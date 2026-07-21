# Intent log

> Rendered from `intent-ledger.json` by `polynv report --log` — do not edit; the ledger is the system of record.

## terminal-absorbing:CLOSED — **confirmed**

- source: template · target: transition
- question: 'CLOSED' is declared terminal. Once state == 'CLOSED', can ANY action still change the state? The template proposes: terminal states are frozen — every action arriving in 'CLOSED' is an observable no-op.
- evidence (contract.terminalStates): terminalStates includes 'CLOSED' (terminalKey: state)
- pre-check: HOLDS
- predicate versions:
  1. `(pre, action, data, post) => pre["state"] !== "CLOSED" || sameOn(["state","proposer","approvers","window_start","window_end","transmitted","executed"])(pre, post)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:27:14.199Z: disposition confirm by jdubray — Confirmed: an order's terminal disposition is final. Held by STRUCT-terminals-absorbing in invariants.mjs.

## terminal-absorbing:ABORTED — **confirmed**

- source: template · target: transition
- question: 'ABORTED' is declared terminal. Once state == 'ABORTED', can ANY action still change the state? The template proposes: terminal states are frozen — every action arriving in 'ABORTED' is an observable no-op.
- evidence (contract.terminalStates): terminalStates includes 'ABORTED' (terminalKey: state)
- pre-check: HOLDS
- predicate versions:
  1. `(pre, action, data, post) => pre["state"] !== "ABORTED" || sameOn(["state","proposer","approvers","window_start","window_end","transmitted","executed"])(pre, post)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:27:15.170Z: disposition confirm by jdubray — Confirmed: an order's terminal disposition is final. Held by STRUCT-terminals-absorbing in invariants.mjs.

## terminal-absorbing:EXPIRED — **confirmed**

