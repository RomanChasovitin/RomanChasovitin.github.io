---
name: discuss
description: Clarify a new product or technical topic and agree on behavior before implementation. Use when requirements or trade-offs need discussion; an already agreed spec, issue or set of review findings can go straight to build.
---

# Discuss

Announce the skill and the topic. Read AGENTS.md and the documentation of the area. Use the code
search named in AGENTS.md for the current code boundaries, the issue tracker it names for intent, and
read-only data evidence when a claim depends on data.

1. Identify the outcome, the users and the constraints. Ask only questions that change scope,
   behavior, acceptance or a material trade-off; group related questions. Continue independent
   discovery while waiting.
2. Recommend an approach and explain the alternatives that matter. Resolve uncertainty with source
   or a small probe where possible. Do not reopen decisions the user already accepted.
3. For substantial work, save `specs/YYYY-MM-DD-<topic>-design.md`. Capture the goal, observable
   behavior, acceptance criteria, exclusions, affected boundaries and contracts, assumptions and the
   verification approach. Add rollout, rollback or sequencing only when the risk requires it. Small
   tasks can use the issue or the conversation directly.
4. Self-review the result for missed cases, blast radius, contradictions and unnecessary machinery.
   This is self-review, not independent validation.
5. A saved spec gets one review by a subagent from the other vendor; see
   [design review](references/design-review.md). Small tasks without a spec skip this.
6. Resolve each concrete concern through a spec change, an explicit exclusion or an evidence-based
   dismissal. One review round is normally enough; validate the changed parts after fixes.

An agreed spec is executable input; no separate plan is needed. If implementation is authorized,
continue with the build skill. If the user asked for a proposal first, deliver the proposal without
changing the product.
