import os
import json
import logging
import traceback
import cohere
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
from dotenv import load_dotenv
from app.supabase import sign_up
from app.tts import text_to_speech

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# Demo patients
patients_db = {
    "patient-maria": {
        "id": "patient-maria",
        "name": "Maria Rodriguez",
        "age": 67,
        "conditions": ["Type 2 Diabetes", "Hypertension"],
        "riskLevel": "high",
        "createdAt": datetime.now().isoformat(),
    },
    "patient-james": {
        "id": "patient-james",
        "name": "James Chen",
        "age": 34,
        "conditions": ["Generalized Anxiety Disorder"],
        "riskLevel": "medium",
        "createdAt": datetime.now().isoformat(),
    },
    "patient-sarah": {
        "id": "patient-sarah",
        "name": "Sarah Thompson",
        "age": 28,
        "conditions": [],
        "riskLevel": "low",
        "createdAt": datetime.now().isoformat(),
    },
}

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
    sign_up(email, password, full_name, role)


# --- Chat ---

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Stream chat responses from Cohere"""
    
    # Add patient context to system prompt
    system_prompt = SYSTEM_PROMPT
    if request.patientId and request.patientId in patients_db:
        patient = patients_db[request.patientId]
        conditions = ", ".join(patient["conditions"]) if patient["conditions"] else "None reported"
        system_prompt += f"\n\nPatient context: {patient['name']}, {patient['age']} years old. Known conditions: {conditions}."
    
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
                    # Create alert
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
                    # Update patient risk level
                    if request.patientId in patients_db:
                        patients_db[request.patientId]["riskLevel"] = "high"
                
                # Add to timeline
                event_id = f"evt-{len(timeline_db) + 1}"
                timeline_db.append({
                    "id": event_id,
                    "patientId": request.patientId,
                    "type": "chat",
                    "title": "AI conversation",
                    "details": last_message[:100] + "..." if len(last_message) > 100 else last_message,
                    "createdAt": datetime.now().isoformat(),
                })
                    
        except Exception as e:
            import traceback
            traceback.print_exc()
            yield f"I'm sorry, I encountered an error: {str(e)}"
    
    return StreamingResponse(generate(), media_type="text/plain")

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

@app.get("/api/patients")
def get_patients():
    return list(patients_db.values())

@app.get("/api/patients/{patient_id}")
def get_patient(patient_id: str):
    if patient_id not in patients_db:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patients_db[patient_id]

# --- Timeline ---

@app.get("/api/timeline")
def get_timeline(patientId: Optional[str] = None):
    if patientId:
        return [e for e in timeline_db if e["patientId"] == patientId]
    return timeline_db

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
