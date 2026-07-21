#!/usr/bin/env python3
"""
safety_engine.py – idiomatic Python 3 implementation of the Action Order workflow.
Standard library only. Behaviourally identical to the Rust version.
"""
import json
import os
import sys
import tempfile
from pathlib import Path

STORE_FILE = "store.json"

ALLOWED_ABORT_STATES = {"PENDING_APPROVAL", "APPROVED", "RELEASED", "ACKNOWLEDGED"}
ALLOWED_EXPIRE_STATES = {"PENDING_APPROVAL", "APPROVED", "RELEASED", "ACKNOWLEDGED"}

def load_store():
    if not os.path.exists(STORE_FILE):
        return {"orders": {}, "effects": []}
    with open(STORE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_store(store):
    dirname = os.path.dirname(STORE_FILE) or "."
    with tempfile.NamedTemporaryFile(mode="w", dir=dirname, delete=False,
                                     encoding="utf-8") as tf:
        json.dump(store, tf, indent=2)
        tmpname = tf.name
    os.replace(tmpname, STORE_FILE)

def ensure_order(orders, oid):
    if oid not in orders:
        orders[oid] = {
            "id": oid,
            "proposer": None,
            "approvers": [],
            "window_start": None,
            "window_end": None,
            "state": "DRAFT"
        }

def process_event(store, event):
    changed = False
    op = event["op"]
    oid = event["order"]
    t = event["t"]
    orders = store["orders"]
    effects = store["effects"]
    ensure_order(orders, oid)
    order = orders[oid]

    if op == "submit":
        if order["state"] != "DRAFT":
            return changed
        proposer = event.get("actor")
        ws = event.get("window_start")
        we = event.get("window_end")
        if proposer is None or ws is None or we is None:
            raise ValueError("submit missing proposer/window")
        order["proposer"] = proposer
        order["window_start"] = ws
        order["window_end"] = we
        order["state"] = "PENDING_APPROVAL"
        changed = True

    elif op == "approve":
        if order["state"] != "PENDING_APPROVAL":
            return changed
        approver = event.get("actor")
        if approver is None:
            raise ValueError("approve missing actor")
        if approver == order["proposer"]:
            return changed
        if approver in order["approvers"]:
            return changed
        ws = order["window_start"]
        we = order["window_end"]
        if ws is None or we is None:
            raise ValueError("window not set")
        if not (ws <= t <= we):
            return changed
        order["approvers"].append(approver)
        if len(order["approvers"]) >= 2:
            order["state"] = "APPROVED"
        changed = True

    elif op == "release":
        if order["state"] != "APPROVED":
            return changed
        ws = order["window_start"]
        we = order["window_end"]
        if not (ws <= t <= we):
            return changed
        effects.append({"effect": "transmit", "order": oid})
        order["state"] = "RELEASED"
        changed = True

    elif op == "acknowledge":
        if order["state"] != "RELEASED":
            return changed
        order["state"] = "ACKNOWLEDGED"
        changed = True

    elif op == "execute":
        if order["state"] != "ACKNOWLEDGED":
            return changed
        ws = order["window_start"]
        we = order["window_end"]
        if not (ws <= t <= we):
            return changed
        effects.append({"effect": "execute", "order": oid})
        order["state"] = "EXECUTED"
        changed = True

    elif op == "close":
        if order["state"] != "EXECUTED":
            return changed
        order["state"] = "CLOSED"
        changed = True

    elif op == "abort":
        if order["state"] not in ALLOWED_ABORT_STATES:
            return changed
        order["state"] = "ABORTED"
        changed = True

    elif op == "expire":
        if order["state"] not in ALLOWED_EXPIRE_STATES:
            return changed
        we = order["window_end"]
        if we is None or t <= we:
            return changed
        order["state"] = "EXPIRED"
        changed = True

    else:
        raise ValueError(f"unknown op: {op}")

    return changed

def main():
    input_path = sys.argv[1] if len(sys.argv) > 1 else None
    store = load_store()
    try:
        if input_path:
            with open(input_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
        else:
            lines = sys.stdin.readlines()
    except Exception as e:
        print(f"Error reading input: {e}", file=sys.stderr)
        sys.exit(1)

    for line in lines:
        line = line.strip()
        if not line:
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError as e:
            print(f"Invalid JSON line: {e}", file=sys.stderr)
            sys.exit(1)
        if process_event(store, event):
            save_store(store)

    final_orders = {oid: {
        "id": o["id"],
        "proposer": o["proposer"],
        "approvers": o["approvers"],
        "window_start": o["window_start"],
        "window_end": o["window_end"],
        "state": o["state"]
    } for oid, o in store["orders"].items()}
    output = {
        "orders": final_orders,
        "effects": store["effects"]
    }
    json.dump(output, sys.stdout, indent=2)
    sys.stdout.write("\n")

if __name__ == "__main__":
    main()