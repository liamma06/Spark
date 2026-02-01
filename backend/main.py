import logging
import os
from datetime import datetime
from typing import Optional

from app.alerts import acknowledge_alert as alerts_acknowledge_alert
from app.alerts import create_alert as alerts_create_alert
from app.alerts import get_alerts as alerts_get_alerts
from app.cohere_chat import (
    assess_risk,
    generate_summary,
    get_system_prompt,
    stream_chat,
)
from app.doctors import connect_patient_doctor as doctors_connect
from app.doctors import create_doctor as doctors_create
from app.doctors import disconnect_patient_doctor as doctors_disconnect
from app.doctors import get_my_patients as doctors_get_my_patients
from app.doctors import get_patient_doctors as doctors_get_patient_doctors
from app.patients import create_patient as patients_create
from app.patients import get_patient as patients_get_patient
from app.patients import get_patients as patients_get_patients
from app.patients import search_patients_by_name as patients_search_by_name
from app.supabase import get_current_user as auth_get_current_user
from app.supabase import sign_in as auth_sign_in
from app.supabase import sign_out as auth_sign_out
from app.supabase import sign_up as auth_sign_up
from app.timeline import add_event as timeline_add_event
from app.timeline import delete_event as timeline_delete_event
from app.timeline import get_timeline as timeline_get_timeline
from app.tts import handle_tts_request
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, StreamingResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from app.supabase import (
    sign_up as auth_sign_up,
    sign_in as auth_sign_in,
    sign_out as auth_sign_out,
    get_current_user as auth_get_current_user,
)
from app.cohere_chat import get_system_prompt, assess_risk, stream_chat, generate_summary
from app.tts import handle_tts_request
from app.doctors import (
    create_doctor as doctors_create,
    get_my_patients as doctors_get_my_patients,
    get_patient_doctors as doctors_get_patient_doctors,
    connect_patient_doctor as doctors_connect,
    disconnect_patient_doctor as doctors_disconnect,
)
from app.patients import (
    get_patients as patients_get_patients,
    get_patient as patients_get_patient,
    search_patients_by_name as patients_search_by_name,
    create_patient as patients_create,
    update_patient_risk as patients_update_risk,
)
from app.alerts import (
    get_alerts as alerts_get_alerts,
    acknowledge_alert as alerts_acknowledge_alert,
    create_alert as alerts_create_alert,
)

from app.timeline import (
    get_timeline as timeline_get_timeline,
    add_event as timeline_add_event,
    delete_event as timeline_delete_event,
)

# Load environment variables
load_dotenv()

