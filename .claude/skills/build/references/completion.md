# Completion gate

Scope coverage, self-review, cross-vendor verification and verification by impact apply to every
implementation: builds, debug fixes and accepted review findings. Using this reference does not by
itself authorize a commit, push, merge or deployment.

## Establish the full scope

Inspect the task's complete changes against its recorded starting state, including committed,
staged, unstaged and relevant untracked work. Preserve pre-existing changes and edits by other agents;
do not count them as your own. If the starting state is unclear, establish the task boundary from the
branch history and the request before claiming coverage.

Map the spec, issue, bug reproduction or accepted findings to observable acceptance criteria. Mark
each criterion implemented, partial, missing or unverified; reading the source alone does not prove
runtime behavior. Inspect scope additions in the other direction too: every changed behavior,
dependency, deleted test, widened lint exemption and generated change needs a reason. For a small
change, one short coverage statement is enough.

### Before a PR

Fetch the actual base from the configured remote; if that fails, say the base may be stale instead of
silently using a local branch. Review `git diff <merge-base>` for the final tracked contents, and
untracked files separately: a committed-only diff misses uncommitted work. Check that HEAD merges
cleanly: `git merge-tree --write-tree --name-only <remote-base> HEAD` exits 1 and lists the files on
a conflict. Merge the base in, resolve and rerun the affected checks first.

## Self-review

Check failure paths, permissions, data shapes, compatibility and regressions relevant to the diff.
Validate findings with source, a reproduction or a meaningful test. Reviewer agreement is not
evidence, and failing to refute a claim does not confirm it.

Update the docs that describe current boundaries, decisions and traps. Retire the task's completed
spec only after its durable content is preserved; do not delete unrelated or future specs.

## Cross-vendor verification

After self-review, one subagent from the other vendor checks the change: a Claude session asks GPT, a
Codex session asks Claude, with the route in AGENTS.md under "Subagents". Skip it for
documentation-only and trivial changes, such as a typo, a rename or a single config value, and say so.

Give the verifier the intent, the full diff and the checks already run. It reviews only: no edits, no
comments, no publication and no further delegation, and it never runs its own cross-vendor
verification. Ask for findings with severity, location, triggering scenario and evidence. Confirm each
finding against source, a reproduction or a test before acting; an unconfirmed claim stays unverified.
One round is enough; after fixes, check the affected parts yourself.

If no route to the other vendor is available, report cross-vendor verification as not run. A
same-vendor subagent is not a substitute and is never labeled cross-vendor.

## Verification by impact

Run the checks AGENTS.md lists for the kind of change: types, lint, tests, build. A change to what a
user sees or how a page reacts also needs a check in the running app. Documentation-only changes need
link and factual consistency checks; app test suites add no evidence for prose. Agent instructions
and skills need a walkthrough of the scenarios they change, labeled as a walkthrough rather than
observed agent behavior.

Reuse checks only if the tested content and environment are unchanged. After a fix, rerun the affected
checks; widen them when the failure or scope warrants it. Record what ran, what it proves and what
remains unverified. Finish all edits before the final commit.
