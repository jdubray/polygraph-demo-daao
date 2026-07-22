# polygen — authored spec report

> Consistency check, not a proof. This code has been model-checked against
> its own stated invariants and its demo corpus has been independently
> replayed — that is not the same as being correct. Review the contract and
> invariants below before trusting either.

- artifact: **SAM v2 strict-profile module** (`{ instance, init, actions, getState, setState }`, vendored sam-lib 2.0.0-alpha; strict validate() gate at every stage boundary)

## Contract

⚠️ **Model-drafted, not extracted from existing code — review before use.**

```json
{
  "lang": "javascript",
  "stateKeys": [
    {
      "name": "status",
      "type": "string enum: idle | pending | approved | released | acknowledged | executed | closed | aborted | expired"
    },
    {
      "name": "firstApprover",
      "type": "string enum: none | authA | authB (identity of the first distinct in-window approver)"
    },
    {
      "name": "transmitted",
      "type": "boolean (external transmit side effect has fired, at most once)"
    },
    {
      "name": "executedEffect",
      "type": "boolean (external execute side effect has fired, at most once)"
    }
  ],
  "initState": {
    "status": "idle",
    "firstApprover": "none",
    "transmitted": false,
    "executedEffect": false
  },
  "actions": {
    "PROPOSE": {
      "dataFields": {}
    },
    "APPROVE": {
      "dataFields": {
        "actor": "string: identity of the approving authority; 'proposer' is the order's proposer",
        "inWindow": "boolean: whether the approval arrives within the authorization window"
      }
    },
    "RELEASE": {
      "dataFields": {
        "inWindow": "boolean: whether the release attempt occurs within the authorization window"
      }
    },
    "ACK": {
      "dataFields": {}
    },
    "EXECUTE": {
      "dataFields": {
        "inWindow": "boolean: whether the execute attempt occurs within the authorization window"
      }
    },
    "CLOSE": {
      "dataFields": {}
    },
    "ABORT": {
      "dataFields": {}
    },
    "EXPIRE": {
      "dataFields": {
        "windowPassed": "boolean: whether the authorization window end has passed"
      }
    }
  },
  "dataDomain": {
    "PROPOSE": {},
    "APPROVE": {
      "actor": [
        "proposer",
        "authA",
        "authB"
      ],
      "inWindow": [
        true,
        false
      ]
    },
    "RELEASE": {
      "inWindow": [
        true,
        false
      ]
    },
    "ACK": {},
    "EXECUTE": {
      "inWindow": [
        true,
        false
      ]
    },
    "CLOSE": {},
    "ABORT": {},
    "EXPIRE": {
      "windowPassed": [
        true,
        false
      ]
    }
  },
  "terminalStates": [
    "closed",
    "aborted",
    "expired"
  ],
  "specialRules": [
    {
      "name": "proposer-cannot-approve",
      "note": "An APPROVE with actor == 'proposer' must be rejected; the proposer is never a valid authority, regardless of inWindow.",
      "whenState": "pending",
      "whenAction": "APPROVE"
    },
    {
      "name": "duplicate-approver-ignored",
      "note": "An APPROVE whose actor equals firstApprover must not count as a second approval; state stays pending with no change (approvals must come from two DISTINCT authorities).",
      "whenState": "pending",
      "whenAction": "APPROVE"
    },
    {
      "name": "approval-outside-window",
      "note": "An APPROVE with inWindow == false must be rejected and must not record the actor as firstApprover nor advance to approved.",
      "whenState": "pending",
      "whenAction": "APPROVE"
    },
    {
      "name": "second-distinct-approval-approves",
      "note": "Only when actor is a non-proposer authority distinct from firstApprover, firstApprover != 'none', and inWindow == true does status advance to approved; the first such valid approval only records firstApprover and stays pending.",
      "whenState": "pending",
      "whenAction": "APPROVE"
    },
    {
      "name": "release-outside-window",
      "note": "RELEASE with inWindow == false must be rejected; the transmit side effect must not fire and status stays approved.",
      "whenState": "approved",
      "whenAction": "RELEASE"
    },
    {
      "name": "release-before-approval",
      "note": "RELEASE while still pending (fewer than two distinct approvals) must be rejected; transmitted must remain false.",
      "whenState": "pending",
      "whenAction": "RELEASE"
    },
    {
      "name": "transmit-at-most-once",
      "note": "A retried RELEASE after the order is already released must be a no-op; transmitted stays true and the external transmit must not fire a second time.",
      "whenState": "released",
      "whenAction": "RELEASE"
    },
    {
      "name": "execute-requires-ack",
      "note": "EXECUTE while merely released (not yet acknowledged) must be rejected; the ordering is released -> acknowledged -> executed.",
      "whenState": "released",
      "whenAction": "EXECUTE"
    },
    {
      "name": "execute-outside-window",
      "note": "EXECUTE with inWindow == false must be rejected; the external execute effect must not fire and status stays acknowledged.",
      "whenState": "acknowledged",
      "whenAction": "EXECUTE"
    },
    {
      "name": "execute-requires-transmit",
      "note": "EXECUTE must be rejected if transmitted == false; an order must never be executed without having been transmitted first (defense in depth even if the state table implies it).",
      "whenState": "acknowledged",
      "whenAction": "EXECUTE"
    },
    {
      "name": "execute-requires-dual-authorization",
      "note": "EXECUTE must be rejected if firstApprover == 'none' or the dual-approval invariant does not hold; never perform the external action without two distinct non-proposer approvers (defense in depth).",
      "whenState": "acknowledged",
      "whenAction": "EXECUTE"
    },
    {
      "name": "execute-at-most-once",
      "note": "A retried EXECUTE after the order is already executed must be a no-op; executedEffect stays true and the external action must not fire a second time.",
      "whenState": "executed",
      "whenAction": "EXECUTE"
    },
    {
      "name": "no-abort-after-execution",
      "note": "ABORT (recall) is only valid before execution; once executed, ABORT must be rejected and the order proceeds only to closed.",
      "whenState": "executed",
      "whenAction": "ABORT"
    },
    {
      "name": "expire-requires-window-passed",
      "note": "EXPIRE with windowPassed == false must be a no-op; the order only expires once the window end has actually passed.",
      "whenState": "pending",
      "whenAction": "EXPIRE"
    },
    {
      "name": "expire-while-approved",
      "note": "An approved-but-unreleased order with windowPassed == true expires; with windowPassed == false EXPIRE is a no-op.",
      "whenState": "approved",
      "whenAction": "EXPIRE"
    },
    {
      "name": "terminal-closed-is-final",
      "note": "Once closed, every action (including RELEASE, EXECUTE, ABORT, APPROVE) must be a no-op; no side effects and no state change.",
      "whenState": "closed",
      "whenAction": "RELEASE"
    },
    {
      "name": "terminal-aborted-is-final",
      "note": "Once aborted, every action (including EXECUTE and RELEASE) must be a no-op; the recall is irrevocable and no external effect may fire.",
      "whenState": "aborted",
      "whenAction": "EXECUTE"
    },
    {
      "name": "terminal-expired-is-final",
      "note": "Once expired, every action (including EXECUTE, RELEASE, APPROVE) must be a no-op; expiry is irrevocable and no external effect may fire.",
      "whenState": "expired",
      "whenAction": "EXECUTE"
    },
    {
      "name": "propose-only-from-idle",
      "note": "PROPOSE is only valid in idle; re-proposing an already-open order must be a no-op and must not reset approvals or effect flags.",
      "whenState": "pending",
      "whenAction": "PROPOSE"
    }
  ],
  "noOpRule": "An action that does not apply in the current state yields post == pre."
}
```

