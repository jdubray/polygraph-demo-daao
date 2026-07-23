'use strict';

const { createInstance } = require('@cognitive-fab/sam-pattern');

const instance = createInstance({ strict: true, hasAsyncActions: false });

const INITIAL_STATE = {
  status: 'draft',
  proposer: 'none',
  firstApprover: 'none',
  transmitted: false,
  executedOnce: false,
};

const modelShape = {
  status: { type: 'string' },
  proposer: { type: 'string' },
  firstApprover: { type: 'string' },
  transmitted: { type: 'boolean' },
  executedOnce: { type: 'boolean' },
};

const TERMINAL_REASON = {
  closed: 'terminal-closed-final',
  aborted: 'terminal-aborted-final',
  expired: 'terminal-expired-final',
};

const actionDefs = {
  PROPOSE: {
    action: (data = {}) => ({ ...data }),
    schema: { proposer: { type: 'string', required: true } },
    domain: [{ proposer: 'p1' }, { proposer: 'a1' }, { proposer: 'a2' }],
  },
  APPROVE: {
    action: (data = {}) => ({ ...data }),
    schema: {
      approver: { type: 'string', required: true },
      inWindow: { type: 'boolean', required: true },
    },
    domain: [
      { approver: 'p1', inWindow: true },
      { approver: 'p1', inWindow: false },
      { approver: 'a1', inWindow: true },
      { approver: 'a1', inWindow: false },
      { approver: 'a2', inWindow: true },
      { approver: 'a2', inWindow: false },
    ],
  },
  RELEASE: {
    action: (data = {}) => ({ ...data }),
    schema: { inWindow: { type: 'boolean', required: true } },
    domain: [{ inWindow: true }, { inWindow: false }],
  },
  ACK: {
    action: (data = {}) => ({ ...data }),
    schema: {},
    domain: [{}],
  },
  EXECUTE: {
    action: (data = {}) => ({ ...data }),
    schema: { inWindow: { type: 'boolean', required: true } },
    domain: [{ inWindow: true }, { inWindow: false }],
  },
  CLOSE: {
    action: (data = {}) => ({ ...data }),
    schema: {},
    domain: [{}],
  },
  ABORT: {
    action: (data = {}) => ({ ...data }),
    schema: {},
    domain: [{}],
  },
  EXPIRE: {
    action: (data = {}) => ({ ...data }),
    schema: { windowPassed: { type: 'boolean', required: true } },
    domain: [{ windowPassed: true }, { windowPassed: false }],
  },
};

