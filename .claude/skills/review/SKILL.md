---
name: review
description: Review another author's PR for actionable defects. Keep findings local unless posting is authorized; accepted findings can go straight to build without a separate plan.
---

# Review a PR

Establish the PR's actual base, head, intent and CI state. Check that any local checkout matches the
reviewed head, and account for local changes before using it as evidence. Read the relevant docs and
use the code search named in AGENTS.md for the source and its consumers.

Inspect the full diff against the remote base. Review behavior, failure cases, access, contracts and
tests. A missing issue link or a style preference is not by itself a defect. Failing CI does not
prevent a useful independent inspection; state the limit and tell existing failures apart.

A dependency finding needs the relevant usage and current primary-source evidence, not a scanner
headline. Use runtime-shaped data for API claims.

After your own pass, one subagent from the other vendor reviews the same PR independently (GPT for a
Claude session, Claude for a Codex session; route in AGENTS.md under "Subagents"). Give it the PR
intent and diff, not your findings. It reviews only: it does not post and does not delegate further.
If you are that delegated reviewer, skip this step. Confirm its claims against source, a reproduction
or tests before merging them into yours; neither model agreement nor a failed refutation proves them.
If no route to the other vendor is available, say the review is single-vendor.

Return actionable findings with severity, file and line, triggering scenario, consequence and
evidence. Drop generic suggestions and unsupported claims; an empty result is valid.

Keep the review in the conversation unless the user authorized posting. For authorized GitHub
comments, use `gh pr review --comment --body-file <file>` (`gh-rch` for personal repositories);
approving or requesting changes needs its own authorization. Do not request another bot review after
fixes.

If asked to fix accepted findings, continue with the build skill using those findings as input. No
intermediate plan is needed.