- source: template · target: transition
- question: 'EXPIRED' is declared terminal. Once state == 'EXPIRED', can ANY action still change the state? The template proposes: terminal states are frozen — every action arriving in 'EXPIRED' is an observable no-op.
- evidence (contract.terminalStates): terminalStates includes 'EXPIRED' (terminalKey: state)
- pre-check: HOLDS
- predicate versions:
  1. `(pre, action, data, post) => pre["state"] !== "EXPIRED" || sameOn(["state","proposer","approvers","window_start","window_end","transmitted","executed"])(pre, post)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:28:55.911Z: disposition confirm by jdubray — Terminal disposition is final; held by STRUCT-terminals-absorbing.

## mined:precedence:acknowledge->close — **rejected**

- source: mined · target: temporal
- question: In all 3 observed scenario(s) where 'close' had an effect, 'acknowledge' had already occurred first. Is "no close before acknowledge" a rule — or just how the recorded scenarios happened to run? (The pre-check explores whether the machine itself can violate it.)
- evidence (mined:temporal): acknowledge before close in 3/3 scenarios containing close
- pre-check: HOLDS
- predicate versions:
  1. `null` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:22.879Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:precedence:acknowledge->execute — **rejected**

- source: mined · target: temporal
- question: In all 3 observed scenario(s) where 'execute' had an effect, 'acknowledge' had already occurred first. Is "no execute before acknowledge" a rule — or just how the recorded scenarios happened to run? (The pre-check explores whether the machine itself can violate it.)
- evidence (mined:temporal): acknowledge before execute in 3/3 scenarios containing execute
- pre-check: HOLDS
- predicate versions:
  1. `null` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:23.831Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:precedence:approve->abort — **rejected**

- source: mined · target: temporal
- question: In all 4 observed scenario(s) where 'abort' had an effect, 'approve' had already occurred first. Is "no abort before approve" a rule — or just how the recorded scenarios happened to run? (The pre-check explores whether the machine itself can violate it.)
- evidence (mined:temporal): approve before abort in 4/4 scenarios containing abort
- pre-check: FAILS — the machine can drive 'abort' before any 'approve'
- predicate versions:
  1. `null` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:22:57.312Z: disposition reject by jdubray — Corpus artifact: traces only exercised approvers {bob,carol}; the machine legitimately reaches other approver pairs and early recall (abort from PENDING with 0 approvers = L1). Behavior, not intent.

## mined:precedence:approve->acknowledge — **rejected**

- source: mined · target: temporal
- question: In all 5 observed scenario(s) where 'acknowledge' had an effect, 'approve' had already occurred first. Is "no acknowledge before approve" a rule — or just how the recorded scenarios happened to run? (The pre-check explores whether the machine itself can violate it.)
- evidence (mined:temporal): approve before acknowledge in 5/5 scenarios containing acknowledge
- pre-check: HOLDS
- predicate versions:
  1. `null` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:24.758Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:precedence:approve->close — **rejected**

- source: mined · target: temporal
- question: In all 3 observed scenario(s) where 'close' had an effect, 'approve' had already occurred first. Is "no close before approve" a rule — or just how the recorded scenarios happened to run? (The pre-check explores whether the machine itself can violate it.)
- evidence (mined:temporal): approve before close in 3/3 scenarios containing close
- pre-check: HOLDS
- predicate versions:
  1. `null` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:25.616Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:precedence:approve->execute — **rejected**

- source: mined · target: temporal
- question: In all 3 observed scenario(s) where 'execute' had an effect, 'approve' had already occurred first. Is "no execute before approve" a rule — or just how the recorded scenarios happened to run? (The pre-check explores whether the machine itself can violate it.)
- evidence (mined:temporal): approve before execute in 3/3 scenarios containing execute
- pre-check: HOLDS
- predicate versions:
  1. `null` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:26.548Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:precedence:approve->release — **rejected**

- source: mined · target: temporal
- question: In all 5 observed scenario(s) where 'release' had an effect, 'approve' had already occurred first. Is "no release before approve" a rule — or just how the recorded scenarios happened to run? (The pre-check explores whether the machine itself can violate it.)
- evidence (mined:temporal): approve before release in 5/5 scenarios containing release
- pre-check: HOLDS
- predicate versions:
  1. `null` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:27.478Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:precedence:execute->close — **rejected**

- source: mined · target: temporal
- question: In all 3 observed scenario(s) where 'close' had an effect, 'execute' had already occurred first. Is "no close before execute" a rule — or just how the recorded scenarios happened to run? (The pre-check explores whether the machine itself can violate it.)
- evidence (mined:temporal): execute before close in 3/3 scenarios containing close
- pre-check: HOLDS
- predicate versions:
  1. `null` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:28.419Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:precedence:release->acknowledge — **rejected**

- source: mined · target: temporal
- question: In all 5 observed scenario(s) where 'acknowledge' had an effect, 'release' had already occurred first. Is "no acknowledge before release" a rule — or just how the recorded scenarios happened to run? (The pre-check explores whether the machine itself can violate it.)
- evidence (mined:temporal): release before acknowledge in 5/5 scenarios containing acknowledge
- pre-check: HOLDS
- predicate versions:
  1. `null` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:29.351Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:precedence:release->close — **rejected**

- source: mined · target: temporal
- question: In all 3 observed scenario(s) where 'close' had an effect, 'release' had already occurred first. Is "no close before release" a rule — or just how the recorded scenarios happened to run? (The pre-check explores whether the machine itself can violate it.)
- evidence (mined:temporal): release before close in 3/3 scenarios containing close
- pre-check: HOLDS
- predicate versions:
  1. `null` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:30.206Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:precedence:release->execute — **rejected**

- source: mined · target: temporal
- question: In all 3 observed scenario(s) where 'execute' had an effect, 'release' had already occurred first. Is "no execute before release" a rule — or just how the recorded scenarios happened to run? (The pre-check explores whether the machine itself can violate it.)
- evidence (mined:temporal): release before execute in 3/3 scenarios containing execute
- pre-check: HOLDS
- predicate versions:
  1. `null` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:31.144Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:precedence:submit->abort — **rejected**

- source: mined · target: temporal
- question: In all 4 observed scenario(s) where 'abort' had an effect, 'submit' had already occurred first. Is "no abort before submit" a rule — or just how the recorded scenarios happened to run? (The pre-check explores whether the machine itself can violate it.)
- evidence (mined:temporal): submit before abort in 4/4 scenarios containing abort
- pre-check: HOLDS
- predicate versions:
  1. `null` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:31.990Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:precedence:submit->acknowledge — **rejected**

- source: mined · target: temporal
- question: In all 5 observed scenario(s) where 'acknowledge' had an effect, 'submit' had already occurred first. Is "no acknowledge before submit" a rule — or just how the recorded scenarios happened to run? (The pre-check explores whether the machine itself can violate it.)
- evidence (mined:temporal): submit before acknowledge in 5/5 scenarios containing acknowledge
- pre-check: HOLDS
- predicate versions:
  1. `null` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:32.911Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:precedence:submit->approve — **rejected**

- source: mined · target: temporal
- question: In all 8 observed scenario(s) where 'approve' had an effect, 'submit' had already occurred first. Is "no approve before submit" a rule — or just how the recorded scenarios happened to run? (The pre-check explores whether the machine itself can violate it.)
- evidence (mined:temporal): submit before approve in 8/8 scenarios containing approve
- pre-check: HOLDS
- predicate versions:
  1. `null` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:33.855Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:precedence:submit->close — **rejected**

- source: mined · target: temporal
- question: In all 3 observed scenario(s) where 'close' had an effect, 'submit' had already occurred first. Is "no close before submit" a rule — or just how the recorded scenarios happened to run? (The pre-check explores whether the machine itself can violate it.)
- evidence (mined:temporal): submit before close in 3/3 scenarios containing close
- pre-check: HOLDS
- predicate versions:
  1. `null` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:34.805Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:precedence:submit->execute — **rejected**

- source: mined · target: temporal
- question: In all 3 observed scenario(s) where 'execute' had an effect, 'submit' had already occurred first. Is "no execute before submit" a rule — or just how the recorded scenarios happened to run? (The pre-check explores whether the machine itself can violate it.)
- evidence (mined:temporal): submit before execute in 3/3 scenarios containing execute
- pre-check: HOLDS
- predicate versions:
  1. `null` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:35.731Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:precedence:submit->release — **rejected**

- source: mined · target: temporal
- question: In all 5 observed scenario(s) where 'release' had an effect, 'submit' had already occurred first. Is "no release before submit" a rule — or just how the recorded scenarios happened to run? (The pre-check explores whether the machine itself can violate it.)
- evidence (mined:temporal): submit before release in 5/5 scenarios containing release
- pre-check: HOLDS
- predicate versions:
  1. `null` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:36.660Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:in-domain:proposer — **rejected**

- source: mined · target: state
- question: Across 108 observed states, 'proposer' only ever took 2 value(s): null, "alice". Is that the complete legal domain — a rule — or an artifact of the scenarios observed so far?
- evidence (mined:state): distinct values: 2
- pre-check: HOLDS
- predicate versions:
  1. `(s) => [null,"alice"].some((v) => canon(v) === canon(s["proposer"]))` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:37.593Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:in-domain:approvers — **rejected**

- source: mined · target: state
- question: Across 108 observed states, 'approvers' only ever took 3 value(s): [], ["bob"], ["bob","carol"]. Is that the complete legal domain — a rule — or an artifact of the scenarios observed so far?
- evidence (mined:state): distinct values: 3
- pre-check: FAILS — reachable state violates the rule
- predicate versions:
  1. `(s) => [[],["bob"],["bob","carol"]].some((v) => canon(v) === canon(s["approvers"]))` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:22:58.167Z: disposition reject by jdubray — Corpus artifact: traces only exercised approvers {bob,carol}; the machine legitimately reaches other approver pairs and early recall (abort from PENDING with 0 approvers = L1). Behavior, not intent.

## mined:in-domain:window_start — **rejected**

- source: mined · target: state
- question: Across 108 observed states, 'window_start' only ever took 2 value(s): null, 10. Is that the complete legal domain — a rule — or an artifact of the scenarios observed so far?
- evidence (mined:state): distinct values: 2
- pre-check: HOLDS
- predicate versions:
  1. `(s) => [null,10].some((v) => canon(v) === canon(s["window_start"]))` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:38.493Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:in-domain:window_end — **rejected**

- source: mined · target: state
- question: Across 108 observed states, 'window_end' only ever took 2 value(s): null, 100. Is that the complete legal domain — a rule — or an artifact of the scenarios observed so far?
- evidence (mined:state): distinct values: 2
- pre-check: HOLDS
- predicate versions:
  1. `(s) => [null,100].some((v) => canon(v) === canon(s["window_end"]))` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:39.361Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:in-domain:transmitted — **rejected**

- source: mined · target: state
- question: Across 108 observed states, 'transmitted' only ever took 2 value(s): false, true. Is that the complete legal domain — a rule — or an artifact of the scenarios observed so far?
- evidence (mined:state): distinct values: 2
- pre-check: HOLDS
- predicate versions:
  1. `(s) => [false,true].some((v) => canon(v) === canon(s["transmitted"]))` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:40.333Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:in-domain:executed — **rejected**

- source: mined · target: state
- question: Across 108 observed states, 'executed' only ever took 2 value(s): false, true. Is that the complete legal domain — a rule — or an artifact of the scenarios observed so far?
- evidence (mined:state): distinct values: 2
- pre-check: HOLDS
- predicate versions:
  1. `(s) => [false,true].some((v) => canon(v) === canon(s["executed"]))` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:41.277Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=DRAFT:proposer-eq — **rejected**

- source: mined · target: state
- question: In all 8 observed states with state == "DRAFT", 'proposer' was exactly null — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): proposer == null in all 8
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("DRAFT") || canon(s["proposer"]) === canon(null)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:42.231Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=DRAFT:approvers-eq — **rejected**

- source: mined · target: state
- question: In all 8 observed states with state == "DRAFT", 'approvers' was exactly [] — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): approvers == [] in all 8
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("DRAFT") || canon(s["approvers"]) === canon([])` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:43.144Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=DRAFT:window_start-eq — **rejected**

