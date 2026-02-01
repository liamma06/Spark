"""
Timeline events (Supabase).
Schema: timeline_events.patient_id references patients(user_id). We use user_id directly.
"""

import logging
import re
from fastapi import HTTPException

from app.supabase import supabase

logger = logging.getLogger(__name__)

# UUID pattern validation
UUID_PATTERN = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)

def is_valid_uuid(uuid_string: str) -> bool:
    """Check if a string is a valid UUID format."""
    return bool(UUID_PATTERN.match(uuid_string))


def get_timeline(patient_id: str | None = None) -> list:
    """
    List timeline events. If patient_id is set, filter by that patient.
    Note: patient_id in DB references patients table (can be user_id or patient UUID depending on schema).
    """
    # Validate patient_id is a valid UUID if provided
    if patient_id and not is_valid_uuid(patient_id):
        logger.warning(f"Invalid UUID format for patient_id: {patient_id}. Returning empty list.")
        return []
    
    try:
        q = supabase.table("timeline_events").select("*")
        if patient_id:
            q = q.eq("patient_id", patient_id)
        res = q.execute()
        data = res.data or []
        # Sort by created_at descending (newest first)
        # Handle None or missing created_at gracefully
        if data:
            data.sort(key=lambda r: r.get("created_at") or "1970-01-01T00:00:00", reverse=True)
        return data
    except HTTPException as he:
        # Re-raise HTTP exceptions (like 404, 403)
        raise
    except Exception as e:
        import traceback
        error_msg = str(e)
        error_trace = traceback.format_exc()
        logger.error(f"Error fetching timeline events for patient_id={patient_id}: {error_msg}\n{error_trace}")
        # For now, return empty list instead of crashing - allows UI to load
        # TODO: Check if table exists and provide better error message
        return []


def add_event(
    patient_id: str,
    type: str,
    title: str,
    details: str | dict | None = None,
) -> dict:
    """
    Insert a timeline event into public.timeline_events.
    type must be one of: symptom, appointment, medication, alert, chat.
    details can be a string (stored as {"text": details}) or a dict for jsonb.
    Returns the created row.
    """
    try:
        payload = {
            "patient_id": patient_id,
            "type": type,
            "title": title,
        }
        if details is not None:
            payload["details"] = details if isinstance(details, dict) else {"text": str(details)}
        res = supabase.table("timeline_events").insert(payload).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to create timeline event")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def delete_event(event_id: str) -> dict:
    """
    Delete a timeline event from public.timeline_events by id.
    Returns success message or raises HTTPException on error.
    """
    try:
        res = supabase.table("timeline_events").delete().eq("id", event_id).execute()
        return {"success": True, "message": "Timeline event deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
