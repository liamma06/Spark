import os
import json
import cohere
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from app.supabase import sign_up
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

# Load environment variables
load_dotenv()

# Initialize Cohere client (v2)
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
if not COHERE_API_KEY:
    raise ValueError("Please set COHERE_API_KEY in your .env file")
co = cohere.ClientV2(api_key=COHERE_API_KEY)

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

timeline_db = []

# ============== Risk Assessment ==============

HIGH_RISK_KEYWORDS = [
    "chest pain", "chest tightness", "difficulty breathing", "can't breathe",
    "severe pain", "unconscious", "fainted", "bleeding heavily", "suicidal",
    "want to die", "heart attack", "stroke", "seizure", "numbness"
]

MEDIUM_RISK_KEYWORDS = [
    "fever", "persistent", "worsening", "dizzy", "nausea", "vomiting",
    "can't sleep", "insomnia", "anxiety", "anxious", "depressed",
    "shortness of breath", "headache", "migraine", "palpitations"
]

def assess_risk(message: str) -> str:
    lower = message.lower()
    if any(kw in lower for kw in HIGH_RISK_KEYWORDS):
        return "high"
    if any(kw in lower for kw in MEDIUM_RISK_KEYWORDS):
        return "medium"
    return "low"

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


# ============== System Prompt ==============

SYSTEM_PROMPT = """You are CareBridge, a caring and empathetic AI health companion. Your role is to:

1. Listen attentively to patients describing their symptoms or health concerns
2. Ask clarifying questions to better understand their situation
3. Provide supportive, non-diagnostic guidance
4. Encourage patients to seek professional medical care when appropriate
5. Help patients articulate their symptoms clearly for their healthcare providers

Important guidelines:
- Be warm, empathetic, and reassuring
- Never diagnose conditions or prescribe treatments
- Always recommend consulting a healthcare provider for serious concerns
- Ask follow-up questions about symptom duration, severity, and any related factors
- Keep responses concise but caring

Remember: You are a bridge to care, not a replacement for professional medical advice."""

# ============== Routes ==============

@app.get("/")
def home():
    return {"status": "hello world"}

def read_root():
    return {"status": "ok", "message": "CareBridge API is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# --- Auth (Supabase) ---

@app.post("/signup")
def read_root(email: str, password: str, full_name: str, role: str):
    result = sign_up(email, password, full_name, role)
    return result

# --- Chat ---

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Stream chat responses from Cohere"""
    
    # Add patient context to system prompt (from Supabase)
    system_prompt = SYSTEM_PROMPT
    if request.patientId:
        try:
            patient = patients_get_patient(request.patientId)
            conds = patient.get("conditions") or []
            conditions = ", ".join(conds) if conds else "None reported"
            system_prompt += f"\n\nPatient context: {patient['name']}, {patient['age']} years old. Known conditions: {conditions}."
        except HTTPException:
            pass  # skip patient context if not found
    
    # Build messages for Cohere v2 API
    cohere_messages = [{"role": "system", "content": system_prompt}]
    for msg in request.messages:
        cohere_messages.append({
            "role": msg.role,
            "content": msg.content
        })
    
    # Get the last user message for risk assessment
    last_message = request.messages[-1].content if request.messages else ""
    
    async def generate():
        try:
            # Use Cohere v2 chat with streaming
            response = co.chat_stream(
                model="command-r-plus-08-2024",
                messages=cohere_messages,
            )
            
            full_response = ""
            for event in response:
                if event.type == "content-delta":
                    text = event.delta.message.content.text
                    full_response += text
                    yield text
            
            # After streaming, assess risk and create alerts if needed
            if request.patientId:
                risk_level = assess_risk(last_message)
                if risk_level == "high":
                    # Create alert (still in-memory for now; timeline/alerts modules later)
                    alert_id = f"alert-{len(alerts_db) + 1}"
                    alerts_db.append({
                        "id": alert_id,
                        "patientId": request.patientId,
                        "severity": "critical",
                        "message": f"High-risk symptoms reported: \"{last_message[:50]}...\"",
                        "reasoning": "Keywords indicating potentially serious symptoms were detected.",
                        "acknowledged": False,
                        "createdAt": datetime.now().isoformat(),
                    })
                    # Update patient risk level in Supabase
                    try:
                        patients_update_risk(request.patientId, "high")
                    except HTTPException:
                        pass
                
                # Add to timeline (in-memory for now)
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
def get_timeline(patientId: Optional[str] = None):
    if patientId:
        return [e for e in timeline_db if e["patientId"] == patientId]
    return timeline_db

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
