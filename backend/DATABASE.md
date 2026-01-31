# Supabase Database Schema & Integration Guide

This document describes the Supabase (PostgreSQL) schema used for the app and how to integrate it fully—auth, profiles, patients, doctors, chat, timeline, and alerts.

---

## 1. Overview

| Layer | Purpose |
|-------|--------|
| **auth.users** | Supabase Auth (email/password). You don't create this; signup creates rows here. |
| **public.profiles** | One row per user: `id = auth.uid()`, plus `full_name`, `role` (patient \| doctor). |
| **public.patients** | Clinical record per patient user (name, age, conditions, risk_level). Linked via `user_id` → `profiles.id`. |
| **public.doctors** | Optional extra info for doctor users (e.g. specialty). |
| **public.patient_doctors** | Which doctors can see which patients (care relationship). |
| **public.messages** | Chat messages per patient (user/assistant). |
| **public.timeline_events** | Events per patient (symptom, appointment, medication, alert, chat). |
| **public.alerts** | Risk alerts per patient (warning/critical, acknowledged). |

**Flow:** User signs up → row in `auth.users` → trigger inserts `public.profiles` → for patients you may insert `public.patients` and link doctors via `public.patient_doctors`.

---

## 2. Table Definitions

### 2.1 Profiles (one per auth user)

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null check (role in ('patient', 'doctor')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

- **id** = `auth.uid()` (same as Auth user).
- **full_name**, **role** come from signup metadata; trigger keeps them in sync.

### 2.2 Patients (clinical record; one per patient user)

```sql
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete cascade,
  name text not null,
  age int not null,
  conditions text[] default '{}',
  risk_level text default 'low' check (risk_level in ('low', 'medium', 'high')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

- **user_id** links to the profile (and thus auth user) that “is” this patient. One patient row per patient user.

### 2.3 Doctors (optional)

```sql
create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete cascade,
  specialty text,
  created_at timestamptz default now()
);
```

### 2.4 Patient–Doctor relationship

```sql
create table public.patient_doctors (
  patient_id uuid references public.patients(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete cascade,
  primary key (patient_id, doctor_id)
);
```

### 2.5 Messages (chat per patient)

```sql
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);
create index messages_patient_id on public.messages(patient_id);
```

### 2.6 Timeline events

```sql
create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  type text not null check (type in ('symptom', 'appointment', 'medication', 'alert', 'chat')),
  title text not null,
  details jsonb,
  created_at timestamptz default now()
);
create index timeline_events_patient_id on public.timeline_events(patient_id);
```

### 2.7 Alerts

```sql
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  severity text not null check (severity in ('warning', 'critical')),
  message text not null,
  reasoning text,
  acknowledged boolean default false,
  created_at timestamptz default now()
);
create index alerts_patient_id on public.alerts(patient_id);
```

---

## 3. Sync profile on signup (trigger)

Run this in **Supabase → SQL Editor** so every new auth user gets a profile with `full_name` and `role` from signup metadata.

**Function:**

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'patient')
  );
  return new;
end;
$$;
```

**Trigger:**

```sql
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Your signup must send metadata (e.g. in backend):

```python
supabase.auth.sign_up({
    "email": email,
    "password": password,
    "options": {
        "data": {
            "full_name": full_name,
            "role": role   # "patient" or "doctor"
        }
    }
})
```

---

## 4. Row Level Security (RLS)

Enable RLS and add policies so patients see only their own data and doctors only see assigned patients.

**Enable RLS on all public tables:**

```sql
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.doctors enable row level security;
alter table public.patient_doctors enable row level security;
alter table public.messages enable row level security;
alter table public.timeline_events enable row level security;
alter table public.alerts enable row level security;
```

**Profiles:** users read/update own row.

```sql
create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
-- Allow trigger to insert (runs as definer)
create policy "Allow insert for new user"
  on public.profiles for insert with check (auth.uid() = id);
```

**Patients:** patients read own row; doctors read assigned patients.

```sql
create policy "Patients can read own record"
  on public.patients for select using (auth.uid() = user_id);
create policy "Doctors can read assigned patients"
  on public.patients for select
  using (
    exists (
      select 1 from public.patient_doctors pd
      join public.doctors d on d.id = pd.doctor_id
      where d.user_id = auth.uid() and pd.patient_id = patients.id
    )
  );
```

**Doctors:** users read/insert own doctor row.

```sql
create policy "Doctors can read own record"
  on public.doctors for select using (auth.uid() = user_id);
create policy "Doctors can insert own record"
  on public.doctors for insert with check (auth.uid() = user_id);
```

**patient_doctors:** doctors manage links for their patients.

```sql
create policy "Doctors can read patient_doctors for their patients"
  on public.patient_doctors for select
  using (
    exists (
      select 1 from public.doctors d
      where d.user_id = auth.uid() and d.id = patient_doctors.doctor_id
    )
  );
create policy "Doctors can insert patient_doctors"
  on public.patient_doctors for insert
  with check (
    exists (select 1 from public.doctors d where d.user_id = auth.uid() and d.id = doctor_id)
  );
