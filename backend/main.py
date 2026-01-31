import logging
import os
import uuid
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response, JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from app.supabase import (
    sign_up as auth_sign_up,
    sign_in as auth_sign_in,
    sign_out as auth_sign_out,
    get_current_user as auth_get_current_user,
)
from app.cohere_chat import get_system_prompt, assess_risk, stream_chat, _get_client
from app.tts import handle_tts_request, text_to_speech

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
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
    get_patient_by_user_id as patients_get_patient_by_user_id,
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
)
from app.extract import extract_timeline_events

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
    patient_id: str = Field(..., alias="patientId")
    doctor_id: str = Field(..., alias="doctorId")

    class Config:
        populate_by_name = True


class ChatSummaryRequest(BaseModel):
    messages: list[ChatMessage]
    patientId: Optional[str] = None


class ChatCloseRequest(BaseModel):
    messages: list[ChatMessage]
    patientId: Optional[str] = None


class ChatSummaryResponse(BaseModel):
    summary: str


class ChatCloseResponse(BaseModel):
    closingMessage: str = Field(..., alias="closingMessage")
    summary: str

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
    conditions: list[str]


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
        clientUid = auth_sign_up(email=body.email, password=body.password, role="patient", full_name=body.name)

        # Create patient
        return patients_create(
            name=body.name,
            age=body.age,
            user_id=clientUid,
            conditions=body.conditions,
            address=body.address
        )
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"msg": f"Error: {e}"}
        )


@app.post("/auth/doctor/signup")
def doctor_sign_up(body: DoctorSignUp):
    try:
        clientUid = auth_sign_up(email=body.email, password=body.password, role="doctor", full_name=body.name)

        return doctors_create(
            user_id=clientUid,
            specialty=body.speciality,
            bio=body.bio
        )
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"msg": f"Error: {e}"}
        )


# --- Auth Routes ---

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

def _is_valid_uuid(value: str) -> bool:
    """Check if a string is a valid UUID"""
    try:
        uuid.UUID(value)
        return True
    except (ValueError, AttributeError):
        return False


async def _process_timeline_events_async(
    patient_id: str,
    messages: list[dict],
    full_response: str,
    last_message: str
):
    """Background task to extract timeline events and assess risk"""
    # Skip timeline processing for demo/non-UUID patient IDs
    if not _is_valid_uuid(patient_id):
        logger.info(f"Skipping timeline processing for non-UUID patient_id: {patient_id}")
        return
    
    try:
        # Build conversation messages for extraction (include the assistant's response)
        extraction_messages = []
        for msg in messages:
            extraction_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        # Add the assistant's response
        extraction_messages.append({
            "role": "assistant",
            "content": full_response
        })
        
        # Extract timeline events
        extracted_events = extract_timeline_events(extraction_messages)
        
        # Create timeline events in Supabase
        for event in extracted_events:
            try:
                # Build details dict with date if available
                details = event.get("details", {})
                if event.get("date"):
                    details["date"] = event["date"]
                
                timeline_add_event(
                    patient_id=patient_id,
                    type=event["type"],
                    title=event["title"],
                    details=details
                )
                logger.info(f"Created timeline event: {event['type']} - {event['title']}")
            except Exception as e:
                logger.error(f"Failed to create timeline event: {e}", exc_info=True)
        
        # If no structured events were extracted, still log the conversation
        if not extracted_events:
            try:
                timeline_add_event(
                    patient_id=patient_id,
                    type="chat",
                    title="AI conversation",
                    details={"text": last_message[:200] + "..." if len(last_message) > 200 else last_message}
                )
            except Exception as e:
                logger.error(f"Failed to create chat timeline event: {e}", exc_info=True)
        
        # Assess risk and create alerts if needed
        risk_level = assess_risk(last_message)
        if risk_level == "high":
            try:
                alerts_create_alert(
                    patient_id,
                    "critical",
                    f"High-risk symptoms reported: \"{last_message[:50]}...\"",
                    "Keywords indicating potentially serious symptoms were detected.",
                )
                patients_update_risk(patient_id, "high")
            except HTTPException:
                pass
                
    except Exception as e:
        logger.error(f"Error in background timeline processing: {e}", exc_info=True)
        # Fallback: still create a basic chat event
        try:
            timeline_add_event(
                patient_id=patient_id,
                type="chat",
                title="AI conversation",
                details={"text": last_message[:200] + "..." if len(last_message) > 200 else last_message}
            )
        except Exception:
            pass

