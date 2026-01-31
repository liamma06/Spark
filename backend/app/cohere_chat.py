"""
Cohere chat and risk assessment.
Client, system prompt, risk keywords, and streaming chat live here; main only wires routes.
"""

import os
import cohere
from dotenv import load_dotenv

load_dotenv()

COHERE_API_KEY = os.getenv("COHERE_API_KEY")
if not COHERE_API_KEY:
    raise ValueError("Please set COHERE_API_KEY in your .env file")

_client: cohere.ClientV2 | None = None


def _get_client() -> cohere.ClientV2:
    global _client
    if _client is None:
        _client = cohere.ClientV2(api_key=COHERE_API_KEY)
    return _client


SYSTEM_PROMPT = """You are CareBridge, a caring and empathetic AI health companion. ALWAYS respond with exactly 2 sentences: first acknowledge their concern briefly, then ask a specific follow-up question. For serious symptoms, recommend professional medical care. Be warm, concise, and never diagnose or prescribe treatments."""


HIGH_RISK_KEYWORDS = [
    "chest pain", "chest tightness", "difficulty breathing", "can't breathe",
    "severe pain", "unconscious", "fainted", "bleeding heavily", "suicidal",
    "want to die", "heart attack", "stroke", "seizure", "numbness",
]

MEDIUM_RISK_KEYWORDS = [
    "fever", "persistent", "worsening", "dizzy", "nausea", "vomiting",
    "can't sleep", "insomnia", "anxiety", "anxious", "depressed",
    "shortness of breath", "headache", "migraine", "palpitations",
]


def get_system_prompt() -> str:
    """Base system prompt for CareBridge chat."""
    return SYSTEM_PROMPT


def assess_risk(message: str) -> str:
    """Return 'high', 'medium', or 'low' based on keyword presence in message."""
    lower = message.lower()
    if any(kw in lower for kw in HIGH_RISK_KEYWORDS):
        return "high"
    if any(kw in lower for kw in MEDIUM_RISK_KEYWORDS):
        return "medium"
    return "low"


def stream_chat(messages: list[dict], system_prompt: str):
    """
    Stream Cohere chat response. messages: list of {"role": str, "content": str}.
    system_prompt: full system message (base + optional patient context).
    Yields text chunks.
    """
    co_messages = [{"role": "system", "content": system_prompt}] + messages
    client = _get_client()
    response = client.chat_stream(
        model="command-r-plus-08-2024",
        messages=co_messages,
        max_tokens=100,  # Limit to exactly 2 sentences
    )
    for event in response:
        if event.type == "content-delta":
            text = event.delta.message.content.text
            yield text
