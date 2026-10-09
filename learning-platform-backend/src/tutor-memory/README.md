# Tutor memory (roadmap 3.2, slice 1)

Builds the compact **learner-memory block** embedded in every tutor and
doubt prompt — the difference between a tutor that answers and a tutor
that *knows you*.

## What it is

A derived, on-demand summary string, capped at 600 characters:

- mastery counts from the BKT snapshot (`X mastered, Y developing, Z weak`),
- the learner's weakest concepts with probability + attempt counts,
- the most recent distinct wrong answers with relative times.

## What it deliberately is not

- **No table.** Everything is computed from existing truth (the answer
  events + tracer), so there is nothing to keep in sync or migrate. The
  roadmap's "running profile" is satisfied by derivation; a cache table
  can be added later if measurement ever shows it matters.
- **No PII.** Topics, probabilities and relative times only — never names,
  emails, ids or the learner's own message text.
- **Not authoritative.** The prompt instructs the model to *use* the memory
  and never invent beyond it; every source degrades independently, and an
  empty profile returns `null` (prompts stay exactly as they were).

## Wiring

`AgentService` (both the Socratic and concept-explanation builders, both
the blocking and streaming entry points) calls
`buildLearnerMemory(context.userId)` best-effort and inserts a
`<learner-memory>` block between the conversation history and the
learner's message. Callers opt in by setting `userId` on
`TutorPromptContext` — `doubts` and the interactive tutor both do.

## Dependencies

`agent → tutor-memory → knowledge-tracing` (never the reverse; no cycle).
