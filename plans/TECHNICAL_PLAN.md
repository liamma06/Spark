---
name: CareBridge Technical Plan
overview: "2-Day Hackathon MVP"
todos: []
---

# CareBridge AI - Hackathon Implementation Plan (2 Days)

## Philosophy: Ship Fast, Demo Well

- **No auth** - use hardcoded demo users (patient + provider view toggle)
- **SQLite + JSON files** - no database setup overhead
- **Direct OpenAI calls** - skip LangChain abstraction
- **Mock data ready** - seed impressive demo scenarios

---

## Current Project Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | Vite 7 + React 19 | Already configured with React Compiler |
| Language | TypeScript 5.9 | Strict mode enabled |
| Backend | Hono (lightweight) | Add to `/backend` folder |
| Database | SQLite + Drizzle | Zero config, type-safe |
| AI | OpenAI SDK | Direct calls, simple streaming |
| Styling | Tailwind + shadcn/ui | Add to existing frontend |
| Routing | React Router | Client-side routing |
| State | Zustand | Minimal boilerplate |

---

## Project File Structure

```
Spark/
├── frontend/                        # Existing Vite + React app
│   ├── src/
│   │   ├── main.tsx                 # Entry point
│   │   ├── App.tsx                  # Router setup
│   │   ├── pages/
│   │   │   ├── Home.tsx             # Landing / role selector
│   │   │   ├── patient/
│   │   │   │   ├── Dashboard.tsx    # Patient home
│   │   │   │   └── Chat.tsx         # AI companion chat
│   │   │   └── provider/
│   │   │       ├── Dashboard.tsx    # Provider home + alerts
│   │   │       └── PatientDetail.tsx # Timeline + graph view
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn components
│   │   │   ├── Chat.tsx             # AI chat interface
│   │   │   ├── Timeline.tsx         # Visual timeline
│   │   │   ├── DecisionGraph.tsx    # Risk explanation graph
│   │   │   ├── AlertCard.tsx        # Provider alert display
│   │   │   └── PatientCard.tsx      # Patient summary card
│   │   │
│   │   ├── hooks/
│   │   │   ├── useChat.ts           # Chat state + streaming
│   │   │   └── usePatients.ts       # Patient data fetching
│   │   │
│   │   ├── stores/
│   │   │   └── appStore.ts          # Zustand global state
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts               # Backend API client
│   │   │   └── utils.ts             # Helper functions
│   │   │
│   │   ├── types/
│   │   │   └── index.ts             # Shared types
│   │   │
│   │   └── index.css                # Tailwind imports
│   │
│   ├── package.json                 # Existing config
│   ├── vite.config.ts               # Already has React Compiler
│   └── tailwind.config.js           # Add this
│
├── backend/                         # New - lightweight API server
│   ├── src/
│   │   ├── index.ts                 # Hono server entry
│   │   ├── routes/
│   │   │   ├── chat.ts              # AI streaming endpoint
│   │   │   ├── patients.ts          # Patient CRUD
│   │   │   ├── timeline.ts          # Timeline events
│   │   │   └── alerts.ts            # Risk alerts
│   │   │
│   │   ├── db/
│   │   │   ├── schema.ts            # Drizzle schema
│   │   │   ├── client.ts            # DB connection
│   │   │   └── seed.ts              # Demo data
│   │   │
│   │   └── lib/
│   │       ├── ai.ts                # OpenAI config + prompts
│   │       └── risk.ts              # Risk scoring logic
│   │
│   ├── package.json
│   └── drizzle.config.ts
│
├── .cursor/plans/                   # Planning docs
└── PLAN.md                          # Project overview
```

---

## Database Schema (Drizzle + SQLite)

```typescript
// backend/src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const patients = sqliteTable('patients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  conditions: text('conditions'),        // JSON string
  riskLevel: text('risk_level').default('low'), // low, medium, high
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').references(() => patients.id),
  role: text('role').notNull(),          // user, assistant
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

export const timelineEvents = sqliteTable('timeline_events', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').references(() => patients.id),
  type: text('type').notNull(),          // symptom, appointment, medication, alert
  title: text('title').notNull(),
  details: text('details'),              // JSON string
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

export const alerts = sqliteTable('alerts', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').references(() => patients.id),
  severity: text('severity').notNull(),  // warning, critical
  message: text('message').notNull(),
  reasoning: text('reasoning'),          // AI explanation
  acknowledged: integer('acknowledged', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});
```

---

## Core Flow (Simplified)

```mermaid
flowchart LR
    subgraph patient_view [Patient View]
        A[Chat with AI]
    end
    
    subgraph backend [API Routes]
        B["/api/chat"]
        C[Risk Check]
    end
    
    subgraph provider_view [Provider View]  
        D[Alert Dashboard]
        E[Patient Timeline]
        F[Decision Graph]
    end
    
    A -->|Stream| B
    B -->|Assess| C
    C -->|If High Risk| D
    B -->|Log| E
    C -->|Explain| F
```

---

## 2-Day Sprint Plan

### Day 1: Core MVP (Hours 1-10)

**Hour 1-2: Project Setup**
```bash
# Frontend (in existing frontend/)
npm install tailwindcss @tailwindcss/vite react-router-dom zustand
npx shadcn@latest init

# Backend (create new backend/)
mkdir backend && cd backend
npm init -y
npm install hono @hono/node-server openai drizzle-orm better-sqlite3
npm install -D tsx drizzle-kit @types/better-sqlite3
```
- Configure Tailwind in vite.config.ts
- Setup Drizzle schema + seed mock data
- Create Hono server with CORS

