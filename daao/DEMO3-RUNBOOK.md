# Demo 3 — the version gate (the "wedge"). Live-run script + talk track.

**The one-sentence premise:** *You change one rule. The gate tells you which orders already in
production the change would break — before you deploy.*

Run time: ~4 minutes. Every command is copy-paste. Every **SEE** block below is the actual output
(the compat-report is byte-deterministic, so it will match live). Terminal, projector-friendly font
size, one window.

---

## Pre-flight (do this before the audience is watching)

```bash
cd ~/code/polygraph-demo/daao
export PV=$(ls -d ~/.claude/plugins/cache/polygraph/polygraph/*/ | sort -V | tail -1)   # latest installed (6.0.0)
alias nogunk='grep -v "shadow Model method"'   # hides one benign SAM warning line
```

Confirm the baseline is green so Beat 0 can't surprise you:

```bash
node $PV/scripts/check.mjs --spec verify/next.cjs --contract verify/contract.json --invariants verify/invariants.mjs 2>&1 | nogunk | tail -2
```
→ `states explored: 28` / `no invariant violations reachable ✓`

---

## Beat 0 — "Here is a machine we have already verified."

**SAY:** "This is the dual-authorization order machine. It's model-checked green: over every
reachable state, it can never authorize an order with fewer than two distinct approvers. That's
today's rule — *two* of N. It's in production. There are orders in flight right now."

*(Optional: show the machine.)* Point at **Figure 1** in the walkthrough, or:

```bash
node -e 'require("./verify-v3/fleet.json").forEach((s,i)=>console.log(`  #${i}  ${s.state.padEnd(16)} approvers=[${s.approvers.join(",")}]`))'
```
**SEE:**
```
  #0  APPROVED         approvers=[bob,carol]
  #1  PENDING_APPROVAL approvers=[bob]
  #2  RELEASED         approvers=[bob,carol]
  #3  ACKNOWLEDGED     approvers=[bob,carol]
  #4  CLOSED           approvers=[bob,carol]
```
**SAY:** "Five real orders. Every one of them was approved legally under the two-person rule — two
distinct approvers, bob and carol."

---

## Beat 1 — "Now the policy changes. Two becomes three."

**SAY:** "Compliance tightens the rule: high-value orders now need *three* approvers, not two. It's a
one-line change in the code, and a one-line change in the invariant."

```bash
diff <(grep 'approvers.length >=' verify/next.cjs) <(grep 'approvers.length >=' verify-v3/next.cjs)
```
**SEE:**
```
<         if (model.approvers.length >= 2) model.state = 'APPROVED';
---
>         if (model.approvers.length >= 3) model.state = 'APPROVED';
```
**SAY:** "That's the whole change. In a normal shop this ships, the tests are green, and nobody has
thought about the orders that were *already approved* under the old rule. Watch what the gate does
instead."

---

## Beat 2 — "The gate reads the change."

```bash
node $PV/polyvers/bin/polyvers.mjs classify --old verify --new verify-v3 2>&1 | nogunk
```
**SEE:**
```
polyvers classify — change 43c7a1e7f0f7
  lanes: vocabulary, intent, semantic
  gates required: load, vocabulary, stimuli, invariant-diff, invariants-pointwise, semantic-model-check, shape-roundtrip
```
**SAY:** "It classifies the change without me telling it anything: the vocabulary moved, the *intent*
moved — that's the invariant — and the semantics moved. Each lane pulls in the checks it needs. This
is the part that decides what 'compatible' even means."

---

## Beat 3 — "Now aim it at the live fleet."

**SAY:** "Here's the move. I don't test the new code against fresh inputs. I replay the change
against the states production is holding *right now* — those five orders — and ask: can the new rules
drive any of them somewhere they must never be?"

```bash
node $PV/polyvers/bin/polyvers.mjs check --old verify --new verify-v3 --snapshots verify-v3/fleet.json --out out/compat 2>&1 | nogunk | sed -n '/| gate/,/Verdict: FAIL/p'
```
**SEE (the gate table):**
```
| gate                 | verdict     |
| load                 | PASS        |
| vocabulary           | PASS        |
| invariant-diff       | PASS        |
| stimuli              | PASS        |
| invariants-pointwise | **FAIL** (4)|
| semantic-model-check | **FAIL** (1)|
| shape-roundtrip      | PASS        |
...
### semantic-model-check
- fleet.json#0 — 'S1-two-person-integrity' [state] — violated in a seeded initial state
## Verdict: FAIL
```
```bash
echo "exit code: $?"      # → 1
```
**SAY (the wedge — land this slowly):** "Fail. Exit 1 — the deploy does not ship. Four of the five
in-flight orders violate the new two-person rule *the instant it goes live* — order #0 is already
`APPROVED` with two approvers, and under the three-rule that's an order the system now considers
authorized without enough humans. The gate names it, and it names the shortest path by which the new
machine would carry it all the way to `execute`. This is a landmine that a diff, a unit test, and a
staging environment would all have shown green."

---

## Beat 4 — "And it refuses to guess the fix."

**SAY:** "Notice what it does *not* do. It doesn't auto-migrate. There's no safe pure function that
turns a two-approver order into a valid three-approver one — the missing approval is a human act. The
correct remediation is to re-open those four orders to `PENDING_APPROVAL` so they earn the third
approver, and that's a decision the gate hands to a person, with the affected orders named, *before*
the deploy — not after, in an incident."

**SAY (the close):** "In a regulated shop, changing this rule means re-accrediting the system against
the state it already holds. Normally that's a spreadsheet and a prayer. Here the deploy carries its
own proof: change the rule, and the gate tells you exactly which live orders you just invalidated,
before anyone is paged."

---

## If asked

- **"Is this just a schema check?"** No — `shape-roundtrip` (the schema/shape lane) *passes*. The
  fields didn't change; the *meaning* did. The failure is the seeded model-check: it starts from real
  fleet states, not from init, and explores forward under the new rules.
- **"How many orders are affected in prod?"** The gate reports a *compatibility verdict with one
  witness per rule*, not an affected-row list — it answers "is this safe to ship," not "run this
  query." Enumerating every affected order is the migration step (polyrun), deliberately separate.
- **"What if there were no in-flight orders?"** Then you'd seed with `--synthesize` (BFS-reachable
  states of the old machine) — weaker, and the report says so. Live fleet snapshots are the honest
  tier; always say which you used.
- **"Could I make it pass?"** Only by writing a real migration that re-opens the affected orders and
  re-running — then the corpus swaps to post-migration states and every downstream gate re-checks.
  That's the point: the green checkmark has to be earned.

## Reset between runs

Nothing to reset — the check only writes `out/compat/` (deterministic) and reads, never mutates, the
fleet. Safe to run repeatedly.
