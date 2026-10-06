---
name: build
description: Implement an agreed spec, issue, diagnosed bug or accepted review findings. Use when the intended behavior is clear enough; a separate implementation plan is not required.
---

# Build

Announce the input and the scope. Follow AGENTS.md and the instructions of the affected package.

## Establish the work

- Record the starting commit, worktree, branch and working changes, so the task's diff can be told
  apart from existing work. Work in the worktree the host provides, or create one when AGENTS.md asks
  for it. Never commit to the protected branches AGENTS.md names; follow its commit rules.
- For review fixes, verify that the checked-out head matches the reviewed code. Preserve unrelated
  work.
- Read the relevant docs and use the code search named in AGENTS.md before editing source. Validate
  data assumptions against runtime-shaped fixtures or read-only evidence.
- Keep a short task list in the session. Persist sequencing only for a complex migration, ordering
  across services or a handoff that needs it; capture dependencies and checkpoints, not speculative
  code.

## Implement and verify

Choose routine implementation details yourself within the agreed behavior. Raise material changes to
scope, contracts, dependencies or access with the user, and continue independent work meanwhile.

Work in coherent increments. Use meaningful tests for logic and regressions, preferably reproducing
the failure before the fix. API fixtures must enter through the real response transformation. Follow
the test tiers in AGENTS.md; do not add a test stack the project does not have.

If you find a pre-existing bug, a performance concern or behavior the task does not mention, do not
fix, optimize or extend it in this change unless the requested behavior cannot work without it; list
it as a follow-up in the report. Scratch scripts and quick checks go to the ignored `.scratch/`
directory and are not committed. Commit tests only where the task asks for them or the package
already keeps tests for this kind of change, sized like the neighbouring test files: roughly one
focused test per stated behavior. This limits extras only; implement every requested behavior
completely.

Run focused checks while iterating. If a hypothesis fails repeatedly, re-check the evidence and change
the approach; a retry count is not a reason to stop. Explain a real blocker with the failing evidence
and what would resolve it.

Prefer inline execution for sequential work. Delegate work that can run independently, within the
subagent rules in AGENTS.md. Do not split a dependency chain into ceremonial handoffs.

## Complete the scope

Map the acceptance criteria to implementation and evidence; inspect unexpected scope growth. Update
the documentation where boundaries, decisions or traps changed.

Apply the [completion gate](references/completion.md) before reporting the work as complete, even when
no PR was requested. Reuse checks that are still valid instead of rerunning them. Commit, push or open
a PR only when the user authorized it and as AGENTS.md describes; otherwise report the local result,
the checks and the remaining limitations.
