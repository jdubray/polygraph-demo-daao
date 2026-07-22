// DAAO liveness / reachability harness — the honest complement to the safety
// model-check in check.mjs. Safety invariants ("never reach a bad state") are
// what check.mjs explores; L1/L2/S4 are REACHABILITY properties ("a good state
// is always still reachable") and cannot be expressed as pred(state). This
// script does its own BFS over the SAME finite (action,data) domain declared in
// contract.json and answers, over the reachable graph:
//
//   L2 — Progress:  every reachable state can still reach a TERMINAL state
//                   (no reachable deadlock / livelock).
//   L1 — Recall:    from every reachable pre-execution state
//                   {PENDING_APPROVAL,APPROVED,RELEASED,ACKNOWLEDGED}, a single
//                   abort reaches ABORTED.
//   S4 — Durability(reachability facet): every reachable ACKNOWLEDGED state can
//                   reach a terminal in {EXECUTED,ABORTED,EXPIRED}. (The
//                   crash-survival facet of S4 is a property of the atomic
//                   persistence layer, reported separately — not a state-graph
//                   property.)
//
// Usage: NODE_PATH=<plugin>/node_modules node reachability.mjs [--spec next.cjs]
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const specArg = (() => {
  const i = process.argv.indexOf('--spec');
  return i !== -1 ? process.argv[i + 1] : 'next.cjs';
})();
const mod = require(resolve(here, specArg));
const contract = JSON.parse(readFileSync(resolve(here, 'contract.json'), 'utf8'));

const TERMINAL = new Set(contract.terminalStates);
const ABORTABLE = new Set(['pending', 'approved', 'released', 'acknowledged']);

// (action, data) domain = cartesian product of each action's declared field
// values, exactly as the checker builds it from contract.dataDomain.
function stepsForAction(action) {
  const dom = contract.dataDomain[action] || {};
  const fields = Object.keys(dom);
  if (fields.length === 0) return [{ action, data: {} }];
  let combos = [{}];
  for (const f of fields) {
    const next = [];
    for (const c of combos) for (const v of dom[f]) next.push({ ...c, [f]: v });
    combos = next;
  }
  return combos.map((data) => ({ action, data }));
}
const STEPS = Object.keys(contract.actions).flatMap(stepsForAction);

const sanitize = (o) => JSON.parse(JSON.stringify(o, (k, v) => {
  if (typeof k === 'string' && k.startsWith('__')) return undefined;
  if (typeof v === 'function') return undefined;
  return v;
}));

// Adapter next(): reset, load snapshot, dispatch; a rejected step is a no-op
// (post == pre) — same semantics as scripts/sam-adapter.cjs.
function next(state, action, data) {
  mod.init();
  mod.setState(JSON.parse(JSON.stringify(state)));
  mod.actions[action](data);
  let rejected = false;
  try {
    const step = mod.instance({}).lastStep();
    if (step && step.classification === 'rejected') rejected = true;
  } catch { /* no lastStep — treat by state comparison below */ }
  const post = sanitize(mod.getState());
  if (rejected) return state;
  return post;
}

// BFS over reachable states; record forward edges.
const key = (s) => JSON.stringify(s);
mod.init();
const init = sanitize(mod.getState());
const nodes = new Map();           // key -> state
const fwd = new Map();             // key -> Set(key)
const queue = [init];
nodes.set(key(init), init);
fwd.set(key(init), new Set());
while (queue.length) {
  const s = queue.shift();
  const sk = key(s);
  for (const { action, data } of STEPS) {
    const p = next(s, action, data);
    const pk = key(p);
    fwd.get(sk).add(pk);
    if (!nodes.has(pk)) {
      nodes.set(pk, p);
      fwd.set(pk, new Set());
      queue.push(p);
    }
  }
}

// Reverse reachability from terminal states.
const rev = new Map();
for (const k of nodes.keys()) rev.set(k, new Set());
for (const [s, outs] of fwd) for (const t of outs) if (t !== s) rev.get(t).add(s);
const canReachTerminal = new Set();
const rq = [];
for (const [k, s] of nodes) if (TERMINAL.has(s.status)) { canReachTerminal.add(k); rq.push(k); }
while (rq.length) {
  const t = rq.shift();
  for (const p of rev.get(t)) if (!canReachTerminal.has(p)) { canReachTerminal.add(p); rq.push(p); }
}

// L2 — every reachable state can reach a terminal.
const l2Fail = [...nodes.entries()].filter(([k]) => !canReachTerminal.has(k)).map(([, s]) => s);

// L1 — every reachable ABORTABLE state reaches ABORTED in one abort.
const l1Fail = [];
for (const [, s] of nodes) {
  if (!ABORTABLE.has(s.status)) continue;
  if (next(s, 'ABORT', {}).status !== 'aborted') l1Fail.push(s);
}

// S4 — every reachable ACKNOWLEDGED state can reach {EXECUTED,ABORTED,EXPIRED}.
const S4_TERMINALS = new Set(['executed', 'aborted', 'expired']);
function canReachSet(startKey, targetStates) {
  const seen = new Set([startKey]);
  const q = [startKey];
  while (q.length) {
    const k = q.shift();
    if (targetStates.has(nodes.get(k).status)) return true;
    for (const t of fwd.get(k)) if (!seen.has(t)) { seen.add(t); q.push(t); }
  }
  return false;
}
const s4Fail = [];
for (const [k, s] of nodes) if (s.status === 'acknowledged' && !canReachSet(k, S4_TERMINALS)) s4Fail.push(s);

const line = (name, fails) =>
  `  ${fails.length === 0 ? '✓' : '✗'} ${name} — ${fails.length === 0 ? 'holds' : `${fails.length} counterexample state(s): ` + JSON.stringify(fails.slice(0, 3))}`;

console.log(`reachable states: ${nodes.size}`);
console.log('liveness / reachability:');
console.log(line('L2-progress-to-terminal', l2Fail));
console.log(line('L1-recall-reachable', l1Fail));
console.log(line('S4-acknowledged-not-dead-end', s4Fail));
const ok = !l2Fail.length && !l1Fail.length && !s4Fail.length;
console.log(ok ? '\nall liveness properties hold over the reachable graph ✓' : '\nLIVENESS VIOLATION(S) FOUND ✗');
process.exit(ok ? 0 : 1);
