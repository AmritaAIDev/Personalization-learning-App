# Project Principles for AI Agents

Welcome to the JEE Competency Diagnosis and Adaptive Learning Assistant project. All AI agents working on this codebase must strictly adhere to the following principles:

## 1. Modular Architecture
- **Frontend (Next.js):** Keep components modular, reusable, and focused on a single responsibility. Avoid massive, monolithic pages. Extract logic into custom hooks and keep UI components dumb where possible.
- **Backend (NestJS):** Follow the standard NestJS modular architecture. Group related controllers, services, and entities into distinct modules (e.g., `QuestionsModule`, `CompetencyModule`, `UsersModule`).

## 2. Database & Migrations
- **Strict Migration Policy:** Do not use `synchronize: true` in production or for any structural schema changes once the initial prototyping phase is over. 
- Every change to a database entity must be accompanied by a proper TypeORM migration script.
- Always verify that migrations run successfully locally before committing.

## 3. Clean Code & Best Practices
- **Typescript First:** Use strict typing for both frontend and backend. Avoid `any` types. Define clear interfaces or DTOs for data passing between layers.
- **Environment Variables:** Never hardcode secrets, API keys, or database URLs in the code. Always use `.env` files and access them via proper config services.
- **Error Handling:** Implement robust error handling (e.g., try/catch blocks, NestJS exception filters). Do not let the app crash silently.

## 4. AI & External Integrations
- Interactions with external LLMs and Vector Databases (like Qdrant) should be isolated in dedicated services.
- Handle API rate limits and external service failures gracefully.

## 5. Testing Requirements
- **Comprehensive Testing:** For every new feature or module built, respective test files (unit/integration tests) MUST be created alongside the code.
- This ensures that future changes can be validated quickly without requiring a full manual rebuild or risking regressions.

## 6. Documentation
- **Module-Level Docs:** Maintain proper, up-to-date documentation (`README.md` or similar) inside every feature or module folder.
- Documentation should explain the module's purpose, its key components, and how it interacts with other parts of the system.

## 7. UI/UX & Component Design
- **Responsive & Flexible:** When building components and UI, they must be completely flexible. They should seamlessly adapt to screen sizes, ensuring no overlapping, overflowing, or underflowing of content.
- **Professional Aesthetics:** The UI must be professional, avoiding any visual bugs (no CSS issues) and adhering strictly to modern web design standards.

## 8. Data Strategy & Security (Production-Grade)
- **Data Fetching Strategy:** Always analyze the best method for data retrieval before implementing. Determine whether a specific feature requires direct database fetching (for real-time accuracy) or local browser-side caching (for performance).
- **Strictly No Static Mock Data:** Never hardcode static mock data directly in the frontend UI. Even during development/prototyping, data must be seeded into the actual database and fetched via proper backend API endpoints, simulating the exact flow of production data.
- **Security First:** Always build with industrial-grade security in mind. Ensure endpoints are properly secured, avoid exposing sensitive data to the client, and implement proper validation/sanitization for all inputs to prepare the application for a production environment.

By following these principles, we will ensure that the platform remains maintainable, scalable, and easy for any future AI agent or human developer to work on.
