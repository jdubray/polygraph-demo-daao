# DAAO — Polygraph Verification Report

**For:** the reviewer · **Machine:** Dual-Authorization Action Order (DAAO), 9 states, invariants
S1–S5 (safety) + L1–L2 (liveness). **Date:** 2026-07-21.

> **Disclosure, once, up front.** Polygraph is experimental, not peer-reviewed technology. Every
> result here is a **consistency check, not a proof.** "Exhaustive" means exhaustive over the
> **finite (action, data) domain declared in `verify/contract.json`** (3 actor identities, 3
> logical time ticks, a fixed window) for a **single order** — not over unbounded real inputs or
> multi-order fleets. Every finding is a lead to confirm by hand. This gate is exactly as good as
> the invariants a human confirms; it is not a substitute for one.

> **New to the vocabulary?** See [`../GLOSSARY.md`](../GLOSSARY.md) for plain-language definitions
> of every term used here — *mutant*, *invariant*, *model-checking*, *counterexample*, *fleet
> gate*, and the rest.

---

## 0. What was built, and the one fact that forced it

The existing `daao/` engines are **Python + Rust**. Polygraph model-checks **JavaScript SAM v2
modules only** — there is no way to point the gate at the Python/Rust source directly. So the
verifiable artifact is a JS SAM v2 strict-profile module authored faithfully to the §2 transition
table, and it becomes the single source of truth the gate actually checks. The Python/Rust builds
remain the "two independent implementations" whose story is narrated (Act 1); the JS artifact is
what is *proven*.

**Artifacts** (`daao/verify/`): `contract.json` (observable state + finite domains),
`next.cjs` (the DAAO SAM v2 module), `invariants.mjs` (S1–S5 + structural rules),
`reachability.mjs` (L1/L2/S4), `traces/` (8 scenarios, 54 windows), `controls/next_buggy.cjs`
(the planted-bug negative control). Three-approver evolution in `daao/verify-v3/`.

**Everything in this report is reproducible** — see §7. The scripted runner is `daao/run_demo.sh`.

---

## 1. Results by engine (all runs are real)

| Engine | What it checked | Result |
|---|---|---|
| **polygraph** `check.mjs` — clean | S1–S5 + structural, exhaustive over the domain | **28 states, 0 violations ✓** |
| **polygraph** `check.mjs` — planted bug | same invariants, distinct-approver guard deleted | **46 states, 3 violations ✗** with 3-step counterexample |
| **polygraph** `verify.mjs` — clean, N=3 | 3 independent LLM-derived specs replayed vs. traces + model-checked | **54/54 windows consistent, 0 findings ✓** |
| **polygraph** `verify.mjs` — buggy, N=3 | same, on the planted build | **52/54 consistent, 2 spec-errors; model-check: 3 invariant violations ✗** |
| **reachability.mjs** — clean | L1 recall, L2 progress, S4 not-a-dead-end | **28 states, all hold ✓** |
| **polynv** `harvest` | 67 candidate invariants pre-checked against the machine | 60 hold, 7 fail — **all 7 are corpus artifacts, 0 real defects** |
| **polynv** `grade` | mutation adequacy of the invariant set | **24 / 38 behaviorally-distinct mutants killed** (iterated 11→21→24) |
| **polynv** interview | 96 candidates dispositioned by the designer | **CONVERGED** — 5 confirmed, 91 rejected, grade ran |
| **polyvers** `check` — 2→3 approvers | version change against 5 in-flight fleet snapshots | **FAIL — deploy blocked**: 4 pointwise + 1 seeded landmine |

### 1a. The planted-bug catch (Act 2) — genuine counterexample from state exploration

With the distinct-approver guard removed, `check.mjs` manufactures the shortest repro itself — not
from a crafted trace:

```
init → submit(alice, [10,100]) → approve(bob, 50) → approve(bob, 50)
     → state=APPROVED, approvers=["bob","bob"], distinct=1
```

Three invariants fire on that path: `S1-two-person-integrity`, `S1-approvers-distinct`,
`S5-authorized-only-earned`. The clean build passes the identical gate. **Disclosed: the bug is
planted.** The frontier model wrote the *correct* two-person logic this round; the bug was
reintroduced to show the net. The point is language-agnostic: the same contract passes the clean
build and catches the buggy one.

### 1b. The independent second reading (Act 2, differential)

`verify.mjs` asked Claude Sonnet-5 to derive **3 independent specs** of the DAAO source and replayed
the 54-window corpus against each. Clean: **54/54 consistent, 0 disagreements** — three independent
readings agree the code does what it appears to do. On the buggy build the readings *disagreed* at
exactly the duplicate-approver windows (2 spec-errors): some generated specs faithfully reproduced
the bug, **some silently "corrected" it** by writing the distinct-approver guard from domain
knowledge — a vivid demonstration of why N-spec voting matters and why "the model got it right" is
not the same as "the code is right." The automatic model-check step then flagged all 3 invariant
violations with the counterexample above.

