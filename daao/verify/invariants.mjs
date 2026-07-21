// DAAO invariants — the gate. These encode INTENT (what the machine must never
// do), not a reading of the code. They are drafted here for the designer to
// confirm/strengthen via polynv (the interview mutation-grades this very set);
// nothing is "proven" until a human dispositions each rule. Predicates return
// TRUE when the rule HOLDS. Mapping to polygraph-daao-demo-spec-v2.md §3.
//
// Coverage note (honest): S1, S2, S3, S5 are SAFETY properties and are
// model-checked exhaustively over the declared finite domain below. S4
// (durability) and L1/L2 (liveness/progress) are REACHABILITY properties, not
// safety predicates — they are checked separately by reachability.mjs and
// reported as such. Do not read a clean safety run as covering L1/L2.

const AUTHORIZED = ['APPROVED', 'RELEASED', 'ACKNOWLEDGED', 'EXECUTED', 'CLOSED'];
const distinct = (xs) => new Set(xs).size;
const withinWindow = (m, now) =>
  m.window_start !== null && m.window_end !== null &&
  typeof now === 'number' && now >= m.window_start && now <= m.window_end;

export const stateInvariants = [
  // S1 — Two-person integrity. Any authorized order has >=2 DISTINCT approvers,
  // none of whom is the proposer.
  {
    name: 'S1-two-person-integrity',
    pred: (s) =>
      !AUTHORIZED.includes(s.state) ||
      (distinct(s.approvers) >= 2 && s.approvers.indexOf(s.proposer) === -1),
  },

  // S1-support — approvers are always pairwise distinct (a multiset of
  // approvals must never masquerade as distinct authorities). This is the
  // exact property the planted bug removes.
  {
    name: 'S1-approvers-distinct',
    pred: (s) => distinct(s.approvers) === s.approvers.length,
  },

  // S3-support — the executed flag can only be true in a state at/after
  // EXECUTED; transmitted can only be true at/after RELEASED. Catches an effect
  // flag being set without the corresponding state advance.
  {
    name: 'S3-executed-implies-post-ack',
    pred: (s) => !s.executed || ['EXECUTED', 'CLOSED'].includes(s.state),
  },
  {
    name: 'S3-transmitted-implies-post-approve',
    pred: (s) =>
      !s.transmitted ||
      ['RELEASED', 'ACKNOWLEDGED', 'EXECUTED', 'CLOSED', 'ABORTED', 'EXPIRED'].includes(s.state),
  },

  // S3-ordering — an order can never be executed without first having been
  // transmitted (released). Closes the gap surfaced by the polynv mutation
  // grade: a machine where `acknowledge` was accepted straight from APPROVED
  // (skipping RELEASED / transmit) would let execute() fire with transmit()
  // never emitted. Added as a domain prior, confirmed via the polynv interview.
  {
    name: 'S3-execute-requires-transmit',
    pred: (s) => !s.executed || s.transmitted,
  },
];

export const transitionInvariants = [
  // S2 — Authorized window. The execute() effect is emitted only when `now` is
  // inside the order's window.
  {
    name: 'S2-execute-in-window',
    pred: (pre, action, data, post) =>
      !(post.executed && !pre.executed) || withinWindow(pre, data && data.now),
  },
  // S2 — the transmit() effect (release) is emitted only in-window.
  {
    name: 'S2-transmit-in-window',
    pred: (pre, action, data, post) =>
      !(post.transmitted && !pre.transmitted) || withinWindow(pre, data && data.now),
  },

  // S3 — Exactly-once execution. execute() is emitted at most once and only out
  // of ACKNOWLEDGED; once executed, it never un-executes.
  {
    name: 'S3-execute-once-from-ack',
    pred: (pre, action, data, post) =>
      !(post.executed && !pre.executed) || pre.state === 'ACKNOWLEDGED',
  },
  {
    name: 'S3-executed-monotone',
    pred: (pre, action, data, post) => !pre.executed || post.executed,
  },
  // S3 — transmit() emitted at most once and only out of APPROVED.
  {
    name: 'S3-transmit-once-from-approved',
    pred: (pre, action, data, post) =>
      !(post.transmitted && !pre.transmitted) || pre.state === 'APPROVED',
  },
  {
    name: 'S3-transmitted-monotone',
    pred: (pre, action, data, post) => !pre.transmitted || post.transmitted,
  },

  // S5 — No forged authorization. approvers never shrink; the proposer is set
  // once and never changes; and an order enters an AUTHORIZED state ONLY by
  // earning it (approve reaching 2 distinct out of PENDING_APPROVAL), never by
  // jumping in from an unauthorized state.
  {
    name: 'S5-approvers-monotone',
    pred: (pre, action, data, post) =>
      pre.approvers.every((a) => post.approvers.indexOf(a) !== -1),
  },
  {
    name: 'S5-proposer-set-once',
    pred: (pre, action, data, post) =>
      pre.proposer === null || post.proposer === pre.proposer,
  },
  {
    name: 'S5-authorized-only-earned',
    pred: (pre, action, data, post) => {
      const preAuth = AUTHORIZED.includes(pre.state);
      const postAuth = AUTHORIZED.includes(post.state);
      if (!postAuth || preAuth) return true;
      // Newly authorized: must be the legitimate approve->APPROVED transition.
      return (
        pre.state === 'PENDING_APPROVAL' &&
        action === 'approve' &&
        post.state === 'APPROVED' &&
        distinct(post.approvers) >= 2 &&
        post.approvers.indexOf(post.proposer) === -1
      );
    },
  },

  // STRUCT — terminal states are reachable only by their own explicit action.
  // Recall (ABORTED) happens only via abort; expiry (EXPIRED) only via expire.
  // Closes the retarget-mutant class from the polynv grade (e.g. a machine
  // where `release` silently landed in ABORTED). These pin the transition
  // GRAPH shape, complementing the "must-never" safety rules above.
  {
    name: 'STRUCT-aborted-only-by-abort',
    pred: (pre, action, data, post) =>
      !(post.state === 'ABORTED' && pre.state !== 'ABORTED') || action === 'abort',
  },
  {
    name: 'STRUCT-expired-only-by-expire',
    pred: (pre, action, data, post) =>
      !(post.state === 'EXPIRED' && pre.state !== 'EXPIRED') || action === 'expire',
  },

  // STRUCT — terminal states are absorbing: no action leaves CLOSED, ABORTED,
  // or EXPIRED. Catches terminal re-entry (e.g. a machine that let `abort`
  // reopen an EXPIRED order). This is the state-machine facet of "an order's
  // final disposition is final".
  {
    name: 'STRUCT-terminals-absorbing',
    pred: (pre, action, data, post) =>
      !['CLOSED', 'ABORTED', 'EXPIRED'].includes(pre.state) || post.state === pre.state,
  },

  // L1-safety — abort is well-formed: whenever it changes state it lands in
  // ABORTED and only from a pre-execution state {PENDING_APPROVAL, APPROVED,
  // RELEASED, ACKNOWLEDGED}. (The dual liveness claim — that abort is always
  // AVAILABLE there — is checked in reachability.mjs, not here.)
  {
    name: 'L1-abort-well-formed',
    pred: (pre, action, data, post) =>
      !(action === 'abort' && post.state !== pre.state) ||
      (post.state === 'ABORTED' &&
        ['PENDING_APPROVAL', 'APPROVED', 'RELEASED', 'ACKNOWLEDGED'].includes(pre.state)),
  },
];
