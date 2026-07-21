// Generate the DAAO trace corpus in Polygraph window format
// ({"pre","action","data","post"} NDJSON, one file per scenario) by driving the
// SAM module through named scenarios. Ported from the original daao/*.json
// probes so the JS artifact is anchored to the same ground truth as the
// Python/Rust builds. Rejected steps are emitted as no-op windows (post==pre) —
// those are the observable "the machine declined and why" evidence the v2
// artifact exists to produce.
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const mod = require(resolve(here, 'next.cjs'));
const sanitize = (o) => JSON.parse(JSON.stringify(o, (k, v) => {
  if (typeof k === 'string' && k.startsWith('__')) return undefined;
  if (typeof v === 'function') return undefined;
  return v;
}));

// A fresh run of a scenario: reset to init, then for each step capture the
// window (pre, action, data, post) using the adapter's reset-then-merge next().
function run(steps) {
  mod.init();
  let pre = sanitize(mod.getState());
  const windows = [];
  for (const [action, data = {}] of steps) {
    mod.init();
    mod.setState(JSON.parse(JSON.stringify(pre)));
    mod.actions[action](data);
    let rejected = false;
    try {
      const s = mod.instance({}).lastStep();
      if (s && s.classification === 'rejected') rejected = true;
    } catch { /* ignore */ }
    const post = rejected ? pre : sanitize(mod.getState());
    windows.push({ pre, action, data, post });
    pre = post;
  }
  return windows;
}

const A = (actor, now) => ['approve', { actor, now }];
const scenarios = {
  // Normal path — two distinct in-window approvers, release, ack, execute, close.
  happy_path: [
    ['submit', { actor: 'alice', window_start: 10, window_end: 100 }],
    A('bob', 50), A('carol', 50),
    ['release', { now: 50 }], ['acknowledge', {}], ['execute', { now: 50 }], ['close', {}],
  ],
  // S1 — self-approval by the proposer is a no-op; a second distinct approver
  // is still required. End terminal via abort.
  p1_self_approval: [
    ['submit', { actor: 'alice', window_start: 10, window_end: 100 }],
    A('alice', 50),           // rejected: approver-is-proposer
    A('bob', 50),             // 1 distinct
    A('alice', 50),           // rejected again
    ['abort', {}],
  ],
  // S1 — a redelivered approval from the same authority never counts twice.
  p2_dup_approver: [
    ['submit', { actor: 'alice', window_start: 10, window_end: 100 }],
    A('bob', 50), A('bob', 50), A('bob', 50),   // only 1 distinct; stays PENDING
    ['abort', {}],
  ],
  // S2 — execute outside the window is refused; no execute() effect.
  p3_out_of_window: [
    ['submit', { actor: 'alice', window_start: 10, window_end: 100 }],
    A('bob', 50), A('carol', 50),
    ['release', { now: 50 }], ['acknowledge', {}],
    ['execute', { now: 150 }],  // rejected: execute-out-of-window
    ['abort', {}],
  ],
  // S3 — redelivered release/execute emit their effects exactly once.
  p4_redeliver_execute: [
    ['submit', { actor: 'alice', window_start: 10, window_end: 100 }],
    A('bob', 50), A('carol', 50),
    ['release', { now: 50 }], ['release', { now: 50 }],   // 2nd release rejected
    ['acknowledge', {}],
    ['execute', { now: 50 }], ['execute', { now: 50 }],   // 2nd execute rejected
    ['close', {}],
  ],
  // Expire — an approved order past window_end expires.
  expire_after_window: [
    ['submit', { actor: 'alice', window_start: 10, window_end: 100 }],
    A('bob', 50), A('carol', 50),
    ['expire', { now: 50 }],    // rejected: not past window end yet
    ['expire', { now: 150 }],   // EXPIRED
  ],
  // L1 — recall from a late state.
  abort_after_ack: [
    ['submit', { actor: 'alice', window_start: 10, window_end: 100 }],
    A('bob', 50), A('carol', 50),
    ['release', { now: 50 }], ['acknowledge', {}], ['abort', {}],
  ],
  // Terminal no-ops — actions into a closed order are observable no-ops.
  terminal_noops: [
    ['submit', { actor: 'alice', window_start: 10, window_end: 100 }],
    A('bob', 50), A('carol', 50),
    ['release', { now: 50 }], ['acknowledge', {}], ['execute', { now: 50 }], ['close', {}],
    A('carol', 50),           // rejected into CLOSED
    ['execute', { now: 50 }], // rejected into CLOSED
    ['abort', {}],            // rejected into CLOSED
  ],
};

mkdirSync(resolve(here, 'traces'), { recursive: true });
let total = 0;
for (const [name, steps] of Object.entries(scenarios)) {
  const windows = run(steps);
  total += windows.length;
  const body = windows.map((w) => JSON.stringify(w)).join('\n') + '\n';
  writeFileSync(resolve(here, 'traces', `${name}.ndjson`), body);
  console.log(`${name}: ${windows.length} windows -> final ${windows[windows.length - 1].post.state}`);
}
console.log(`\n${Object.keys(scenarios).length} scenarios, ${total} windows written to traces/`);
