// Figure generator — every figure is DERIVED from the repo's artifacts, not drawn
// from memory:
//   fig1  state machine   — edges BFS-derived from verify/next.cjs (the script
//                           ASSERTS the drawn edge set equals the machine's).
//   fig2  counterexample  — read from a live check.mjs --json run on the
//                           planted-bug control.
//   fig3  scorecard       — verdict literals, each row cited to its report line.
//   fig4  fleet gate      — gates + flagged snapshots parsed from
//                           out/compat/.../compat-report.json + fleet.json.
// Palette: dataviz reference instance (slots 1-3 + status), validated with
// validate_palette.js (ALL CHECKS PASS light mode; aqua's contrast WARN is
// covered by the relief rule — every mark here carries a visible text label).
// Usage: node gen_figures.mjs   (writes fig1..fig4 .svg beside itself)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const PLUGIN = process.env.POLYGRAPH_PLUGIN ||
  resolve(process.env.HOME || process.env.USERPROFILE, '.claude/plugins/cache/polygraph/polygraph/5.0.0');

// ── palette (dataviz reference instance, light mode) ────────────────────────
const C = {
  surface: '#fcfcfb', ink: '#0b0b0b', ink2: '#52514e', grid: '#e4e3df',
  blue: '#2a78d6', orange: '#eb6834', aqua: '#1baf7a',
  good: '#0ca30c', critical: '#d03b3b',
};
const FONT = 'Segoe UI, -apple-system, Helvetica, Arial, sans-serif';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const svgOpen = (w, h, title) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="${FONT}">
<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${C.ink2}"/></marker>
<marker id="arrR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${C.critical}"/></marker></defs>
<rect width="${w}" height="${h}" fill="${C.surface}"/>
<text x="28" y="42" font-size="24" font-weight="600" fill="${C.ink}">${esc(title)}</text>`;
const footer = (w, h, note) => `<text x="28" y="${h - 16}" font-size="12.5" fill="${C.ink2}">${esc(note)}</text></svg>`;

// ═══ derive the machine's real edges by BFS over verify/next.cjs ════════════
const mod = require(resolve(here, '../verify/next.cjs'));
const contract = JSON.parse(readFileSync(resolve(here, '../verify/contract.json'), 'utf8'));
const sanitize = (o) => JSON.parse(JSON.stringify(o, (k, v) =>
  (typeof k === 'string' && k.startsWith('__')) || typeof v === 'function' ? undefined : v));
function stepsFor(action) {
  const dom = contract.dataDomain[action] || {}; const fs = Object.keys(dom);
  let cs = [{}]; for (const f of fs) cs = cs.flatMap((c) => dom[f].map((v) => ({ ...c, [f]: v })));
  return cs.map((data) => ({ action, data }));
}
const STEPS = Object.keys(contract.actions).flatMap(stepsFor);
function next(state, action, data) {
  mod.init(); mod.setState(JSON.parse(JSON.stringify(state))); mod.actions[action](data);
  let rej = false; try { const s = mod.instance({}).lastStep(); if (s && s.classification === 'rejected') rej = true; } catch {}
  return rej ? state : sanitize(mod.getState());
}
mod.init();
const init = sanitize(mod.getState());
const seen = new Map([[JSON.stringify(init), init]]);
const q = [init]; const edgeSet = new Set(); // "FROM|action|TO" control-state projection, identity steps excluded
while (q.length) {
  const s = q.shift();
  for (const { action, data } of STEPS) {
    const p = next(s, action, data);
    if (JSON.stringify(p) === JSON.stringify(s)) continue;          // reject/no-op
    edgeSet.add(`${s.state}|${action}|${p.state}`);
    const k = JSON.stringify(p);
    if (!seen.has(k)) { seen.set(k, p); q.push(p); }
  }
}
// The layout below claims exactly these edges — assert no drift from the machine.
const EXPECTED = [
  'DRAFT|submit|PENDING_APPROVAL',
  'PENDING_APPROVAL|approve|PENDING_APPROVAL', 'PENDING_APPROVAL|approve|APPROVED',
  'APPROVED|release|RELEASED', 'RELEASED|acknowledge|ACKNOWLEDGED',
  'ACKNOWLEDGED|execute|EXECUTED', 'EXECUTED|close|CLOSED',
  ...['PENDING_APPROVAL', 'APPROVED', 'RELEASED', 'ACKNOWLEDGED'].flatMap((f) => [`${f}|abort|ABORTED`, `${f}|expire|EXPIRED`]),
];
const got = [...edgeSet].sort().join('\n'), want = [...new Set(EXPECTED)].sort().join('\n');
if (got !== want) { console.error('EDGE DRIFT between machine and figure!\nmachine:\n' + got + '\nfigure:\n' + want); process.exit(1); }
console.log(`fig1: ${seen.size} reachable states, ${edgeSet.size} projected edges — matches layout ✓`);

// ═══ fig1 — the state machine ═══════════════════════════════════════════════
{
  const W = 1360, H = 640;
  const nodes = { // [x, y, w] — spine y=150, terminals below
    DRAFT: [30, 150, 92], PENDING_APPROVAL: [212, 150, 196], APPROVED: [498, 150, 122],
    RELEASED: [710, 150, 118], ACKNOWLEDGED: [918, 150, 168], EXECUTED: [1176, 150, 120],
    CLOSED: [1188, 330, 96], ABORTED: [350, 480, 104], EXPIRED: [760, 480, 100],
  };
  const TERM = new Set(['CLOSED', 'ABORTED', 'EXPIRED']);
  const NH = 44;
  let b = svgOpen(W, H, 'DAAO — the verified state machine');
  b += `<text x="28" y="66" font-size="14" fill="${C.ink2}">9 states · 28 reachable (state, data) configurations · model-checked against S1–S5, liveness via reachability</text>`;
  const cx = (n) => nodes[n][0] + nodes[n][2] / 2, top = (n) => nodes[n][1], bot = (n) => nodes[n][1] + NH;
  const right = (n) => nodes[n][0] + nodes[n][2], left = (n) => nodes[n][0], my = (n) => nodes[n][1] + NH / 2;
  const E = (x1, y1, x2, y2, red) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${red ? C.critical : C.ink2}" stroke-width="1.6" marker-end="url(#${red ? 'arrR' : 'arr'})"/>`;
  // label with a surface-colored halo so lines/nodes never strike through text
  const L = (x, y, t, col = C.ink2, size = 12.5, w = 400, anch = 'middle') => {
    const tw = String(t).length * (size * 0.56) + 10, x0 = anch === 'middle' ? x - tw / 2 : anch === 'end' ? x - tw : x - 4;
    return `<rect x="${x0}" y="${y - size + 1}" width="${tw}" height="${size + 6}" fill="${C.surface}" opacity="0.92"/>` +
      `<text x="${x}" y="${y}" font-size="${size}" fill="${col}" text-anchor="${anch}" font-weight="${w}">${esc(t)}</text>`;
  };
  // authorized band under APPROVED..EXECUTED
  b += `<rect x="490" y="136" width="814" height="72" rx="10" fill="${C.blue}" opacity="0.07"/>`;
  // abort / expire fans (drawn first, labels+nodes go on top)
  for (const f of ['PENDING_APPROVAL', 'APPROVED', 'RELEASED', 'ACKNOWLEDGED']) {
    b += `<line x1="${cx(f) - 24}" y1="${bot(f) + 2}" x2="${cx('ABORTED')}" y2="${top('ABORTED') - 3}" stroke="${C.ink2}" stroke-width="1.1" opacity="0.5" marker-end="url(#arr)"/>`;
    b += `<line x1="${cx(f) + 24}" y1="${bot(f) + 2}" x2="${cx('EXPIRED')}" y2="${top('EXPIRED') - 3}" stroke="${C.ink2}" stroke-width="1.1" opacity="0.35" stroke-dasharray="5 4" marker-end="url(#arr)"/>`;
  }
  // spine edges; labels ABOVE the node row so they can be wider than the gap
  const spine = [['DRAFT', 'PENDING_APPROVAL', 'submit'], ['PENDING_APPROVAL', 'APPROVED', 'approve (2nd distinct)'], ['APPROVED', 'RELEASED', 'release'], ['RELEASED', 'ACKNOWLEDGED', 'acknowledge'], ['ACKNOWLEDGED', 'EXECUTED', 'execute'], ];
  for (const [f, t, lab] of spine) { b += E(right(f) + 2, my(f), left(t) - 3, my(t)); b += L((right(f) + left(t)) / 2, 140, lab); }
  // guard + effect annotations in their own row below the band
  b += L((right('PENDING_APPROVAL') + left('APPROVED')) / 2, 240, '≠ proposer · not a duplicate · in window', C.ink2, 11.5);
  b += L((right('APPROVED') + left('RELEASED')) / 2 + 20, 240, '⚡ transmit — once, in window', C.orange, 11.5, 600);
  b += L((right('ACKNOWLEDGED') + left('EXECUTED')) / 2, 240, '⚡ execute — once, in window', C.orange, 11.5, 600);
  b += L(1196, 204, 'AUTHORIZED — S1 two-person rule must hold', C.blue, 11.5, 600, 'end');
  // EXECUTED -> CLOSED (down)
  b += E(cx('CLOSED'), bot('EXECUTED') + 2, cx('CLOSED'), top('CLOSED') - 3); b += L(cx('CLOSED') + 14, 280, 'close', C.ink2, 12.5, 400, 'start');
  // self-loop: first approval
  { const x = cx('PENDING_APPROVAL'); b += `<path d="M ${x - 26} ${top('PENDING_APPROVAL') - 2} C ${x - 40} ${top('PENDING_APPROVAL') - 42}, ${x + 40} ${top('PENDING_APPROVAL') - 42}, ${x + 26} ${top('PENDING_APPROVAL') - 4}" fill="none" stroke="${C.ink2}" stroke-width="1.6" marker-end="url(#arr)"/>`; b += L(x, top('PENDING_APPROVAL') - 48, 'approve (1st distinct)'); }
  b += L(cx('ABORTED'), top('ABORTED') - 14, 'abort — recall, any pre-execution state (L1)', C.ink, 12, 600);
  b += L(cx('EXPIRED'), top('EXPIRED') - 14, 'expire — only past window end', C.ink2, 12, 600);
  // nodes last
  for (const [n, [x, y, w]] of Object.entries(nodes)) {
    const t = TERM.has(n);
    b += `<rect x="${x}" y="${y}" width="${w}" height="${NH}" rx="9" fill="${t ? '#f0efeb' : '#ffffff'}" stroke="${t ? C.ink2 : C.blue}" stroke-width="${t ? 1.4 : 2}"/>`;
    b += `<text x="${x + w / 2}" y="${y + 28}" font-size="14" fill="${C.ink}" text-anchor="middle" font-weight="600">${esc(n)}</text>`;
  }
  b += L(30, 580, 'Every action that does not apply is an observable reject(reason) — no silent paths.', C.ink2, 13, 400, 'start');
  b += footer(W, H, 'Derived from daao/verify/next.cjs + contract.json — the edge set is BFS-checked against the machine at generation time. Terminal states are absorbing.');
  writeFileSync(resolve(here, 'fig1-state-machine.svg'), b);
}