- source: mined · target: state
- question: In all 8 observed states with state == "DRAFT", 'window_start' was exactly null — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): window_start == null in all 8
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("DRAFT") || canon(s["window_start"]) === canon(null)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:44.098Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=DRAFT:window_end-eq — **rejected**

- source: mined · target: state
- question: In all 8 observed states with state == "DRAFT", 'window_end' was exactly null — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): window_end == null in all 8
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("DRAFT") || canon(s["window_end"]) === canon(null)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:45.031Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=DRAFT:transmitted-eq — **rejected**

- source: mined · target: state
- question: In all 8 observed states with state == "DRAFT", 'transmitted' was exactly false — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): transmitted == false in all 8
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("DRAFT") || canon(s["transmitted"]) === canon(false)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:45.973Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=DRAFT:executed-eq — **rejected**

- source: mined · target: state
- question: In all 8 observed states with state == "DRAFT", 'executed' was exactly false — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): executed == false in all 8
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("DRAFT") || canon(s["executed"]) === canon(false)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:46.877Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=PENDING_APPROVAL:proposer-set — **rejected**

- source: mined · target: state
- question: In all 40 observed states with state == "PENDING_APPROVAL", 'proposer' was set (not "") — while it IS "" in other states. Is "state == "PENDING_APPROVAL" implies proposer is set" a rule, or an artifact?
- evidence (mined:state): proposer set in 40/40 states with state="PENDING_APPROVAL"
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("PENDING_APPROVAL") || (s["proposer"] !== '' && s["proposer"] !== null && s["proposer"] !== undefined)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:47.779Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=PENDING_APPROVAL:window_start-set — **rejected**

- source: mined · target: state
- question: In all 40 observed states with state == "PENDING_APPROVAL", 'window_start' was set (not "") — while it IS "" in other states. Is "state == "PENDING_APPROVAL" implies window_start is set" a rule, or an artifact?
- evidence (mined:state): window_start set in 40/40 states with state="PENDING_APPROVAL"
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("PENDING_APPROVAL") || (s["window_start"] !== '' && s["window_start"] !== null && s["window_start"] !== undefined)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:48.593Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=PENDING_APPROVAL:window_end-set — **rejected**

- source: mined · target: state
- question: In all 40 observed states with state == "PENDING_APPROVAL", 'window_end' was set (not "") — while it IS "" in other states. Is "state == "PENDING_APPROVAL" implies window_end is set" a rule, or an artifact?
- evidence (mined:state): window_end set in 40/40 states with state="PENDING_APPROVAL"
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("PENDING_APPROVAL") || (s["window_end"] !== '' && s["window_end"] !== null && s["window_end"] !== undefined)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:49.524Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=PENDING_APPROVAL:transmitted-eq — **rejected**

- source: mined · target: state
- question: In all 40 observed states with state == "PENDING_APPROVAL", 'transmitted' was exactly false — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): transmitted == false in all 40
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("PENDING_APPROVAL") || canon(s["transmitted"]) === canon(false)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:50.434Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=PENDING_APPROVAL:executed-eq — **rejected**

- source: mined · target: state
- question: In all 40 observed states with state == "PENDING_APPROVAL", 'executed' was exactly false — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): executed == false in all 40
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("PENDING_APPROVAL") || canon(s["executed"]) === canon(false)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:51.346Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=APPROVED:proposer-set — **rejected**

- source: mined · target: state
- question: In all 14 observed states with state == "APPROVED", 'proposer' was set (not "") — while it IS "" in other states. Is "state == "APPROVED" implies proposer is set" a rule, or an artifact?
- evidence (mined:state): proposer set in 14/14 states with state="APPROVED"
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("APPROVED") || (s["proposer"] !== '' && s["proposer"] !== null && s["proposer"] !== undefined)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:52.288Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=APPROVED:approvers-eq — **rejected**

