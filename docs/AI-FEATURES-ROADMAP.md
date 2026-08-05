# AI Features Integration Plan

A phased, module-wise plan to integrate AI features into the JEE Competency
Diagnosis & Adaptive Learning platform — ordered **small to big** so each phase
delivers value on its own and de-risks the next. Every item is tied to an
existing module so it builds on real infrastructure (the `AgentService` LLM
boundary, Qdrant embeddings, the competency engine, notebook, doubts, tutor
threads, flashcards, and the admin question-review queue).

Legend for checklists:

- `[ ]` not started · `[~]` in progress · `[x]` done

---

## 0. Current AI baseline (what already exists)

| Capability | Module | Status |
| --- | --- | --- |
| LLM + vector boundary (DeepSeek + Qdrant) | `agent` | exists |
| Adaptive question generation (learner-private pool) | `adaptive` + `agent` | exists |
| Flashcard generation + spaced-repetition queue | `adaptive` | exists (basic schedule) |
| Socratic in-session tutor (hint/explanation threads) | `adaptive` + `agent` | exists |
| Doubt resolution (async, non-blocking) | `doubts` + `agent` | exists |
| Notebook concept-level LLM summaries (cached) | `notebook` + `agent` | exists |
| Competency score (weighted accuracy/difficulty/bloom/speed/consistency) | `adaptive` (competency.service) | exists |
| 12-coordinate Bloom × difficulty journey + prerequisite graph | `adaptive` + `topics` | exists |
| Per-question `common_errors` misconceptions | `question` entity | exists (data only) |
| Admin question review queue + generation | `questions` | exists |

This plan turns existing infrastructure into productised AI features.

---

## Phase 1 — Quick wins (small effort, high perceived AI polish)

Goal: make the surfaces already built *feel* intelligent, with no new
infrastructure. Days, not weeks. Build directly on `AgentService` + the
analysis/review/notebook pages.

### 1.1 One-tap "Explain this" / "Hint" on review & practice
**Modules:** frontend `practice`/`diagnostics` review UIs · backend `adaptive` tutor · `doubts`

- [x] Frontend: add "Explain this" button on each per-question review item (tests + practice), wired to the tutor prompt with `answerRevealed: true`. — shared `ExplainThis` component on `PracticeReview` and the diagnostic review drill-down.
- [x] Frontend: surface the existing "Hint" quick-prompt as a visible action on the practice board (not only via `H` key). — quick-prompt buttons already render above the tutor input in `StudyAssistant`.
- [x] Backend: ensure `AgentService.generateTutorResponse` accepts an ad-hoc question context without an active session (reuse the doubt path). — new `explainReviewQuestion` on practice/diagnostics services; `POST .../questions/:questionId/explain`.
- [x] Tests: unit test the ad-hoc explanation path with a mocked model + fallback.
- [x] Docs: update `learning`/`practice` component READMEs.

### 1.2 AI test recap (one-line summary on the analysis page)
**Modules:** frontend `analysis` page · backend `diagnostics` analysis

- [x] Backend: add an optional `recap` field to `GET /api/diagnostics/:id/analysis`, generated from topic performance + weak topics (short, deterministic if no LLM). — `buildRecap`, stored on every analysis; zero-cost, always present.
- [x] Frontend: render the recap line at the top of the analysis page. — "AI recap" line in the hero.
- [x] Tests: deterministic recap from a fixture analysis; LLM recap path mocked. — deterministic recap covered; recap needs no LLM path.
- [x] Docs: `diagnostics` README endpoint note.

### 1.3 Explanation depth toggle (concise / step-by-step / from-scratch)
**Modules:** `agent` (prompt control) · frontend tutor/review

- [x] Add a `depth` field to the tutor prompt context and a UI toggle. — `TutorPromptContext.depth` + `EXPLANATION_DEPTHS`; toggle lives in `ExplainThis`.
- [x] Tests: prompt builder includes the depth directive. — `agent.service.spec.ts`.
- [x] Docs: `agent` README.

### 1.4 Confidence calibration (rate before answering)
**Modules:** frontend `practice`/`diagnostics` · backend answer save (new optional field)