```

**Messages, timeline_events, alerts:** patient sees own; doctor sees for assigned patients.

```sql
-- Messages
create policy "Patients can read own messages"
  on public.messages for select
  using (
    exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid())
  );
create policy "Doctors can read messages for assigned patients"
  on public.messages for select
  using (
    exists (
      select 1 from public.patient_doctors pd
      join public.doctors d on d.id = pd.doctor_id
      where d.user_id = auth.uid() and pd.patient_id = messages.patient_id
    )
  );
create policy "Patients can insert own messages"
  on public.messages for insert
  with check (
    exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid())
  );

-- Timeline events (same pattern)
create policy "Patients can read own timeline_events"
  on public.timeline_events for select
  using (
    exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid())
  );
create policy "Doctors can read timeline_events for assigned patients"
  on public.timeline_events for select
  using (
    exists (
      select 1 from public.patient_doctors pd
      join public.doctors d on d.id = pd.doctor_id
      where d.user_id = auth.uid() and pd.patient_id = timeline_events.patient_id
    )
  );

-- Alerts (same pattern)
create policy "Patients can read own alerts"
  on public.alerts for select
  using (
    exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid())
  );
create policy "Doctors can read and update alerts for assigned patients"
  on public.alerts for select
  using (
    exists (
      select 1 from public.patient_doctors pd
      join public.doctors d on d.id = pd.doctor_id
      where d.user_id = auth.uid() and pd.patient_id = alerts.patient_id
    )
  );
create policy "Doctors can update acknowledged on alerts"
  on public.alerts for update
  using (
    exists (
      select 1 from public.patient_doctors pd
      join public.doctors d on d.id = pd.doctor_id
      where d.user_id = auth.uid() and pd.patient_id = alerts.patient_id
    )
  );
```

Adjust `insert`/`update` policies for messages and timeline_events if your app writes from the backend with the service role (then you may not need client insert policies for those).

---

## 5. Backfill existing users

If you had auth users **before** the trigger existed, they won’t have a profile. Run once:

**Backfill profiles:**

```sql
insert into public.profiles (id, full_name, role)
select
  id,
  coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email),
  coalesce(raw_user_meta_data->>'role', 'patient')
from auth.users
where id not in (select id from public.profiles);
```

**Optionally create patient rows for every profile with role = patient:**

```sql
insert into public.patients (user_id, name, age, conditions, risk_level)
select
  p.id,
  coalesce(p.full_name, 'Patient'),
  0,
  '{}',
  'low'
from public.profiles p
where p.role = 'patient'
  and not exists (select 1 from public.patients pt where pt.user_id = p.id);
```

---

## 6. How to use in the app

### 6.1 After signup (backend)

- Sign up with `options.data.full_name` and `options.data.role` (see section 3).
- Trigger creates `public.profiles`.
- For **patients**, you can:
  - Create a row in `public.patients` with `user_id = auth.uid()` and name/age/conditions/risk_level (e.g. from a post-signup form or default values).

### 6.2 After sign-in (frontend/backend)

- Get current user: `supabase.auth.getUser()` or session.
- **Profile:** `supabase.from('profiles').select('*').eq('id', user.id).single()`.
- **Patient record (if patient):** `supabase.from('patients').select('*').eq('user_id', user.id).single()`.
- **Doctor record (if doctor):** `supabase.from('doctors').select('*').eq('user_id', user.id).single()`.
- **Patients list (for doctor):** join `patient_doctors` and `patients` where `doctor_id = doctors.id`.

### 6.3 Chat, timeline, alerts

- All keyed by `patient_id` (the UUID from `public.patients`).
- Patient: use `patient_id` from their `patients` row.
- Doctor: use `patient_id` only for patients linked in `patient_doctors`.

---

## 7. Integration checklist

Use this so new developers can integrate fully:

- [ ] **Supabase project:** Create project; get `SUPABASE_URL` and `SUPABASE_KEY` (anon) in `.env`.
- [ ] **Tables:** Run the `create table` statements from section 2 in SQL Editor (in order: profiles → patients → doctors → patient_doctors → messages → timeline_events → alerts).
- [ ] **Trigger:** Create `handle_new_user()` and trigger `on_auth_user_created` (section 3).
- [ ] **RLS:** Enable RLS and add policies from section 4.
- [ ] **Backfill:** If you have existing auth users, run the backfill SQL from section 5.
- [ ] **Signup:** Ensure signup sends `full_name` and `role` in `options.data` (section 3).
- [ ] **Patient row:** After a patient signs up, create a row in `public.patients` with `user_id = auth.uid()` (or use the bulk backfill once).
- [ ] **Doctor assignment:** When a doctor should see a patient, insert into `patient_doctors(patient_id, doctor_id)`.
- [ ] **Queries:** Use `auth.uid()` and RLS so patients see only their data and doctors only assigned patients.

---

## 8. Env and keys

- **SUPABASE_URL** – Project URL (e.g. `https://xxxx.supabase.co`).
- **SUPABASE_KEY** – Anon key for client-side; use service role only on the server if you need to bypass RLS (e.g. for admin or background jobs).

Keep the service role key secret and never expose it in the frontend.
