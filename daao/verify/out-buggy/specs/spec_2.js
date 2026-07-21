'use strict';

const { createInstance } = require('@cognitive-fab/sam-pattern');

const instance = createInstance({ strict: true, hasAsyncActions: false });

const INITIAL_STATE = {
  state: 'DRAFT',
  proposer: null,
  approvers: [],
  window_start: null,
  window_end: null,
  transmitted: false,
  executed: false,
};

const ABORTABLE = ['PENDING_APPROVAL', 'APPROVED', 'RELEASED', 'ACKNOWLEDGED'];
const EXPIRABLE = ['PENDING_APPROVAL', 'APPROVED', 'RELEASED', 'ACKNOWLEDGED'];

const inWindow = (m, now) =>
  m.window_start !== null && m.window_end !== null &&
  now >= m.window_start && now <= m.window_end;

const control = instance({
  initialState: { ...INITIAL_STATE, approvers: [] },
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
      submit: {
        action: (data = {}) => ({ ...data }),
        schema: {
          actor: { type: 'string', required: true },
          window_start: { type: 'number', required: true },
          window_end: { type: 'number', required: true },
        },
        domain: [{ actor: 'alice', window_start: 10, window_end: 100 }],
      },
      approve: {
        action: (data = {}) => ({ ...data }),
        schema: {
          actor: { type: 'string', required: true },
          now: { type: 'number', required: true },
        },
        domain: [
          { actor: 'alice', now: 5 }, { actor: 'alice', now: 50 }, { actor: 'alice', now: 150 },
          { actor: 'bob', now: 5 }, { actor: 'bob', now: 50 }, { actor: 'bob', now: 150 },
          { actor: 'carol', now: 5 }, { actor: 'carol', now: 50 }, { actor: 'carol', now: 150 },
        ],
      },
      release: {
        action: (data = {}) => ({ ...data }),
        schema: { now: { type: 'number', required: true } },
        domain: [{ now: 50 }, { now: 150 }],
      },
      acknowledge: {
        action: (data = {}) => ({ ...data }),
        schema: {},
        domain: [{}],
      },
      execute: {
        action: (data = {}) => ({ ...data }),
        schema: { now: { type: 'number', required: true } },
        domain: [{ now: 50 }, { now: 150 }],
      },
      close: {
        action: (data = {}) => ({ ...data }),
        schema: {},
        domain: [{}],
      },
      abort: {
        action: (data = {}) => ({ ...data }),
        schema: {},
        domain: [{}],
      },
      expire: {
        action: (data = {}) => ({ ...data }),
        schema: { now: { type: 'number', required: true } },
        domain: [{ now: 50 }, { now: 150 }],
      },
    },
    acceptors: {
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

      // NOTE: faithful to the PLANTED BUG in the source — the distinct-
      // approver guard is intentionally absent, so a redelivered approval
      // from the same authority is counted again toward APPROVED.
      approve: (model) => (p, { reject }) => {
        if (model.state !== 'PENDING_APPROVAL') return reject('approve-only-when-pending');
        if (p.actor == null) return reject('approve-missing-actor');
        if (p.actor === model.proposer) return reject('approver-is-proposer');
        if (!inWindow(model, p.now)) return reject('approve-out-of-window');
        model.approvers = model.approvers.concat([p.actor]);
        if (model.approvers.length >= 2) model.state = 'APPROVED';
      },

      release: (model) => (p, { reject }) => {
        if (model.state !== 'APPROVED') return reject('release-only-when-approved');
        if (!inWindow(model, p.now)) return reject('release-out-of-window');
        model.transmitted = true;
        model.state = 'RELEASED';
      },

      acknowledge: (model) => (_p, { reject }) => {
        if (model.state !== 'RELEASED') return reject('acknowledge-only-when-released');
        model.state = 'ACKNOWLEDGED';
      },

      execute: (model) => (p, { reject }) => {
        if (model.state !== 'ACKNOWLEDGED') return reject('execute-only-when-acknowledged');
        if (!inWindow(model, p.now)) return reject('execute-out-of-window');
        model.executed = true;
        model.state = 'EXECUTED';
      },

      close: (model) => (_p, { reject }) => {
        if (model.state !== 'EXECUTED') return reject('close-only-when-executed');
        model.state = 'CLOSED';
      },

      abort: (model) => (_p, { reject }) => {
        if (ABORTABLE.indexOf(model.state) === -1) return reject('abort-not-allowed-here');
        model.state = 'ABORTED';
      },

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
const init = () => { setState(INITIAL_STATE); };

const actions = {
  submit: (data = {}) => intents.submit(data),
  approve: (data = {}) => intents.approve(data),
  release: (data = {}) => intents.release(data),
  acknowledge: (data = {}) => intents.acknowledge(data),
  execute: (data = {}) => intents.execute(data),
  close: (data = {}) => intents.close(data),
  abort: (data = {}) => intents.abort(data),
  expire: (data = {}) => intents.expire(data),
};

module.exports = { instance, init, actions, getState, setState };