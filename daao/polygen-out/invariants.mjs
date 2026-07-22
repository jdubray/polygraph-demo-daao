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