#!/usr/bin/env bash
# Demo 3 — the version gate, paced for a live audience.
# Presenter-driven: each beat prints what it's about to do, runs it, shows the
# result, then waits for you to press Enter before the next beat. Nothing races,
# nothing hangs. Ctrl-C to bail at any point.
#
#   bash demo3.sh          # normal, paced
#   bash demo3.sh --auto   # no pauses (for a rehearsal / recording)
set -uo pipefail

AUTO=0; [ "${1:-}" = "--auto" ] && AUTO=1
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PV="${POLYGRAPH_PLUGIN:-$HOME/.claude/plugins/cache/polygraph/polygraph/5.0.0}"
cd "$HERE"

# colors (fall back to plain if not a tty)
if [ -t 1 ]; then B=$'\e[1m'; DIM=$'\e[2m'; BLU=$'\e[38;5;39m'; GRN=$'\e[32m'; RED=$'\e[31m'; ORA=$'\e[38;5;208m'; R=$'\e[0m'; else B=; DIM=; BLU=; GRN=; RED=; ORA=; R=; fi
nogunk(){ grep -v "shadow Model method" || true; }
pause(){ [ "$AUTO" = 1 ] && { echo; return; }; printf "\n${DIM}   ┈┈ press Enter for the next beat ┈┈${R}"; read -r _ < /dev/tty; echo; }
beat(){ printf "\n${BLU}${B}══ %s ══${R}\n" "$1"; }
say(){  printf "${DIM}   “%s”${R}\n\n" "$1"; }
run(){  printf "${B}\$ %s${R}\n" "$1"; eval "$1"; }

clear
printf "${B}Demo 3 — the version gate${R}\n"
printf "${DIM}You change one rule. The gate tells you which orders already in production it would break — before you deploy.${R}\n"
pause

# ── Beat 0 ───────────────────────────────────────────────────────────────────
beat "0 · A machine we've already verified"
say "This is live and model-checked green: it can never authorize an order with fewer than two distinct approvers. Two-of-N. In production."
run "node \"\$PV/scripts/check.mjs\" --spec verify/next.cjs --contract verify/contract.json --invariants verify/invariants.mjs 2>&1 | nogunk | tail -2"
echo
say "And here are five orders in flight right now — every one approved legally under the two-person rule."
run "node -e 'require(\"./verify-v3/fleet.json\").forEach((s,i)=>console.log(\`  #\${i}  \${s.state.padEnd(16)} approvers=[\${s.approvers.join(\", \")}]\`))'"
pause

# ── Beat 1 ───────────────────────────────────────────────────────────────────
beat "1 · The policy changes — two becomes three"
say "Compliance tightens the rule: three approvers now, not two. One line of code, one line of invariant. In a normal shop this ships green."
run "diff <(grep 'approvers.length >=' verify/next.cjs) <(grep 'approvers.length >=' verify-v3/next.cjs) || true"
pause

# ── Beat 2 ───────────────────────────────────────────────────────────────────
beat "2 · The gate reads the change"
say "It classifies the change on its own: the vocabulary moved, the intent moved, the semantics moved. Each lane pulls in the checks it needs."
run "node \"\$PV/polyvers/bin/polyvers.mjs\" classify --old verify --new verify-v3 2>&1 | nogunk"
pause

# ── Beat 3 ───────────────────────────────────────────────────────────────────
beat "3 · Replay the change against the live fleet"
say "The move: don't test the new code on fresh inputs — replay it against the states production holds right now, and ask whether the new rules can drive any of them somewhere they must never be."
run "node \"\$PV/polyvers/bin/polyvers.mjs\" check --old verify --new verify-v3 --snapshots verify-v3/fleet.json --out out/compat 2>&1 | nogunk | sed -n '/| gate/,/Verdict: FAIL/p'"
code=${PIPESTATUS[0]}
printf "\n${RED}${B}   exit code: %s — the deploy does not ship${R}\n" "$code"
pause

# ── Beat 4 ───────────────────────────────────────────────────────────────────
beat "4 · And it won't guess the fix"
say "No pure function turns a two-approver order into a valid three-approver one — the missing approval is a human act. The gate hands the four named orders to a person to re-open, before the deploy, not after in an incident."
printf "${ORA}   Change a rule → the deploy tells you exactly which live orders you just invalidated.${R}\n"
printf "${ORA}   Normally that's a spreadsheet and a prayer. Here the deploy carries its own proof.${R}\n"
pause

printf "\n${GRN}${B}✓ demo complete${R}  ${DIM}(full talk track + Q&A: DEMO3-RUNBOOK.md · slides: figures/demo3.html)${R}\n"
