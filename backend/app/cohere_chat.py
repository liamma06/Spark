"""
Cohere chat and risk assessment.
Client, system prompt, risk keywords, and streaming chat live here; main only wires routes.
"""

import os
import json
import re
from datetime import datetime, timedelta
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


def generate_summary(messages: list[dict]) -> str:
    """
    Generate a conversation summary using Cohere.
    messages: list of {"role": str, "content": str} (excluding system message).
    Returns a markdown-formatted summary.
    """
    client = _get_client()
    
    # Create a summary prompt
    summary_prompt = """Create a concise medical conversation summary in markdown format. Include:
- **Main Symptoms**: What the patient reported
- **Key Details**: Important information discussed
- **Recommendations**: Any advice or next steps mentioned

Format as markdown with clear sections."""
    
    # Format conversation for summary
    conversation_text = "\n".join([
        f"{msg['role'].capitalize()}: {msg['content']}" 
        for msg in messages 
        if msg['role'] != 'system'
    ])
    
    summary_messages = [
        {"role": "system", "content": summary_prompt},
        {"role": "user", "content": f"Summarize this conversation:\n\n{conversation_text}"}
    ]
    
    # Use chat_stream but collect all chunks
    response = client.chat_stream(
        model="command-r-plus-08-2024",
        messages=summary_messages,
        max_tokens=500,
    )
    
    summary_text = ""
    for event in response:
        if event.type == "content-delta":
            summary_text += event.delta.message.content.text
    
    return summary_text


