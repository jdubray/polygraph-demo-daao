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
      "type": "'draft'|'pending'|'approved'|'released'|'acknowledged'|'executed'|'closed'|'aborted'|'expired'"
    },
    {
      "name": "proposer",
      "type": "'none'|'p1'|'a1'|'a2'"
    },
    {
      "name": "firstApprover",
      "type": "'none'|'p1'|'a1'|'a2'"
    },
    {
      "name": "transmitted",
      "type": "boolean"
    },
    {
      "name": "executedOnce",
      "type": "boolean"
    }
  ],
  "initState": {
    "status": "draft",
    "proposer": "none",
    "firstApprover": "none",
    "transmitted": false,
    "executedOnce": false
  },
  "actions": {
    "PROPOSE": {
      "dataFields": {
        "proposer": "actor id submitting the order and setting the window"
      }
    },
    "APPROVE": {
      "dataFields": {
        "approver": "actor id granting authorization",
        "inWindow": "boolean, true iff the approval arrives before the window end"
      }
    },
    "RELEASE": {
      "dataFields": {
        "inWindow": "boolean, true iff the release attempt is before the window end"
      }
    },
    "ACK": {
      "dataFields": {}
    },
    "EXECUTE": {
      "dataFields": {
        "inWindow": "boolean, true iff the execute attempt is before the window end"
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
        "windowPassed": "boolean, true iff the window end has passed"
      }
    }
  },
  "dataDomain": {
    "PROPOSE": {
      "proposer": [
        "p1",
        "a1",
        "a2"
      ]
    },
    "APPROVE": {
      "approver": [
        "p1",
        "a1",
        "a2"
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
      "note": "Reject an APPROVE whose approver equals the stored proposer; the proposer is never a valid authority.",
      "whenState": "pending",
      "whenAction": "APPROVE"
    },
    {
      "name": "duplicate-approver-ignored",
      "note": "An APPROVE whose approver equals firstApprover is a no-op; the same authority cannot count as both required approvals.",
      "whenState": "pending",
      "whenAction": "APPROVE"
    },
    {
      "name": "approve-outside-window",
      "note": "Reject an APPROVE with inWindow == false; late approvals never count toward the two required.",
      "whenState": "pending",
      "whenAction": "APPROVE"
    },
    {
      "name": "second-distinct-approval-promotes",
      "note": "Only the second distinct in-window non-proposer approval moves the order to approved; the first merely records firstApprover and stays pending.",
      "whenState": "pending",
      "whenAction": "APPROVE"
    },
    {
      "name": "release-outside-window",
      "note": "Reject a RELEASE with inWindow == false; transmit must never fire outside the window.",
      "whenState": "approved",
      "whenAction": "RELEASE"
    },
    {
      "name": "release-before-approval",
      "note": "Reject RELEASE while still pending; an order without two distinct approvals must never be transmitted.",
      "whenState": "pending",
      "whenAction": "RELEASE"
    },
    {
      "name": "release-retry-no-retransmit",
      "note": "A repeated RELEASE while already released is a no-op and must not fire the transmit side effect a second time (transmitted stays true, post == pre).",
      "whenState": "released",
      "whenAction": "RELEASE"
    },
    {
      "name": "execute-outside-window",
      "note": "Reject an EXECUTE with inWindow == false; the external action must never fire outside the window.",
      "whenState": "acknowledged",
      "whenAction": "EXECUTE"
    },
    {
      "name": "execute-requires-transmit",
      "note": "Reject EXECUTE if transmitted == false, even in acknowledged state; execution without a prior transmit is a safety violation.",
      "whenState": "acknowledged",
      "whenAction": "EXECUTE"
    },
    {
      "name": "execute-requires-dual-auth",
      "note": "Reject EXECUTE if firstApprover == 'none' or the dual-authorization invariant is broken; defense in depth for the two-distinct-approvers rule.",
      "whenState": "acknowledged",
      "whenAction": "EXECUTE"
    },
    {
      "name": "execute-before-ack",
      "note": "Reject EXECUTE while merely released; acknowledgement must precede execution.",
      "whenState": "released",
      "whenAction": "EXECUTE"
    },
    {
      "name": "execute-retry-no-repeat",
      "note": "A repeated EXECUTE while already executed is a no-op and must not fire the external action a second time (executedOnce stays true, post == pre).",
      "whenState": "executed",
      "whenAction": "EXECUTE"
    },
    {
      "name": "no-abort-after-execute",
      "note": "Reject ABORT once executed; recall is only allowed at any point strictly before execution.",
      "whenState": "executed",
      "whenAction": "ABORT"
    },
    {
      "name": "expire-requires-window-passed",
      "note": "An EXPIRE with windowPassed == false is a no-op; expiry is only valid once the window end has actually passed. Applies identically from approved, released, and acknowledged.",
      "whenState": "pending",
      "whenAction": "EXPIRE"
    },
    {
      "name": "no-expire-after-execute",
      "note": "An executed order never expires; EXPIRE in executed state is a no-op even with windowPassed == true.",
      "whenState": "executed",
      "whenAction": "EXPIRE"
    },
    {
      "name": "no-repropose",
      "note": "A second PROPOSE after the order exists is a no-op; the proposer and window are fixed at first submission.",
      "whenState": "pending",
      "whenAction": "PROPOSE"
    },
    {
      "name": "terminal-closed-final",
      "note": "A closed order is final; every action in closed yields post == pre.",
      "whenState": "closed",
      "whenAction": "APPROVE"
    },
    {
      "name": "terminal-aborted-final",
      "note": "An aborted order is final; every action in aborted yields post == pre.",
      "whenState": "aborted",
      "whenAction": "RELEASE"
    },
    {
      "name": "terminal-expired-final",
      "note": "An expired order is final; every action in expired yields post == pre.",
      "whenState": "expired",
      "whenAction": "EXECUTE"
    }
  ],
  "noOpRule": "An action that does not apply in the current state yields post == pre."
}
```

## Code (`C:\Users\jjdub\code\polygraph-demo\daao\polygen-out-v6\next.cjs`)

```javascript
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
```

⚠️ **Proposed invariants — review before trusting; these encode the model's
reading of intent, not a verified spec.**

```javascript
const eq = (a, b) =>
  a.status === b.status &&
  a.proposer === b.proposer &&
  a.firstApprover === b.firstApprover &&
  a.transmitted === b.transmitted &&
  a.executedOnce === b.executedOnce;