- source: mined · target: state
- question: In all 14 observed states with state == "APPROVED", 'approvers' was exactly ["bob","carol"] — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): approvers == ["bob","carol"] in all 14
- pre-check: FAILS — reachable state violates the rule
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("APPROVED") || canon(s["approvers"]) === canon(["bob","carol"])` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:22:59.019Z: disposition reject by jdubray — Corpus artifact: traces only exercised approvers {bob,carol}; the machine legitimately reaches other approver pairs and early recall (abort from PENDING with 0 approvers = L1). Behavior, not intent.

## mined:implication:state=APPROVED:window_start-set — **rejected**

- source: mined · target: state
- question: In all 14 observed states with state == "APPROVED", 'window_start' was set (not "") — while it IS "" in other states. Is "state == "APPROVED" implies window_start is set" a rule, or an artifact?
- evidence (mined:state): window_start set in 14/14 states with state="APPROVED"
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("APPROVED") || (s["window_start"] !== '' && s["window_start"] !== null && s["window_start"] !== undefined)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:53.181Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=APPROVED:window_end-set — **rejected**

- source: mined · target: state
- question: In all 14 observed states with state == "APPROVED", 'window_end' was set (not "") — while it IS "" in other states. Is "state == "APPROVED" implies window_end is set" a rule, or an artifact?
- evidence (mined:state): window_end set in 14/14 states with state="APPROVED"
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("APPROVED") || (s["window_end"] !== '' && s["window_end"] !== null && s["window_end"] !== undefined)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:54.088Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=APPROVED:transmitted-eq — **rejected**

- source: mined · target: state
- question: In all 14 observed states with state == "APPROVED", 'transmitted' was exactly false — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): transmitted == false in all 14
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("APPROVED") || canon(s["transmitted"]) === canon(false)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:54.965Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=APPROVED:executed-eq — **rejected**

- source: mined · target: state
- question: In all 14 observed states with state == "APPROVED", 'executed' was exactly false — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): executed == false in all 14
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("APPROVED") || canon(s["executed"]) === canon(false)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:55.915Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=RELEASED:proposer-set — **rejected**

- source: mined · target: state
- question: In all 12 observed states with state == "RELEASED", 'proposer' was set (not "") — while it IS "" in other states. Is "state == "RELEASED" implies proposer is set" a rule, or an artifact?
- evidence (mined:state): proposer set in 12/12 states with state="RELEASED"
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("RELEASED") || (s["proposer"] !== '' && s["proposer"] !== null && s["proposer"] !== undefined)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:56.789Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=RELEASED:approvers-eq — **rejected**

- source: mined · target: state
- question: In all 12 observed states with state == "RELEASED", 'approvers' was exactly ["bob","carol"] — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): approvers == ["bob","carol"] in all 12
- pre-check: FAILS — reachable state violates the rule
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("RELEASED") || canon(s["approvers"]) === canon(["bob","carol"])` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:22:59.871Z: disposition reject by jdubray — Corpus artifact: traces only exercised approvers {bob,carol}; the machine legitimately reaches other approver pairs and early recall (abort from PENDING with 0 approvers = L1). Behavior, not intent.

## mined:implication:state=RELEASED:window_start-set — **rejected**

- source: mined · target: state
- question: In all 12 observed states with state == "RELEASED", 'window_start' was set (not "") — while it IS "" in other states. Is "state == "RELEASED" implies window_start is set" a rule, or an artifact?
- evidence (mined:state): window_start set in 12/12 states with state="RELEASED"
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("RELEASED") || (s["window_start"] !== '' && s["window_start"] !== null && s["window_start"] !== undefined)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:57.639Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=RELEASED:window_end-set — **rejected**

- source: mined · target: state
- question: In all 12 observed states with state == "RELEASED", 'window_end' was set (not "") — while it IS "" in other states. Is "state == "RELEASED" implies window_end is set" a rule, or an artifact?
- evidence (mined:state): window_end set in 12/12 states with state="RELEASED"
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("RELEASED") || (s["window_end"] !== '' && s["window_end"] !== null && s["window_end"] !== undefined)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:58.575Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=RELEASED:transmitted-eq — **rejected**

- source: mined · target: state
- question: In all 12 observed states with state == "RELEASED", 'transmitted' was exactly true — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): transmitted == true in all 12
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("RELEASED") || canon(s["transmitted"]) === canon(true)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:26:59.469Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=RELEASED:executed-eq — **rejected**

- source: mined · target: state
- question: In all 12 observed states with state == "RELEASED", 'executed' was exactly false — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): executed == false in all 12
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("RELEASED") || canon(s["executed"]) === canon(false)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:27:00.403Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=ACKNOWLEDGED:proposer-set — **rejected**

- source: mined · target: state
- question: In all 12 observed states with state == "ACKNOWLEDGED", 'proposer' was set (not "") — while it IS "" in other states. Is "state == "ACKNOWLEDGED" implies proposer is set" a rule, or an artifact?
- evidence (mined:state): proposer set in 12/12 states with state="ACKNOWLEDGED"
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("ACKNOWLEDGED") || (s["proposer"] !== '' && s["proposer"] !== null && s["proposer"] !== undefined)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:27:01.301Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=ACKNOWLEDGED:approvers-eq — **rejected**

