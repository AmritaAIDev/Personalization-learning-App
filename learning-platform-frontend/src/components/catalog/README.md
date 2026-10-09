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

## Not here yet

- **Bloom tab and per-subject analytics link**: arrive with Phase 4.
- **Cross-links** from the dashboard subject cards, search results and the
  command palette: Phase 5.

## Tests

`npm test` in the frontend: `lib/catalog.test.ts` (helpers) and
`components/catalog/catalog-components.test.tsx` (jsdom: unit tabs keyboard
behaviour, chapter tabs, no-guide and no-topics fallbacks).
