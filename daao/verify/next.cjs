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

const instance = createInstance({ strict: true, hasAsyncActions: false, instanceName: 'daao' });

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
      approve: { action: (d = {}) => ({ ...d }), schema: {}, domain: [{ actor: 'alice', now: 50 }, { actor: 'bob', now: 5 }, { actor: 'bob', now: 50 }, { actor: 'bob', now: 150 }, { actor: 'carol', now: 50 }] },
      release: { action: (d = {}) => ({ ...d }), schema: {}, domain: [{ now: 50 }, { now: 150 }] },
      acknowledge: { action: (d = {}) => ({ ...d }), schema: {}, domain: [{}] },
      execute: { action: (d = {}) => ({ ...d }), schema: {}, domain: [{ now: 50 }, { now: 150 }] },
      close: { action: (d = {}) => ({ ...d }), schema: {}, domain: [{}] },
      abort: { action: (d = {}) => ({ ...d }), schema: {}, domain: [{}] },
      expire: { action: (d = {}) => ({ ...d }), schema: {}, domain: [{ now: 50 }, { now: 150 }] },
    },
    acceptors: {
      // DRAFT --submit--> PENDING_APPROVAL ; set proposer + window.
      submit: (model) => (p, { reject }) => {
        if (model.state !== 'DRAFT') return reject('submit-only-from-draft');
        if (p.actor == null || p.window_start == null || p.window_end == null) {
          return reject('submit-missing-proposer-or-window');
        }
        model.proposer = p.actor;
        model.window_start = p.window_start;
        model.window_end = p.window_end;
        model.state = 'PENDING_APPROVAL';
      },

      // PENDING_APPROVAL --approve--> stays PENDING_APPROVAL, or reaches
      // APPROVED on the 2nd distinct in-window approver. Guards: not proposer,
      // not already an approver, now in window.
      approve: (model) => (p, { reject }) => {
        if (model.state !== 'PENDING_APPROVAL') return reject('approve-only-when-pending');
        if (p.actor == null) return reject('approve-missing-actor');
        if (p.actor === model.proposer) return reject('approver-is-proposer');
        if (model.approvers.indexOf(p.actor) !== -1) return reject('duplicate-approver');
        if (!inWindow(model, p.now)) return reject('approve-out-of-window');
        model.approvers = model.approvers.concat([p.actor]);
        if (model.approvers.length >= 2) model.state = 'APPROVED';
      },

      // APPROVED --release--> RELEASED ; transmit() once, in-window.
      release: (model) => (p, { reject }) => {
        if (model.state !== 'APPROVED') return reject('release-only-when-approved');
        if (!inWindow(model, p.now)) return reject('release-out-of-window');
        model.transmitted = true;
        model.state = 'RELEASED';
      },

      // RELEASED --acknowledge--> ACKNOWLEDGED.
      acknowledge: (model) => (_p, { reject }) => {
        if (model.state !== 'RELEASED') return reject('acknowledge-only-when-released');
        model.state = 'ACKNOWLEDGED';
      },

      // ACKNOWLEDGED --execute--> EXECUTED ; execute() once, in-window.
      execute: (model) => (p, { reject }) => {
        if (model.state !== 'ACKNOWLEDGED') return reject('execute-only-when-acknowledged');
        if (!inWindow(model, p.now)) return reject('execute-out-of-window');
        model.executed = true;
        model.state = 'EXECUTED';
      },

      // EXECUTED --close--> CLOSED.
      close: (model) => (_p, { reject }) => {
        if (model.state !== 'EXECUTED') return reject('close-only-when-executed');
        model.state = 'CLOSED';
      },

      // {PENDING_APPROVAL,APPROVED,RELEASED,ACKNOWLEDGED} --abort--> ABORTED.
      abort: (model) => (_p, { reject }) => {
        if (ABORTABLE.indexOf(model.state) === -1) return reject('abort-not-allowed-here');
        model.state = 'ABORTED';
      },

      // {PENDING_APPROVAL,APPROVED,RELEASED,ACKNOWLEDGED} --expire--> EXPIRED,
      // only once now is strictly past the window end.
      expire: (model) => (p, { reject }) => {
        if (EXPIRABLE.indexOf(model.state) === -1) return reject('expire-not-allowed-here');
        if (model.window_end === null || p.now <= model.window_end) return reject('expire-before-window-end');
        model.state = 'EXPIRED';
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