@app.post("/api/chat")
async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
    """Stream chat responses from Cohere (app.cohere_chat) with async timeline processing."""
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
            # Collect full response for async timeline processing
            full_response = ""
            for chunk in stream_chat(messages, system_prompt):
                full_response += chunk
                yield chunk
            
            # Schedule timeline event extraction and risk assessment as background task
            # This runs after the response is sent, so it doesn't delay the user
            if request.patientId:
                background_tasks.add_task(
                    _process_timeline_events_async,
                    request.patientId,
                    messages,
                    full_response,
                    last_message
                )
        except Exception as e:
            import traceback

            traceback.print_exc()
            yield f"I'm sorry, I encountered an error: {str(e)}"

    return StreamingResponse(generate(), media_type="text/plain")

# --- Helper function for summary generation ---

async def _generate_summary(messages: list[ChatMessage]) -> str:
    """Helper function to generate a chat summary"""
    summary_prompt = """You are a medical assistant summarizing a patient conversation. Create a concise summary that includes:
1. Key symptoms discussed
2. Main concerns raised by the patient
3. Any recommendations or guidance provided
4. Important health information mentioned

Keep the summary clear, organized, and professional. Focus on actionable information."""
    
    cohere_messages = [{"role": "system", "content": summary_prompt}]
    for msg in messages:
        cohere_messages.append({
            "role": msg.role,
            "content": msg.content
        })
    
    # Add a final instruction message
    cohere_messages.append({
        "role": "user",
        "content": "Please provide a concise summary of this conversation."
    })
    
    # Generate summary using Cohere
    client = _get_client()
    response = client.chat(
        model="command-r-plus-08-2024",
        messages=cohere_messages,
    )
    
    # Handle Cohere response - content can be a list or have text attribute
    content = response.message.content
    if isinstance(content, list):
        # If content is a list, extract text from each item
        text_parts = []
        for item in content:
            if isinstance(item, dict):
                # If item is a dict, try to get 'text' key
                text_parts.append(item.get('text', str(item)))
            elif hasattr(item, 'text'):
                text_parts.append(item.text)
            elif isinstance(item, str):
                text_parts.append(item)
            else:
                text_parts.append(str(item))
        return ' '.join(text_parts).strip()
    elif isinstance(content, dict):
        # If content is a dict, try to get 'text' key
        return content.get('text', str(content)).strip()
    elif hasattr(content, 'text'):
        return content.text.strip()
    elif isinstance(content, str):
        return content.strip()
    else:
        # Fallback: try to convert to string
        return str(content).strip()

# --- Chat Summary ---

@app.post("/api/chat/summary", response_model=ChatSummaryResponse)
async def generate_chat_summary(request: ChatSummaryRequest):
    """Generate a concise summary of the chat conversation"""
    try:
        summary = await _generate_summary(request.messages)
        return ChatSummaryResponse(summary=summary)
    except Exception as e:
        logger.error(f"Error generating chat summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")

# --- Chat Close ---

