# Catalog components (Subjects and Chapter screens)

Phase 3 of the JEE Compass adoption plan (`docs/JEE-COMPASS-ADOPTION-PLAN.md`).
These components render the **browse view** of the syllabus: every subject,
its chapters grouped by unit, and a chapter hub with the study guide. The
guided, recommended path stays in `/journey`; the two link to each other.

## Routes

| Route | Page | Data |
|---|---|---|
| `/subjects` | three subject cards | `GET /api/catalog/subjects` |
| `/subjects/[subject]` | banner, unit tabs, chapter grid | `GET /api/catalog/subjects/:subject/chapters` |
| `/subjects/[subject]/[chapter]` | hero, stats, actions, study-guide tabs | `GET /api/catalog/subjects/:subject/chapters/:chapter` |

All data comes from the backend `CatalogModule` (see
`learning-platform-backend/src/catalog/README.md`); nothing here is hard-coded.
Slugs are case-insensitive. An unknown subject or chapter shows a "couldn't
find that" state with a way back, not a blank page.

## Layout of the code

| File | Role |
|---|---|
| `lib/catalog-types.ts` | API payload types (mirror the backend). |
| `lib/catalog.ts` | Pure helpers: hrefs, status/tone maps, unit filter, subject stats, `pickFocusTopic`. Unit-tested. |
| `lib/useCatalog.ts` | `useCatalogSubjects`, `useSubjectChapters`, `useChapterDetail`; wrap `useApiResource` and refresh in the background on `LEARNING_DATA_UPDATED_EVENT`. |
| `SubjectCard`, `SubjectBanner` | Subject list card and subject page header. |
| `UnitFilterTabs` | Scrollable roving-tabindex tablist (arrow keys, Home/End). |
| `ChapterCard` | One chapter; the whole card is a single link. |
| `ChapterHero`, `ChapterStatTiles`, `ChapterActions`, `ChapterTabs` | Chapter hub sections. |
| `ProgressRing`, `ChapterStatusPill`, `Breadcrumb`, `CatalogState` | Shared small pieces (loading skeleton, error/not-found). |

## Behaviour worth knowing

- **Actions reuse the adaptive engine.** `ChapterActions` opens `/learn` on the
  chapter's most useful topic (`pickFocusTopic`: weakest active, else next
  untouched, else paused, else first) with the Practice or Flashcards tab.
  The catalog never duplicates learning UI.
- **Study guide fallback.** A chapter whose guide is not published still
  renders fully (topics, progress, actions); the Overview, Objectives and
  Formulas tabs explain that the guide is being prepared.
- **Pages are keyed by slug** so moving between chapters never shows the
  previous chapter's data while the next one loads.
- **Responsive and accessible.** Fluid grids (1/2/3 columns), `min-w-0` and
  truncation on every text slot, unit tabs scroll inside their own row,
  44px-class touch targets, `motion-reduce` respected, proper `tablist`/`tab`/
  `tabpanel` roles, `progressbar` roles with values, light and dark via tokens.

## Analytics (Phase 4)

`/subjects/[subject]/analytics` renders `SubjectAnalyticsView`: a banner with the
Compass mastery level (stars and "x% more to reach the next level"), four
headline numbers, and four tabs (Overview, Bloom's taxonomy, Chapters, Topics).
The chapter page gains a **Bloom's taxonomy** tab and an **Analytics** action.

| Component | Role |
|---|---|
| `Tabs` | Shared accessible tablist; only the active panel mounts, so the chapter Bloom tab fetches on first open. |
| `BloomPanel` | Four level cards (accuracy, band, mastery stars), skill radar and insight cards. |
| `SkillCards`, `InsightCards` | Compass's skill cards with tips and its four insight cards. |
| `RadarChart`, `TrendChart` | Dependency-free SVG charts in the app tokens; missing data is a dash or an empty slot, never a fake 0%. |
| `MasteryStars` | Compass mastery level; renders nothing for a student with no answers. |

All scoring rules (status bands, mastery levels, Bloom bands, tips) live in the
backend and are documented in `learning-platform-backend/src/catalog/README.md`;
the frontend only displays what the API returns.

## Aliased chapters

Some chapters (Electrostatics) hold questions tagged with another chapter name
("Electric Charges and Fields"). The API folds them together; each topic carries
a `scopeChapter`, the name its questions are tagged with. **Every link into
`/learn` from the catalog must use `topic.scopeChapter`, not the chapter's
display name**, because the learning engine matches questions by that exact
name (`ChapterActions`, the Topics tab and the analytics topic lists do). Links
by display name (`ChapterLink`, the workspace breadcrumb) still resolve, since
the API also accepts the content-side slug.

## Not here yet

- **Cross-links** from the dashboard subject cards, search results and the
  command palette: Phase 5.

## Tests

`npm test` in the frontend: `lib/catalog.test.ts` (helpers) and
`components/catalog/catalog-components.test.tsx` (jsdom: unit tabs keyboard
behaviour, chapter tabs, no-guide and no-topics fallbacks).
