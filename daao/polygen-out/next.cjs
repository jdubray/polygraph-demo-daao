'use strict';

const { createInstance } = require('@cognitive-fab/sam-pattern');

const instance = createInstance({ strict: true, hasAsyncActions: false });

const INITIAL_STATE = {
  status: 'idle',
  firstApprover: 'none',
  transmitted: false,
  executedEffect: false,
};

const { intents } = instance({
  initialState: INITIAL_STATE,
  component: {
    modelShape: {
      status: { type: 'string' },
      firstApprover: { type: 'string' },
      transmitted: { type: 'boolean' },
      executedEffect: { type: 'boolean' },
    },
    actions: {
      PROPOSE: {
        action: (data = {}) => ({ ...data }),
        schema: {},
        domain: [{}],
      },
      APPROVE: {
        action: (data = {}) => ({ ...data }),
        schema: {
          actor: { type: 'string', required: true },
          inWindow: { type: 'boolean', required: true },
        },
        domain: [
          { actor: 'proposer', inWindow: true },
          { actor: 'proposer', inWindow: false },
          { actor: 'authA', inWindow: true },
          { actor: 'authA', inWindow: false },
          { actor: 'authB', inWindow: true },
          { actor: 'authB', inWindow: false },
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
    },
    acceptors: {
      PROPOSE: (model) => (proposal, { reject }) => {
        if (model.status === 'idle') {
          model.status = 'pending';
          return;
        }
        if (model.status === 'pending') {
          reject('propose-only-from-idle');
          return;
        }
        if (model.status === 'closed') {
          reject('terminal-closed-is-final');
          return;
        }
        if (model.status === 'aborted') {
          reject('terminal-aborted-is-final');
          return;
        }
        if (model.status === 'expired') {
          reject('terminal-expired-is-final');
          return;
        }
        reject('propose-only-from-idle');
      },

      APPROVE: (model) => (proposal, { reject }) => {
        if (model.status === 'pending') {
          if (proposal.actor === 'proposer') {
            reject('proposer-cannot-approve');
            return;
          }
          if (proposal.inWindow !== true) {
            reject('approval-outside-window');
            return;
          }
          if (proposal.actor !== 'authA' && proposal.actor !== 'authB') {
            reject('second-distinct-approval-approves');
            return;
          }
          if (proposal.actor === model.firstApprover) {
            reject('duplicate-approver-ignored');
            return;
          }
          if (model.firstApprover === 'none') {
            // First distinct valid in-window approval: record only.
            model.firstApprover = proposal.actor;
            return;
          }
          // Second distinct in-window approval by a non-proposer authority.
          model.status = 'approved';
          return;
        }
        if (model.status === 'closed') {
          reject('terminal-closed-is-final');
          return;
        }
        if (model.status === 'aborted') {
          reject('terminal-aborted-is-final');
          return;
        }
        if (model.status === 'expired') {
          reject('terminal-expired-is-final');
          return;
        }
        reject('approve-not-applicable');
      },

      RELEASE: (model) => (proposal, { reject }) => {
        if (model.status === 'pending') {
          reject('release-before-approval');
          return;
        }
        if (model.status === 'approved') {
          if (proposal.inWindow !== true) {
            reject('release-outside-window');
            return;
          }
          model.status = 'released';
          model.transmitted = true;
          return;
        }
        if (model.status === 'released') {
          reject('transmit-at-most-once');
          return;
        }
        if (model.status === 'closed') {
          reject('terminal-closed-is-final');
          return;
        }
        if (model.status === 'aborted') {
          reject('terminal-aborted-is-final');
          return;
        }
        if (model.status === 'expired') {
          reject('terminal-expired-is-final');
          return;
        }
        reject('release-not-applicable');
      },

      ACK: (model) => (proposal, { reject }) => {
        if (model.status === 'released') {
          model.status = 'acknowledged';
          return;
        }
        if (model.status === 'closed') {
          reject('terminal-closed-is-final');
          return;
        }
        if (model.status === 'aborted') {
          reject('terminal-aborted-is-final');
          return;
        }
        if (model.status === 'expired') {
          reject('terminal-expired-is-final');
          return;
        }
        reject('ack-not-applicable');
      },

      EXECUTE: (model) => (proposal, { reject }) => {
        if (model.status === 'released') {
          reject('execute-requires-ack');
          return;
        }
        if (model.status === 'acknowledged') {
          if (proposal.inWindow !== true) {
            reject('execute-outside-window');
            return;
          }
          if (model.transmitted !== true) {
            reject('execute-requires-transmit');
            return;
          }
          if (model.firstApprover === 'none') {
            reject('execute-requires-dual-authorization');
            return;
          }
          model.status = 'executed';
          model.executedEffect = true;
          return;
        }
        if (model.status === 'executed') {
          reject('execute-at-most-once');
          return;
        }
        if (model.status === 'closed') {
          reject('terminal-closed-is-final');
          return;
        }
        if (model.status === 'aborted') {
          reject('terminal-aborted-is-final');
          return;
        }
        if (model.status === 'expired') {
          reject('terminal-expired-is-final');
          return;
        }
        reject('execute-not-applicable');
      },

      CLOSE: (model) => (proposal, { reject }) => {
        if (model.status === 'executed') {
          model.status = 'closed';
          return;
        }
        if (model.status === 'closed') {
          reject('terminal-closed-is-final');
          return;
        }
        if (model.status === 'aborted') {
          reject('terminal-aborted-is-final');
          return;
        }
        if (model.status === 'expired') {
          reject('terminal-expired-is-final');
          return;
        }
        reject('close-not-applicable');
      },

      ABORT: (model) => (proposal, { reject }) => {
        if (
          model.status === 'pending' ||
          model.status === 'approved' ||
          model.status === 'released' ||
          model.status === 'acknowledged'
        ) {
          model.status = 'aborted';
          return;
        }
        if (model.status === 'executed') {
          reject('no-abort-after-execution');
          return;
        }
        if (model.status === 'closed') {
          reject('terminal-closed-is-final');
          return;
        }
        if (model.status === 'aborted') {
          reject('terminal-aborted-is-final');
          return;
        }
        if (model.status === 'expired') {
          reject('terminal-expired-is-final');
          return;
        }
        reject('abort-not-applicable');
      },

      EXPIRE: (model) => (proposal, { reject }) => {
        if (model.status === 'pending') {
          if (proposal.windowPassed !== true) {
            reject('expire-requires-window-passed');
            return;
          }
          model.status = 'expired';
          return;
        }
        if (model.status === 'approved') {
          if (proposal.windowPassed !== true) {
            reject('expire-while-approved');
            return;
          }
          model.status = 'expired';
          return;
        }
        if (model.status === 'closed') {
          reject('terminal-closed-is-final');
          return;
        }
        if (model.status === 'aborted') {
          reject('terminal-aborted-is-final');
          return;
        }
        if (model.status === 'expired') {
          reject('terminal-expired-is-final');
          return;
        }
        reject('expire-not-applicable');
      },
    },
  },
});

const getState = () => instance({}).getState();
const setState = (snapshot) => instance({}).setState(snapshot);
const init = () => setState(INITIAL_STATE);

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

module.exports = { instance, init, actions, getState, setState };