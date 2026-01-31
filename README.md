# CareBridge AI

AI-powered healthcare companion for patient check-ins, risk assessment, and provider dashboards.

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Create .env file with your OpenAI API key
echo "OPENAI_API_KEY=sk-your-key-here" > .env

# Seed the database (already done if you ran setup)
npm run db:seed

# Start the server
npm run dev
```

Backend runs on **http://localhost:3001**

### 2. Frontend Setup

```bash
cd frontend

# Start the dev server
npm run dev
```

Frontend runs on **http://localhost:5173**

## Demo Patients

The database is seeded with three demo patients:

| Patient | Age | Risk Level | Scenario |
|---------|-----|------------|----------|
| Maria Rodriguez | 67 | HIGH | Diabetic with chest tightness |
| James Chen | 34 | MEDIUM | Anxiety and sleep issues |
| Sarah Thompson | 28 | LOW | Routine check-in |

## Project Structure

```
Spark/
├── frontend/          # Vite + React 19 + TypeScript
│   ├── src/
│   │   ├── pages/     # Route pages
│   │   ├── components/# Reusable UI components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── stores/    # Zustand state
│   │   └── lib/       # Utilities
│
└── backend/           # Hono + SQLite + OpenAI
    └── src/
        ├── routes/    # API endpoints
        ├── db/        # Database schema & seed
        └── lib/       # Business logic
```

## Tech Stack

- **Frontend**: Vite 7, React 19, TypeScript, Tailwind CSS, Zustand
- **Backend**: Hono, SQLite, Drizzle ORM, OpenAI API
- **AI**: GPT-4o-mini for chat, keyword-based risk assessment

## Features

- Patient AI chat with streaming responses
- Automated risk detection and alerts
- Visual health timeline
- Decision graph showing AI reasoning
- Provider dashboard with patient overview
