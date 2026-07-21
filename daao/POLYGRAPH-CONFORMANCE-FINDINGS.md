# DAAO conformance run — what the two DeepSeek builds actually did

Both DeepSeek implementations were compiled and run head-to-head (Python 3 stdlib; Rust 1.95,
std-only) across the example traces and a set of adversarial probes, with a small S1 gate over
the output. Summary: **DeepSeek got the safety logic right — and was confidently wrong about
something else.** That second part is your best, most honest demo beat.

## 1. The safety invariants held (no natural S1–S5 violation)

| Probe | Input | Result (both languages) | Invariant |
|---|---|---|---|
| Self-approval | proposer Alice also approves | stalls at `PENDING_APPROVAL`, never executes | **S1 ✓** |
| Duplicate approver | Bob approves twice (redelivery) | stalls at `PENDING_APPROVAL`, never executes | **S1 ✓** |
| Out-of-window execute | execute at t=60, window ends 50 | stalls at `ACKNOWLEDGED`, no `execute` effect | **S2 ✓** |
| Redelivered release/execute | release ×2, execute ×3 | exactly one `transmit`, one `execute` | **S3 ✓** |
| Crash / recover | kill after 5 events, resume | resumes `ACKNOWLEDGED`→`CLOSED`, effects once | **S4 ✓** |

And the two languages were **semantically identical** on every trace (same final state per order,
same ordered effects log). So the naive "frontier model writes the two-person-rule bug" beat
didn't happen this round — DeepSeek deduped approvers correctly and gated the window on the
event's own timestamp. Say that out loud in the demo; it's more credible than pretending
otherwise, and it sets up the real finding.

## 2. The real, un-planted defect: DeepSeek was wrong about its own code

DeepSeek's README asserts: *"The same input trace must produce the same final orders map … in
both implementations. Any divergence is a defect."* It isn't true, and the model didn't notice:

```
Python  run 1: ['zeta','alpha','mike','bravo']
Python  run 2: ['zeta','alpha','mike','bravo']     # stable (insertion order)
Rust    run 1: ['zeta','mike','alpha','bravo']
Rust    run 2: ['mike','bravo','zeta','alpha']      # different every run
Rust    run 3: ['mike','alpha','bravo','zeta']
```

The Rust build stores orders in a `HashMap`, whose iteration order is randomized per process — so
the output **and the persisted `store.json`** come out in a different order on every run. Rust
doesn't even match itself, let alone Python.

**Is it a real bug?** This is the whole point — and the answer separates verification from vibes:

- A naive **output-diff** test would flag Rust-vs-Python as failing, and flag Rust-vs-itself as
  *flaky* — a false positive on a difference that carries no behavioral meaning.
- **Polygraph's contract-level view** adjudicates correctly: the observable contract is *(final
  state per order, ordered effect log)*. The order-map is a set-like structure; its serialization
  order is not part of the contract, so the two are **equivalent on everything observable** — and
  the ordering difference is flagged as benign.
- **But** the same non-determinism *does* matter the moment `store.json` is an **audit record you
  hash, sign, or replicate by checksum** — exactly the world the reviewer lives in (MySQL replication
  checksums; a defense audit log that must verify deterministically). A non-canonical serialization
  can't be signed or replica-compared. The gate tells you *which* difference is benign and *which*
  would bite — a diff can't.

That's your headline: **a frontier model shipped two "identical" implementations, was confidently
wrong that they were identical, and the contract-level gate is what tells you the divergence is
benign for behavior but real for auditability.**

## 3. The planted catch (fallback, and disclose it)

Since no natural S1 break occurred, the canonical §5 bug was planted in **Rust only** — the
distinct-approver guard was deleted, so approvals become a multiset (list length, not distinct
IDs). Same 4-step counterexample as the spec predicted:

```
submit(Alice) → approve(Bob) → approve(Bob) [redelivery] → release → acknowledge → execute → close

[CLEAN-PY ]  x1 final: PENDING_APPROVAL | effects: []           ✓ S1 holds
[CLEAN-RS ]  x1 final: PENDING_APPROVAL | effects: []           ✓ S1 holds
[PLANTED-RS] x1 final: CLOSED | effects: [transmit, execute]    ✗ S1 VIOLATED
             order x1: proposer=Alice, approvers=['Bob','Bob'] -> distinct approvers=1
             and execute() was emitted for x1
```

Same contract, same gate: it passes the clean language and catches the buggy one, with the
reproduction. Tell the reviewer it's planted — "the model got this right this time, so I reintroduced
the classic mistake to show the catch." Honesty here *strengthens* the point: the bug class is
real, models do write it, and the gate is the net regardless of language.

## 4. Recommended two-act demo (revised from the live result)

**Act 1 — verification vs. vibes (authentic).** Show DeepSeek's "identical / any divergence is a
defect" claim. Byte-diff the outputs: Rust is non-deterministic. Then run the contract-level check:
equivalent on states + effects, divergence isolated to map serialization, flagged benign-for-
behavior / real-for-audit. This is the moment for a database+security person — it's the difference
between a green checkmark and a proof.

**Act 2 — language-agnostic catch (planted, disclosed).** Plant the two-person-rule bug in one
language, run the 4-step counterexample, gate catches the buggy build and passes the clean one.

**Then polyvers** as in the demo spec (tighten 2→3 approvers, seed the check with in-flight
orders) — language-independent, works on the clean build.

## 5. How to re-run everything

All files are in the `daao/` folder:
```
rustc -O safety_engine.rs -o safety_engine_rs          # clean Rust
rustc -O safety_engine_buggy.rs -o safety_engine_buggy # planted Rust
python3 harness.py            # conformance table across all traces
python3 check_s1.py out.json  # the S1 gate over an engine's output
```
Probes: `p1_self_approval` (S1), `p2_dup_approver` (S1), `p3_out_of_window` (S2),
`p4_redeliver_execute` (S3), `cr.json` (S4 crash/recover), `multi.json` (serialization
determinism), `ce_dup.json` (the planted-bug counterexample).

## 6. Two honest caveats about the harness

- My `check_s1.py` is a hand-written **stand-in** for the Polygraph gate — it reads the engine's
  output and asserts the S1 predicate. It demonstrates the catch concretely, but it is not
  Polygraph doing the model-checking; for the real demo you'd run these builds through polygraph
  itself so the counterexample comes from exhaustive state exploration, not from one crafted trace.
- The probes are targeted, not exhaustive — they confirm the invariants hold *on these paths*.
  "Holds on my probes" is testing; "holds on every reachable state" is what your gate claims. Worth
  stating precisely, since that gap is exactly what you sell.
