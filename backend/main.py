import os
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from fastapi.responses import StreamingResponse, Response, JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from app.supabase import sign_up
from app.cohere_chat import get_system_prompt, assess_risk, stream_chat
from app.tts import handle_tts_request

from app.tts import text_to_speech

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from app.supabase import (
    sign_up as auth_sign_up,
    sign_in as auth_sign_in,
    sign_out as auth_sign_out,
    get_current_user as auth_get_current_user,
)
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
    create_patient as patients_create,
    update_patient_risk as patients_update_risk,
)
from app.alerts import (
    get_alerts as alerts_get_alerts,
    acknowledge_alert as alerts_acknowledge_alert,
    create_alert as alerts_create_alert,
)

from app.timeline import (
    get_timeline as timeline_get_timeline
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

# ============== In-Memory (timeline only; alerts use Supabase) ==============

# Timeline events
timeline_db = [
    {
        "id": "evt-1",
        "patientId": "patient-maria",
        "type": "symptom",
        "title": "Reported chest tightness",
        "details": "Patient described tightness in chest area, especially during morning hours",
        "createdAt": datetime.now().isoformat(),
    },
    {
        "id": "evt-2",
        "patientId": "patient-maria",
        "type": "symptom",
        "title": "Shortness of breath",
        "details": "Difficulty breathing when climbing stairs",
        "createdAt": datetime.now().isoformat(),
    },
    {
        "id": "evt-3",
        "patientId": "patient-maria",
        "type": "medication",
        "title": "Metformin refill",
        "details": "Monthly diabetes medication refilled",
        "createdAt": datetime.now().isoformat(),
    },
    {
        "id": "evt-4",
        "patientId": "patient-james",
        "type": "symptom",
        "title": "Sleep difficulties",
        "details": "Having trouble falling asleep, racing thoughts at night",
        "createdAt": datetime.now().isoformat(),
    },
    {
        "id": "evt-5",
        "patientId": "patient-sarah",
        "type": "symptom",
        "title": "Mild headache",
        "details": "Occasional tension headache, likely stress-related",
        "createdAt": datetime.now().isoformat(),
    },
]


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
    patient_id: str = Field(..., alias="patientId")
    doctor_id: str = Field(..., alias="doctorId")

    class Config:
        populate_by_name = True


class TTSRequest(BaseModel):
    text: str
    voice_id: str | None = Field(None, alias="voiceId")

    class Config:
        populate_by_name = True

# Basic Routes

@app.get("/")
def home():
    return {"status": "hello world"}

def read_root():
    return {"status": "ok", "message": "CareBridge API is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Login and Signup Routes 

@app.post("/auth/signup")
def read_root(email: str, password: str, full_name: str, role: str):
    result = auth_sign_up(email, password, full_name, role)
    return result

#Cohere Chats 
@app.post("/auth/signin")
def sign_in(email: str, password: str):
    res = auth_sign_in(email=email, password=password)
    
    return res

@app.post("/auth/sign_out")
def sign_out():
    res = auth_sign_out()

    return res

@app.get("/auth/getuser")
def get_current_user():
    res = auth_get_current_user()
    return res
    
# --- Chat ---

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
                            f"High-risk symptoms reported: \"{last_message[:50]}...\"",
                            "Keywords indicating potentially serious symptoms were detected.",
                        )
                        patients_update_risk(request.patientId, "high")
                    except HTTPException:
                        pass
                details = last_message[:100] + "..." if len(last_message) > 100 else last_message
                timeline_db.append({
                    "id": f"evt-{len(timeline_db) + 1}",
                    "patientId": request.patientId,
                    "type": "chat",
                    "title": "AI conversation",
                    "details": details,
                    "createdAt": datetime.now().isoformat(),
                })
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

# --- Timeline (in-memory for now) ---

@app.get("/api/timeline")
def timeline(patientId: Optional[str] = None):
    if patientId:
        return [e for e in timeline_db if e["patientId"] == patientId]
    return timeline_db

@app.get("/api/get_timeline")
def get_timeline():
    timeline_get_timeline("thing")

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
def get_my_patients(doctor_id: str):
    """
    List all patients connected to this doctor.
    Pass doctor_id as query param (UUID). With auth, resolve doctor_id from current user's token.
    """
    return doctors_get_my_patients(doctor_id)


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
    print("""
CareBridge Backend
==================
Server running on http://localhost:8000
Press Ctrl+C to stop
    """)
    uvicorn.run(app, host="0.0.0.0", port=8000)