def extract_timeline_events(message: str, conversation_context: list[dict] = None) -> list[dict]:
    """
    Extract timeline events (symptoms or appointments) from a user message using Cohere.
    Returns a list of event dictionaries with: type, title, details, date (ISO format YYYY-MM-DD).
    """
    client = _get_client()
    
    # Build context from recent conversation
    context_text = ""
    if conversation_context:
        # Get last 3 messages for context
        recent_messages = conversation_context[-3:] if len(conversation_context) > 3 else conversation_context
        context_text = "\n".join([
            f"{msg.get('role', 'user').capitalize()}: {msg.get('content', '')}"
            for msg in recent_messages
            if msg.get('role') != 'system'
        ])
    
    extraction_prompt = """You are a medical data extraction assistant. Analyze the user's message and extract any symptoms or appointments mentioned.

For each symptom or appointment found, extract:
- type: must be exactly "symptom" or "appointment" (no other values)
- title: A brief title (e.g., "Headache started", "Doctor appointment scheduled")
- details: When it started/occurred, severity, duration, or appointment details
- date: The date mentioned in YYYY-MM-DD format (convert relative dates like "yesterday", "3 days ago" to actual dates, or use today's date if not specified)

CRITICAL: Return ONLY a valid JSON array. No other text. If no symptoms or appointments are found, return exactly: []

Valid format examples:
- "I had a headache yesterday" -> [{{"type": "symptom", "title": "Headache", "details": "Started yesterday", "date": "2024-01-15"}}]
- "I have an appointment next Monday" -> [{{"type": "appointment", "title": "Doctor appointment", "details": "Scheduled for next Monday", "date": "2024-01-22"}}]
- "I've been feeling dizzy for 3 days" -> [{{"type": "symptom", "title": "Dizziness", "details": "Started 3 days ago, ongoing", "date": "2024-01-13"}}]

Today's date: {today_date}

Remember: Return ONLY the JSON array, nothing else."""

    today = datetime.now()
    today_str = today.strftime("%Y-%m-%d")
    
    full_prompt = extraction_prompt.format(today_date=today_str)
    if context_text:
        full_prompt += f"\n\nRecent conversation context:\n{context_text}\n\nUser's current message: {message}"
    else:
        full_prompt += f"\n\nUser's message: {message}"
    
    import logging
    logging.info(f"Calling Cohere to extract timeline events from message: {message[:100]}")
    
    try:
        # Use Cohere to extract structured data with JSON mode if available
        # Check if the client supports response_format parameter
        chat_kwargs = {
            "model": "command-r-plus-08-2024",
            "messages": [
                {"role": "system", "content": full_prompt},
                {"role": "user", "content": "Extract timeline events from this message. Return only valid JSON array."}
            ],
            "max_tokens": 500,
        }
        
        # Try to use JSON mode if available (Cohere may support response_format)
        # If not available, the prompt should be sufficient
        response = client.chat(**chat_kwargs)
        
        # Extract JSON from response - Cohere chat() returns a ChatResponse object
        # The text is in response.message.content (list of content blocks)
        logging.info(f"Cohere response type: {type(response)}, has message: {hasattr(response, 'message')}")
        
        if not hasattr(response, 'message'):
            logging.error(f"Cohere response doesn't have 'message' attribute. Response type: {type(response)}, available attrs: {[x for x in dir(response) if not x.startswith('_')]}")
            return []
        
        # Extract text from message content
        # Based on Cohere SDK structure: response.message.content is a list of content blocks
        message = response.message
        logging.info(f"Message type: {type(message)}, has content: {hasattr(message, 'content')}")
        
        if not hasattr(message, 'content'):
            logging.error(f"Cohere message doesn't have 'content' attribute. Message type: {type(message)}, available attrs: {[x for x in dir(message) if not x.startswith('_')]}")
            return []
        
        message_content = message.content
        logging.info(f"Message content type: {type(message_content)}, is list: {isinstance(message_content, list)}")
        
        if isinstance(message_content, list) and len(message_content) > 0:
            # Content is a list of content blocks, get text from first block
            first_block = message_content[0]
            logging.info(f"First block type: {type(first_block)}, has text: {hasattr(first_block, 'text')}")
            if hasattr(first_block, 'text'):
                response_text = first_block.text.strip()
            else:
                logging.warning(f"First block doesn't have 'text', using str(): {first_block}")
                response_text = str(first_block).strip()
        elif hasattr(message_content, 'text'):
            # Content has a text attribute directly
            response_text = message_content.text.strip()
        else:
            # Fallback: try to get text from the message directly
            logging.warning(f"Message content is not a list and doesn't have 'text', using str(): {message_content}")
            response_text = str(message_content).strip()
        
        logging.info(f"Cohere extraction response (full, {len(response_text)} chars): {response_text}")
        
        # Try multiple strategies to extract JSON
        events = []
        
        # Strategy 1: Try to find JSON array with balanced brackets
        # Find the first [ and then find the matching ]
        bracket_start = response_text.find('[')
        if bracket_start != -1:
            bracket_count = 0
            bracket_end = bracket_start
            for i in range(bracket_start, len(response_text)):
                if response_text[i] == '[':
                    bracket_count += 1
                elif response_text[i] == ']':
                    bracket_count -= 1
                    if bracket_count == 0:
                        bracket_end = i + 1
                        break
            if bracket_count == 0:
                try:
                    json_str = response_text[bracket_start:bracket_end].strip()
                    parsed = json.loads(json_str)
                    if isinstance(parsed, list):
                        events = parsed
                except (json.JSONDecodeError, ValueError) as e:
                    import logging
                    logging.debug(f"JSON parsing failed with bracket matching: {e}, json_str: {json_str[:100] if 'json_str' in locals() else 'N/A'}")
                    pass
        
        # Strategy 2: Try parsing the entire response as JSON
        if not events:
            try:
                parsed = json.loads(response_text)
                if isinstance(parsed, list):
                    events = parsed
            except (json.JSONDecodeError, ValueError) as e:
                import logging
                logging.debug(f"JSON parsing failed on full response: {e}")
                pass
        
        # Strategy 3: Try to find JSON code blocks
        if not events:
            code_block_match = re.search(r'```(?:json)?\s*(\[.*?\])\s*```', response_text, re.DOTALL)
            if code_block_match:
                try:
                    parsed = json.loads(code_block_match.group(1))
                    if isinstance(parsed, list):
                        events = parsed
                except (json.JSONDecodeError, ValueError) as e:
                    import logging
                    logging.debug(f"JSON parsing failed in code block: {e}")
                    pass
        
        # Validate and normalize events
        if not isinstance(events, list):
            logging.warning(f"Extracted events is not a list, type: {type(events)}, value: {events}")
            return []
        
        logging.info(f"Successfully parsed {len(events)} events from Cohere response")
        
        normalized_events = []
        for idx, event in enumerate(events):
            try:
                # Ensure event is a dictionary
                if not isinstance(event, dict):
                    import logging
                    logging.debug(f"Skipping event {idx}: not a dict, type: {type(event)}")
                    continue
                
                # Check if type is valid - use .get() to avoid KeyError
                event_type = event.get("type")
                if not event_type or event_type not in ["symptom", "appointment"]:
                    import logging
                    logging.debug(f"Skipping event {idx}: invalid type '{event_type}', event keys: {list(event.keys()) if isinstance(event, dict) else 'N/A'}")
                    continue
                
                # Ensure date is in correct format
                date_str = event.get("date", today_str)
                if not isinstance(date_str, str):
                    date_str = today_str
                # Validate date format
                try:
                    datetime.strptime(date_str, "%Y-%m-%d")
                except (ValueError, TypeError):
                    # Invalid date, use today
                    date_str = today_str
                
                # Safely get title and details with defaults
                title = event.get("title")
                if not title:
                    title = "Untitled event"
                
                details = event.get("details", "")
                if details is None:
                    details = ""
                
                normalized_events.append({
                    "type": str(event_type),
                    "title": str(title),
                    "details": str(details),
                    "date": date_str
                })
            except Exception as e:
                import logging
                logging.warning(f"Skipping invalid event {idx}: {type(e).__name__}: {e}, event: {event}")
                continue
        
        return normalized_events
            
    except KeyError as e:
        import logging
        logging.error(f"KeyError in extract_timeline_events: {e}. Response text: {response_text[:500] if 'response_text' in locals() else 'N/A'}")
        return []
    except json.JSONDecodeError as e:
        import logging
        logging.error(f"JSON decode error in extract_timeline_events: {e.msg} at position {e.pos}. Response text: {response_text[:500] if 'response_text' in locals() else 'N/A'}")
        return []
    except (ValueError, TypeError) as e:
        import logging
        logging.error(f"Value/Type error in extract_timeline_events: {e}. Response text: {response_text[:500] if 'response_text' in locals() else 'N/A'}")
        return []
    except Exception as e:
        import logging
        error_msg = str(e)
        error_type = type(e).__name__
        logging.error(f"Failed to extract timeline events: {error_type}: {error_msg}", exc_info=True)
        # Log the response text for debugging if available
        try:
            if 'response_text' in locals():
                logging.error(f"Full Cohere response text: {response_text}")
        except:
            pass
        return []