// ═══ fig2 — the manufactured counterexample (from a live check run) ═════════
{
  try {
    execFileSync('node', [resolve(PLUGIN, 'scripts/check.mjs'),
      '--spec', resolve(here, '../verify/controls/next_buggy.cjs'),
      '--contract', resolve(here, '../verify/contract.json'),
      '--invariants', resolve(here, '../verify/invariants.mjs'),
      '--json', resolve(here, 'buggy-check.json')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { if (e.status !== 1) throw e; /* exit 1 = violations found — expected */ }
  const chk = JSON.parse(readFileSync(resolve(here, 'buggy-check.json'), 'utf8'));
  const names = chk.violations.map((v) => v.invariant);
  const v = chk.violations.find((x) => x.invariant === 'S1-two-person-integrity') || chk.violations[0];
  const path = v.path; // [init, submit, approve, approve]
  console.log(`fig2: ${chk.violations.length} violations from live check (${chk.statesExplored} states) — path len ${path.length}`);
  const W = 1200, H = 630;
  let b = svgOpen(W, H, 'The gate manufactures the repro — planted two-person bug');
  b += `<text x="28" y="66" font-size="14" fill="${C.ink2}">Distinct-approver guard deleted; model checking finds the shortest path to the violation. No test was written.</text>`;
  const cardW = 258, cardH = 168, gap = 34, y0 = 110;
  const labels = ['init', 'submit(alice, window 10–100)', 'approve(bob, t=50)', 'approve(bob, t=50) again'];
  path.forEach((step, i) => {
    const x = 32 + i * (cardW + gap); const bad = i === path.length - 1;
    if (i) b += `<line x1="${x - gap + 4}" y1="${y0 + cardH / 2}" x2="${x - 5}" y2="${y0 + cardH / 2}" stroke="${bad ? C.critical : C.ink2}" stroke-width="2" marker-end="url(#${bad ? 'arrR' : 'arr'})"/>`;
    b += `<rect x="${x}" y="${y0}" width="${cardW}" height="${cardH}" rx="10" fill="#ffffff" stroke="${bad ? C.critical : C.blue}" stroke-width="${bad ? 2.6 : 1.8}"/>`;
    b += `<text x="${x + 14}" y="${y0 + 28}" font-size="13" fill="${C.ink2}">step ${i} — ${esc(labels[i])}</text>`;
    b += `<text x="${x + 14}" y="${y0 + 56}" font-size="17" font-weight="700" fill="${bad ? C.critical : C.ink}">${esc(step.state.state)}</text>`;
    b += `<text x="${x + 14}" y="${y0 + 84}" font-size="13.5" fill="${C.ink}">approvers: [${esc(step.state.approvers.join(', '))}]</text>`;
    b += `<text x="${x + 14}" y="${y0 + 106}" font-size="13.5" fill="${bad ? C.critical : C.ink2}">distinct: ${new Set(step.state.approvers).size}${bad ? '  — needs 2' : ''}</text>`;
    b += `<text x="${x + 14}" y="${y0 + 128}" font-size="13.5" fill="${C.ink2}">proposer: ${esc(step.state.proposer ?? '—')}</text>`;
    if (bad) b += `<text x="${x + 14}" y="${y0 + 152}" font-size="13" font-weight="600" fill="${C.critical}">⚠ AUTHORIZED with one approver</text>`;
  });
  const vy = 344;
  b += `<rect x="32" y="${vy}" width="1136" height="150" rx="10" fill="${C.critical}" opacity="0.06"/>`;
  b += `<text x="52" y="${vy + 34}" font-size="15" font-weight="700" fill="${C.critical}">✗ ${names.length} invariants violated — reported with this shortest path as the ready-made repro</text>`;
  names.forEach((n, i) => { b += `<text x="${52 + (i % 2) * 560}" y="${vy + 68 + Math.floor(i / 2) * 30}" font-size="14.5" fill="${C.ink}">✗ <tspan font-weight="600">${esc(n)}</tspan></text>`; });
  b += `<text x="52" y="${vy + 130}" font-size="13.5" fill="${C.ink2}">The clean build passes the identical gate (28 states, 0 violations). Same contract, same rules — the code is the only variable.</text>`;
  b += footer(W, H, `Live output of check.mjs --json on daao/verify/controls/next_buggy.cjs (${chk.statesExplored} states explored). The bug is planted and disclosed.`);
  writeFileSync(resolve(here, 'fig2-counterexample.svg'), b);
}

// ═══ fig3 — lifecycle scorecard ═════════════════════════════════════════════
{
  // Row literals cite their source; verdict semantics: ok=true → green ✓,
  // intended-catch → red ✗ chip (the gate doing its job).
  const rows = [ // [stage, what happened, result, chip('ok'|'catch')]
    ['polygen — author', 'Fable 5 authors the machine from one paragraph; self-check', 'converged, iteration 0', 'ok'],          // POLYGEN-REPORT §1
    ['polynv — elicit intent', '96 candidate rules pre-checked, human-dispositioned', 'CONVERGED · 5 confirmed / 91 rejected', 'ok'], // INTENT-LOG.md
    ['polynv — grade', 'mutation adequacy of the invariant set', '24/38 killed (11 → 21 → 24)', 'ok'],                            // POLYGRAPH-REPORT §1
    ['polygraph — model-check', 'every reachable state vs S1–S5', 'clean: 28 states, 0 violations', 'ok'],                        // POLYGRAPH-REPORT §1
    ['polygraph — planted bug', 'distinct-approver guard deleted', 'CAUGHT: 3 violations + 3-step repro', 'catch'],               // fig2 / live check
    ['polygraph — differential', '3 independent LLM readings replayed on 54 windows', 'clean 54/54 · buggy flagged', 'ok'],        // POLYGRAPH-REPORT §1b
    ['reachability — liveness', 'recall available · progress · no dead-ends', 'L1, L2, S4 all hold', 'ok'],                        // POLYGRAPH-REPORT §1
    ['polyvers — version gate', 'tighten 2→3 approvers vs 5 in-flight orders', 'DEPLOY BLOCKED: 4 landmines named', 'catch'],      // out/compat report
  ];
  const W = 1200, H = 630;
  let b = svgOpen(W, H, 'One machine, every gate — the develop-and-verify lifecycle');
  b += `<text x="28" y="66" font-size="14" fill="${C.ink2}">All runs real and reproducible (daao/run_demo.sh). Red is the gate succeeding: a planted defect caught, an unsafe deploy blocked.</text>`;
  const y0 = 96, rh = 56;
  rows.forEach(([stage, what, res, kind], i) => {
    const y = y0 + i * rh;
    if (i) b += `<line x1="28" y1="${y - 8}" x2="1172" y2="${y - 8}" stroke="${C.grid}" stroke-width="1"/>`;
    b += `<text x="28" y="${y + 22}" font-size="15" font-weight="700" fill="${C.ink}">${esc(stage)}</text>`;
    b += `<text x="330" y="${y + 22}" font-size="14" fill="${C.ink2}">${esc(what)}</text>`;
    const chipCol = kind === 'ok' ? C.good : C.critical, mark = kind === 'ok' ? '✓' : '✗';
    b += `<rect x="868" y="${y + 2}" width="304" height="30" rx="15" fill="${chipCol}" opacity="0.1"/>`;
    b += `<text x="884" y="${y + 23}" font-size="13.5" font-weight="600" fill="${chipCol}">${mark} ${esc(res)}</text>`;
  });
  b += `<text x="28" y="${H - 46}" font-size="14.5" font-weight="600" fill="${C.ink}">Total frontier-model spend for everything above: $1.81.</text>`;
  b += footer(W, H, 'Verdicts from daao/POLYGRAPH-REPORT.md, POLYGEN-REPORT.md, verify/INTENT-LOG.md and out/compat/ — every number is from an actual run.');
  writeFileSync(resolve(here, 'fig3-scorecard.svg'), b);
  console.log('fig3: 8 rows');
}

// ═══ fig4 — the fleet gate (from compat-report.json + fleet.json) ═══════════
{
  const rep = JSON.parse(readFileSync(resolve(here, '../out/compat/43c7a1e7f0f7/compat-report.json'), 'utf8'));
  const fleet = JSON.parse(readFileSync(resolve(here, '../verify-v3/fleet.json'), 'utf8'));
  const flagged = new Set();
  for (const g of rep.gates) for (const f of g.failures || []) { const m = String(f.snapshot ?? f.id ?? f).match(/fleet\.json#(\d+)/); if (m) flagged.add(+m[1]); }
  console.log(`fig4: verdict ${rep.verdict}, flagged snapshots: [${[...flagged].sort().join(',')}]`);
  const W = 1200, H = 630;
  let b = svgOpen(W, H, 'polyvers — the deploy is blocked before it ships');
  b += `<text x="28" y="66" font-size="14" fill="${C.ink2}">Rule change: two approvers → three. The gate replays it against the orders already in flight under the old rule.</text>`;
  // left: fleet snapshots
  b += `<text x="32" y="104" font-size="15" font-weight="700" fill="${C.ink}">Live fleet (5 in-flight orders)</text>`;
  fleet.forEach((s, i) => {
    const y = 122 + i * 66; const bad = flagged.has(i);
    b += `<rect x="32" y="${y}" width="470" height="54" rx="9" fill="#ffffff" stroke="${bad ? C.critical : C.good}" stroke-width="${bad ? 2.4 : 1.6}"/>`;
    b += `<text x="48" y="${y + 23}" font-size="14" font-weight="700" fill="${bad ? C.critical : C.ink}">#${i}  ${esc(s.state)}</text>`;
    b += `<text x="48" y="${y + 43}" font-size="12.5" fill="${C.ink2}">approvers: [${esc(s.approvers.join(', '))}] — legal under 2-rule${bad ? ' · violates new S1 (≥3)' : ''}</text>`;
    b += `<text x="470" y="${y + 33}" font-size="17" text-anchor="end" font-weight="700" fill="${bad ? C.critical : C.good}">${bad ? '✗' : '✓'}</text>`;
  });
  // right: gates table
  b += `<text x="560" y="104" font-size="15" font-weight="700" fill="${C.ink}">Mechanical gates</text>`;
  rep.gates.forEach((g, i) => {
    const y = 122 + i * 46; const ok = g.ok;
    b += `<rect x="560" y="${y}" width="608" height="36" rx="8" fill="${ok ? C.good : C.critical}" opacity="0.07"/>`;
    b += `<text x="576" y="${y + 24}" font-size="14" font-weight="600" fill="${C.ink}">${esc(g.gate)}</text>`;
    const n = (g.failures || []).length;
    b += `<text x="1152" y="${y + 24}" font-size="13.5" text-anchor="end" font-weight="700" fill="${ok ? C.good : C.critical}">${ok ? '✓ PASS' : `✗ FAIL (${n})`}</text>`;
  });
  const gy = 122 + rep.gates.length * 46 + 10;
  b += `<rect x="560" y="${gy}" width="608" height="44" rx="9" fill="${C.critical}" opacity="0.12"/>`;
  b += `<text x="576" y="${gy + 29}" font-size="16" font-weight="700" fill="${C.critical}">Verdict: ${esc(rep.verdict)} — exit 1, the deploy does not ship</text>`;
  b += footer(W, H, 'Parsed from daao/out/compat/43c7a1e7f0f7/compat-report.json and verify-v3/fleet.json. Remediation (re-open to PENDING_APPROVAL) is a human decision the gate refuses to invent.');
  writeFileSync(resolve(here, 'fig4-fleet-gate.svg'), b);
}
console.log('done: fig1..fig4 written');