- [x] Add `confidence` (1–3) to `SavePracticeAnswerDto` / `SaveDiagnosticAnswerDto` (optional).
- [x] Persist on the answer rows (migration for the new nullable column). — `AddAnswerConfidence1785400000000`.
- [x] Frontend: confidence selector before submit; show over/under-confidence on review. — `ConfidenceSelector` on both runners; `ConfidenceBadge` on review via the shared `calibrationFor`.
- [x] Tests: DTO validation + persistence. — persistence + calibration covered in service specs; `calibrationFor` unit-tested.
- [x] Docs: practice/diagnostics README + migration note.

### 1.5 Guessing / random-answering detection in tests
**Modules:** `diagnostics` analysis

- [x] Heuristic flag on submit: implausibly fast + wrong, or shuffled-pattern answers. — `buildIntegritySignal`.
- [x] Surface a subtle "possible guess pattern" note on analysis (admin-visible only). — redacted server-side for students via `viewAnalysisFor`; note shown only when `user.role === "admin"`.
- [x] Tests: heuristic over a fixture attempt.
- [x] Docs: `diagnostics` README.

### Phase 1 exit criteria
- [x] Review and practice offer on-demand AI explanation/hint.
- [x] Analysis page shows an AI recap.
- [x] Confidence + guess-detection data captured without disrupting the flow.
- [x] All new endpoints unit tested; READMEs updated.

---

## Phase 2 — Integratable (medium effort, build on existing infra)

Goal: productise the AI infrastructure you already have. Each item reuses
`AgentService`, Qdrant, or an existing module. ~days–a-few-weeks each.

### 2.1 RAG-grounded explanations with citations
**Modules:** `agent` (retrieve-then-generate) · `doubts` · `adaptive` tutor

- [x] Wire `AgentService.retrieveContextFromQdrant` into the **doubts** path (currently context-light) and the tutor explanation path. — new structured `retrieveSourcesFromQdrant` + cached best-effort `retrieveSupplementalSources`; `generateConceptExplanation` grounds on these; doubts + explain endpoints consume them.
- [x] Append retrieved context to the tutor prompt; return a short `sources` list in the response. — explain endpoints return `{ explanation, grounded, sources }`; doubts persist `sources`.
- [x] Frontend: render source citations under tutor/doubt answers. — shared `SourceCitations` in `ExplainThis` and the doubts page.
- [x] Fallback: if Qdrant empty/unavailable, answer without citations (never block). — `retrieveSupplementalSources` is timeout-bounded and returns `[]`; verified live.
- [x] Tests: retrieval mocked; citation payload shape; fallback path. — `citation.util.spec.ts`, `agent.service.spec.ts` (mapping + fallback + cache), explain-endpoint source assertions.
- [x] Docs: `agent` README retrieval contract. — plus practice/diagnostics/doubts + frontend READMEs.

### 2.2 Misconception detection + targeted remediation
**Modules:** `notebook` · `adaptive` · `agent` · `question` (`common_errors`)

- [ ] On each wrong answer, classify it against the question's `common_errors` (deterministic match first, LLM fallback).
- [ ] Store a per-user `misconception_hits` record (migration for a small table) keyed by (user, topic, misconception).
- [ ] Notebook concept groups surface the dominant misconception and a one-line targeted remedy.
- [ ] "Practice this misconception" generates a similar question on that exact gap (reuse generation worker).
- [ ] Tests: classification accuracy on fixtures; remediation payload.
- [ ] Docs: `notebook` README + migration.

### 2.3 On-demand "similar question" generation
**Modules:** `adaptive` generation worker · `agent` · frontend practice/review

- [ ] Endpoint `POST /api/learning/sessions/:id/items/:itemId/similar` (and a practice variant) that generates one isomorphic question.
- [ ] Generation grounded in the source question's concept tags + difficulty, not the answer key.
- [ ] Frontend: "Try a similar one" button after a wrong answer / on review.
- [ ] Rate-limit per user; cache by source-hash to bound cost.
- [ ] Tests: generation prompt shape; rate-limit; fallback.
- [ ] Docs: `adaptive` README.

### 2.4 Modern spaced repetition (FSRS)
**Modules:** `adaptive` flashcard review

