---
name: Supabase integration by domain files
overview: Separate the backend into domain modules (patients, timeline, alerts, chat) that each use Supabase for persistence, following the pattern of [backend/app/doctors.py](backend/app/doctors.py). Main.py only wires routes; in-memory data is removed as each domain is moved to Supabase.
todos: []
isProject: false
---

# Separate backend into files while integrating Supabase

Goal: Integrate Supabase for patients, timeline, and alerts (and optionally chat messages) by splitting logic into one module per domain under `backend/app/`. Each module uses the Supabase client and the tables defined in [backend/DATABASE.md](backend/DATABASE.md). Main.py only registers routes and delegates to these modules; in-memory `patients_db`, `timeline_db`, and `alerts_db` are removed as each domain is moved.

---

## Pattern to follow

Same as [backend/app/doctors.py](backend/app/doctors.py):

- One file per domain (patients, timeline, alerts, chat).
- Each module imports `from app.supabase import supabase` and uses `supabase.table("...").select/insert/update/delete`.
- Functions raise `HTTPException` on not found or Supabase errors; return plain data (list, dict).
- Main.py imports from these modules and exposes thin route handlers only.

---

## 1. app/patients.py (new, Supabase)

**Table:** `public.patients` (id, user_id, name, age, conditions, risk_level, created_at, updated_at).

**Functions:**

- `get_patients() -> list` – `supabase.table("patients").select("*").execute()`; return `res.data` or `[]`.
- `get_patient(patient_id: str)` – select by id; if no row, raise 404 "Patient not found"; return row.
- `create_patient(user_id: str | None, name: str, age: int, conditions: list, risk_level: str)` – insert row, return created row (for post-signup or admin). Optional: handle duplicate user_id.
- `update_patient_risk(patient_id: str, risk_level: str)` – update risk_level for that id; optional, used by chat when risk is high.

**Main routes:** `GET /api/patients` → `patients.get_patients()`; `GET /api/patients/{id}` → `patients.get_patient(id)`. Optionally `POST /api/patients` → `patients.create_patient(...)`.

**Remove from main:** `patients_db` and any inline patient list/get logic. Keep doctor–patient link in doctors.py; doctors.py already queries `patients` by ids (can stay as-is or call `patients.get_patient` in a loop / add `get_patients_by_ids(ids)` in patients.py for efficiency).

---

## 2. app/timeline.py (new, Supabase)

**Table:** `public.timeline_events` (id, patient_id, type, title, details jsonb, created_at).

**Functions:**

- `get_timeline(patient_id: str | None) -> list` – if patient_id: select where patient_id; else select all. Return list of events.
- `add_event(patient_id: str, type: str, title: str, details: str | dict | None)` – insert one row (details as jsonb if dict). Return created row or void.

**Main routes:** `GET /api/timeline?patientId=...` → `timeline.get_timeline(patient_id)`.

**Remove from main:** `timeline_db`. Chat (or main) calls `timeline.add_event(patient_id, "chat", "AI conversation", details)` after a conversation.

---

## 3. app/alerts.py (new, Supabase)

**Table:** `public.alerts` (id, patient_id, severity, message, reasoning, acknowledged, created_at).

**Functions:**

- `get_alerts(patient_id: str | None) -> list` – if patient_id: select where patient_id; else select all. Return list.
- `acknowledge_alert(alert_id: str)` – update row set acknowledged=true where id=alert_id; if no row, raise 404; return updated row.
- `create_alert(patient_id: str, severity: str, message: str, reasoning: str | None)` – insert row. Return created row.

**Main routes:** `GET /api/alerts?patientId=...` → `alerts.get_alerts(patient_id)`; `POST /api/alerts/{alert_id}/acknowledge` → `alerts.acknowledge_alert(alert_id)`.

**Remove from main:** `alerts_db`. Chat calls `alerts.create_alert(...)` when risk is high; optionally call `patients.update_patient_risk(patient_id, "high")` in the same flow.

---

## 4. app/chat.py (new, Cohere + Supabase side effects)

**Owns:** Cohere client (from env), SYSTEM_PROMPT, risk keywords, `assess_risk(message) -> str`.

**Optional table:** `public.messages` – store each user/assistant message (patient_id, role, content, created_at). If you integrate: after streaming, insert user message and assistant message.

**Function:** `stream_chat(messages: list[dict], patient_id: str | None)` – async generator that:

1. Builds system prompt; if patient_id, fetches patient context via `patients.get_patient(patient_id)` (from app.patients) and appends to prompt.
2. Streams Cohere response, yields text chunks.
3. After stream: if patient_id, runs `assess_risk(last_user_message)`; if high, calls `alerts.create_alert(patient_id, "critical", message, reasoning)` and `patients.update_patient_risk(patient_id, "high")`; calls `timeline.add_event(patient_id, "chat", "AI conversation", details)`.
4. Optionally inserts into `public.messages` (user + assistant) via Supabase in this module or a small `app/messages.py`.

**Main:** `POST /api/chat` body → `ChatRequest`; return `StreamingResponse(chat.stream_chat(request.messages, request.patientId), media_type="text/plain")`. No Cohere or risk logic in main.

**Dependencies:** chat.py imports patients, timeline, alerts (and supabase if it writes messages). So implement patients, timeline, alerts first, then chat.

---

## 5. app/schemas.py (optional but recommended)

Move Pydantic models (ChatMessage, ChatRequest, CreateDoctorBody, PatientDoctorLink, etc.) from main into `app/schemas.py`. Main and route handlers import from schemas. Keeps main and other modules clean.

---

## 6. main.py after integration

- **Keep:** App creation, CORS, load_dotenv.
- **Remove:** `patients_db`, `timeline_db`, `alerts_db`, Cohere client, SYSTEM_PROMPT, risk constants, assess_risk, inline Pydantic models (if moved to schemas).
- **Imports:** app.supabase, app.doctors, app.patients, app.timeline, app.alerts, app.chat, app.schemas (if used).
- **Routes:** Only delegate to module functions (e.g. get_patients → patients.get_patients(), chat → StreamingResponse(chat.stream_chat(...))).

---

## 7. Order of implementation (while integrating Supabase)

1. **Supabase tables** – Ensure `public.patients`, `public.timeline_events`, `public.alerts` (and `public.messages` if you store chat) exist per [backend/DATABASE.md](backend/DATABASE.md). RLS: either disable for testing or use service_role key in backend.
2. **app/schemas.py** – Add and move request/response models from main; update main imports.
3. **app/patients.py** – Implement get_patients, get_patient, create_patient (and optionally update_patient_risk). Switch main’s patient routes to use these; remove patients_db from main.
4. **app/timeline.py** – Implement get_timeline, add_event. Switch main’s timeline route to use these; remove timeline_db from main.
5. **app/alerts.py** – Implement get_alerts, acknowledge_alert, create_alert. Switch main’s alert routes to use these; remove alerts_db from main.
6. **app/chat.py** – Move Cohere client, prompt, risk logic, and streaming into stream_chat; call patients.get_patient, alerts.create_alert, timeline.add_event, patients.update_patient_risk. Wire POST /api/chat to stream_chat; remove Cohere/risk/timeline/alert logic from main.

---

## 8. Dependency summary

- **main** → schemas, supabase, doctors, patients, timeline, alerts, chat.
- **chat** → patients, timeline, alerts (and supabase if writing messages).
- **patients, timeline, alerts, doctors** → supabase only (no app.* except supabase).

This keeps a clear separation: each domain lives in one file and talks to Supabase (and chat coordinates patients/timeline/alerts for post-stream side effects).