const acceptors = {
  PROPOSE: (model) => (proposal, { reject, next, unchanged }) => {
    if (TERMINAL_REASON[model.status]) return reject(TERMINAL_REASON[model.status]);
    if (model.status !== 'draft') return reject('no-repropose');
    next.status = 'pending';
    next.proposer = proposal.proposer;
    return unchanged('firstApprover', 'transmitted', 'executedOnce');
  },

  APPROVE: (model) => (proposal, { reject, next, unchanged }) => {
    if (TERMINAL_REASON[model.status]) return reject(TERMINAL_REASON[model.status]);
    if (model.status !== 'pending') return reject('approve-not-applicable');
    if (proposal.approver === model.proposer) return reject('proposer-cannot-approve');
    if (proposal.approver === model.firstApprover) return reject('duplicate-approver-ignored');
    if (proposal.inWindow !== true) return reject('approve-outside-window');
    if (model.firstApprover === 'none') {
      next.firstApprover = proposal.approver;
      return unchanged('status', 'proposer', 'transmitted', 'executedOnce');
    }
    if (proposal.approver !== model.firstApprover) {
      next.status = 'approved';
      return unchanged('proposer', 'firstApprover', 'transmitted', 'executedOnce');
    }
    return reject('second-distinct-approval-promotes');
  },

  RELEASE: (model) => (proposal, { reject, next, unchanged }) => {
    if (TERMINAL_REASON[model.status]) return reject(TERMINAL_REASON[model.status]);
    if (model.status === 'pending') return reject('release-before-approval');
    if (model.status === 'released') return reject('release-retry-no-retransmit');
    if (model.status !== 'approved') return reject('release-not-applicable');
    if (proposal.inWindow !== true) return reject('release-outside-window');
    next.status = 'released';
    next.transmitted = true;
    return unchanged('proposer', 'firstApprover', 'executedOnce');
  },

  ACK: (model) => (proposal, { reject, next, unchanged }) => {
    if (TERMINAL_REASON[model.status]) return reject(TERMINAL_REASON[model.status]);
    if (model.status !== 'released') return reject('ack-not-applicable');
    next.status = 'acknowledged';
    return unchanged('proposer', 'firstApprover', 'transmitted', 'executedOnce');
  },

  EXECUTE: (model) => (proposal, { reject, next, unchanged }) => {
    if (TERMINAL_REASON[model.status]) return reject(TERMINAL_REASON[model.status]);
    if (model.status === 'released') return reject('execute-before-ack');
    if (model.status === 'executed') return reject('execute-retry-no-repeat');
    if (model.status !== 'acknowledged') return reject('execute-not-applicable');
    if (proposal.inWindow !== true) return reject('execute-outside-window');
    if (model.transmitted !== true) return reject('execute-requires-transmit');
    if (
      model.firstApprover === 'none' ||
      model.proposer === 'none' ||
      model.firstApprover === model.proposer
    ) {
      return reject('execute-requires-dual-auth');
    }
    next.status = 'executed';
    next.executedOnce = true;
    return unchanged('proposer', 'firstApprover', 'transmitted');
  },

  CLOSE: (model) => (proposal, { reject, next, unchanged }) => {
    if (TERMINAL_REASON[model.status]) return reject(TERMINAL_REASON[model.status]);
    if (model.status !== 'executed') return reject('close-not-applicable');
    next.status = 'closed';
    return unchanged('proposer', 'firstApprover', 'transmitted', 'executedOnce');
  },

  ABORT: (model) => (proposal, { reject, next, unchanged }) => {
    if (TERMINAL_REASON[model.status]) return reject(TERMINAL_REASON[model.status]);
    if (model.status === 'executed') return reject('no-abort-after-execute');
    if (model.status === 'draft') return reject('abort-not-applicable');
    next.status = 'aborted';
    return unchanged('proposer', 'firstApprover', 'transmitted', 'executedOnce');
  },

  EXPIRE: (model) => (proposal, { reject, next, unchanged }) => {
    if (TERMINAL_REASON[model.status]) return reject(TERMINAL_REASON[model.status]);
    if (model.status === 'executed') return reject('no-expire-after-execute');
    if (model.status === 'draft') return reject('expire-not-applicable');
    if (proposal.windowPassed !== true) return reject('expire-requires-window-passed');
    next.status = 'expired';
    return unchanged('proposer', 'firstApprover', 'transmitted', 'executedOnce');
  },
};

const control = instance({
  initialState: { ...INITIAL_STATE },
  component: { modelShape, actions: actionDefs, acceptors, reactors: [] },
});
const { intents } = control;

const actions = {
  PROPOSE: (data = {}) => intents.PROPOSE(data),
  APPROVE: (data = {}) => intents.APPROVE(data),
  RELEASE: (data = {}) => intents.RELEASE(data),
  ACK: (data = {}) => intents.ACK(data),
  EXECUTE: (data = {}) => intents.EXECUTE(data),
  CLOSE: (data = {}) => intents.CLOSE(data),
  ABORT: (data = {}) => intents.ABORT(data),
  EXPIRE: (data = {}) => intents.EXPIRE(data),
};

function getState() {
  return instance({}).getState();
}

function setState(snapshot) {
  return instance({}).setState(snapshot);
}

function init() {
  setState(INITIAL_STATE);
}

module.exports = { instance, init, actions, getState, setState };