- [ ] Replace the basic schedule with FSRS parameters (stability/difficulty/retrievability) per card.
- [ ] Migration to add FSRS columns to `flashcard_reviews`.
- [ ] Review endpoint returns the next review date from FSRS; rating updates it.
- [ ] Tests: FSRS next-date math over a fixture history.
- [ ] Docs: `adaptive` README flashcard section.

### 2.5 AI auto-tagging + review pipeline for admins
**Modules:** `questions` admin review · `agent`

- [ ] On candidate generation, auto-suggest `concept_tags`, `bloom_level`, `difficulty`, `marks`, `common_errors` for the reviewer to confirm.
- [ ] Reviewer UI shows AI-suggested tags as pre-filled, editable.
- [ ] Tests: tagger prompt shape; suggestions never auto-publish.
- [ ] Docs: `questions` README (admin flow).

### 2.6 Photo-to-question (OCR + solve/match)
**Modules:** new `vision`/OCR path in `agent` · `doubts` · frontend upload

- [ ] Accept an image upload; OCR (model or service) to text.
- [ ] Either solve step-by-step or match to a practice question; return a tutor explanation.
- [ ] Frontend: upload/camera control on the doubts page.
- [ ] Fallback: if OCR fails, ask the user to type the question.
- [ ] Tests: OCR mock + match; error handling.
- [ ] Docs: new module README.

### Phase 2 exit criteria
- [ ] Tutor and doubt answers are grounded with citations.
- [ ] Misconceptions are detected and drive targeted practice.
- [ ] Learners can request a similar question on demand.
- [ ] Flashcards use FSRS; admins get AI tag suggestions.
- [ ] Photo-to-question available on doubts.
- [ ] All features have tests + module READMEs.

---

## Phase 3 — Strategic (big, new capability)

Goal: the differentiators that make this a true AI-first assessment + tutoring
platform. Higher effort, sequenced after Phases 1–2 give a solid base.

### 3.1 Probabilistic knowledge tracing (BKT/DKT/IRT)
**Modules:** new `knowledge-tracing` service · `adaptive` (competency) · `diagnostics` analysis

- [ ] New `KnowledgeTracingService` estimating per-skill mastery probability from answer history (start with BKT — interpretable, low-data).
- [ ] Migration for a `skill_mastery` table (per user × skill: probability, last-updated).
- [ ] Replace the heuristic weak-topic threshold with low-confidence skills; analysis page shows mastery % with a confidence band.
- [ ] Adaptive engine consumes mastery probability for level decisions (replaces/augments the accuracy gate).
- [ ] Tests: BKT update math; small-sample behaviour vs classical %.
- [ ] Docs: new `knowledge-tracing` README; update `adaptive`/`diagnostics`.

### 3.2 Unified persistent tutor with long-term memory
**Modules:** `agent` · `doubts` · `adaptive` tutor · `notebook`

- [ ] One `TutorMemoryService` holding a compact running profile (weak topics, recent mistakes, mastery) per learner.
- [ ] All tutor/doubt prompts include this memory; the tutor references cross-surface history ("you've missed flux three times").
- [ ] Frontend: a persistent tutor entry point accessible from any tab.
- [ ] Privacy: memory derived from learner data only; no PII to the model.
- [ ] Tests: memory assembly; prompt includes memory; truncation/safety.
- [ ] Docs: `agent` README memory contract.

### 3.3 AI-graded free-response / numerical JEE answers
**Modules:** `question` entity (answer format) · `practice`/`diagnostics` grading · `agent`

- [ ] Extend `Question` answer model: `answer_type` (MCQ | NUMERICAL | INTEGER | SHORT) + `accepted_answers`/tolerance.
- [ ] Grading: deterministic for numerical/integer (range/tolerance); LLM grade-then-verify for short symbolic, with a verification guardrail.
- [ ] Frontend: numerical/short-input UI for practice & tests.
- [ ] Tests: numerical grader; LLM grader with verify-stub; anti-hallucination guard.
- [ ] Docs: `question`/`practice`/`diagnostics` READMEs + migration.

### 3.4 Personalized next-best-action sequencing
**Modules:** new `planner` service · `topics` prerequisite graph · `adaptive` competency

