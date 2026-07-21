import json, os, subprocess, sys, glob

def run(engine_cmd, trace):
    # fresh store each run
    if os.path.exists("store.json"): os.remove("store.json")
    with open(trace) as f: data=f.read()
    p = subprocess.run(engine_cmd, input=data, capture_output=True, text=True)
    if p.returncode!=0:
        return {"__error__": p.stderr.strip()[:300]}
    try:
        return json.loads(p.stdout)
    except Exception as e:
        return {"__parse_error__": str(e), "raw": p.stdout[:300]}

def norm(o):
    # semantic normalization: sort orders by id; keep effects order (it's meaningful)
    if "__error__" in o or "__parse_error__" in o: return o
    orders = o.get("orders",{})
    norm_orders = {k: {kk: orders[k].get(kk) for kk in ["proposer","approvers","window_start","window_end","state"]} for k in orders}
    return {"orders": dict(sorted(norm_orders.items())), "effects": o.get("effects",[])}

traces = sorted(glob.glob("*.json"))
traces = [t for t in traces if t!="store.json"]
PY=["python3","safety_engine.py"]
RS=["./safety_engine_rs"]
print(f"{'trace':24} {'match':6} summary")
print("-"*90)
for t in traces:
    py=norm(run(PY,t)); rs=norm(run(RS,t))
    match = (py==rs)
    # summarize each order's final state + effects
    def summ(o):
        if "__error__" in o: return "ERR:"+o["__error__"][:40]
        st = {k:v["state"] for k,v in o["orders"].items()}
        eff=[f'{e["effect"]}:{e["order"]}' for e in o["effects"]]
        return f'states={st} effects={eff}'
    print(f"{t:24} {'OK' if match else 'DIFF':6} PY {summ(py)}")
    if not match:
        print(f"{'':24} {'':6} RS {summ(rs)}")
