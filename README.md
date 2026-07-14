# JEE Competency Diagnosis & Adaptive Learning Platform

Welcome to the JEE Competency Diagnosis and Adaptive Learning Assistant. This platform is an AI-powered, highly gamified learning application designed to help students master the JEE curriculum (Physics, Mathematics, and Chemistry) through adaptive micro-learning.

## Project Structure

This is a monorepo containing two main applications:

- **`/learning-platform-frontend`**: A Next.js application providing the gamified user interface (Dashboard, Syllabus Skill Trees, and the interactive learning Arena).
- **`/learning-platform-backend`**: A NestJS application handling business logic, user progress tracking, and AI-driven question generation using DeepSeek LLM and a Qdrant Vector Database.

## Features

- **Gamified Dashboard**: Visual learning journeys with real-time progress tracking, identifying exactly what topics need attention.
- **Immersive Syllabus Skill Trees**: A "Bento Box" hub that opens into a scrolling, video-game style skill tree mapping out chapters and subtopics for Physics, Math, and Chemistry.
- **Active Learning Arena (In-Progress)**: An adaptive quiz interface where an AI tutor generates dynamic questions based on the student's weaknesses.
- **AI-Driven Personalization**: Uses LLMs to generate high-quality JEE questions grounded in textbook context stored in a Vector DB (Qdrant).

## Getting Started

To run this platform locally, you will need to start both the frontend and backend servers.

### 1. Database Setup
Ensure you have PostgreSQL running. 
Navigate to the backend and run the seeder script to populate the curriculum and a mock student:
```bash
cd learning-platform-backend
npm run seed
```

### 2. Run the Backend
```bash
cd learning-platform-backend
npm run start:dev
```
The API will be available at `http://localhost:4000`.

### 3. Run the Frontend
```bash
cd learning-platform-frontend
npm run dev
```
The Web App will be available at `http://localhost:3000`.

## Architectural Principles
This codebase strictly adheres to modular architecture, robust error handling, and separation of concerns. Please refer to `AGENTS.md` for specific AI agent coding guidelines for this repository.