- [ ] `PlannerService` computes "what to study next" from mastery probabilities + prerequisite graph + goal (exam date).
- [ ] Endpoint `GET /api/learning/plan` returns a prioritized daily/weekly plan.
- [ ] Frontend: a "Today" plan card on the dashboard + learn workspace.
- [ ] Tests: plan respects prerequisites; prioritizes low-mastery skills.
- [ ] Docs: new `planner` README.

### 3.5 Generative content from uploaded material (PDF/notes)
**Modules:** `agent` (RAG + generation) · `questions` admin

- [ ] Admin uploads notes/PDF; chunk + embed into Qdrant under a source tag.
- [ ] Generate reviewed question candidates + flashcards grounded in that material.
- [ ] Tests: chunking/embedding mock; generation grounded in chunks.
- [ ] Docs: `questions`/`agent` READMEs.

### Phase 3 exit criteria
- [ ] Mastery is a probability with a confidence band, driving the engine.
- [ ] One tutor remembers the learner across all surfaces.
- [ ] Numerical/short JEE answers are gradeable.
- [ ] A personalized plan sequences study.
- [ ] Content can be generated from uploaded material.
- [ ] All features tested + documented; migrations included.

---

## Cross-cutting rules (every phase, every feature)

- [ ] **LLM boundary:** all model calls go through `AgentService` (AGENTS.md §4); no direct LLM use in modules.
- [ ] **Fallback-first:** every AI feature degrades to a deterministic path if the model/vector DB is unavailable.
- [ ] **No mock data:** AI outputs are persisted via backend endpoints; nothing is faked in the frontend (AGENTS.md §8).
- [ ] **Migrations:** every schema change is a TypeORM migration; `synchronize` stays off (AGENTS.md §2).
- [ ] **Tests:** each feature ships unit/integration tests (AGENTS.md §5).
- [ ] **Docs:** each affected module README is updated; endpoints added to the backend API reference + Swagger tags.
- [ ] **Cost/latency guard:** generation is bounded (max tokens, cache, rate limits) and never blocks the request path unless unavoidable (doubts already async).
- [ ] **Security:** no answer keys in student-facing prompts before reveal; inputs validated/sanitised.

---

## Master checklist (phase completion)

### Phase 1 — Quick wins ✅
- [x] 1.1 One-tap explain/hint on review & practice
- [x] 1.2 AI test recap on analysis
- [x] 1.3 Explanation depth toggle
- [x] 1.4 Confidence calibration
- [x] 1.5 Guessing detection

### Phase 2 — Integratable
- [x] 2.1 RAG-grounded explanations + citations
- [ ] 2.2 Misconception detection + remediation
- [ ] 2.3 On-demand similar question
- [ ] 2.4 FSRS spaced repetition
- [ ] 2.5 Admin AI auto-tagging pipeline
- [ ] 2.6 Photo-to-question (OCR + solve)

### Phase 3 — Strategic
- [ ] 3.1 Probabilistic knowledge tracing
- [ ] 3.2 Unified persistent tutor
- [ ] 3.3 Free-response / numerical grading
- [ ] 3.4 Personalized next-best-action planner
- [ ] 3.5 Generative content from uploads

---

## Suggested execution order within phases

1. **Phase 1 first** — all five are low-risk and immediately make the existing
   surfaces feel AI-native. Start with 1.1 + 1.2 (they touch the pages just
   built) and 1.4 (captures useful data early for Phase 3).
2. **Phase 2** — 2.1 (RAG) and 2.2 (misconception) together give the biggest
   "personalised intelligence" lift per effort; then 2.3 and 2.4 for daily
   stickiness; 2.5/2.6 when content scale and mobile input matter.
3. **Phase 3** — 3.1 (knowledge tracing) is the strategic core that makes the
   whole "assess the level" promise true and feeds 3.4 (planner); 3.2 unifies
   the tutor; 3.3 unlocks real JEE question types; 3.5 scales content.

> Sequencing rationale: Phase 1 captures confidence/guess data that Phase 3.1
> needs; Phase 2.1 grounds everything for 3.2 and 3.5; Phase 3.1 feeds 3.4. Build
> the cheap data-capture first, the intelligence second, the strategic models
> last.