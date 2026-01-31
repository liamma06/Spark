"""
Timeline events (Supabase).
Uses public.timeline_events: id, patient_id, type, title, details (jsonb), created_at.
"""

from fastapi import HTTPException

from app.supabase import supabase


def get_timeline(patient_id: str | None = None) -> list:
    """
    List timeline events from public.timeline_events.
    If patient_id is set, filter by that patient; otherwise return all.
    Returns list of rows (snake_case keys). Empty list on error or no rows.
    """
    try:
        q = supabase.table("timeline_events").select("*").order("created_at", desc=True)
        if patient_id:
            q = q.eq("patient_id", patient_id)
        res = q.execute()
        return res.data or []
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
