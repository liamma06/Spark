"""
Patient data (Supabase).
Same pattern as app.doctors: one module for public.patients.
"""

import logging
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


logger = logging.getLogger(__name__)


def get_patient_by_id(patient_id: str) -> dict:
    """
    Get one patient by patients.id.
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


def get_patient_by_user_id(user_id: str) -> dict:
    """
    Get one patient by patients.user_id (auth user id).
    Raises HTTPException 404 if not found, 500 on Supabase error.
    """
    try:
        res = supabase.table("patients").select("*").eq("user_id", user_id).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_patient(identifier: str) -> dict:
    """
    Get one patient by patients.id or patients.user_id.
    Tries id first, then user_id.
    """
    try:
        return get_patient_by_id(identifier)
    except HTTPException as he:
        if he.status_code != 404:
            raise
    return get_patient_by_user_id(identifier)


def resolve_patient_id(identifier: str) -> str | None:
    """
    Resolve a patient identifier to patients.id.
    Accepts either patients.id or patients.user_id. Returns None if not found.
    """
    if not identifier:
        logger.warning("resolve_patient_id called with empty identifier")
        return None
    
    logger.info(f"Resolving patient_id for identifier: {identifier}")
    
    try:
        res = supabase.table("patients").select("id").eq("id", identifier).execute()
        if res.data and len(res.data) > 0:
            patient_id = res.data[0].get("id")
            logger.info(f"Found patient by id: {patient_id}")
            return patient_id
    except Exception as e:
        logger.warning(f"Failed to resolve patient id by patients.id: {e}")

    try:
        res = supabase.table("patients").select("id").eq("user_id", identifier).execute()
        if res.data and len(res.data) > 0:
            patient_id = res.data[0].get("id")
            logger.info(f"Found patient by user_id: {patient_id}")
            return patient_id
        else:
            logger.warning(f"No patient found for user_id: {identifier}. Available patients: {supabase.table('patients').select('id, user_id, name').execute().data if True else 'N/A'}")
    except Exception as e:
        logger.error(f"Failed to resolve patient id by patients.user_id: {e}", exc_info=True)

    logger.error(f"Could not resolve patient_id for identifier: {identifier}")
    return None




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
