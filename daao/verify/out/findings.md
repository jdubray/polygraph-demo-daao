# Polygraph — verification findings

> Consistency check, not a proof. Every finding is a lead to investigate by hand.

## Part 1 — trace conformance (replay)

- specs replayed: **3** (live: **3**)
- windows: **54**
- consistent (pass in all live specs): **54**
- likely spec-error (some specs miss it): **0**
- likely code-finding / contract-error (all specs disagree): **0**
- unscoreable in all specs (specs didn't load): **0**

All windows consistent across all specs — the derived spec reproduces the code.
_Note: a faithful spec reproduces bugs too, so a clean Part 1 is not a clean bill of
health. The bug-finding is Part 2._


## Part 2 — invariant violations (model checking)

- states explored: **28** · specs checked: **3/3**

No invariant violations reachable. (Bounded exploration; not a proof.)