### 1c. The wedge (Act 3) — polyvers blocks a rule change against the live fleet

Tightening **two-of-N → three-of-N** approvers, checked against 5 snapshots representing orders
already in flight under the old 2-rule:

- **invariants-pointwise: FAIL (4).** The four already-authorized orders holding exactly 2
  approvers (APPROVED, RELEASED, ACKNOWLEDGED, CLOSED) violate the new S1 (≥3) *the instant the
  rule ships* — they are named: `fleet.json#0,#2,#3,#4`.
- **semantic-model-check: FAIL (1).** The seeded landmine: `fleet.json#0` (APPROVED, 2 approvers)
  violates new S1 at its root and the machine would carry it forward to `execute()` — an action
  executed under a two-person rule in a three-person regime.
- stimuli / shape-roundtrip / vocabulary: PASS. **Verdict: FAIL, exit 1 — the deploy is blocked
  before it ships.**

There is no shape change, so no mechanical field migration exists; the correct remediation —
re-open affected orders to `PENDING_APPROVAL` so they must earn the third approver — is a **semantic
data-migration and a human decision**, which polyvers correctly refuses to invent. In a defense
context: changing the rule means re-accrediting the fleet, and the gate delivers that decision
pre-deploy, attached to named snapshots and a repro, instead of post-deploy attached to a pager.

---

## 2. Defects found — honest, complete

Nothing here is smoothed over. This includes defects in the original spec and in my own first draft.

- **D1 — Rust build: non-deterministic audit record (real; source-confirmed).** `safety_engine.rs`
  stores orders in `HashMap<String, Order>` (line 74) and serializes via `.iter()` (line 279).
  Rust's std `HashMap` uses a per-process random seed, so `store.json`'s key order differs every
  run. **Benign for behavior** (the observable contract is *state-per-order + ordered effect log*,
  which is identical), **but a real auditability defect** the moment `store.json` is hashed, signed,
  or replicated by checksum — MySQL-replication and defense-audit territory. A diff flags this as a
  failure *and* as flaky (a false positive in both directions); the contract-level gate adjudicates
  it correctly. *Note: reproduced at source level and from the recorded prior run; the compiled
  Linux binary does not run on this Windows host, and a freshly-compiled Windows build was
  quarantined by Defender, so the run-to-run divergence was not re-observed live in-session.*
  **Recommended fix:** canonical (sorted-key) serialization in both engines. The JS artifact already
  serializes canonically, so it does not inherit this bug.

- **D2 — Spec method gap (real; now closed).** The spec's own §6 admits `check_s1.py` is a
  hand-written single-trace stand-in and the probes are "targeted, not exhaustive." Confirmed. This
  report replaces both: the S1 predicate is now model-checked over every reachable state in the
  domain, and the counterexample comes from state exploration, not one crafted trace.

- **D3 — My own invariant set was too weak (real; found by polynv, then fixed).** The first draft of
  `invariants.mjs` killed only **11/38** mutants. The mutation grade surfaced a genuine safety gap:
  nothing forbade an order being **executed without ever being transmitted** (a machine that
  accepted `acknowledge` straight from `APPROVED`, skipping `RELEASED`/`transmit`, would pass). I
  added `S3-execute-requires-transmit`, `STRUCT-terminals-absorbing`, `STRUCT-*-only-by-*`, and
  `L1-abort-well-formed`, raising the grade to **24/38** while the clean machine stayed clean and
  the planted bug stayed caught. This is the loop working: the gate found a hole in the human's
  rules, not just in the code.

- **D4 — Liveness is not safety (real; addressed honestly).** S4/L1/L2 are reachability properties
  and *cannot* be written as `pred(state)`; a safety-only run does not cover them. They are checked
  separately by `reachability.mjs` over the reachable graph (all hold), and this boundary is stated
  wherever the safety verdict appears.

- **No natural S1–S5 violation in the machine.** The clean DAAO satisfies every safety invariant
  over the explored domain and every liveness property over the reachable graph. The two-person bug
  is planted and disclosed as such. Stated plainly because it is more credible than pretending a
  frontier model wrote the classic bug this round — it didn't.

---

## 3. What the 24/38 grade means (and its blind spot)

The 14 surviving mutants are almost entirely **behavior-removing** (`drop:abort@APPROVED` → abort
becomes a no-op) and a few **retarget/widen** shapes. The SKILL names this blind spot explicitly:
state-invariants largely cannot kill a mutant that makes the machine *do less*. Those survivors are
not uncovered — they are covered by the **other two gates**:

- `drop:abort@*`, malformed abort → caught by **reachability** (L1 fails: abort no longer reaches
  ABORTED).
