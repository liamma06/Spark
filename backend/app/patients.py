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


def get_patient(user_id: str) -> dict:
    """
    Get one patient by user_id.
    Raises HTTPException 404 if not found, 500 on Supabase error.
    """
    try:
        res = supabase.table("patients").select("*").eq("", user_id).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




def search_patients_by_name(name_query: str) -> list:
    """
    Search patients by name (partial, case-insensitive).
    Returns list of matching rows (snake_case keys). Empty list if query is empty or no matches.
    """
    q = (name_query or "").strip()
    if not q:
        return []
    try:
        res = (
            supabase.table("patients")
            .select("*")
            .filter("name", "ilike", f"%{q}%")
            .order("name")
            .execute()
        )
        return res.data or []
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def create_patient(
    name: str,
    age: int,
    address: str,
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
            "address": address
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


def update_patient_risk(user_id: str, risk_level: str) -> dict:
    """
    Update a patient's risk_level. Must be 'low', 'medium', or 'high'.
    user_id is the patient's Supabase user_id.
    """
    if risk_level not in ("low", "medium", "high"):
        raise HTTPException(status_code=400, detail="risk_level must be low, medium, or high")
    try:
        res = (
            supabase.table("patients")
            .update({"risk_level": risk_level})
            .eq("user_id", user_id)
            .execute()
        )
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
