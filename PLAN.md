# DAAO — Build & Verification Plan (Polygraph SDLC demo for the reviewer)

**Goal.** Show the full SDLC of developing *and verifying* stateful code to real standards: a
DAAO (Dual-Authorization Action Order) state machine with genuine invariants (S1–S5, L1–L2),
checked by the actual Polygraph engines, with every real defect reported — including defects in
the spec and the existing `daao/` code. Honest verdicts are the deliverable.

**Scope (bounded, per instructions).** Unclassified generic domain, single node, file persistence.
No auth, no infra, no deployment.

---

## The one structural fact that shapes everything

The existing `daao/` engines are **Python + Rust**. The Polygraph plugins model-check
**JavaScript SAM v2 modules only**. So "run Polygraph for real" *requires* authoring a JS DAAO
artifact set — there is no way to point the gate at the Python/Rust code directly. That is not
busywork: it is the honest demo. The JS artifact becomes the single verified source of truth; the
Python/Rust builds become the "two independent implementations" whose conformance we narrate
(Acts 1–2), and the JS gate is what actually proves the invariants.

**Toolchain reality:** `polynv`, `polygraph check.mjs` (the model-checker / bug-finder), and
`polyvers` all run **without an API key**. Only the *LLM-generation* legs need a key: `polygen`
(authoring) and `polygraph verify.mjs --model` (N independent differential specs). See the
**Decision** at the bottom — it changes how strong the "independent second reading" evidence is,
not whether the model-checking is real.

---

## Phase 0 — Foundations (author the checkable artifact)

Produce a real, production-grade SAM v2 strict-profile artifact set in `daao/verify/`:

- `contract.json` — stateKeys (primary control = `state`; plus `proposer`, `approvers`,
  `window_start/end`, and a bounded logical clock `now`), the 8 actions, **finite `dataDomain`**
  for every data field (this is what makes the check exhaustive *and* terminating — abstract time
  to a few tick values inside/outside the window, actors to a small pool), terminalStates
  (`CLOSED`, `ABORTED`, `EXPIRED`), and specialRules for the distinct-approver, in-window, and
  exactly-once guards.
- `next.cjs` — the DAAO machine as a **SAM v2 strict module** (sealed model, keyed acceptors,
  every not-applicable action an observable `reject(reason)`), authored faithfully to the §2
  transition table. Effects (`transmit`, `execute`) modeled as observable, at-most-once emissions.
- Positive/negative **reference specs** (hand-written `next()` and one with a rule broken) as the
  Step-3 controls the SKILL mandates — proves the harness discriminates before any invariant runs.
- `traces/` — one NDJSON file per scenario: happy path, self-approval, dup approver,
  out-of-window, redelivered release/execute, crash/recover, plus terminal-state no-ops. These are
  ported from the existing `daao/*.json` probes so the JS artifact is anchored to the same ground
  truth the Python/Rust builds used.

**Honest note baked in:** the Act-1 non-determinism finding (Rust `HashMap` serialization) is a
property of the *Rust* build, not the JS artifact. We report it as a real auditability defect in
the existing code, and give the JS artifact a canonical (sorted-key) serialization so it does not
inherit the same latent bug.

## Phase 1 — `polynv`: lock the invariants (replace the `check_s1.py` stand-in)

Run the real invariant-elicitation engine against the artifact dir:

1. `polynv harvest` — mechanical candidates from the contract vocabulary.
2. Contribute domain priors for the two-person-integrity / ROE-window / exactly-once family
   (S1–S5) as `add` candidates with provenance — each pre-checked against the machine, so any that
   the machine *reachably violates* arrives with a counterexample attached.
3. Drive the interview (`questions --next`), record each disposition. **These are intent calls —
   they are yours (the human) to make; I frame and pre-check, I do not answer them for you.**
4. `polynv grade` (mutation adequacy) — convergence requires it. Report CONVERGED vs PARTIAL
   honestly, and name the grade's blind spot (behavior-removing mutants).

