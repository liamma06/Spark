# Auto-Create Timeline Events from AI Chat

## Overview
Automatically create timeline events when users mention symptoms or appointments during AI chat conversations. The AI will extract relevant information (symptom type, timing, details) and create timeline events automatically.

## Requirements
- Trigger: After each user message is processed
- Event types: Symptoms and appointments
- User notification: Notify user that event was created (no confirmation needed)
- Extract: Symptom type, when it started, and relevant details

## Implementation Plan

### 1. Create Function to Extract Timeline Events from Messages
**File:** `backend/app/cohere_chat.py`
- Add function `extract_timeline_events(message: str, conversation_context: list[dict]) -> list[dict]`
- Use Cohere API to analyze the message and extract:
  - Event type (symptom or appointment)
  - Title (e.g., "Headache started")
  - Details (when it started, severity, etc.)
  - Date (extract from message like "yesterday", "3 days ago", specific dates)
- Return list of event dictionaries with extracted information

### 2. Update Chat Endpoint to Process Events
**File:** `backend/main.py`
- In the `/api/chat` endpoint, after streaming the response:
  - Call `extract_timeline_events()` with the user's last message
  - For each extracted event, create a timeline event using `timeline_add_event()`
  - Include notification in response or log for frontend display

### 3. Add Cohere Extraction Function
**File:** `backend/app/cohere_chat.py`
- Create function that uses Cohere to extract structured data from messages
- Use JSON mode or structured output to get event information
- Parse timing information (relative dates like "yesterday" to actual dates)

### 4. Update System Prompt (Optional)
**File:** `backend/app/cohere_chat.py`
- May need to update system prompt to help AI identify when to extract events
- Or use separate extraction call with specific prompt

## Technical Details
- Use Cohere's structured output or JSON mode for extraction
- Convert relative dates ("yesterday", "3 days ago") to actual dates
- Handle multiple events in a single message
- Only create events for symptoms and appointments (not medications, alerts, or chat events)
