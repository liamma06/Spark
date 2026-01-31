"""
Timeline events (Supabase).
Schema: timeline_events.patient_id references patients(user_id). We use user_id directly.
"""

from fastapi import HTTPException

from app.supabase import supabase


def get_timeline(patient_user_id: str | None = None) -> list:
    """
    List timeline events. If patient_user_id is set, filter by that patient (patient_id in DB is user_id).
    """
    try:
        q = supabase.table("timeline_events").select("*").order("created_at", desc=True)
        if patient_user_id:
            q = q.eq("patient_id", patient_user_id)
        res = q.execute()
        return res.data or []
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def add_event(
    patient_user_id: str,
    type: str,
    title: str,
    details: str | dict | None = None,
) -> dict:
    """
    Insert a timeline event. patient_id in DB is patient's user_id.
    type must be one of: symptom, appointment, medication, alert, chat.
    """
    try:
        payload = {
            "patient_id": patient_user_id,
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
