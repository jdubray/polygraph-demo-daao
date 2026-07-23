// DAAO — Dual-Authorization Action Order — SAM v2 strict-profile module.
//
// This is the CHECKABLE artifact: the single source of truth that Polygraph
// model-checks against the invariants in invariants.mjs. It models ONE order's
// lifecycle (the state machine); multi-order storage/serialization is a
// property of the persistence layer, not of this machine, and is out of scope
// here (that is the Act-1 Python/Rust serialization finding, narrated
// separately). Faithful to polygraph-daao-demo-spec-v2.md §2 transition table.
//
// DECLARED ABSTRACTIONS (the model is finite; the real domains are not — every
// one is mirrored in contract.json dataDomain, which IS the exploration domain):
//   • TIME is abstracted to a small set of logical ticks carried ON EACH
//     time-sensitive action as `now`. The window is fixed at submit to
//     [10, 100]. Ticks: 5 (before window), 50 (in window), 150 (after window).
//     Time is never read from a clock — the spec must be a pure function of the
//     input snapshot + action payload (determinism is gated).
//   • ACTORS are abstracted to a 3-identity pool {alice, bob, carol}. The
//     proposer is always `alice`; approvers range over the full pool so that
//     self-approval (alice), redelivery (bob then bob) and two-distinct
//     (bob, carol) are all reachable and therefore explored.
//   • EFFECTS transmit()/execute() are modeled as observable one-shot booleans
//     `transmitted` / `executed`; "emitted this step" is (post.X && !pre.X).
//     This makes exactly-once (S3) checkable as a transition invariant.
//
// OBSERVABLE PROJECTION — the bound on every claim. Seven keys are declared
// below; everything else about a real action order (payload, provenance,
// crypto, audit metadata) is unmodeled and unchecked.
'use strict';

const { createInstance } = require('@cognitive-fab/sam-pattern');

const instance = createInstance({ strict: true, hasAsyncActions: false, instanceName: 'daao-v3' });

const STATES = [
  'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'RELEASED', 'ACKNOWLEDGED',
  'EXECUTED', 'CLOSED', 'ABORTED', 'EXPIRED',
];

// States in which the order is considered AUTHORIZED (the two-person rule must
// hold). See invariants.mjs S1.
const AUTHORIZED = ['APPROVED', 'RELEASED', 'ACKNOWLEDGED', 'EXECUTED', 'CLOSED'];

const ABORTABLE = ['PENDING_APPROVAL', 'APPROVED', 'RELEASED', 'ACKNOWLEDGED'];
const EXPIRABLE = ['PENDING_APPROVAL', 'APPROVED', 'RELEASED', 'ACKNOWLEDGED'];

const INITIAL_STATE = {
  state: 'DRAFT',
  proposer: null,
  approvers: [],       // distinct approver ids, in arrival order
  window_start: null,
  window_end: null,
  transmitted: false,  // transmit() effect emitted (one-shot)
  executed: false,     // execute() effect emitted (one-shot)
};

const inWindow = (m, now) =>
  m.window_start !== null && m.window_end !== null &&
  now >= m.window_start && now <= m.window_end;