app = FastAPI(title="CareBridge API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== Pydantic Models ==============


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    patientId: Optional[str] = None


class AlertAcknowledge(BaseModel):
    acknowledged: bool = True


class CreateDoctorBody(BaseModel):
    user_id: str = Field(..., alias="userId")
    specialty: str | None = Field(None)

    class Config:
        populate_by_name = True


class CreatePatientBody(BaseModel):
    user_id: str | None = Field(None, alias="userId")
    name: str = Field(...)
    age: int = Field(...)
    conditions: list[str] = Field(default_factory=list)
    risk_level: str = Field("low", alias="riskLevel")

    class Config:
        populate_by_name = True


class PatientDoctorLink(BaseModel):
    patient_id: str
    doctor_id: str

    class Config:
        populate_by_name = True


class TTSRequest(BaseModel):
    text: str
    voice_id: str | None = Field(None, alias="voiceId")

    class Config:
        populate_by_name = True


class PatientSignUp(BaseModel):
    email: str
    password: str
    address: str
    name: str
    age: int
    condition: list[str]


class DoctorSignUp(BaseModel):
    email: str
    password: str
    speciality: str
    name: str
    bio: str


# Basic Routes


@app.get("/")
def home():
    return {"status": "hello world"}


def read_root():
    return {"status": "ok", "message": "CareBridge API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


# --------- AUTH ROUTES ------------------


@app.post("/auth/patient/signup")
def patient_sign_up(body: PatientSignUp):
    try:
        # Sign in
        clientUid = auth_sign_up(
            email=body.email,
            password=body.password,
            role="patient",
            full_name=body.name,
        )

        # Create
        return patients_create(
            name=body.name,
            age=body.age,
            user_id=clientUid,
            conditions=body.condition,
            # risk_level=body.risk_level,
            address=body.address,
        )

    except Exception as e:
        return JSONResponse(status_code=400, content={"msg": f"Error: {e}"})


@app.post("/auth/doctor/signup")
def doctor_sign_up(body: DoctorSignUp):
    try:
        clientUid = auth_sign_up(
            email=body.email, password=body.password, role="doctor", full_name=body.name
        )
        return doctors_create(
            user_id=clientUid, specialty=body.speciality, bio=body.bio
        )

    except Exception as e:
        return JSONResponse(status_code=400, content={"msg": f"Error: {e}"})


# Cohere Chats
@app.post("/auth/signin")
def sign_in(email: str, password: str, role: str):
    try:
        res = auth_sign_in(email=email, password=password, role=role)

        return res
    except Exception as e:
        return JSONResponse(status_code=400, content={"msg": "Incorrect password"})


@app.post("/auth/signout")
def sign_out():
    res = auth_sign_out()

    return res


@app.get("/auth/getuser")
def get_current_user():
    res = auth_get_current_user()
    
    return JSONResponse(
        status_code=res["status"],
        content={
            "uid": "Not currently signed in" if res["status"] == 400 else res["user"].id
        },
    )


# --- Chat ---


@app.get("/api/chat/greeting")
def get_greeting():
    """Return a hardcoded initial greeting from the doctor."""
    greeting_text = "Hello! How can I help you today?"
    return {"text": greeting_text}


@app.post("/api/chat/end")
def end_call(request: ChatRequest):
    """End the call: return closing message and generate conversation summary."""
    # Hardcoded closing message
    closing_message = (
        "Thank you for sharing with me today. Take care and feel better soon!"
    )

    # Generate summary from conversation messages
    messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
    summary = ""
    try:
        if messages:
            summary = generate_summary(messages)
    except Exception as e:
        import logging

        logging.error(f"Failed to generate summary: {e}")
        summary = "**Summary**: Unable to generate conversation summary."

    return {"closingMessage": closing_message, "summary": summary}


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Stream chat responses from Cohere (app.cohere_chat)."""
    system_prompt = get_system_prompt()
    if request.patientId:
        try:
            patient = patients_get_patient(request.patientId)
            conds = patient.get("conditions") or []
            conditions = ", ".join(conds) if conds else "None reported"
            system_prompt += f"\n\nPatient context: {patient['name']}, {patient['age']} years old. Known conditions: {conditions}."
        except HTTPException:
            pass
    messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
    last_message = request.messages[-1].content if request.messages else ""

    async def generate():
        try:
            for chunk in stream_chat(messages, system_prompt):
                yield chunk
            if request.patientId:
                risk_level = assess_risk(last_message)
                if risk_level == "high":
                    try:
                        alerts_create_alert(
                            request.patientId,
                            "critical",
                            f'High-risk symptoms reported: "{last_message[:50]}..."',
                            "Keywords indicating potentially serious symptoms were detected.",
                        )
                        patients_update_risk(request.patientId, "high")
                    except HTTPException:
                        pass
                details = (
                    last_message[:100] + "..."
                    if len(last_message) > 100
                    else last_message
                )
                try:
                    timeline_add_event(
                        request.patientId, "chat", "AI conversation", details
                    )
                except HTTPException:
                    pass
        except Exception as e:
            import traceback

            traceback.print_exc()
            yield f"I'm sorry, I encountered an error: {str(e)}"

    return StreamingResponse(generate(), media_type="text/plain")


# --- TTS (app.tts / ElevenLabs) ---


@app.post("/api/tts")
def generate_speech(request: TTSRequest):
    """Generate speech from text using ElevenLabs (app.tts)."""
    return handle_tts_request(request.text, request.voice_id)


# --- Patients (Supabase: app.patients) ---


@app.get("/api/patients")
def get_patients():
    """List all patients from Supabase."""
    return patients_get_patients()


@app.get("/api/patients/search")
def search_patients(name: Optional[str] = None):
    """Search patients by name (partial, case-insensitive). Returns all matching patients."""
    return patients_search_by_name(name or "")


@app.get("/api/patients/{patient_id}")
def get_patient(patient_id: str):
    """Get one patient by id from Supabase."""
    return patients_get_patient(patient_id)


@app.post("/api/patients")
def create_patient(body: CreatePatientBody):
    """Create a patient row in Supabase. Returns the created patient."""
    return patients_create(
        name=body.name,
        age=body.age,
        user_id=body.user_id,
        conditions=body.conditions,
        risk_level=body.risk_level,
    )


# --- Timeline (Supabase: app.timeline) ---


class TimelineEventCreate(BaseModel):
    patient_id: str = Field(..., alias="patientId")
    type: str
    title: str
    details: Optional[str] = None

    class Config:
        populate_by_name = True


@app.get("/api/timeline")
def get_timeline(patientId: Optional[str] = None):
    """List timeline events from Supabase, optionally filtered by patient."""
    return timeline_get_timeline(patientId)


@app.post("/api/timeline")
def create_timeline_event(body: TimelineEventCreate):
    """Create a new timeline event."""
    return timeline_add_event(body.patient_id, body.type, body.title, body.details)


@app.delete("/api/timeline/{event_id}")
def delete_timeline_event(event_id: str):
    """Delete a timeline event by id."""
    return timeline_delete_event(event_id)


# --- Alerts (Supabase: app.alerts) ---


@app.get("/api/alerts")
def get_alerts(patientId: Optional[str] = None, doctorId: Optional[str] = None):
    """
    List alerts scoped by patient or doctor. Doctors only see alerts for their assigned patients.
    Pass patientId (one patient's alerts) or doctorId (alerts for all of that doctor's patients).
    If neither is passed, returns empty list.
    """
    return alerts_get_alerts(patient_id=patientId, doctor_id=doctorId)


@app.post("/api/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str):
    return alerts_acknowledge_alert(alert_id)


# --- Doctors (Supabase: app.doctors) ---


@app.post("/api/doctors")
def create_doctor(body: CreateDoctorBody):
    """Create a doctor row (user_id = auth user id, specialty optional). Returns the created doctor."""
    return doctors_create(body.user_id, body.specialty)


@app.get("/api/doctors/me/patients")
def get_my_patients():
    """
    List all patients connected to this doctor.
    Pass doctor_id as query param (UUID). With auth, resolve doctor_id from current user's token.
    """
    # print(res)
    # print(res["status"])
    #
    # return JSONResponse(
    #     status_code=res["status"],
    #     content={
    #         "uid": "Not currently signed in" if res["status"] == 400 else res["user"].id
    #     },
    # )

    doctor = auth_get_current_user()
    print(doctor)
    if doctor["status"] == 400:
        return JSONResponse(
            status_code=doctor["status"], content={"msg": "bad request"}
        )

    return doctors_get_my_patients(doctor["user"].id)


@app.get("/api/patients/{patient_id}/doctors")
def get_patient_doctors(patient_id: str):
    """List all doctors connected to this patient."""
    return doctors_get_patient_doctors(patient_id)


@app.post("/api/patient_doctors")
def connect_patient_doctor(body: PatientDoctorLink):
    """Connect a doctor to a patient (assign patient to doctor)."""
    return doctors_connect(body.patient_id, body.doctor_id)


@app.delete("/api/patient_doctors")
def disconnect_patient_doctor(patient_id: str, doctor_id: str):
    """Remove the connection between a doctor and a patient."""
    return doctors_disconnect(patient_id, doctor_id)


# ============== Run ==============

if __name__ == "__main__":
    import uvicorn

    print(
        """
CareBridge Backend
==================
Server running on http://localhost:8000
Press Ctrl+C to stop
    """
    )
    uvicorn.run(app, host="0.0.0.0", port=8000)
