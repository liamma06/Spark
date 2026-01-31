"""
Extract structured timeline events from chat conversations using Cohere.
"""

import json
import logging
import cohere
import os
from typing import Optional
from dotenv import load_dotenv

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Cohere client for extraction
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
if not COHERE_API_KEY:
    raise ValueError("Please set COHERE_API_KEY in your .env file")
co = cohere.ClientV2(api_key=COHERE_API_KEY)

EXTRACTION_PROMPT = """You are a medical information extraction system. Analyze the conversation below and extract any timeline-worthy events.

Extract the following types of events:
1. **Symptoms** - When the patient mentions symptoms, especially with dates (e.g., "chest pain started on January 31, 2026")
2. **Appointments** - When appointments are mentioned, scheduled, or missed
3. **Medications** - When medications are mentioned, started, stopped, or changed
4. **Alerts** - Critical health concerns that need immediate attention

For each event, extract:
- type: one of "symptom", "appointment", "medication", "alert"
- title: A concise title (e.g., "Chest pain started", "Appointment scheduled", "Started Metformin")
- date: The date mentioned (if any) in ISO format (YYYY-MM-DD), or null if not mentioned
- details: Additional context as a dictionary with relevant fields

Return ONLY valid JSON in this exact format (array of events, empty array if none found):
[
  {
    "type": "symptom",
    "title": "Chest pain started",
    "date": "2026-01-31",
    "details": {
      "description": "Patient reported chest tightness",
      "severity": "moderate",
      "duration": "ongoing"
    }
  }
]

If no timeline events are found, return an empty array: []

Be precise - only extract events that are clearly mentioned in the conversation."""


def extract_timeline_events(conversation_messages: list[dict]) -> list[dict]:
    """
    Extract structured timeline events from a conversation using Cohere.
    
    Args:
        conversation_messages: List of message dicts with 'role' and 'content' keys
        
    Returns:
        list: List of extracted events, each with 'type', 'title', 'date', and 'details' keys.
              Returns empty list if extraction fails or no events found.
    """
    if not conversation_messages:
        return []
    
    try:
        # Build the conversation text for extraction
        conversation_text = "\n".join([
            f"{msg.get('role', 'unknown').upper()}: {msg.get('content', '')}"
            for msg in conversation_messages
        ])
        
        # Create extraction prompt with conversation
        full_prompt = f"{EXTRACTION_PROMPT}\n\nConversation:\n{conversation_text}\n\nExtracted events (JSON only):"
        
        logger.info(f"Extracting timeline events from conversation ({len(conversation_messages)} messages)")
        
        # Make Cohere call for extraction (collect stream)
        response = co.chat_stream(
            model="command-r-plus-08-2024",
            messages=[
                {"role": "system", "content": "You are a JSON extraction system. Return only valid JSON, no other text."},
                {"role": "user", "content": full_prompt}
            ],
        )
        
        # Collect all text chunks from the stream
        extracted_text = ""
        for event in response:
            if event.type == "content-delta":
                extracted_text += event.delta.message.content.text
        
        extracted_text = extracted_text.strip()
        
        # Try to parse JSON from the response
        # Cohere might return text with JSON, so try to extract just the JSON part
        try:
            # Try parsing the entire response
            events = json.loads(extracted_text)
        except json.JSONDecodeError:
            # Try to find JSON array in the response
            import re
            json_match = re.search(r'\[.*\]', extracted_text, re.DOTALL)
            if json_match:
                events = json.loads(json_match.group())
            else:
                logger.warning(f"Failed to parse JSON from extraction response: {extracted_text[:200]}")
                return []
        
        # Validate events structure
        if not isinstance(events, list):
            logger.warning(f"Extraction returned non-list: {type(events)}")
            return []
        
        # Validate each event has required fields
        valid_events = []
        for event in events:
            if isinstance(event, dict) and "type" in event and "title" in event:
                # Ensure date is None if not provided or invalid
                if "date" not in event or not event["date"]:
                    event["date"] = None
                # Ensure details is a dict
                if "details" not in event or not isinstance(event["details"], dict):
                    event["details"] = {}
                valid_events.append(event)
            else:
                logger.warning(f"Skipping invalid event structure: {event}")
        
        logger.info(f"Extracted {len(valid_events)} timeline events")
        return valid_events
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error during extraction: {e}")
        return []
    except Exception as e:
        logger.error(f"Error extracting timeline events: {e}", exc_info=True)
        return []