const control = instance({
  initialState: JSON.parse(JSON.stringify(INITIAL_STATE)),
  component: {
    modelShape: {
      state: { type: 'string' },
      proposer: { type: 'string', nullable: true },
      approvers: { type: 'array' },
      window_start: { type: 'number', nullable: true },
      window_end: { type: 'number', nullable: true },
      transmitted: { type: 'boolean' },
      executed: { type: 'boolean' },
    },
    actions: {
      // proposer creates the order and sets the authorization window.
      submit: { action: (d = {}) => ({ ...d }), schema: {}, domain: [{ actor: 'alice', window_start: 10, window_end: 100 }] },
      // a distinct non-proposer authority approves, within the window.
      approve: { action: (d = {}) => ({ ...d }), schema: {}, domain: [{ actor: 'alice', now: 50 }, { actor: 'bob', now: 5 }, { actor: 'bob', now: 50 }, { actor: 'bob', now: 150 }, { actor: 'carol', now: 50 }, { actor: 'dave', now: 50 }] },
      release: { action: (d = {}) => ({ ...d }), schema: {}, domain: [{ now: 50 }, { now: 150 }] },
      acknowledge: { action: (d = {}) => ({ ...d }), schema: {}, domain: [{}] },
      execute: { action: (d = {}) => ({ ...d }), schema: {}, domain: [{ now: 50 }, { now: 150 }] },
      close: { action: (d = {}) => ({ ...d }), schema: {}, domain: [{}] },
      abort: { action: (d = {}) => ({ ...d }), schema: {}, domain: [{}] },
      expire: { action: (d = {}) => ({ ...d }), schema: {}, domain: [{ now: 50 }, { now: 150 }] },
    },
    // sam-pattern 2.1 next-state (prime) form: `model` is the frozen pre-state
    // (read-only), all writes go to the `next` draft, and every declared
    // modelShape variable must be assigned in `next` OR named `unchanged(...)`
    // per accepted step (the TLA+ frame rule). A rejection returns before any
    // write, so it needs no frame.
    acceptors: {
      // DRAFT --submit--> PENDING_APPROVAL ; set proposer + window.
      submit: (model) => (p, { reject, next, unchanged }) => {
        if (model.state !== 'DRAFT') return reject('submit-only-from-draft');
        if (p.actor == null || p.window_start == null || p.window_end == null) {
          return reject('submit-missing-proposer-or-window');
        }
        next.proposer = p.actor;
        next.window_start = p.window_start;
        next.window_end = p.window_end;
        next.state = 'PENDING_APPROVAL';
        unchanged('approvers', 'transmitted', 'executed');
      },

      // PENDING_APPROVAL --approve--> stays PENDING_APPROVAL, or reaches
      // APPROVED on the 2nd distinct in-window approver. Guards: not proposer,
      // not already an approver, now in window.
      approve: (model) => (p, { reject, next, unchanged }) => {
        if (model.state !== 'PENDING_APPROVAL') return reject('approve-only-when-pending');
        if (p.actor == null) return reject('approve-missing-actor');
        if (p.actor === model.proposer) return reject('approver-is-proposer');
        if (model.approvers.indexOf(p.actor) !== -1) return reject('duplicate-approver');
        if (!inWindow(model, p.now)) return reject('approve-out-of-window');
        const approvers = model.approvers.concat([p.actor]);
        next.approvers = approvers;
        if (approvers.length >= 3) {
          next.state = 'APPROVED';
          unchanged('proposer', 'window_start', 'window_end', 'transmitted', 'executed');
        } else {
          unchanged('state', 'proposer', 'window_start', 'window_end', 'transmitted', 'executed');
        }
      },

      // APPROVED --release--> RELEASED ; transmit() once, in-window.
      release: (model) => (p, { reject, next, unchanged }) => {
        if (model.state !== 'APPROVED') return reject('release-only-when-approved');
        if (!inWindow(model, p.now)) return reject('release-out-of-window');
        next.transmitted = true;
        next.state = 'RELEASED';
        unchanged('proposer', 'approvers', 'window_start', 'window_end', 'executed');
      },

      // RELEASED --acknowledge--> ACKNOWLEDGED.
      acknowledge: (model) => (_p, { reject, next, unchanged }) => {
        if (model.state !== 'RELEASED') return reject('acknowledge-only-when-released');
        next.state = 'ACKNOWLEDGED';
        unchanged('proposer', 'approvers', 'window_start', 'window_end', 'transmitted', 'executed');
      },

      // ACKNOWLEDGED --execute--> EXECUTED ; execute() once, in-window.
      execute: (model) => (p, { reject, next, unchanged }) => {
        if (model.state !== 'ACKNOWLEDGED') return reject('execute-only-when-acknowledged');
        if (!inWindow(model, p.now)) return reject('execute-out-of-window');
        next.executed = true;
        next.state = 'EXECUTED';
        unchanged('proposer', 'approvers', 'window_start', 'window_end', 'transmitted');
      },

      // EXECUTED --close--> CLOSED.
      close: (model) => (_p, { reject, next, unchanged }) => {
        if (model.state !== 'EXECUTED') return reject('close-only-when-executed');
        next.state = 'CLOSED';
        unchanged('proposer', 'approvers', 'window_start', 'window_end', 'transmitted', 'executed');
      },

      // {PENDING_APPROVAL,APPROVED,RELEASED,ACKNOWLEDGED} --abort--> ABORTED.
      abort: (model) => (_p, { reject, next, unchanged }) => {
        if (ABORTABLE.indexOf(model.state) === -1) return reject('abort-not-allowed-here');
        next.state = 'ABORTED';
        unchanged('proposer', 'approvers', 'window_start', 'window_end', 'transmitted', 'executed');
      },

      // {PENDING_APPROVAL,APPROVED,RELEASED,ACKNOWLEDGED} --expire--> EXPIRED,
      // only once now is strictly past the window end.
      expire: (model) => (p, { reject, next, unchanged }) => {
        if (EXPIRABLE.indexOf(model.state) === -1) return reject('expire-not-allowed-here');
        if (model.window_end === null || p.now <= model.window_end) return reject('expire-before-window-end');
        next.state = 'EXPIRED';
        unchanged('proposer', 'approvers', 'window_start', 'window_end', 'transmitted', 'executed');
      },
    },
    reactors: [],
  },
});

const { intents } = control;
const getState = () => instance({}).getState();
const setState = (snapshot) => { instance({}).setState(snapshot); };
const init = () => { setState(JSON.parse(JSON.stringify(INITIAL_STATE))); };
const actions = Object.fromEntries(Object.keys(intents).map((n) => [n, (d = {}) => intents[n](d)]));

module.exports = { instance, init, actions, getState, setState, STATES, AUTHORIZED, INITIAL_STATE };
