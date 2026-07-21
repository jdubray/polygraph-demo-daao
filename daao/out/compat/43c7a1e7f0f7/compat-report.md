# polyvers compat-report — change 43c7a1e7f0f7

old version `f6835d90c285` → new version `5eca4518d990`

**Lanes:** vocabulary, intent, semantic
**Corpus:** 5 snapshot(s), source: archive (fleet.json)
**Invariant adequacy:** NOT MEASURED — invariant-set strength unknown; a PASS against weak invariants is weaker than it looks (`polynv grade` measures it)

| gate | verdict | summary |
|---|---|---|
| load | PASS | module surface, validate(), contract/manifest cross-checks |
| vocabulary | PASS | cross-version action/effect/reject-reason/terminal vocabulary |
| invariant-diff | PASS | edited in place (same names, new predicates) |
| stimuli | PASS | 15 old-version stimulus(es) (full declared domain — a conservative superset of in-flight stimuli) × 5 snapshot(s) = 75 deliveries; every outcome must be accepted or a NAMED observable reject |
| invariants-pointwise | **FAIL** (4) | 5 state invariant(s) × 5 snapshot(s) = 25 checks (13 transition invariant(s) need transitions, not snapshots — checked by the M1 model-check gate) |
| semantic-model-check | **FAIL** (1) | exhaustive check from 5 fleet snapshot(s) + init, 92 state(s) checked = 5 seeded from the fleet + 87 discovered from them; one witness per violated rule — not an affected-instance list |
| shape-roundtrip | PASS | setState round-trip over 5 snapshot(s) |

## Failures

### invariants-pointwise
- `fleet.json#0` — violates 'S1-two-person-integrity' — this state exists (or is reachable); decide what it means BEFORE the deploy
- `fleet.json#2` — violates 'S1-two-person-integrity' — this state exists (or is reachable); decide what it means BEFORE the deploy
- `fleet.json#3` — violates 'S1-two-person-integrity' — this state exists (or is reachable); decide what it means BEFORE the deploy
- `fleet.json#4` — violates 'S1-two-person-integrity' — this state exists (or is reachable); decide what it means BEFORE the deploy

### semantic-model-check
- `fleet.json#0` — 'S1-two-person-integrity' [state] — violated in a seeded initial state; shortest counterexample from snapshot fleet.json#0: (violated at the root state)

## Vocabulary diff
- dataDomain changed

## Intent diff
- edited in place (same names, new predicates)

## Verdict: FAIL
