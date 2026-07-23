# DAAO — polygen (author-from-scratch) track — STATUS: CONVERGED with Fable 5

Separate from the main verification (`POLYGRAPH-REPORT.md`; terms in
[`../GLOSSARY.md`](../GLOSSARY.md)). This track is the optional "verified-by-construction"
counterpoint: have **polygen** author a fresh DAAO from a one-paragraph intent — drafting the
contract, the module, and the invariants, then self-repairing against its own invariants and
synthesizing a regression corpus.

**Status (2026-07-22): CONVERGED.** `claude-fable-5` authored the machine in one shot — converged
on **iteration 0** (no repairs needed), and every claim was **independently re-verified** in a
separate session (see §3). Artifacts in [`polygen-out/`](polygen-out/).

---

## 1. Three models, same task, same intent paragraph

| Run | Model | Artifact | max-tokens | Result |
|---|---|---|---|---|
| 1 | claude-sonnet-5 | SAM v2 | 32000 | **FAIL** — module truncated/unloadable: "no named intents / no modelShape" |
| 2 | claude-sonnet-5 | SAM v2 | 64000 | **FAIL** — same empty-shape error (not a token-budget problem) |
| 3 | claude-opus-4-8 | SAM v2 | 64000 | **FAIL** — full module, but against a **hallucinated API** (`instance.addComponent is not a function`) |
| 4 | claude-sonnet-5 | legacy bare-next | 48000 | stopped by operator (bare-next not pursued) |
| 5 | **claude-fable-5** | SAM v2 | 64000 | **CONVERGED, iteration 0** — 22 states, 0 violations, 96 corpus windows, 0 replay fails |

The failure modes were distinct and instructive: sonnet-5 could not hold the strict module shape at
all; opus-4.8 held a shape but invented a plausible-looking API the vendored library does not have.
Fable 5 produced a strict-clean module on the first try that needed **zero self-repair rounds**.
polygen's *contract-drafting* step succeeded with every model; module authoring was the
discriminator.

## 2. What Fable 5 independently arrived at

The intent paragraph named the safety rules in prose; the model had never seen the hand-authored
artifact (`verify/`). Its authored contract/invariants independently encode **all five confirmed
rule families** from the polynv-converged set:

| Confirmed intent (polynv ledger) | Fable 5's authored counterpart |
|---|---|
| S1 two distinct non-proposer approvers | `approve-requires-two-distinct-in-window-authorities` + state rule `firstApprover !== 'proposer'` |
| S2 in-window release/execute | transmit/execute fire only with `inWindow === true` |
| S3 exactly-once effects | effect flags monotone; fire only from the right pre-state |
| S3 execute-requires-transmit (the D3 gap I initially missed!) | explicit: `pre.transmitted === true` required, *plus* a `specialRule` marked "defense in depth" |
| Terminal finality | `terminal-states-are-final` (post == pre from closed/aborted/expired) |

It also added rules the hand-written set reached only after iteration (`propose-only-from-idle`,
idle-is-pristine) — and its **first-draft** invariant set mutation-grades **18/37**, stronger than
my first draft (11/38) before polynv's grade forced improvements.

**A different, legitimate abstraction.** Instead of an approver *array* + logical time ticks (the
hand-authored artifact, 28 states), Fable chose a `firstApprover` enum (`none|authA|authB`) +
per-action `inWindow` booleans — 22 states. Both are sound finite projections of the same machine;
the checker's claims are relative to each projection.

## 3. Independent verification (not taking the report's word)

All re-run in-session after the generation completed:

| Check | Result |
|---|---|
| `check.mjs` re-run (safety model-check vs its own invariants) | **22 states, 0 violations ✓** |
| Adapted `reachability.mjs` (L1 recall, L2 progress, S4 no-dead-end) | **all hold ✓** |
| `polynv grade --include-invariants` | **18/37** — survivors are the same behavior-removing class as the main track, covered by liveness + replay |
| polygen's own independent-process corpus replay | 96/96 windows pass (from its report) |

*(Transparency note: my first liveness run showed spurious failures — an adaptation bug of my own,
reading the hand-authored artifact's `state` key where Fable's control key is `status`. Fixed the
harness, re-ran, all green. Kept here because false alarms are part of an honest log.)*

## 4. The one real divergence — and it is in MY intent prose, not Fable's code

The DAAO spec §2 allows `expire` from **RELEASED and ACKNOWLEDGED** as well as
PENDING_APPROVAL/APPROVED. Fable's machine allows expiry **only from pending/approved**, and its
invariant even asserts `expired ⇒ no effects fired` — internally consistent, but a different
machine than the spec's.

Root cause: my intent paragraph said *"While still **open and pending** it can expire"* — ambiguous
prose that Fable reasonably read narrowly. **No gate caught this, and no gate could have**: the
code is correctly verified against its own contract; the contract is the model's reading of the
prose; only human review of the contract catches prose-to-contract drift. This is precisely the
polygen SKILL's warning — *"a converged run against a wrong contract proves nothing about the
actual feature"* — demonstrated live. (Consequence in Fable's machine: a released/acknowledged
order whose window has passed can only be aborted, never expired. Defensible, but not what §2
says.)

If this artifact were to be adopted, the fix is a contract edit (widen expire's whenStates) and a
re-run — not a code patch by hand.

## 5. Verdict

- **The author path works with Fable 5** — one-shot, zero repairs, and the authored rules
  independently converge on the same intent set a human + polynv reached over three iterations on
  the audit path. That is the "verified-by-construction" counterpoint, delivered.
- **The human review step is not optional**: the only defect in the converged output (§4) lives in
  the intent→contract translation, exactly where the SKILL says to look, and only a human who knows
  the real spec can see it.
- Same disclosure as everything else in this repo: consistency check over a declared finite domain,
  not a proof.

## 5b. v6.0.0 re-author (2026-07-22) — and the prose fix landed

Re-run under Polygraph **v6.0.0** (sam-pattern 2.1). polygen now authors the **next-state**
(`next`/`unchanged`) form natively; Fable 5 converged first try again — `polygen-out-v6/`, 70 states,
0 violations, 203-window corpus, independently re-checked clean under v6. **The one real defect from
§4 is gone:** I corrected the ambiguous intent sentence to *"an order that has not yet executed can
expire … from pending, approved, released, or acknowledged,"* and the authored machine now permits
expiry from all four states — matching the spec. The lesson holds exactly as stated: the fix was a
contract/prose edit, not a code patch, and it took a human who knew the real spec to make it.

## 6. Reproduce

```bash
cd daao/polygen-out
PLUGIN=~/.claude/plugins/cache/polygraph/polygraph/5.0.0

# Re-verify the authored machine against its own invariants
node $PLUGIN/scripts/check.mjs --spec next.cjs --contract contract.json --invariants invariants.mjs

# Liveness over the reachable graph
NODE_PATH=$PLUGIN/node_modules node reachability.mjs

# Invariant strength
node $PLUGIN/polynv/bin/polynv.mjs grade --artifacts . --include-invariants

# Regenerate from scratch (needs ANTHROPIC_API_KEY; intent paragraph in git history)
node $PLUGIN/scripts/polygen.mjs --intent "<the §1 intent>" --model claude-fable-5 --max-tokens 64000 --out polygen-out/
```