- `drop:submit/approve/release/acknowledge/execute/close`, `drop:expire` → caught by **trace
  replay** (the happy-path and expire scenarios *require* each step to advance; a no-op mutant
  diverges from the corpus).

**No single gate is the net. Model-check (safety) + reachability (liveness) + trace replay
(conformance) together are.** That is the honest shape of the guarantee.

**24/38 is a conservative floor.** The grade lists `widen:acknowledge@APPROVED` (acknowledge
skipping RELEASED) as a survivor, but a direct model-check of that exact mutant
(`controls/next_widen_ack.cjs`) is **caught** by `S3-execute-requires-transmit` (1 violation). The
grade runs on its own bounded contract-level mutant model and can under-report a kill whose
violation needs a multi-step downstream path in the concrete machine — so the true kill count is
at least 24, not at most.

---

## 4. The 7 harvested FAILS — all corpus artifacts, zero defects

`polynv harvest` mined 67 candidate invariants and pre-checked each against the machine; 7 failed
(the machine reachably violates them). Every one is a **coverage artifact of my trace corpus**, not
a defect: e.g. "approvers is always `["bob","carol"]` in APPROVED" (true in my traces, false in
general — `["bob","dave"]` etc. are reachable), and "no abort before approve" (my traces always
approved first, but abort from PENDING with zero approvers is legal recall, L1). The pre-check
correctly flags each "rule, or artifact?" and the honest disposition is *artifact*. This is the
elicitation engine doing its job: harvested candidates describe **behavior**, and behavior is not
intent.

---

## 5. Boundaries of this verification (what is NOT claimed)

- **Finite domain.** 3 actors {alice, bob, carol}, 3 ticks {5, 50, 150}, one fixed window [10,100],
  a single order. Behavior at values outside these representatives is unchecked.
- **Single order.** Multi-order storage, and its serialization (D1), is a persistence-layer concern
  outside the state machine and outside this gate.
- **Crash-safety (S4 durability) is split.** The reachability facet (ACKNOWLEDGED is never a
  dead-end) is checked here. The *crash-survival* facet is a property of the atomic write
  (`os.replace`) in the persistence layer, not the state graph — narrated, not gated.
- **Consistency, not proof.** A clean run means observable behavior matches an independent reading
  of the source over the declared domain. Nothing more.

---

## 6. The human's part vs. the agent's part (the SDLC point)

The human owns **what the machine may observe** (the contract's state projection) and **what it
must never do** (the invariants). Those are the two artifacts that needed judgment. The **polynv
interview is complete: CONVERGED** — the designer dispositioned all 96 candidates (5 confirmed, 91
rejected), each with a recorded reason, in the append-only ledger `verify/intent-ledger.json`
(rendered for the PR as `verify/INTENT-LOG.md`). What the designer decided:

- **Confirmed (5):** `S3-execute-requires-transmit` (never execute what was never released — the
  D3 gap), `L1-abort-well-formed` (recall lands in ABORTED only from pre-execution states), and
  terminal-finality for CLOSED / ABORTED / EXPIRED.
- **Rejected with reason (91):** the 7 corpus artifacts; ~57 mined facts that restate the state
  table or are already covered by S3/S5; and the 27 mutation survivors, dispositioned as
  out-of-scope for the *safety* gate because each is caught by reachability (liveness) or trace
  replay (conformance).
- **L2-progress** was confirmed as intent but is **pure liveness with no predicate form** — its
  system of record is `reachability.mjs`, not the predicate ledger. Stated here so the boundary is
  honest.

Everything else — the module, the specs, the exploration, the counterexamples, the version gate —
the agent wrote and the gate checked, on every change, in either language.

---

## 7. Reproduce everything

```bash
cd daao/verify
PLUGIN=~/.claude/plugins/cache/polygraph/polygraph/5.0.0

# Safety model-check — clean (pass) and planted bug (caught with counterexample)
node $PLUGIN/scripts/check.mjs --spec next.cjs           --contract contract.json --invariants invariants.mjs
node $PLUGIN/scripts/check.mjs --spec controls/next_buggy.cjs --contract contract.json --invariants invariants.mjs

# Liveness / reachability (L1, L2, S4)
NODE_PATH=$PLUGIN/node_modules node reachability.mjs

# Invariant strength (mutation grade)
node $PLUGIN/polynv/bin/polynv.mjs grade --artifacts . --include-invariants

# Independent differential specs (needs ANTHROPIC_API_KEY)
node $PLUGIN/scripts/verify.mjs --contract contract.json --source next.cjs --traces traces/ --model claude-sonnet-5 --n 3 --out out/

# Version gate: 2 -> 3 approvers against the live fleet (Act 3)
cd .. && node $PLUGIN/polyvers/bin/polyvers.mjs check --old verify --new verify-v3 --snapshots verify-v3/fleet.json --out out/compat
```
