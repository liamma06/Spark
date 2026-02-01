# CareBridge AI

An AI-powered healthcare platform connecting patients with intelligent care companions and healthcare providers with comprehensive patient dashboards. Built for seamless health check-ins, real-time risk assessment, and data-driven clinical decision-making.

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase URL
- Supabase Key
- Cohere Key
- ElevenLabs Key

### 1. Backend Setup

see backend/.example.env
run 

```bash
cd backend

pip install -r requirements.txt

fastapi dev
```


### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend runs on **http://localhost:5173**



## Project Structure

```
Spark/
├── frontend/                    # React 19 + Vite + TypeScript
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx         # Sign-in page
│   │   │   ├── Signup.tsx       # Registration page
│   │   │   ├── patient/
│   │   │   │   ├── Dashboard.tsx# Patient home screen
│   │   │   │   └── Chat.tsx     # AI chat interface
│   │   │   └── provider/
│   │   │       ├── Dashboard.tsx# Provider patient overview
│   │   │       └── PatientDetail.tsx
│   │   ├── components/          # Reusable UI components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── stores/              # Zustand state management
│   │   ├── lib/                 # Utilities & helpers
│   │   └── types/               # TypeScript types
│   └── public/
│       └── Logo.png             # Brand logo
│
└── backend/                     # FASTAPI + Supabase
    └── src/
        ├── app/              # REST API endpoints
        ├── .env                  # Database schema & migrations
        ├── requirements.txt             # Business logic & AI integration
        └── main.py               # Server entry point
```

## Features

### Patient Interface
- **AI Care Companion**: Chat-based health assessment with streaming responses
- **Health Dashboard**: Quick access to health status and recent interactions
- **Call-based Check-ins**: Record symptoms and health updates via conversation
- **Summary Generation**: AI-powered health summaries from conversations

### Provider Interface
- **Patient Management**: Add and manage patient roster
- **Patient Dashboard**: View detailed patient information at a glance
  - Age, Address, and Active Conditions
  - Risk level assessment
  - Visual patient selection and filtering
- **Patient Timeline**: Chronological health event history
  - Symptoms, appointments, medications
  - Chat interactions and alerts
- **Sticky Sidebar**: Quick patient access with sticky positioning
- **Responsive Design**: Optimized for desktop workflows

## Tech Stack

### Frontend
- **Framework**: React 19 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router
- **HTTP Client**: Fetch API

### Backend
- **Framework**: FastAPI
- **Database**: Supabase with RLS and Row Based Access Control
- **AI Integration**: Cohere, Elevenlabs

### Infrastructure
- **Risk Assessment**: Keyword-based analysis with AI enhancement
- **Real-time Features**: Streaming chat responses
- **Data Privacy & Storage**: Supabase with persistent schema and RBAC to ensure user privacy.

## Core Functionality

### Patient Flow
1. User signs up/logs in with email and password
2. Selects role (Patient or Provider)
3. Patient accesses AI Care Companion
4. Chat interactions generate health summaries
5. Risk assessment triggers alerts for critical conditions

### Provider Flow
1. Provider logs in to dashboard
2. Views comprehensive patient list
3. Clicks patient to see:
   - Detailed patient statistics
   - Medical conditions and history
   - Complete health timeline
4. Manages patient roster with add/remove functionality

## Authentication

- Email/password based authentication
- Role-based access control (Patient vs Provider)
- Session management with secure cookies

## Responsive Design

- Mobile-first approach with Tailwind CSS
- Sticky sidebars for persistent navigation
- Two-column layout optimized for desktop workflows
- Graceful fallbacks for smaller screens

---

Made with ❤️ for Spark
