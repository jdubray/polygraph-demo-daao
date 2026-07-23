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