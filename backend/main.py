import os
import json
import logging
import traceback
import cohere
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from app.supabase import sign_up
from app.tts import text_to_speech

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
    create_patient as patients_create,
    update_patient_risk as patients_update_risk,
)
from app.timeline import (
    get_timeline as timeline_get_timeline,
    add_event as timeline_add_event,
)
from app.extract import extract_timeline_events

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

# ============== In-Memory Data Store ==============

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

# Alerts
alerts_db = [
    {
        "id": "alert-1",
        "patientId": "patient-maria",
        "severity": "critical",
        "message": "Chest tightness reported - potential cardiac concern",
        "reasoning": "Patient is 67 years old with diabetes and hypertension history. Combination of chest tightness and shortness of breath requires urgent evaluation.",
        "acknowledged": False,
        "createdAt": datetime.now().isoformat(),
    },
    {
        "id": "alert-2",
        "patientId": "patient-james",
        "severity": "warning",
        "message": "Persistent sleep issues may require intervention",
        "reasoning": "Patient has reported sleep difficulties for over a week. Combined with existing anxiety diagnosis, may need medication adjustment.",
        "acknowledged": False,
        "createdAt": datetime.now().isoformat(),
    },
]

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

class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None

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
- **Keep responses SHORT and concise - aim for 2-3 sentences maximum**
- Be direct and to the point while remaining caring
- Prioritize brevity without losing empathy

Timeline tracking:
- When patients mention symptoms, especially with dates (e.g., "chest pain started on January 31"), acknowledge this clearly
- When appointments, medications, or other health events are mentioned, acknowledge them naturally
- This helps build an accurate timeline of the patient's health journey

Remember: You are a bridge to care, not a replacement for professional medical advice. Keep your responses brief to ensure quick, helpful interactions."""

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

async def _process_timeline_events_async(
    patient_id: str,
    messages: list[dict],
    full_response: str,
    last_message: str
):
    """Background task to extract timeline events and assess risk"""
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
            # Create alert (still in-memory for now; alerts module later)
            alert_id = f"alert-{len(alerts_db) + 1}"
            alerts_db.append({
                "id": alert_id,
                "patientId": patient_id,
                "severity": "critical",
                "message": f"High-risk symptoms reported: \"{last_message[:50]}...\"",
                "reasoning": "Keywords indicating potentially serious symptoms were detected.",
                "acknowledged": False,
                "createdAt": datetime.now().isoformat(),
            })
            # Update patient risk level in Supabase
            try:
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
            
            # Schedule timeline event extraction and risk assessment as background task
            # This runs after the response is sent, so it doesn't delay the user
            if request.patientId:
                # Convert messages to dict format for background task
                messages_dict = [{"role": msg.role, "content": msg.content} for msg in request.messages]
                background_tasks.add_task(
                    _process_timeline_events_async,
                    request.patientId,
                    messages_dict,
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
    response = co.chat(
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
        closing_response = co.chat(
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
async def generate_speech(request: TTSRequest):
    """Generate speech audio from text using ElevenLabs"""
    try:
        logger.info(f"TTS request received - text length: {len(request.text)}, voice_id: {request.voice_id or 'default'}")
        
        if not request.text or not request.text.strip():
            raise ValueError("Text cannot be empty")
        
        audio_bytes = text_to_speech(request.text, request.voice_id)
        
        logger.info(f"TTS generation successful - audio size: {len(audio_bytes)} bytes")
        
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=speech.mp3"
            }
        )
    except ValueError as e:
        error_msg = str(e)
        logger.error(f"TTS ValueError: {error_msg}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        error_msg = f"TTS generation failed: {str(e)}"
        logger.error(f"TTS Exception: {error_msg}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_msg)

# --- Patients ---
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

# --- Timeline ---

@app.get("/api/timeline")
def get_timeline(patientId: Optional[str] = None):
    """Get timeline events for a patient or all patients"""
    try:
        events = timeline_get_timeline(patientId)
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

# --- Alerts ---

@app.get("/api/alerts")
def get_alerts(patientId: Optional[str] = None):
    if patientId:
        return [a for a in alerts_db if a["patientId"] == patientId]
    return alerts_db

@app.post("/api/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str):
    for alert in alerts_db:
        if alert["id"] == alert_id:
            alert["acknowledged"] = True
            return alert
    raise HTTPException(status_code=404, detail="Alert not found")

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
