# Glossary

Plain-language definitions of the terms used across this repo's reports
([`daao/POLYGRAPH-REPORT.md`](daao/POLYGRAPH-REPORT.md),
[`daao/POLYGEN-REPORT.md`](daao/POLYGEN-REPORT.md),
[`daao/verify/INTENT-LOG.md`](daao/verify/INTENT-LOG.md)). Grouped from the general idea down to
the specific engine vocabulary. No formal-methods background assumed.

## The machine and its description

- **State machine.** Code that moves through a fixed set of named **states** in response to
  **actions**, following declared rules. DAAO has 9 states (DRAFT → … → EXECUTED/CLOSED, plus
  ABORTED/EXPIRED).
- **DAAO** — Dual-Authorization Action Order. The example machine: an order proposed by one party,
  approved by two *distinct* others, then released, executed (once), and closed — the two-person
  rule made mechanical.
- **Observable state (state projection).** The minimal set of fields the behavior actually depends
  on (here: `state`, `proposer`, `approvers`, window, effect flags). Everything else about a real
  order is deliberately *not* modeled; claims only cover what's projected.
- **Contract (`contract.json`).** The declaration of the machine's observable state, its action
  alphabet, the finite data values to explore, terminal states, and special-case rules. One
  document that is simultaneously the trace schema and the model-checking domain.
- **Action / intent.** A discrete event that steps the machine (`submit`, `approve`, `execute`, …).
  "Intent" is the SAM library's name for the same thing.
- **Data domain.** The finite list of representative values a parameterized action is explored with
  (e.g. time = {before, in, after} the window; actors = {alice, bob, carol}). A value missing here
  is invisible to the checker — the whole reason "exhaustive" is bounded.
- **SAM v2 strict-profile module.** The specific JavaScript shape the Polygraph engines check: named
  actions with schemas and finite domains, one handler ("acceptor") per action, a sealed model, and
  every not-applicable action an *observable rejection* rather than a silent no-op or a throw.
- **Reject / observable no-op.** When an action doesn't apply in the current state, the machine
  declines *and says why* (`reject('duplicate-approver')`) instead of silently doing nothing. Makes
  "the machine did nothing here" a checkable event with a reason.
- **Trace / window.** A recorded step of execution as `{pre, action, data, post}` (one NDJSON line).
  A **trace** is a scenario's sequence of windows; the corpus is the set of scenarios.

## Verification concepts

- **Invariant.** A rule the machine must always obey, written as a predicate that returns *true when
  the rule holds*. The gate is only ever as good as these.
- **Safety invariant** ("must never"). A property of a single state or a single transition —
  *nothing bad is ever reached*. Model-checked exhaustively. (S1–S5 here.) Split into **state
  invariants** (`pred(state)`) and **transition invariants** (`pred(pre, action, data, post)`).
- **Liveness property** ("must eventually"). A property about what remains *reachable* — e.g. every
  order can still reach a terminal state (progress), or recall is always available. Cannot be
  written as `pred(state)`; checked here by a separate reachability harness (L1/L2/S4).
- **Model checking.** Starting from the initial state, mechanically try every action with every
  declared data value, visit every state reachable that way, and check the invariants at each one.
- **Reachable state / state space.** The set of states the machine can actually get to from init
  over the declared domain. "28 states explored" = the size of that set for the clean DAAO.
- **Counterexample (repro).** The shortest sequence of actions from init that reaches a rule
  violation — a ready-made reproduction of the bug.