**Hour 3-4: AI Chat (The Hero Feature)**
- `backend/src/routes/chat.ts` - streaming endpoint
- System prompt for empathetic care companion
- `frontend/src/components/Chat.tsx` with message history
- Auto-extract symptoms and log to timeline

**Hour 5-6: Patient View**
- React Router setup with patient routes
- Simple dashboard showing recent activity
- Chat page with full conversation UI
- Basic timeline view of their events

**Hour 7-8: Provider View**
- Dashboard with patient list + risk indicators
- Alert cards with acknowledge button
- Click-through to patient detail

**Hour 9-10: Timeline Component**
- Visual timeline with icons per event type
- Filterable by type (symptoms, appointments, alerts)
- Color-coded by severity

### Day 2: Differentiators + Polish (Hours 11-20)

**Hour 11-13: Decision Graph (Wow Factor)**
- Simple tree/flow visualization
- Shows: Symptom → Risk Factor → Recommendation
- Use React Flow or simple CSS flexbox tree

**Hour 14-15: Risk Engine**
- Keyword-based risk detection in chat
- Auto-generate alerts for concerning symptoms
- Add reasoning explanation to alerts

**Hour 16-17: Summary Packet**
- Single page view of patient for handoff
- Recent symptoms, timeline, AI recommendations
- "Print/Export" button (just window.print())

**Hour 18-20: Demo Polish**
- Seed compelling demo scenarios
- Add loading states and animations
- Mobile responsive tweaks
- Deploy: Frontend to Vercel, Backend to Railway/Render

---

## Key Code Snippets

### Backend: Hono Server Entry
```typescript
// backend/src/index.ts
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { chatRoutes } from './routes/chat';
import { patientRoutes } from './routes/patients';

const app = new Hono();

app.use('/*', cors({ origin: 'http://localhost:5173' }));
app.route('/api/chat', chatRoutes);
app.route('/api/patients', patientRoutes);

serve({ fetch: app.fetch, port: 3001 });
console.log('Backend running on http://localhost:3001');
```

### AI Chat Endpoint with Streaming
```typescript
// backend/src/routes/chat.ts
import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import OpenAI from 'openai';

const openai = new OpenAI();
export const chatRoutes = new Hono();

chatRoutes.post('/', async (c) => {
  const { messages, patientId } = await c.req.json();
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    stream: true,
    messages: [
      { role: 'system', content: 'You are a caring health companion. Be empathetic, ask clarifying questions about symptoms, and flag anything concerning.' },
      ...messages
    ],
  });

  return stream(c, async (stream) => {
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';
      await stream.write(content);
    }
  });
});
```

### Frontend: Chat Hook
```typescript
// frontend/src/hooks/useChat.ts
import { useState, useCallback } from 'react';

interface Message { role: 'user' | 'assistant'; content: string }

export function useChat(patientId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const res = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...messages, userMessage], patientId }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let assistantContent = '';

    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      assistantContent += decoder.decode(value);
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: assistantContent }
      ]);
    }
    setIsLoading(false);
  }, [messages, patientId]);

  return { messages, sendMessage, isLoading };
}
```

### Simple Risk Detection
```typescript
// lib/risk.ts
const HIGH_RISK_KEYWORDS = [
  'chest pain', 'difficulty breathing', 'severe',
  'unconscious', 'bleeding heavily', 'suicidal'
];

const MEDIUM_RISK_KEYWORDS = [
  'fever', 'persistent', 'worsening', 'dizzy',
  'nausea', 'can\'t sleep', 'anxiety'
];

export function assessRisk(message: string): 'low' | 'medium' | 'high' {
  const lower = message.toLowerCase();
  if (HIGH_RISK_KEYWORDS.some(k => lower.includes(k))) return 'high';
  if (MEDIUM_RISK_KEYWORDS.some(k => lower.includes(k))) return 'medium';
  return 'low';
}
```

---

## Demo Scenarios to Seed

1. **Maria, 67** - Diabetic with recent chest tightness → HIGH RISK demo
2. **James, 34** - Anxiety and sleep issues → MEDIUM RISK, shows follow-up
3. **Sarah, 28** - Routine check-in, mild headache → LOW RISK baseline

---

## Quick Wins for Judges

- [ ] Streaming AI responses (feels responsive)
- [ ] Color-coded risk levels (visual impact)
- [ ] Decision graph explaining "why" (transparency differentiator)
- [ ] Real-time alert appearing when patient reports concerning symptom
- [ ] Clean, medical-feeling UI (trust factor)

---

## Skip for Hackathon (Do Later)

- ~~Authentication~~ → Role toggle button in UI
- ~~Real database~~ → SQLite file is fine
- ~~Job queues~~ → Inline processing
- ~~Real-time WebSocket~~ → Just refetch/poll
- ~~PDF export~~ → Browser print (window.print())
- ~~Tests~~ → Demo manually
- ~~Mobile app~~ → Responsive web only
- ~~Docker~~ → Run locally with npm scripts

---

## Quick Start Commands

```bash
# Terminal 1 - Backend
cd backend
npm run dev          # Runs on :3001

# Terminal 2 - Frontend  
cd frontend
npm run dev          # Runs on :5173 (Vite)
```

## Environment Variables

```bash
# backend/.env
OPENAI_API_KEY=sk-...
DATABASE_URL=file:./dev.db
```

---

## Team Split (2 People)

**Person A - Frontend:**
- Pages + routing
- Chat UI component
- Timeline visualization
- Decision graph component

**Person B - Backend + AI:**
- Hono API routes
- Database schema + seed
- OpenAI integration
- Risk assessment logic

**Sync Points:**
- Hour 2: API contract (endpoints + types)
- Hour 6: Integration test
- Hour 12: Feature freeze, polish only