## Code (`C:\Users\jjdub\code\polygraph-demo\daao\polygen-out\next.cjs`)

```javascript
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
```

⚠️ **Proposed invariants — review before trusting; these encode the model's
reading of intent, not a verified spec.**

```javascript
export const stateInvariants = [
  {
    name: 'execution-safety-flags-consistent',
    pred: (s) => {
      // executedEffect fires exactly when the order has been executed (and not undone by close)
      if (s.executedEffect !== (s.status === 'executed' || s.status === 'closed')) return false;
      // never executed without transmit and dual authorization on record
      if (s.executedEffect && !(s.transmitted === true && s.firstApprover !== 'none' && s.firstApprover !== 'proposer')) return false;
      // anything at or past release must have been transmitted and dual-approved
      if (['released', 'acknowledged', 'executed', 'closed'].includes(s.status) &&
          !(s.transmitted === true && s.firstApprover !== 'none')) return false;
      // approved requires a recorded first approver
      if (s.status === 'approved' && s.firstApprover === 'none') return false;
      // expiry only happens before release, so no external effect ever fired
      if (s.status === 'expired' && (s.transmitted || s.executedEffect)) return false;
      return true;
    },
  },
  {
    name: 'status-domain-and-clean-early-states',
    pred: (s) => {
      const valid = ['idle', 'pending', 'approved', 'released', 'acknowledged', 'executed', 'closed', 'aborted', 'expired'];
      if (!valid.includes(s.status)) return false;
      // the proposer must never be recorded as an approver
      if (s.firstApprover === 'proposer') return false;
      // idle is pristine: no approvals, no effects
      if (s.status === 'idle' && (s.firstApprover !== 'none' || s.transmitted || s.executedEffect)) return false;
      // transmit only happens on release, never while merely approved or pending
      if ((s.status === 'pending' || s.status === 'approved') && (s.transmitted || s.executedEffect)) return false;
      return true;
    },
  },
];

const same = (a, b) =>
  a.status === b.status &&
  a.firstApprover === b.firstApprover &&
  a.transmitted === b.transmitted &&
  a.executedEffect === b.executedEffect;

export const transitionInvariants = [
  {
    name: 'side-effects-monotonic-and-guarded',
    pred: (pre, action, data, post) => {
      // effects never un-fire
      if (pre.transmitted && !post.transmitted) return false;
      if (pre.executedEffect && !post.executedEffect) return false;
      // transmit fires only via RELEASE, in-window, from approved (at most once)
      if (!pre.transmitted && post.transmitted) {
        if (!(action === 'RELEASE' && data.inWindow === true && pre.status === 'approved')) return false;
      }
      // execute fires only via EXECUTE, in-window, from acknowledged,
      // after transmit, with dual authorization on record (at most once)
      if (!pre.executedEffect && post.executedEffect) {
        if (!(action === 'EXECUTE' && data.inWindow === true && pre.status === 'acknowledged' &&
              pre.transmitted === true && pre.firstApprover !== 'none')) return false;
      }
      return true;
    },
  },
  {
    name: 'terminal-states-are-final',
    pred: (pre, action, data, post) => {
      if (pre.status === 'closed' || pre.status === 'aborted' || pre.status === 'expired') {
        return same(pre, post);
      }
      return true;
    },
  },
  {
    name: 'approve-requires-two-distinct-in-window-authorities',
    pred: (pre, action, data, post) => {
      if (action !== 'APPROVE') return true;
      // advancing to approved requires: pending, in-window, non-proposer,
      // distinct from an already-recorded first approver
      if (pre.status !== 'approved' && post.status === 'approved') {
        if (pre.status !== 'pending') return false;
        if (data.inWindow !== true) return false;
        if (data.actor === 'proposer') return false;
        if (pre.firstApprover === 'none') return false;
        if (data.actor === pre.firstApprover) return false;
      }
      // proposer, out-of-window, or duplicate approvals are strict no-ops
      if (pre.status === 'pending' &&
          (data.actor === 'proposer' || data.inWindow !== true || data.actor === pre.firstApprover)) {
        return same(pre, post);
      }
      // firstApprover is only ever recorded by a valid first in-window approval,
      // which keeps the order pending
      if (post.firstApprover !== pre.firstApprover) {
        return pre.status === 'pending' && pre.firstApprover === 'none' &&
               data.inWindow === true && data.actor !== 'proposer' &&
               post.firstApprover === data.actor && post.status === 'pending';
      }
      return true;
    },
  },
  {
    name: 'expire-and-propose-guards',
    pred: (pre, action, data, post) => {
      if (action === 'EXPIRE') {
        // may only become expired from pending/approved once the window has passed
        if (post.status === 'expired' && pre.status !== 'expired') {
          if (!((pre.status === 'pending' || pre.status === 'approved') && data.windowPassed === true)) return false;
        }
        // window not passed: strict no-op
        if (data.windowPassed !== true) return same(pre, post);
      }
      // re-proposing an open order must not reset approvals or effect flags
      if (action === 'PROPOSE' && pre.status !== 'idle') return same(pre, post);
      return true;
    },
  },
];
```

