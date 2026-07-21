import json,sys
d=json.load(open(sys.argv[1]))
AUTH={"APPROVED","RELEASED","ACKNOWLEDGED","EXECUTED","CLOSED"}
viol=[]
for oid,o in d["orders"].items():
    if o["state"] in AUTH:
        distinct=set(o["approvers"])
        if len(distinct)<2 or o["proposer"] in distinct:
            viol.append((oid,o["state"],o["proposer"],o["approvers"]))
executed=[e for e in d["effects"] if e["effect"]=="execute"]
if viol:
    print("  ✗ S1 VIOLATED — two-person integrity")
    for oid,st,p,ap in viol:
        print(f"     order {oid}: state={st}, proposer={p}, approvers={ap} -> distinct approvers={len(set(ap))}")
    if executed: print(f"     and execute() was emitted for: {[e['order'] for e in executed]}")
else:
    print("  ✓ S1 holds — every authorized order has ≥2 distinct approvers, none the proposer")