- source: mined · target: state
- question: In all 12 observed states with state == "ACKNOWLEDGED", 'approvers' was exactly ["bob","carol"] — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): approvers == ["bob","carol"] in all 12
- pre-check: FAILS — reachable state violates the rule
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("ACKNOWLEDGED") || canon(s["approvers"]) === canon(["bob","carol"])` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:23:00.725Z: disposition reject by jdubray — Corpus artifact: traces only exercised approvers {bob,carol}; the machine legitimately reaches other approver pairs and early recall (abort from PENDING with 0 approvers = L1). Behavior, not intent.

## mined:implication:state=ACKNOWLEDGED:window_start-set — **rejected**

- source: mined · target: state
- question: In all 12 observed states with state == "ACKNOWLEDGED", 'window_start' was set (not "") — while it IS "" in other states. Is "state == "ACKNOWLEDGED" implies window_start is set" a rule, or an artifact?
- evidence (mined:state): window_start set in 12/12 states with state="ACKNOWLEDGED"
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("ACKNOWLEDGED") || (s["window_start"] !== '' && s["window_start"] !== null && s["window_start"] !== undefined)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:27:02.213Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=ACKNOWLEDGED:window_end-set — **rejected**

- source: mined · target: state
- question: In all 12 observed states with state == "ACKNOWLEDGED", 'window_end' was set (not "") — while it IS "" in other states. Is "state == "ACKNOWLEDGED" implies window_end is set" a rule, or an artifact?
- evidence (mined:state): window_end set in 12/12 states with state="ACKNOWLEDGED"
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("ACKNOWLEDGED") || (s["window_end"] !== '' && s["window_end"] !== null && s["window_end"] !== undefined)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:27:03.132Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=ACKNOWLEDGED:transmitted-eq — **rejected**

- source: mined · target: state
- question: In all 12 observed states with state == "ACKNOWLEDGED", 'transmitted' was exactly true — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): transmitted == true in all 12
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("ACKNOWLEDGED") || canon(s["transmitted"]) === canon(true)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:27:04.061Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=ACKNOWLEDGED:executed-eq — **rejected**

- source: mined · target: state
- question: In all 12 observed states with state == "ACKNOWLEDGED", 'executed' was exactly false — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): executed == false in all 12
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("ACKNOWLEDGED") || canon(s["executed"]) === canon(false)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:27:04.942Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=EXECUTED:proposer-set — **rejected**

- source: mined · target: state
- question: In all 8 observed states with state == "EXECUTED", 'proposer' was set (not "") — while it IS "" in other states. Is "state == "EXECUTED" implies proposer is set" a rule, or an artifact?
- evidence (mined:state): proposer set in 8/8 states with state="EXECUTED"
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("EXECUTED") || (s["proposer"] !== '' && s["proposer"] !== null && s["proposer"] !== undefined)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:27:05.850Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=EXECUTED:approvers-eq — **rejected**

- source: mined · target: state
- question: In all 8 observed states with state == "EXECUTED", 'approvers' was exactly ["bob","carol"] — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): approvers == ["bob","carol"] in all 8
- pre-check: FAILS — reachable state violates the rule
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("EXECUTED") || canon(s["approvers"]) === canon(["bob","carol"])` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:23:01.622Z: disposition reject by jdubray — Corpus artifact: traces only exercised approvers {bob,carol}; the machine legitimately reaches other approver pairs and early recall (abort from PENDING with 0 approvers = L1). Behavior, not intent.

## mined:implication:state=EXECUTED:window_start-set — **rejected**

- source: mined · target: state
- question: In all 8 observed states with state == "EXECUTED", 'window_start' was set (not "") — while it IS "" in other states. Is "state == "EXECUTED" implies window_start is set" a rule, or an artifact?
- evidence (mined:state): window_start set in 8/8 states with state="EXECUTED"
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("EXECUTED") || (s["window_start"] !== '' && s["window_start"] !== null && s["window_start"] !== undefined)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:27:06.694Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=EXECUTED:window_end-set — **rejected**

- source: mined · target: state
- question: In all 8 observed states with state == "EXECUTED", 'window_end' was set (not "") — while it IS "" in other states. Is "state == "EXECUTED" implies window_end is set" a rule, or an artifact?
- evidence (mined:state): window_end set in 8/8 states with state="EXECUTED"
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("EXECUTED") || (s["window_end"] !== '' && s["window_end"] !== null && s["window_end"] !== undefined)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:27:07.607Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=EXECUTED:transmitted-eq — **rejected**

- source: mined · target: state
- question: In all 8 observed states with state == "EXECUTED", 'transmitted' was exactly true — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): transmitted == true in all 8
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("EXECUTED") || canon(s["transmitted"]) === canon(true)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:27:08.525Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=EXECUTED:executed-eq — **rejected**

- source: mined · target: state
- question: In all 8 observed states with state == "EXECUTED", 'executed' was exactly true — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): executed == true in all 8
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("EXECUTED") || canon(s["executed"]) === canon(true)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:27:09.444Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=CLOSED:proposer-set — **rejected**

- source: mined · target: state
- question: In all 9 observed states with state == "CLOSED", 'proposer' was set (not "") — while it IS "" in other states. Is "state == "CLOSED" implies proposer is set" a rule, or an artifact?
- evidence (mined:state): proposer set in 9/9 states with state="CLOSED"
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("CLOSED") || (s["proposer"] !== '' && s["proposer"] !== null && s["proposer"] !== undefined)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:27:10.365Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=CLOSED:approvers-eq — **rejected**

