# polygraph-demo-daao

Develop-and-verify lifecycle for a small stateful machine — a **Dual-Authorization Action Order
(DAAO)** — checked end-to-end with the Polygraph engines (model-checking, invariant elicitation,
version gating). One order is proposed, needs two *distinct* approvers inside a time window, and only
then fires two real-world effects (`transmit`, `execute`) exactly once. Small, but it's the shape of
every approval, checkout, and payment flow.

New to the vocabulary (mutant, invariant, model-checking, fleet gate)? Read
**[GLOSSARY.md](GLOSSARY.md)** first.

---

## The three demos

Each demo is one beat you can trigger yourself. They assume **Claude Code with the Polygraph plugins
installed** and the verified machine already present in [`daao/verify/`](daao/verify). The
model-checker and `polyvers` are deterministic and need **no API key**; only the bonus (`polygen`)
does.

### Demo 1 — Verification vs. vibes

*A green checkmark is not a proof. The gate tells you which differences actually matter.* `daao/`
ships two independently generated implementations (Python + Rust) that were claimed to be identical.
They aren't — the Rust build serializes from a `HashMap`, so its output is non-deterministic
run-to-run: harmless for behavior, fatal for an audit log you hash or sign.

> **Prompt:** `daao/` contains two independently generated implementations of the same machine
> (Python and Rust) whose README claims identical output — "any divergence is a defect." Check
> whether that's actually true: run both across the example traces, byte-diff the results, and run
> the non-deterministic one a few times. Tell me which divergences are benign for behavior and which
> would break an audit log that's hashed, signed, or replicated by checksum.

Result: [`daao/POLYGRAPH-CONFORMANCE-FINDINGS.md`](daao/POLYGRAPH-CONFORMANCE-FINDINGS.md) · defect
**D1** in the report.

### Demo 2 — The catch (find the bug your tests miss)

*Delete one guard and the checker manufactures the reproduction itself — no test written.* With the
distinct-approver guard removed, model-checking returns the shortest path to disaster:
`submit → approve(bob) → approve(bob)` → an order **authorized with one human**. The clean build
passes the identical gate.

> **Prompt:** Take the verified DAAO machine in `daao/verify/`, make a copy with the
> distinct-approver guard removed, and run the Polygraph gate on both. Show me that it clears the
> clean build and, on the buggy one, produces the shortest path to a state that violates the
> two-person rule — the reproduction — without me writing a test.

Result: [`daao/POLYGRAPH-REPORT.md`](daao/POLYGRAPH-REPORT.md) §1a · figure
[`daao/figures/fig2-counterexample.png`](daao/figures/fig2-counterexample.png).

### Demo 3 — Evolve a live system safely (the version gate)

*You change one rule; the gate tells you which orders already in production it would break, before
you deploy.* Tightening two approvers to three is **blocked** — four orders already in flight under
the old rule now violate the new one, and `polyvers` names them and the path by which the new machine
would carry one to `execute`.

> **Prompt:** The DAAO machine in `daao/verify/` is verified under a two-approver rule. Tighten it to
> three approvers, build a set of realistic in-flight fleet snapshots (orders already approved or
> released under the old rule), and run polyvers to version-gate the change against them. Don't
> hand-roll the check. If it's unsafe, block it and show me exactly which in-flight orders break and
> the shortest path by which the new rule would carry one to `execute`.

Result: [`daao/out/compat/`](daao/out/compat) · figure
[`daao/figures/fig4-fleet-gate.png`](daao/figures/fig4-fleet-gate.png) · live runbook +
slides: [`daao/DEMO3-RUNBOOK.md`](daao/DEMO3-RUNBOOK.md), [`daao/demo3.sh`](daao/demo3.sh),
[`daao/figures/demo3.html`](daao/figures/demo3.html).

### Bonus — author it from scratch (`polygen`)

Not one of the three acts, kept as a separate track: a frontier model writes the whole verified
machine from one paragraph of English, born with a contract, invariants, and a regression corpus —
model-checked before you ever see it. Converged first try; **$1.81** of model spend. Needs an
`ANTHROPIC_API_KEY`.

> **Prompt:** Write a verifiable dual-authorization action-order state machine with polygen from this
> description: [one paragraph describing the states, the two-distinct-approver rule, the in-window
> exactly-once effects, recall, and expiry]. Model-check it against its own invariants, self-repair
> any reachable violation, and give me the contract, invariants, and a regression corpus.

Result: [`daao/POLYGEN-REPORT.md`](daao/POLYGEN-REPORT.md) · [`daao/polygen-out/`](daao/polygen-out).

---

## Reproduce everything at once

```bash
bash daao/run_demo.sh          # Demos 2 + 3 + liveness + differential, one shot
```

## Where else to look

- **[daao/POLYGRAPH-REPORT.md](daao/POLYGRAPH-REPORT.md)** — the full verification report: every
  verdict and the honest defect list.
- **[GLOSSARY.md](GLOSSARY.md)** — plain-language definitions.
- **[PLAN.md](PLAN.md)** — the plan the work followed.

## Layout

- `daao/verify/` — the verified artifact: the SAM v2 module (`next.cjs`), contract, invariants,
  reachability harness, trace corpus, planted-bug control, and the converged intent ledger
  (`INTENT-LOG.md`).
- `daao/verify-v3/` — the three-approver evolution + fleet snapshots for Demo 3.
- `daao/figures/` — the figures (generated from the artifacts) and the Demo 3 slide deck.
- `daao/safety_engine.{py,rs}` — the two generated reference implementations (see Provenance in
  [GLOSSARY.md](GLOSSARY.md#provenance)).

> Disclosure: Polygraph is experimental, not peer-reviewed technology — a consistency check, not a
> proof, over a declared finite domain. See the disclosure at the top of the report.
