"""
Patient data (Supabase).
Same pattern as app.doctors: one module for public.patients.
"""

from fastapi import HTTPException

from app.supabase import supabase


def get_patients() -> list:
    """
    List all patients from public.patients.
    Returns list of rows (snake_case keys). Empty list on error or no rows.
    """
    try:
        res = supabase.table("patients").select("*").execute()
        return res.data or []
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_patient(patient_id: str) -> dict:
    """
    Get one patient by id.
    Raises HTTPException 404 if not found, 500 on Supabase error.
    """
    try:
        res = supabase.table("patients").select("*").eq("id", patient_id).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def create_patient(
    name: str,
    age: int,
    user_id: str | None = None,
    conditions: list | None = None,
) -> dict:
    """
    Create a patient row in public.patients.
    Returns the created row. Raises HTTPException on duplicate user_id or Supabase error.
    """
    try:
        payload = {
            "name": name,
            "age": age,
            "conditions": conditions if conditions is not None else [],
        }
        if user_id is not None:
            payload["user_id"] = user_id
        res = supabase.table("patients").insert(payload).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to create patient")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        err_msg = str(e).lower()
        if "duplicate" in err_msg or "unique" in err_msg or "conflict" in err_msg:
            raise HTTPException(status_code=409, detail="Patient already exists for this user")
        raise HTTPException(status_code=500, detail=str(e))


def update_patient_risk(patient_id: str, risk_level: str) -> dict:
    """
    Update a patient's risk_level.
    Raises HTTPException 404 if patient not found, 500 on Supabase error.
    """
    try:
        res = supabase.table("patients").update({"risk_level": risk_level}).eq("id", patient_id).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