- source: mined · target: state
- question: In all 9 observed states with state == "CLOSED", 'approvers' was exactly ["bob","carol"] — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): approvers == ["bob","carol"] in all 9
- pre-check: FAILS — reachable state violates the rule
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("CLOSED") || canon(s["approvers"]) === canon(["bob","carol"])` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:23:02.514Z: disposition reject by jdubray — Corpus artifact: traces only exercised approvers {bob,carol}; the machine legitimately reaches other approver pairs and early recall (abort from PENDING with 0 approvers = L1). Behavior, not intent.

## mined:implication:state=CLOSED:window_start-set — **rejected**

- source: mined · target: state
- question: In all 9 observed states with state == "CLOSED", 'window_start' was set (not "") — while it IS "" in other states. Is "state == "CLOSED" implies window_start is set" a rule, or an artifact?
- evidence (mined:state): window_start set in 9/9 states with state="CLOSED"
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("CLOSED") || (s["window_start"] !== '' && s["window_start"] !== null && s["window_start"] !== undefined)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:27:11.338Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=CLOSED:window_end-set — **rejected**

- source: mined · target: state
- question: In all 9 observed states with state == "CLOSED", 'window_end' was set (not "") — while it IS "" in other states. Is "state == "CLOSED" implies window_end is set" a rule, or an artifact?
- evidence (mined:state): window_end set in 9/9 states with state="CLOSED"
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("CLOSED") || (s["window_end"] !== '' && s["window_end"] !== null && s["window_end"] !== undefined)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:27:12.285Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=CLOSED:transmitted-eq — **rejected**

- source: mined · target: state
- question: In all 9 observed states with state == "CLOSED", 'transmitted' was exactly true — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): transmitted == true in all 9
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("CLOSED") || canon(s["transmitted"]) === canon(true)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:27:13.217Z: disposition reject by jdubray — Restates the transition table / already covered by S3 (monotone effects) and S5 (proposer set-once); not adopted as a separate invariant.

## mined:implication:state=CLOSED:executed-eq — **rejected**

- source: mined · target: state
- question: In all 9 observed states with state == "CLOSED", 'executed' was exactly true — while it varies elsewhere. Rule, or artifact?
- evidence (mined:state): executed == true in all 9
- pre-check: HOLDS
- predicate versions:
  1. `(s) => canon(s["state"]) !== canon("CLOSED") || canon(s["executed"]) === canon(true)` (harvest, 2026-07-21T11:47:28.712Z)
- events:
  - 2026-07-21T11:47:28.712Z: harvested
  - 2026-07-21T11:47:28.712Z: precheck
  - 2026-07-21T12:28:56.781Z: disposition reject by jdubray — Restates the state table (CLOSED implies executed); already covered by S3-executed-implies-post-ack.

## mutation-survivor:drop:abort@"ACKNOWLEDGED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'abort' in state="ACKNOWLEDGED" no longer does anything (guard negated to a reject). Concretely: abort({}) on {"state":"ACKNOWLEDGED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} would yield {"state":"ACKNOWLEDGED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} (the real machine yields {"state":"ABORTED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'abort' in state="ACKNOWLEDGED" no longer does anything (guard negated to a reject)
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:25:59.432Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:drop:abort@"APPROVED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'abort' in state="APPROVED" no longer does anything (guard negated to a reject). Concretely: abort({}) on {"state":"APPROVED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":false,"executed":false} would yield {"state":"APPROVED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":false,"executed":false} (the real machine yields {"state":"ABORTED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":false,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'abort' in state="APPROVED" no longer does anything (guard negated to a reject)
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:00.363Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:drop:abort@"PENDING_APPROVAL" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'abort' in state="PENDING_APPROVAL" no longer does anything (guard negated to a reject). Concretely: abort({}) on {"state":"PENDING_APPROVAL","proposer":"alice","approvers":[],"window_start":10,"window_end":100,"transmitted":false,"executed":false} would yield {"state":"PENDING_APPROVAL","proposer":"alice","approvers":[],"window_start":10,"window_end":100,"transmitted":false,"executed":false} (the real machine yields {"state":"ABORTED","proposer":"alice","approvers":[],"window_start":10,"window_end":100,"transmitted":false,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'abort' in state="PENDING_APPROVAL" no longer does anything (guard negated to a reject)
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:01.248Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:drop:abort@"RELEASED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'abort' in state="RELEASED" no longer does anything (guard negated to a reject). Concretely: abort({}) on {"state":"RELEASED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} would yield {"state":"RELEASED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} (the real machine yields {"state":"ABORTED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'abort' in state="RELEASED" no longer does anything (guard negated to a reject)
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:02.079Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:drop:acknowledge@"RELEASED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'acknowledge' in state="RELEASED" no longer does anything (guard negated to a reject). Concretely: acknowledge({}) on {"state":"RELEASED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} would yield {"state":"RELEASED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} (the real machine yields {"state":"ACKNOWLEDGED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'acknowledge' in state="RELEASED" no longer does anything (guard negated to a reject)
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:02.935Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:drop:approve@"PENDING_APPROVAL" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'approve' in state="PENDING_APPROVAL" no longer does anything (guard negated to a reject). Concretely: approve({"actor":"bob","now":50}) on {"state":"PENDING_APPROVAL","proposer":"alice","approvers":[],"window_start":10,"window_end":100,"transmitted":false,"executed":false} would yield {"state":"PENDING_APPROVAL","proposer":"alice","approvers":[],"window_start":10,"window_end":100,"transmitted":false,"executed":false} (the real machine yields {"state":"PENDING_APPROVAL","proposer":"alice","approvers":["bob"],"window_start":10,"window_end":100,"transmitted":false,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'approve' in state="PENDING_APPROVAL" no longer does anything (guard negated to a reject)
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:03.819Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:drop:close@"EXECUTED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'close' in state="EXECUTED" no longer does anything (guard negated to a reject). Concretely: close({}) on {"state":"EXECUTED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":true} would yield {"state":"EXECUTED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":true} (the real machine yields {"state":"CLOSED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":true}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'close' in state="EXECUTED" no longer does anything (guard negated to a reject)
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:04.682Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:drop:execute@"ACKNOWLEDGED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'execute' in state="ACKNOWLEDGED" no longer does anything (guard negated to a reject). Concretely: execute({"now":50}) on {"state":"ACKNOWLEDGED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} would yield {"state":"ACKNOWLEDGED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} (the real machine yields {"state":"EXECUTED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":true}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'execute' in state="ACKNOWLEDGED" no longer does anything (guard negated to a reject)
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:05.569Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:drop:expire@"ACKNOWLEDGED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'expire' in state="ACKNOWLEDGED" no longer does anything (guard negated to a reject). Concretely: expire({"now":150}) on {"state":"ACKNOWLEDGED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} would yield {"state":"ACKNOWLEDGED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} (the real machine yields {"state":"EXPIRED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'expire' in state="ACKNOWLEDGED" no longer does anything (guard negated to a reject)
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:06.468Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:drop:expire@"APPROVED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'expire' in state="APPROVED" no longer does anything (guard negated to a reject). Concretely: expire({"now":150}) on {"state":"APPROVED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":false,"executed":false} would yield {"state":"APPROVED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":false,"executed":false} (the real machine yields {"state":"EXPIRED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":false,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'expire' in state="APPROVED" no longer does anything (guard negated to a reject)
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:07.405Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:drop:expire@"PENDING_APPROVAL" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'expire' in state="PENDING_APPROVAL" no longer does anything (guard negated to a reject). Concretely: expire({"now":150}) on {"state":"PENDING_APPROVAL","proposer":"alice","approvers":[],"window_start":10,"window_end":100,"transmitted":false,"executed":false} would yield {"state":"PENDING_APPROVAL","proposer":"alice","approvers":[],"window_start":10,"window_end":100,"transmitted":false,"executed":false} (the real machine yields {"state":"EXPIRED","proposer":"alice","approvers":[],"window_start":10,"window_end":100,"transmitted":false,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'expire' in state="PENDING_APPROVAL" no longer does anything (guard negated to a reject)
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:08.258Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:drop:expire@"RELEASED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'expire' in state="RELEASED" no longer does anything (guard negated to a reject). Concretely: expire({"now":150}) on {"state":"RELEASED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} would yield {"state":"RELEASED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} (the real machine yields {"state":"EXPIRED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'expire' in state="RELEASED" no longer does anything (guard negated to a reject)
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:09.122Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:drop:release@"APPROVED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'release' in state="APPROVED" no longer does anything (guard negated to a reject). Concretely: release({"now":50}) on {"state":"APPROVED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":false,"executed":false} would yield {"state":"APPROVED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":false,"executed":false} (the real machine yields {"state":"RELEASED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'release' in state="APPROVED" no longer does anything (guard negated to a reject)
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:09.989Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:drop:submit@"DRAFT" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'submit' in state="DRAFT" no longer does anything (guard negated to a reject). Concretely: submit({"actor":"alice","window_start":10,"window_end":100}) on {"state":"DRAFT","proposer":null,"approvers":[],"window_start":null,"window_end":null,"transmitted":false,"executed":false} would yield {"state":"DRAFT","proposer":null,"approvers":[],"window_start":null,"window_end":null,"transmitted":false,"executed":false} (the real machine yields {"state":"PENDING_APPROVAL","proposer":"alice","approvers":[],"window_start":10,"window_end":100,"transmitted":false,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'submit' in state="DRAFT" no longer does anything (guard negated to a reject)
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:10.797Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:retarget:abort@"APPROVED"->"ACKNOWLEDGED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'abort' in state="APPROVED" lands in state="ACKNOWLEDGED" instead. Concretely: abort({}) on {"state":"APPROVED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":false,"executed":false} would yield {"state":"ACKNOWLEDGED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":false,"executed":false} (the real machine yields {"state":"ABORTED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":false,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'abort' in state="APPROVED" lands in state="ACKNOWLEDGED" instead
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:11.682Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:retarget:abort@"RELEASED"->"ACKNOWLEDGED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'abort' in state="RELEASED" lands in state="ACKNOWLEDGED" instead. Concretely: abort({}) on {"state":"RELEASED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} would yield {"state":"ACKNOWLEDGED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} (the real machine yields {"state":"ABORTED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'abort' in state="RELEASED" lands in state="ACKNOWLEDGED" instead
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:12.621Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:retarget:acknowledge@"RELEASED"->"ABORTED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'acknowledge' in state="RELEASED" lands in state="ABORTED" instead. Concretely: acknowledge({}) on {"state":"RELEASED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} would yield {"state":"ABORTED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} (the real machine yields {"state":"ACKNOWLEDGED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'acknowledge' in state="RELEASED" lands in state="ABORTED" instead
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:13.545Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:retarget:approve@"PENDING_APPROVAL"->"ABORTED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'approve' in state="PENDING_APPROVAL" lands in state="ABORTED" instead. Concretely: approve({"actor":"bob","now":50}) on {"state":"PENDING_APPROVAL","proposer":"alice","approvers":[],"window_start":10,"window_end":100,"transmitted":false,"executed":false} would yield {"state":"ABORTED","proposer":"alice","approvers":["bob"],"window_start":10,"window_end":100,"transmitted":false,"executed":false} (the real machine yields {"state":"PENDING_APPROVAL","proposer":"alice","approvers":["bob"],"window_start":10,"window_end":100,"transmitted":false,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'approve' in state="PENDING_APPROVAL" lands in state="ABORTED" instead
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:14.504Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:retarget:expire@"ACKNOWLEDGED"->"ABORTED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'expire' in state="ACKNOWLEDGED" lands in state="ABORTED" instead. Concretely: expire({"now":150}) on {"state":"ACKNOWLEDGED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} would yield {"state":"ABORTED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} (the real machine yields {"state":"EXPIRED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'expire' in state="ACKNOWLEDGED" lands in state="ABORTED" instead
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:15.454Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:retarget:expire@"APPROVED"->"ABORTED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'expire' in state="APPROVED" lands in state="ABORTED" instead. Concretely: expire({"now":150}) on {"state":"APPROVED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":false,"executed":false} would yield {"state":"ABORTED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":false,"executed":false} (the real machine yields {"state":"EXPIRED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":false,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'expire' in state="APPROVED" lands in state="ABORTED" instead
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:16.412Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:retarget:expire@"PENDING_APPROVAL"->"ABORTED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'expire' in state="PENDING_APPROVAL" lands in state="ABORTED" instead. Concretely: expire({"now":150}) on {"state":"PENDING_APPROVAL","proposer":"alice","approvers":[],"window_start":10,"window_end":100,"transmitted":false,"executed":false} would yield {"state":"ABORTED","proposer":"alice","approvers":[],"window_start":10,"window_end":100,"transmitted":false,"executed":false} (the real machine yields {"state":"EXPIRED","proposer":"alice","approvers":[],"window_start":10,"window_end":100,"transmitted":false,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'expire' in state="PENDING_APPROVAL" lands in state="ABORTED" instead
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:17.317Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:retarget:expire@"RELEASED"->"ABORTED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'expire' in state="RELEASED" lands in state="ABORTED" instead. Concretely: expire({"now":150}) on {"state":"RELEASED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} would yield {"state":"ABORTED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} (the real machine yields {"state":"EXPIRED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'expire' in state="RELEASED" lands in state="ABORTED" instead
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:18.254Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:retarget:release@"APPROVED"->"ABORTED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'release' in state="APPROVED" lands in state="ABORTED" instead. Concretely: release({"now":50}) on {"state":"APPROVED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":false,"executed":false} would yield {"state":"ABORTED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false} (the real machine yields {"state":"RELEASED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":true,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'release' in state="APPROVED" lands in state="ABORTED" instead
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:19.183Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:retarget:submit@"DRAFT"->"ABORTED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'submit' in state="DRAFT" lands in state="ABORTED" instead. Concretely: submit({"actor":"alice","window_start":10,"window_end":100}) on {"state":"DRAFT","proposer":null,"approvers":[],"window_start":null,"window_end":null,"transmitted":false,"executed":false} would yield {"state":"ABORTED","proposer":"alice","approvers":[],"window_start":10,"window_end":100,"transmitted":false,"executed":false} (the real machine yields {"state":"PENDING_APPROVAL","proposer":"alice","approvers":[],"window_start":10,"window_end":100,"transmitted":false,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'submit' in state="DRAFT" lands in state="ABORTED" instead
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:20.076Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:widen:abort@"DRAFT"<-"ACKNOWLEDGED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'abort' now ACCEPTED in state="DRAFT" (applied as it is in state="ACKNOWLEDGED"). Concretely: abort({}) on {"state":"DRAFT","proposer":null,"approvers":[],"window_start":null,"window_end":null,"transmitted":false,"executed":false} would yield {"state":"ABORTED","proposer":null,"approvers":[],"window_start":null,"window_end":null,"transmitted":false,"executed":false} (the real machine yields {"state":"DRAFT","proposer":null,"approvers":[],"window_start":null,"window_end":null,"transmitted":false,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'abort' now ACCEPTED in state="DRAFT" (applied as it is in state="ACKNOWLEDGED")
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:20.937Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:widen:abort@"EXPIRED"<-"ACKNOWLEDGED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'abort' now ACCEPTED in state="EXPIRED" (applied as it is in state="ACKNOWLEDGED"). Concretely: abort({}) on {"state":"EXPIRED","proposer":"alice","approvers":[],"window_start":10,"window_end":100,"transmitted":false,"executed":false} would yield {"state":"ABORTED","proposer":"alice","approvers":[],"window_start":10,"window_end":100,"transmitted":false,"executed":false} (the real machine yields {"state":"EXPIRED","proposer":"alice","approvers":[],"window_start":10,"window_end":100,"transmitted":false,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'abort' now ACCEPTED in state="EXPIRED" (applied as it is in state="ACKNOWLEDGED")
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:26:21.873Z: disposition reject by jdubray — Out of scope for safety invariants: behavior-removing/retarget mutant caught by reachability.mjs (L1/L2) or trace replay (conformance).

## mutation-survivor:widen:acknowledge@"APPROVED"<-"RELEASED" — **rejected**

- source: mutation-survivor · target: transition
- question: NO confirmed invariant constrains this behavior change: 'acknowledge' now ACCEPTED in state="APPROVED" (applied as it is in state="RELEASED"). Concretely: acknowledge({}) on {"state":"APPROVED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":false,"executed":false} would yield {"state":"ACKNOWLEDGED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":false,"executed":false} (the real machine yields {"state":"APPROVED","proposer":"alice","approvers":["bob","carol"],"window_start":10,"window_end":100,"transmitted":false,"executed":false}). Which rule should forbid it? Supply one (disposition modify, then confirm) — or abandon it as genuinely out-of-intent.
- evidence (mutation-survivor): 'acknowledge' now ACCEPTED in state="APPROVED" (applied as it is in state="RELEASED")
- pre-check: NOT-RUN — no predicate yet — supply the rule via `record --disposition modify`, or abandon as out-of-intent
- events:
  - 2026-07-21T11:54:19.483Z: harvested
  - 2026-07-21T11:54:19.483Z: precheck
  - 2026-07-21T12:28:57.749Z: disposition reject by jdubray — Already constrained by confirmed S3-execute-requires-transmit — verified by direct model-check (controls/next_widen_ack.cjs: 1 violation). polynv grade under-reports this kill on its bounded model.

## prior:S3-execute-requires-transmit — **confirmed**

- source: domain-prior · target: state
- domain prior: ? — "" (model unstated, 2026-07-21T12:23:16.155Z)
- question: An order must never be EXECUTED without first being TRANSMITTED (released). executed => transmitted.
- pre-check: HOLDS
- predicate versions:
  1. `(s) => !s.executed || s.transmitted` (jdubray, 2026-07-21T12:23:16.155Z)
- events:
  - 2026-07-21T12:23:16.155Z: added by jdubray
  - 2026-07-21T12:23:16.155Z: precheck
  - 2026-07-21T12:23:16.966Z: disposition confirm by jdubray — Confirmed intent (D3): closes the execute-without-release gap the mutation grade surfaced.

## prior:L1-abort-well-formed — **confirmed**

- source: domain-prior · target: transition
- domain prior: ? — "" (model unstated, 2026-07-21T12:23:17.831Z)
- question: Recall (L1) safety facet: whenever abort changes state it lands in ABORTED, only from {PENDING_APPROVAL,APPROVED,RELEASED,ACKNOWLEDGED}. (Availability facet checked by reachability.mjs.)
- pre-check: HOLDS
- predicate versions:
  1. `(pre, action, data, post) => !(action === 'abort' && post.state !== pre.state) || (post.state === 'ABORTED' && ['PENDING_APPROVAL','APPROVED','RELEASED','ACKNOWLEDGED'].includes(pre.state))` (jdubray, 2026-07-21T12:23:17.831Z)
- events:
  - 2026-07-21T12:23:17.831Z: added by jdubray
  - 2026-07-21T12:23:17.831Z: precheck
  - 2026-07-21T12:23:18.699Z: disposition confirm by jdubray — Confirmed intent: recall right up until execution. Liveness/availability facet lives in reachability.mjs, not this predicate.
