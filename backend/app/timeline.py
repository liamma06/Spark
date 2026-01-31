"""
Timeline events (Supabase).
Manages public.timeline_events table for patient timeline.
"""

from fastapi import HTTPException
from typing import Optional

from app.supabase import supabase


def get_timeline(patient_id: Optional[str] = None) -> list:
    """
    Get timeline events.
    If patient_id is provided, returns events for that patient only.
    Otherwise, returns all events.
    Returns list of rows (snake_case keys). Empty list on error or no rows.
    """
    try:
        query = supabase.table("timeline_events").select("*")
        if patient_id:
            query = query.eq("patient_id", patient_id)
        query = query.order("created_at", desc=True)
        res = query.execute()
        return res.data or []
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def add_event(
    patient_id: str,
    type: str,
    title: str,
    details: Optional[dict | str] = None,
) -> dict:
    """
    Add a timeline event to public.timeline_events.
    
    Args:
        patient_id: UUID of the patient
        type: Event type - must be one of: 'symptom', 'appointment', 'medication', 'alert', 'chat'
        title: Event title (required)
        details: Event details as dict (will be stored as JSONB) or string
        
    Returns:
        dict: The created event row
        
    Raises:
        HTTPException: On validation error or Supabase error
    """
    # Validate event type
    valid_types = ["symptom", "appointment", "medication", "alert", "chat"]
    if type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid event type. Must be one of: {', '.join(valid_types)}"
        )
    
    try:
        payload = {
            "patient_id": patient_id,
            "type": type,
            "title": title,
        }
        
        # Handle details - if dict, store as JSONB; if string, store as text in JSONB
        if details is not None:
            if isinstance(details, dict):
                payload["details"] = details
            else:
                # Store string as JSONB with a "text" key for consistency
                payload["details"] = {"text": str(details)}
        
        res = supabase.table("timeline_events").insert(payload).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to create timeline event")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