- **Exhaustive (and what it isn't).** Exhaustive means *every reachable state over the declared
  finite domain* — not over unbounded real-world data. This gap is the honest boundary of every
  claim here.
- **Consistency check, not a proof.** A clean run means the code's observable behavior matches an
  independent reading of its own source over the declared domain. It is evidence to investigate by
  hand, not a mathematical guarantee.
- **Determinism (double-pass).** The spec must be a pure function of its inputs — no clock or random
  reads. The checker runs each exploration twice; if they differ, that non-determinism is itself a
  finding.

## The four Polygraph engines

- **polygraph / verify.** *Audits existing code.* An LLM writes an independent spec of the source;
  the tool replays real traces against it and model-checks it. The bug-finder is `check.mjs`.
- **polygen.** *Authors new code* from a feature description so it's verifiable from the first line,
  self-repairing against its own invariants. (The still-open item in this repo.)
- **polynv.** *Elicits the invariants* — proposes candidate rules, pre-checks each against the
  machine, and drives an interview where a human confirms/rejects them.
- **polyvers.** *Version-gates a change* against the live fleet — decides whether a new version can
  ship over states already in flight, before deploy.

## Differential auditing (polygraph)

- **Differential spec / N-spec voting.** Generate N *independent* readings of the same source; a
  disagreement among them, or a violation reached by all of them, is a strong signal. Here N=3.
- **Replay / trace conformance.** Running a spec against recorded traces to confirm it faithfully
  reproduces observed behavior, window by window.
- **Spec-error vs code-finding vs contract-error.** Where a disagreement lives: one generated spec
  missed a rule (spec-error), the *code* does something unexpected (code-finding), or the contract
  omits a field that drives the transition (contract-error).

## Invariant elicitation (polynv)

- **Candidate / harvest.** A proposed rule, either mined mechanically from the contract vocabulary
  and traces, or contributed as a domain prior. "Harvest" is the mechanical proposal step.
- **Pre-check (HOLDS / FAILS).** Before asking the human, polynv tests each candidate against the
  machine. FAILS means the machine can reach a state that breaks it — arriving with a counterexample
  attached (either a real defect, or a candidate that shouldn't be a rule).
- **Disposition.** The human's verdict on a candidate: **confirm** / **reject** / **modify** /
  **defer** / **abandon** — each recorded with a reason.
- **Intent ledger (`intent-ledger.json`).** The append-only record of every candidate ever
  considered and how it was dispositioned. `INTENT-LOG.md` is its human-readable render.
- **Corpus artifact.** A "rule" that's really just a coincidence of the limited trace corpus (e.g.
  "approvers were always [bob,carol]"), which the machine legitimately violates — correctly
  rejected, not a defect.
- **Convergence (CONVERGED / PARTIAL).** CONVERGED = every candidate dispositioned *and* the
  mutation grade ran. PARTIAL = some remain open.

## Mutation grading (the "mutant" family)

- **Mutant.** A deliberately altered copy of the machine with one small behavioral change. Used to
  test how strong the invariant set is: a good set should *catch* the broken copy.
- **Mutation operators.** The kinds of change applied: **drop** (an action's guard is removed, so it
  stops doing anything), **retarget** (an action lands in a different state), **widen** (an action
  is now accepted where it shouldn't be).
- **Kill / survivor.** A mutant is **killed** if some invariant flags it, and a **survivor** if
  none do. "Kills 24/38" = the invariant set catches 24 of 38 behaviorally-distinct mutants.
- **Equivalent mutant.** A change that produces no behavioral difference at all; discarded
  mechanically so it doesn't pad the denominator.
- **Conservative floor.** The grade can *under*-report kills (a mutant whose violation needs a
  multi-step downstream path), so the real kill count is at least the reported number — see report
  §3.

## Version gating (polyvers)

- **Fleet / fleet snapshot.** The set of states the deployed machines are actually holding right now
  (e.g. orders sitting at APPROVED). A snapshot is an exported copy the gate runs against.
- **Compatibility lanes.** The independent questions a version change raises — **shape** (state
  fields), **vocabulary** (actions/effects/terminals), **intent** (invariants), **semantic** (the
  code), **migration**, **composition** — each with its own mechanical gate.
- **Seeded model check.** Model-checking that *starts from the live fleet states* (not just init),
  asking "can any state the fleet actually holds be driven to a violation under the new rules?"
- **Rule-regression / landmine.** A live state that the *new* rules can drive to a violation — the
  reason a deploy is blocked, reported with the witness state and the shortest path to the bad state.
- **Meaning-gap.** A live state that has no honest image under the new version (no pure function can
  carry it over) — escalated to a human, never auto-repaired.
- **Migration (`migrate.cjs`).** A function that carries old fleet states into the new shape. For a
  pure semantic tightening (like 2→3 approvers) there's no field change to migrate — the remedy is a
  data decision (re-open affected orders), which the human owns.

## DAAO safety/liveness rules (shorthand used in the reports)

- **S1 — two-person integrity.** An authorized order has ≥2 *distinct* approvers, none the proposer.
- **S2 — authorized window.** Release and execute fire only inside the order's time window.
- **S3 — exactly-once.** `transmit`/`execute` are emitted at most once; execute requires a prior
  transmit.
- **S5 — no forged authorization.** Approvers never shrink, the proposer is set once, and an order
  becomes authorized only by earning it.
- **L1 — recall.** Abort is available (and lands in ABORTED) from every pre-execution state.
- **L2 — progress.** Every order can still reach a terminal disposition; no reachable deadlock.

---

## Provenance

- The two "independent implementations" in `daao/` (`safety_engine.py`, `safety_engine.rs`) were
  generated by **DeepSeek**. Original code-generation session:
  <https://chat.deepseek.com/share/qgwo4x3j68j5ohcmbt> (access may be gated). The session's own
  claim — *"identical output; any divergence is a defect"* — is the one this project disproves
  (see D1 in the report: the Rust build's `HashMap` serialization is non-deterministic).
- Polygraph is experimental, not peer-reviewed technology. Reference implementation and origin:
  the SysMoBench "finixpos" study, <https://github.com/jdubray/SysMoBench-1>.
