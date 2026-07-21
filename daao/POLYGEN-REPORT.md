# DAAO — polygen (author-from-scratch) track — STATUS: BLOCKED, resume tomorrow

Separate from the main verification (`POLYGRAPH-REPORT.md`). This track attempts the optional
"verified-by-construction" counterpoint: have **polygen** author a fresh DAAO from a one-paragraph
intent (drafting the contract, the module, and the invariants, then self-repairing against its own
invariants and synthesizing a regression corpus).

**Status (2026-07-21): did NOT converge with the models tried today. Paused to retry with
Fable 5 tomorrow when tokens are available.** No polygen-authored artifact is committed yet.

## What was attempted (same intent paragraph each time)

| Run | Model | Artifact mode | max-tokens | Result |
|---|---|---|---|---|
| 1 | claude-sonnet-5 | SAM v2 (default) | 32000 | **FAIL** — author rewrite truncated/unloadable after 2 attempts: "no named intents registered / no modelShape declared" |
| 2 | claude-sonnet-5 | SAM v2 | 64000 | **FAIL** — same empty-shape error (so not simple truncation) |
| 3 | claude-opus-4-8 | SAM v2 | 64000 | **FAIL** — full module authored but against a **hallucinated API**: `instance.addComponent is not a function` |
| 4 | claude-sonnet-5 | legacy bare-next | 48000 | **stopped by operator mid-run** (bare-next not pursued) |

## Honest findings from the attempts

1. **polygen's contract-drafting step works.** Every run successfully drafted a `contract.json`
   from the intent before failing at the module step. The intent → observable-contract translation
   is not where it breaks.
2. **The break is authoring the strict SAM v2 module single-shot.** Two frontier models failed two
   different ways: sonnet-5 returned an empty/degenerate model shape (even at double the token
   budget, so it is a format/attention problem, not truncation), and opus-4.8 authored a complete
   module but called a **SAM API method that does not exist in the vendored 2.0.0-alpha bundle**
   (`addComponent`) — it knew *a* SAM pattern, not *this* library's exact surface. The hand-authored
   module in `verify/next.cjs` needed the precise `createInstance / component / acceptors` shape;
   the models did not reproduce it unaided.
3. This is consistent with the earlier hand-authoring experience: the SAM v2 strict profile is
   exacting (nullable declarations, `type:'array'`, keyed acceptors, observable `reject`), and a
   correct 9-state module is a lot to get right in one generation. It is a real usability data point
   for polygen on machines of this size — and it makes the *verify* path (audit an
   independently-authored module) look stronger than the *author* path for a machine this complex.

## Resume plan (tomorrow, with Fable 5)

- Retry polygen with `--model claude-fable-5` (SAM v2 default), `--max-tokens 64000`.
  Fable 5 is a current model not yet tried on this task.
- If SAM v2 still will not author cleanly, the fallback is NOT bare-next (ruled out) but to supply
  the KNOWN-GOOD contract via `--contract verify/contract.json` so polygen authors only the module
  + invariants against a fixed, correct shape — a smaller, better-scoped generation that isolates
  the module-authoring step from contract-drafting.
- On convergence: compare the polygen-authored invariants against the human-owned §3 set
  (did it independently reach two-person-distinct, exactly-once, in-window, execute-requires-
  transmit, terminal-finality?) and model-check the authored module with `check.mjs`.

## What is NOT blocked

The core demo is complete and unaffected: authored artifact + `polynv` CONVERGED + safety
model-check (clean pass / planted catch) + N-spec differential + reachability + `polyvers` fleet
gate. See `POLYGRAPH-REPORT.md`.
