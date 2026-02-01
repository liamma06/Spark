"""
Doctor–patient connection logic (Supabase).
Schema: patients(user_id) and doctors(user_id) are PKs; patient_doctors stores user_ids.
We use user_id everywhere; no resolution to internal id.
"""

from fastapi import HTTPException

from app.supabase import supabase


def create_doctor(
    user_id: str,
    bio: str,
    specialty: str | None = None,
    name: str | None = None,
    email: str | None = None,
    address: str | None = None,
) -> dict:
    """
    Create a doctor row in public.doctors (same pattern as patients: name, address, email).
    Returns the created doctor row. Raises HTTPException on duplicate user_id or Supabase error.
    """
    try:
        payload = {
            "user_id": user_id,
            "specialty": specialty or None,
            "bio": bio or None,
        }
        if name is not None and name != "":
            payload["name"] = name
        if email is not None and email != "":
            payload["email"] = email
        if address is not None and address != "":
            payload["address"] = address
        try:
            res = supabase.table("doctors").insert(payload).execute()
        except Exception as insert_err:
            err_str = str(insert_err).lower()
            # If table doesn't have name/email/address columns yet, insert minimal row so signup succeeds
            if "column" in err_str and ("does not exist" in err_str or "unknown" in err_str):
                payload = {"user_id": user_id, "specialty": specialty or None, "bio": bio or None}
                res = supabase.table("doctors").insert(payload).execute()
            else:
                raise insert_err
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to create doctor")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        err_msg = str(e).lower()
        if "duplicate" in err_msg or "unique" in err_msg or "conflict" in err_msg:
            raise HTTPException(status_code=409, detail="Doctor already exists for this user")
        raise HTTPException(status_code=500, detail=str(e))


def get_profile_by_user_id(user_id: str) -> dict:
    """
    Get profile data by user_id from profiles table.
    Returns full_name, role, email, etc.
    Raises HTTPException 404 if not found, 500 on Supabase error.
    """
    try:
        res = supabase.table("profiles").select("*").eq("id", user_id).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Profile not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_doctor_by_user_id(user_id: str) -> dict:
    """
    Get one doctor by Supabase user_id. Merges in name, email, address from profile
    when missing from doctors row (so patient page gets same shape as patients on provider page).
    """
    try:
        res = supabase.table("doctors").select("*").eq("user_id", user_id).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Doctor not found")
        doctor = dict(res.data[0])
        # Propagate name, email, address from profile if missing (like patients table)
        try:
            profile = get_profile_by_user_id(user_id)
            doctor["name"] = doctor.get("name") or profile.get("full_name") or profile.get("name")
            doctor["email"] = doctor.get("email") or profile.get("email")
            doctor["address"] = doctor.get("address") or profile.get("address")
        except HTTPException:
            pass
        return doctor
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_my_patients(doctor_user_id: str) -> list:
    """
    List all patients connected to this doctor. patient_doctors.doctor_id and patient_id are user_ids.
    """
    try:
        links = supabase.table("patient_doctors").select("patient_id").eq("doctor_id", doctor_user_id).execute()
        if not links.data:
            return []
        patient_user_ids = [r["patient_id"] for r in links.data]
        res = supabase.table("patients").select("*").in_("user_id", patient_user_ids).execute()
        return res.data or []
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_patient_doctors(patient_user_id: str) -> list:
    """
    List all doctors connected to this patient. patient_doctors stores user_ids.
    Returns enriched doctor data using get_doctor_by_user_id for each.
    """
    try:
        links = supabase.table("patient_doctors").select("doctor_id").eq("patient_id", patient_user_id).execute()
        if not links.data:
            return []
        doctor_user_ids = [r["doctor_id"] for r in links.data]
        
        # Get full doctor details for each
        doctors = []
        for doctor_id in doctor_user_ids:
            try:
                doctor = get_doctor_by_user_id(doctor_id)
                doctors.append(doctor)
            except HTTPException:
                # Skip doctors that aren't found
                continue
        
        return doctors
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def connect_patient_doctor(patient_user_id: str, doctor_user_id: str) -> dict:
    """
    Connect a doctor to a patient. patient_doctors stores (patient_id, doctor_id) as user_ids.
    """
    try:
        supabase.table("patient_doctors").insert({
            "patient_id": patient_user_id,
            "doctor_id": doctor_user_id,
        }).execute()
        return {"message": "Linked", "patient_user_id": patient_user_id, "doctor_user_id": doctor_user_id}
    except HTTPException:
        raise
    except Exception as e:
        err_msg = str(e).lower()
        if "duplicate" in err_msg or "unique" in err_msg or "conflict" in err_msg:
            return {"message": "Already linked", "patient_user_id": patient_user_id, "doctor_user_id": doctor_user_id}
        raise HTTPException(status_code=500, detail=str(e))


def disconnect_patient_doctor(patient_user_id: str, doctor_user_id: str) -> dict:
    """
    Remove the connection. patient_doctors keys are user_ids.
    """
    try:
        res = supabase.table("patient_doctors").delete().eq("patient_id", patient_user_id).eq("doctor_id", doctor_user_id).execute()
        if res.data is not None and len(res.data) > 0:
            return {"message": "Unlinked", "patient_user_id": patient_user_id, "doctor_user_id": doctor_user_id}
        raise HTTPException(status_code=404, detail="Link not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