@app.post("/api/chat/close", response_model=ChatCloseResponse)
async def close_chat(request: ChatCloseRequest):
    """Generate closing message and summary, then store summary in timeline"""
    try:
        # Generate closing message using Cohere
        closing_prompt = """You are CareBridge, a caring and empathetic AI health companion. The patient is ending their chat session. Generate a warm, professional closing message that:
1. Thanks them for the conversation
2. Reassures them that their concerns have been noted
3. Encourages them to seek professional medical care if needed
4. Wishes them well

Keep it brief (2-3 sentences) and warm."""
        
        cohere_messages = [{"role": "system", "content": closing_prompt}]
        for msg in request.messages:
            cohere_messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Add closing instruction
        cohere_messages.append({
            "role": "user",
            "content": "Please provide a warm closing message for this conversation."
        })
        
        # Generate closing message
        client = _get_client()
        closing_response = client.chat(
            model="command-r-plus-08-2024",
            messages=cohere_messages,
        )
        
        # Handle Cohere response - content can be a list or have text attribute
        content = closing_response.message.content
        if isinstance(content, list):
            # If content is a list, extract text from each item
            text_parts = []
            for item in content:
                if isinstance(item, dict):
                    # If item is a dict, try to get 'text' key
                    text_parts.append(item.get('text', str(item)))
                elif hasattr(item, 'text'):
                    text_parts.append(item.text)
                elif isinstance(item, str):
                    text_parts.append(item)
                else:
                    text_parts.append(str(item))
            closing_message = ' '.join(text_parts).strip()
        elif isinstance(content, dict):
            # If content is a dict, try to get 'text' key
            closing_message = content.get('text', str(content)).strip()
        elif hasattr(content, 'text'):
            closing_message = content.text.strip()
        elif isinstance(content, str):
            closing_message = content.strip()
        else:
            # Fallback: try to convert to string
            closing_message = str(content).strip()
        
        # Generate summary using helper function
        summary = await _generate_summary(request.messages)
        
        # Store summary in timeline if patientId is provided
        if request.patientId:
            try:
                timeline_add_event(
                    patient_id=request.patientId,
                    type="chat",
                    title="Chat session summary",
                    details={"summary": summary, "closing_message": closing_message}
                )
                logger.info(f"Stored chat summary for patient: {request.patientId}")
            except Exception as e:
                logger.error(f"Failed to store chat summary in timeline: {e}", exc_info=True)
                # Continue even if storage fails
        
        return ChatCloseResponse(closingMessage=closing_message, summary=summary)
    except Exception as e:
        logger.error(f"Error closing chat: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to close chat: {str(e)}")

# --- Text-to-Speech ---

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

# --- Timeline (Supabase: app.timeline) ---


@app.get("/api/timeline")
def get_timeline(patientId: Optional[str] = None):
    """Get timeline events for a patient or all patients"""
    try:
        # If patientId is provided but not a valid UUID, try to get it from current user
        actual_patient_id = patientId
        if patientId and not _is_valid_uuid(patientId):
            # Try to get patient ID from current user
            try:
                current_user = auth_get_current_user()
                if current_user.get("success") and current_user.get("user"):
                    user_id = current_user["user"]["id"]
                    patient = patients_get_patient_by_user_id(user_id)
                    actual_patient_id = patient["id"]
                    logger.info(f"Resolved placeholder patientId '{patientId}' to actual UUID: {actual_patient_id}")
                else:
                    # If no user or can't get patient, return empty list for placeholder IDs
                    logger.warning(f"Could not resolve placeholder patientId '{patientId}', returning empty timeline")
                    return []
            except Exception as e:
                logger.warning(f"Could not get patient ID from current user: {e}, returning empty timeline")
                return []
        
        events = timeline_get_timeline(actual_patient_id)
        # Convert snake_case keys to camelCase for frontend compatibility
        return [
            {
                "id": e.get("id"),
                "patientId": e.get("patient_id"),
                "type": e.get("type"),
                "title": e.get("title"),
                "details": e.get("details"),
                "createdAt": e.get("created_at"),
            }
            for e in events
        ]
    except Exception as e:
        logger.error(f"Error getting timeline: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


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

    print(
        """
CareBridge Backend
==================
Server running on http://localhost:8000
Press Ctrl+C to stop
    """
    )
    uvicorn.run(app, host="0.0.0.0", port=8000)
