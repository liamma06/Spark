"""
Timeline events (Supabase).
Schema: timeline_events.patient_id references patients(user_id). We use user_id directly.
"""

import logging
import re
from fastapi import HTTPException

from app.supabase import supabase
from app.patients import resolve_patient_id, create_patient

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

    resolved_patient_id = None
    if patient_id:
        resolved_patient_id = resolve_patient_id(patient_id)
        if not resolved_patient_id:
            logger.warning(f"No patient found for identifier: {patient_id}. Returning empty list.")
            return []
    
    try:
        q = supabase.table("timeline_events").select("*")
        if resolved_patient_id:
            q = q.eq("patient_id", resolved_patient_id)
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
    created_at: str | None = None,
) -> dict:
    """
    Insert a timeline event into public.timeline_events.
    type must be one of: symptom, appointment, medication, alert, chat.
    details can be a string (stored as {"text": details}) or a dict for jsonb.
    created_at is optional ISO date string (YYYY-MM-DD). If not provided, uses database default.
    Returns the created row.
    """
    try:
        resolved_patient_id = resolve_patient_id(patient_id)
        if not resolved_patient_id:
            # Try to auto-create patient record if it doesn't exist
            # This handles cases where user signed up but patient record wasn't created
            logger.warning(f"No patient found for identifier: {patient_id}. Attempting to auto-create patient record.")
            try:
                # Try to get user info from Supabase auth to create patient record
                # Check if this is a valid user_id by trying to get user from profiles
                profile_res = supabase.table("profiles").select("*").eq("id", patient_id).execute()
                if profile_res.data and len(profile_res.data) > 0:
                    profile = profile_res.data[0]
                    if profile.get("role") == "patient":
                        # Create patient record with minimal info
                        patient_record = create_patient(
                            name=profile.get("full_name", "Patient"),
                            age=0,  # Default age, user can update later
                            address="",
                            user_id=patient_id,
                            conditions=[]
                        )
                        resolved_patient_id = patient_record.get("id")
                        logger.info(f"Auto-created patient record with id: {resolved_patient_id}")
                    else:
                        logger.error(f"User {patient_id} is not a patient (role: {profile.get('role')})")
                        raise HTTPException(status_code=403, detail="User is not a patient")
                else:
                    logger.error(f"User {patient_id} not found in profiles table")
                    raise HTTPException(status_code=404, detail="User not found")
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Failed to auto-create patient record: {e}", exc_info=True)
                raise HTTPException(status_code=404, detail=f"Patient not found for timeline event and could not auto-create: {str(e)}")
        
        if not resolved_patient_id:
            logger.error(f"Cannot create timeline event. No patient found for identifier: {patient_id}")
            raise HTTPException(status_code=404, detail="Patient not found for timeline event")
        payload = {
            "patient_id": resolved_patient_id,
            "type": type,
            "title": title,
        }
        if details is not None:
            payload["details"] = details if isinstance(details, dict) else {"text": str(details)}
        if created_at is not None:
            # Convert YYYY-MM-DD to ISO datetime string for PostgreSQL timestamptz
            # Add time component (00:00:00) if not present
            if len(created_at) == 10:  # YYYY-MM-DD format
                payload["created_at"] = f"{created_at}T00:00:00"
            else:
                payload["created_at"] = created_at
        res = supabase.table("timeline_events").insert(payload).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to create timeline event")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating timeline event: {e}", exc_info=True)
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
