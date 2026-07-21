# polygraph-demo-daao

Develop-and-verify lifecycle for a small stateful machine — a **Dual-Authorization Action Order
(DAAO)** — checked end-to-end with the Polygraph engines (model-checking, invariant elicitation,
version gating).

## Where to start

- **[GLOSSARY.md](GLOSSARY.md)** — plain-language definitions (mutant, invariant, model-checking,
  fleet gate, …). Read this first if the vocabulary is unfamiliar.
- **[daao/POLYGRAPH-REPORT.md](daao/POLYGRAPH-REPORT.md)** — the full verification report: what was
  checked, every verdict, and the honest defect list.
- **[daao/POLYGEN-REPORT.md](daao/POLYGEN-REPORT.md)** — the author-from-scratch track (open item).
- **[PLAN.md](PLAN.md)** — the plan the work followed.
- **[daao/run_demo.sh](daao/run_demo.sh)** — one command to reproduce the safety, liveness, and
  version-gate results.

## Layout

- `daao/verify/` — the verified artifact: the SAM v2 module (`next.cjs`), contract, invariants,
  reachability harness, trace corpus, planted-bug control, and the converged intent ledger
  (`INTENT-LOG.md`).
- `daao/verify-v3/` — the three-approver evolution + fleet snapshots for the version gate.
- `daao/safety_engine.{py,rs}` — the two DeepSeek-generated reference implementations (see
  Provenance in [GLOSSARY.md](GLOSSARY.md#provenance)).

> Disclosure: Polygraph is experimental, not peer-reviewed technology — a consistency check, not a
> proof, over a declared finite domain. See the disclosure at the top of the report.
