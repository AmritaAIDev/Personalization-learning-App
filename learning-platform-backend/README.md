# JEE Learning Platform - Backend API

This is the backend server for the JEE Competency Diagnosis and Adaptive Learning Platform. It serves as the data persistence layer, API gateway, and the brain behind the AI question generation.

## Technology Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **AI Integrations**: 
  - **OpenAI SDK** (configured for DeepSeek LLM for reasoning and question generation).
  - **Qdrant Vector Database** (for storing and retrieving textbook context to ground the LLM's responses, minimizing hallucinations).

## Core Modules

- **UsersModule**: Manages student profiles and auth metadata.
- **TopicsModule**: Manages the deep hierarchical syllabus structure (Subjects -> Chapters -> Subtopics).
- **SessionsModule**: Manages `TestSession` records, tracking student scores and completion status. It includes complex business logic (e.g., `SessionsService`) to dynamically compute and return Gamified Journey Maps and Skill Tree payloads for the frontend.
- **QuestionsModule / AgentModule**: Exposes endpoints to trigger the AI Agent. The Agent queries Qdrant for context, then prompts DeepSeek to generate a dynamic, JSON-structured multiple-choice question.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Database Setup:
   Ensure you have a local PostgreSQL instance running. You can configure your database URL in the `.env` file (or `app.module.ts` for prototyping).
   
   To seed the database with mock students and the entire Physics, Math, and Chemistry syllabus hierarchy, run:
   ```bash
   npm run seed
   ```

3. Start the server:
   ```bash
   npm run start:dev
   ```
   The API will listen on `http://localhost:4000`.

## Best Practices
- Every structural database change requires a proper TypeORM migration. Do not rely on `synchronize: true` in production.
- Keep controllers thin. Heavy logic (like assembling the journey map) should be isolated in Services.
