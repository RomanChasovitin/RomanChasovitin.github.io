---
name: debug
description: Diagnose and fix broken behavior using a reproduction and runtime evidence. Use before any speculative fix.
---

# Debug

Announce the symptom and the scope. Read the gotchas document named in AGENTS.md and the docs of the
area it points to. A matching trap is a hypothesis, not proof.

1. Capture expected and actual behavior, input, environment and the smallest useful reproduction. For
   intermittent or inaccessible behavior, use logs, traces or runtime data and state what they cannot
   prove.
2. Use the code search named in AGENTS.md to follow the failing flow and its callers. Follow data
   across API boundaries; use read-only data evidence when a claim depends on the shape or contents of
   stored data.
3. Form a falsifiable hypothesis and run the smallest check that tells the options apart. If it fails,
   update the hypothesis. Repeated failures call for reassessing the evidence, not for stopping after
   a fixed number of tries.
4. Add a meaningful regression test where the project's test tiers support it, preferably one that
   fails before the fix. Use fixtures shaped like the real transport.
5. Fix the cause, then check the original reproduction and the relevant regression paths. Raise
   material changes to scope or contracts; choose routine implementation details yourself.
6. Record only reusable, non-obvious traps in the owning area doc, with a short entry in the gotchas
   document when it is broadly useful.

Report the cause, the evidence, the change and the limits of the verification. Apply the build
skill's [completion gate](../build/references/completion.md).