## Self-repair loop

Two defect classes are checked every round, in order: domain-ref gaps (a
`dataDomain` value the contract declares but the code never handles — these
are fixed FIRST, since until they're gone the checker may never even reach
what an invariant is meant to guard) and invariant violations.

| iteration | states explored | cap hit | nondeterministic | domain gaps | violations |
|---|---|---|---|---|---|
| 0 | 22 | no | no | — | — |

**Converged — no domain-ref gaps and no invariant violations reachable in the
final code**, over the explored (bounded) state space. Not a proof.

## Demo / regression trace corpus

- scenarios: **7** · windows: **96**
- corpus validated clean: no chaining/terminal problems.
- ⚠️ special rule 'terminal-closed-is-final' is exercised by only 2 window(s) (< 3) — thin regression coverage for that rule
- ⚠️ special rule 'terminal-aborted-is-final' is exercised by only 2 window(s) (< 3) — thin regression coverage for that rule
- ⚠️ special rule 'terminal-expired-is-final' is exercised by only 2 window(s) (< 3) — thin regression coverage for that rule

## Independent replay sanity check

- windows replayed (separate process): **96** · non-pass: **0**

## Next steps

1. Review the contract and invariants above — both are the model's reading of
   your intent, not ground truth.
2. Wire the machine into the real handler/reducer via its exported `actions` —
   call the intents, do not reimplement the transition logic inline.
3. After integration, run `/polygraph:verify` against REAL captured traces to
   catch drift between this pure model and the glue code around it.