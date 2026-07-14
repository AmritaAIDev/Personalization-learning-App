# JEE Learning Platform - Frontend

This is the frontend application for the JEE Competency Diagnosis and Adaptive Learning Platform. It provides a highly visual, gamified, and responsive user interface for students.

## Technology Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS for utility-first styling.
- **Icons**: Lucide React.
- **UI Architecture**: Modular component design. Uses extensive custom glassmorphism, micro-animations, and dynamic data rendering to provide a premium SaaS look.

## Core Modules

### Dashboard (`/`)
Provides a high-level overview of the student's progress. It prominently features a "Resume Practice" call-to-action that dynamically points to the exact chapter the student needs to work on, along with a horizontal "Learning Journey" roadmap showing their path through the current subject.

### Gamified Syllabus (`/topics`)
An immersive "Skill Tree" view replacing a traditional table of contents.
- **Tier 1**: Hub view with dynamic Bento Box cards for Physics, Mathematics, and Chemistry.
- **Tier 2**: Winding vertical timelines mapping out chapters, showing locked, active, and completed statuses. Includes a global search bar for quick subtopic lookups.

### Arena (`/arena`)
*In development.* The core learning interface where students solve dynamic AI-generated questions and receive immediate, personalized feedback.

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.

*Note: Ensure the backend API is running on `http://localhost:4000` for dynamic data (Syllabus, User Profiles, etc.) to load correctly.*
