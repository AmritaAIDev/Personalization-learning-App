# Dashboard Routing Module

## Purpose
This module `(dashboard)` contains the authenticated core UI structure of the application. It acts as the structural base for the student user journey.

## Key Components
- **layout.tsx**: Defines the persistent `Sidebar` and the global ChatPress light-themed layout (grid backgrounds, max-widths). It prevents the sidebar from showing up on unauthenticated pages like `/login`.
- **page.tsx (Overview)**: The home screen prompting the user to take a baseline diagnostic test or resume learning.
- **topics/page.tsx**: The Syllabus grid where the student can browse subjects and view their current mastery score.
- **arena/page.tsx**: The immersive "Agentic Engine" view where dynamic DeepSeek questions are rendered and the Tutor Panel intervenes on failures.
- **analytics/page.tsx**: The historical log of past performance.

## Interaction
This module imports shared components from `src/components/` (like the Sidebar). It will eventually make REST calls to the NestJS backend to populate the dynamic content in these pages.