const TERMINAL = ['closed', 'aborted', 'expired'];

export const stateInvariants = [
  {
    // Anywhere at or beyond execution, dual-authorization and transmit must hold.
    name: 'executed-implies-dual-auth-and-transmit',
    pred: (s) =>
      !(s.status === 'executed' || s.status === 'closed') ||
      (s.executedOnce === true &&
        s.transmitted === true &&
        s.firstApprover !== 'none' &&
        s.proposer !== 'none' &&
        s.firstApprover !== s.proposer),
  },
  {
    // Flags only appear once the lifecycle has actually reached that stage.
    name: 'flags-consistent-with-status',
    pred: (s) => {
      const transmittedOk = s.transmitted
        ? ['released', 'acknowledged', 'executed', 'closed', 'aborted', 'expired'].includes(s.status)
        : true;
      const executedOk = s.executedOnce
        ? ['executed', 'closed', 'aborted', 'expired'].includes(s.status)
        : true;
      // executedOnce implies transmitted (never executed without transmit)
      return transmittedOk && executedOk && (!s.executedOnce || s.transmitted);
    },
  },
];

export const transitionInvariants = [
  {
    // Closed, aborted, expired are final: every action is a strict no-op.
    name: 'terminal-states-are-final',
    pred: (pre, action, data, post) =>
      !TERMINAL.includes(pre.status) || eq(pre, post),
  },
  {
    // transmitted flips false->true only via an in-window RELEASE from approved,
    // and never flips back. A retry RELEASE while released changes nothing.
    name: 'transmit-fires-exactly-once-in-window',
    pred: (pre, action, data, post) => {
      if (pre.transmitted && !post.transmitted) return false;
      if (!pre.transmitted && post.transmitted) {
        return action === 'RELEASE' && data.inWindow === true && pre.status === 'approved';
      }
      if (action === 'RELEASE' && pre.status === 'released') return eq(pre, post);
      return true;
    },
  },
  {
    // executedOnce flips false->true only via an in-window EXECUTE from acknowledged,
    // with transmit done and two distinct non-proposer approvers; never flips back.
    // A retry EXECUTE while executed changes nothing.
    name: 'execute-fires-exactly-once-fully-guarded',
    pred: (pre, action, data, post) => {
      if (pre.executedOnce && !post.executedOnce) return false;
      if (!pre.executedOnce && post.executedOnce) {
        return (
          action === 'EXECUTE' &&
          data.inWindow === true &&
          pre.status === 'acknowledged' &&
          pre.transmitted === true &&
          pre.firstApprover !== 'none' &&
          pre.proposer !== 'none' &&
          pre.firstApprover !== pre.proposer
        );
      }
      if (action === 'EXECUTE' && pre.status === 'executed') return eq(pre, post);
      return true;
    },
  },
  {
    // Invalid approvals (proposer, duplicate, out-of-window) are no-ops; a valid
    // first approval records the approver and stays pending; a valid second
    // distinct approval promotes to approved.
    name: 'approval-rules-enforced',
    pred: (pre, action, data, post) => {
      if (action !== 'APPROVE' || pre.status !== 'pending') return true;
      const invalid =
        data.approver === pre.proposer ||
        data.approver === pre.firstApprover ||
        data.inWindow !== true;
      if (invalid) return eq(pre, post);
      if (pre.firstApprover === 'none') {
        return (
          post.status === 'pending' &&
          post.firstApprover === data.approver &&
          post.proposer === pre.proposer &&
          post.transmitted === pre.transmitted &&
          post.executedOnce === pre.executedOnce
        );
      }
      return (
        post.status === 'approved' &&
        post.firstApprover === pre.firstApprover &&
        post.proposer === pre.proposer
      );
    },
  },
  {
    // Expiry only via EXPIRE with windowPassed, never from executed or draft;
    // an EXPIRE without windowPassed is a no-op.
    name: 'expire-requires-window-passed-and-not-executed',
    pred: (pre, action, data, post) => {
      if (post.status === 'expired' && pre.status !== 'expired') {
        return (
          action === 'EXPIRE' &&
          data.windowPassed === true &&
          pre.status !== 'executed' &&
          pre.status !== 'draft'
        );
      }
      if (action === 'EXPIRE' && data.windowPassed !== true && !TERMINAL.includes(pre.status)) {
        return eq(pre, post);
      }
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
| 0 | 70 | no | no | — | — |

**Converged — no domain-ref gaps and no invariant violations reachable in the
final code**, over the explored (bounded) state space. Not a proof.

## Demo / regression trace corpus

- scenarios: **23** · windows: **203**
- corpus validated clean: no chaining/terminal problems.
- ⚠️ special rule 'terminal-closed-final' is exercised by only 1 window(s) (< 3) — thin regression coverage for that rule
- ⚠️ special rule 'terminal-aborted-final' is exercised by only 1 window(s) (< 3) — thin regression coverage for that rule
- ⚠️ special rule 'terminal-expired-final' is exercised by only 1 window(s) (< 3) — thin regression coverage for that rule

## Independent replay sanity check

- windows replayed (separate process): **203** · non-pass: **0**

## Next steps

1. Review the contract and invariants above — both are the model's reading of
   your intent, not ground truth.
2. Wire the machine into the real handler/reducer via its exported `actions` —
   call the intents, do not reimplement the transition logic inline.
3. After integration, run `/polygraph:verify` against REAL captured traces to
   catch drift between this pure model and the glue code around it.