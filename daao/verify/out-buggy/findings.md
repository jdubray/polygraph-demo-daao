# Polygraph — verification findings

> Consistency check, not a proof. Every finding is a lead to investigate by hand.

## Part 1 — trace conformance (replay)

- specs replayed: **3** (live: **3**)
- windows: **54**
- consistent (pass in all live specs): **52**
- likely spec-error (some specs miss it): **2**
- likely code-finding / contract-error (all specs disagree): **0**
- unscoreable in all specs (specs didn't load): **0**

## Windows to review

| scenario | # | action | verdict | per-spec | step classification (per live spec) |
|---|---|---|---|---|---|
| p2_dup_approver.ndjson | 2 | approve | spec-error | fail, pass, fail | mutated, rejected(duplicate-approver), mutated |
| p2_dup_approver.ndjson | 3 | approve | spec-error | fail, pass, fail | mutated, rejected(duplicate-approver), mutated |

**Reading the verdicts**
- *code-finding / contract-error*: every spec disagrees with the trace here. Either the code does something you did not expect (a defect) or your observable-state contract omits a field that drives this transition. Investigate the source at this (pre-state, action).
- *spec-error*: some generations pass, some fail. Usually one generation missed a rule; check the majority. The missed rules are typically special cases living outside the main state table.
- *unscoreable in all specs*: the generated modules did not load or export next(). Fix generation, not the code.

**Reading the step classifications** (v2 SAM artifact only)
- *rejected(reason)* and *identity-by-mutation* are the two GOOD no-op classes: the spec explicitly declined or explicitly re-committed the same state.
- *unhandled* on a failing window is itself a finding: the spec neither acted nor rejected — usually a missing acceptor case (spec-error) or a rule the code has that the contract does not.

## Part 2 — invariant violations (model checking)

- states explored: **46** · specs checked: **3/3**

**3 invariant violation(s) reachable — these are bugs, with counterexamples:**

| invariant | kind | strength | counterexample (init → …) |
|---|---|---|---|
| S5-authorized-only-earned | transition | some-specs | init → submit({"actor":"alice","window_start":10,"window_end":100}) → approve({"actor":"bob","now":50}) → approve({"actor":"bob","now":50}) |
| S1-two-person-integrity | state | some-specs | init → submit({"actor":"alice","window_start":10,"window_end":100}) → approve({"actor":"bob","now":50}) → approve({"actor":"bob","now":50}) |
| S1-approvers-distinct | state | some-specs | init → submit({"actor":"alice","window_start":10,"window_end":100}) → approve({"actor":"bob","now":50}) → approve({"actor":"bob","now":50}) |

An *all-specs* violation means every independently derived model reaches the bad
state — a strong signal. Follow the counterexample path in the source.