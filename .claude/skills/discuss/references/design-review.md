# Design review

A saved spec gets one review by a subagent from the other vendor: GPT for a Claude session, Claude
for a Codex session. The route, model and effort are in AGENTS.md under "Subagents". It matters most
where independent reasoning could expose a costly ambiguity: permissions, changed contracts,
irreversible migrations or an uncertain boundary between services.

Give the reviewer the spec and bounded support files, and name its lenses: missed cases and blast
radius, contradictions, and unnecessary scope. Ask for a concrete output shape. It reviews only: it
does not edit and does not delegate further.

A finding must name an input, state, user or sequence that produces a wrong or undefined outcome.
Verify repository claims before accepting them. Resolve each one as a spec change, a deliberate
exclusion with a reason, or a dismissal supported by evidence. Agreement between models does not
decide validity.

One round normally suffices. After edits, check the affected requirements rather than repeating the
review. Report the actual model, failures, concrete resolutions and remaining uncertainty. If no route
to the other vendor is available, say the spec had self-review only.