Output: a confirmed `invariants.mjs` encoding S1–S5, plus an explicit, honest treatment of the
**liveness** rules L1–L2 (recall-reachable, progress-to-terminal): these are *not* safety
invariants and cannot be model-checked as such — I'll encode them as reachability obligations
(no reachable non-terminal deadlock; `ABORTED` reachable from every pre-execution state) and say
plainly where the gate's guarantee stops.

## Phase 2 — `polygraph`: audit the build (the real gate, Act 2)

- Controls first: replay the reference specs (positive → 100%, negative → fails exactly the
  expected windows).
- Model-check the DAAO module against `invariants.mjs` with `check.mjs` — **this is the
  bug-finder.** Every reachable violation is reported with the shortest counterexample path from
  init (a ready-made repro). Determinism double-pass included.
- Reproduce the planted two-person-rule bug *as a Polygraph counterexample from state
  exploration*, not the crafted `ce_dup.json` — i.e. author a `next_buggy.cjs` with the
  distinct-approver guard removed, and show the gate manufactures the 4-step
  `submit→approve(Bob)→approve(Bob)→…→execute` path itself. Disclose it's planted.
- *(If API key available)* also run `verify.mjs --source --model --n 5` for N independent
  differential specs — the "second independent reading" evidence. Otherwise the hand-written
  reference specs stand in as the control and I say so.

## Phase 3 — `polyvers`: evolve the fleet (Act 3, the wedge — currently unbuilt)

- Author `daao/verify-v2/` tightening two-of-N → **three-of-N** approvers.
- `polyvers classify` the change, then `polyvers check` seeded with **in-flight fleet snapshots**
  (orders already at `APPROVED` under the 2-rule, exported to a `store`-shaped snapshot corpus).
- Expected result: a **rule-regression** — the seeded model check drives an already-`APPROVED`
  order to `execute` under the 3-approver invariant, returns the shortest violating path, blocks
  the deploy, and `migrate scaffold` proposes re-opening affected orders to `PENDING_APPROVAL`.
  Report the actual verdict, whatever it is.

## Phase 4 — Report + one-command runner

- `POLYGRAPH-REPORT.md` for the reviewer: what was checked, the exact commands, every verdict, every
  real defect (in the spec, the existing code, and anything the gate surfaces in the new
  artifact), and — stated precisely — where "holds on my probes" ends and "holds on every
  reachable state over the declared domain" begins.
- A single runner script that reproduces Acts 1–3 deterministically.
- *(Optional)* `polygen` a clean DAAO module from scratch as a "verified-by-construction"
  counterpoint — only if the API-key decision enables it.

---

## Defects already identified (to verify and report, not assume)

- **Spec self-contradiction (real):** the spec/README claim "the two builds are identical; any
  divergence is a defect" is false — the Rust build's `HashMap` serialization is non-deterministic
  run-to-run. Behaviorally benign, but a genuine **auditability** defect the moment `store.json`
  is hashed/signed/replicated. This is Act 1 and it is honest.
- **Method gap the spec already admits:** `check_s1.py` is a hand-rolled single-trace stand-in,
  not model-checking; the probes are targeted, not exhaustive. Phases 1–2 close this for real.
- **Liveness is not safety:** L1/L2 need a reachability treatment, not a `pred(state)`. Flagged
  above; will be stated as a boundary of the guarantee.

## Decision needed from you

**Is an `ANTHROPIC_API_KEY` available for this work?** It does not change whether the
model-checking is real (that runs keyless), only the strength of the *independent-reading*
evidence and whether `polygen` authors a from-scratch clean build:

- **Key available** → `polygen` authors the module and `polygraph verify` generates N independent
  differential specs — the fullest version of the demo.
- **No key** → I hand-author the SAM v2 module + reference control specs (legitimate per the
  SKILL), and every deterministic gate (polynv, model-check, polyvers) still runs for real. The
  report states plainly that the "second reading" was the reference control, not N generations.
