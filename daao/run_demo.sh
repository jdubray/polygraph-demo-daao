#!/usr/bin/env bash
# DAAO — one-command Polygraph demo runner (Acts 1-3).
# Deterministic and repeatable. The only leg needing ANTHROPIC_API_KEY is the
# differential spec generation (Act 2b); it is skipped with a notice if unset.
set -uo pipefail

PLUGIN="${POLYGRAPH_PLUGIN:-$HOME/.claude/plugins/cache/polygraph/polygraph/5.0.0}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
V="$HERE/verify"
NM="$PLUGIN/node_modules"
filter() { grep -v "shadow Model method" || true; }
hr() { printf '\n\033[1m== %s ==\033[0m\n' "$1"; }

hr "ACT 2a — Safety model-check: CLEAN build (expect 0 violations)"
node "$PLUGIN/scripts/check.mjs" --spec "$V/next.cjs" --contract "$V/contract.json" \
  --invariants "$V/invariants.mjs" 2>&1 | filter

hr "ACT 2a — Safety model-check: PLANTED bug (expect S1 counterexample)"
node "$PLUGIN/scripts/check.mjs" --spec "$V/controls/next_buggy.cjs" --contract "$V/contract.json" \
  --invariants "$V/invariants.mjs" 2>&1 | filter

hr "Liveness / reachability: L1 recall, L2 progress, S4 not-a-dead-end"
NODE_PATH="$NM" node "$V/reachability.mjs" 2>&1 | filter

hr "Invariant strength (polynv mutation grade)"
node "$PLUGIN/polynv/bin/polynv.mjs" grade --artifacts "$V" --include-invariants 2>&1 | filter | grep -E "kills|SURVIVOR" | head -20

hr "ACT 3 — polyvers version gate: 2 -> 3 approvers vs. live fleet (expect FAIL / deploy blocked)"
node "$PLUGIN/polyvers/bin/polyvers.mjs" check --old "$V" --new "$HERE/verify-v3" \
  --snapshots "$HERE/verify-v3/fleet.json" --out "$HERE/out/compat" 2>&1 | filter | grep -E "gate|PASS|FAIL|Verdict|witness|counterexample" | head -30

hr "ACT 2b — Independent differential specs (needs ANTHROPIC_API_KEY)"
if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  node "$PLUGIN/scripts/verify.mjs" --contract "$V/contract.json" --source "$V/next.cjs" \
    --traces "$V/traces/" --model claude-sonnet-5 --n 3 --out "$V/out/" 2>&1 | filter | tail -5
else
  echo "  (skipped — set ANTHROPIC_API_KEY to run the N-spec differential)"
fi

hr "Done. Full write-up: daao/POLYGRAPH-REPORT.md"
