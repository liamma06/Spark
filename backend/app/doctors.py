"""
Doctor–patient connection logic (Supabase).
Similar to app.supabase: one module for doctor/patient_doctors data.
"""

from fastapi import HTTPException

from app.supabase import supabase


def get_my_patients(doctor_id: str) -> list:
    """
    List all patients connected to this doctor.
    Raises HTTPException 404 if doctor not found, 500 on Supabase error.
    """
    try:
        doc = supabase.table("doctors").select("id").eq("id", doctor_id).execute()
        if not doc.data or len(doc.data) == 0:
            raise HTTPException(status_code=404, detail="Doctor not found")
        links = supabase.table("patient_doctors").select("patient_id").eq("doctor_id", doctor_id).execute()
        if not links.data:
            return []
        patient_ids = [r["patient_id"] for r in links.data]
        res = supabase.table("patients").select("*").in_("id", patient_ids).execute()
        return res.data or []
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_patient_doctors(patient_id: str) -> list:
    """
    List all doctors connected to this patient.
    Raises HTTPException 404 if patient not found, 500 on Supabase error.
    """
    try:
        pat = supabase.table("patients").select("id").eq("id", patient_id).execute()
        if not pat.data or len(pat.data) == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
        links = supabase.table("patient_doctors").select("doctor_id").eq("patient_id", patient_id).execute()
        if not links.data:
            return []
        doctor_ids = [r["doctor_id"] for r in links.data]
        res = supabase.table("doctors").select("*").in_("id", doctor_ids).execute()
        return res.data or []
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def connect_patient_doctor(patient_id: str, doctor_id: str) -> dict:
    """
    Connect a doctor to a patient (insert into patient_doctors).
    Returns {"message": "Linked", ...} or {"message": "Already linked", ...} on duplicate.
    Raises HTTPException 404 if patient/doctor not found, 500 on other error.
    """
    try:
        pat = supabase.table("patients").select("id").eq("id", patient_id).execute()
        doc = supabase.table("doctors").select("id").eq("id", doctor_id).execute()
        if not pat.data or len(pat.data) == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
        if not doc.data or len(doc.data) == 0:
            raise HTTPException(status_code=404, detail="Doctor not found")
        supabase.table("patient_doctors").insert({
            "patient_id": patient_id,
            "doctor_id": doctor_id,
        }).execute()
        return {"message": "Linked", "patient_id": patient_id, "doctor_id": doctor_id}
    except HTTPException:
        raise
    except Exception as e:
        err_msg = str(e).lower()
        if "duplicate" in err_msg or "unique" in err_msg or "conflict" in err_msg:
            return {"message": "Already linked", "patient_id": patient_id, "doctor_id": doctor_id}
        raise HTTPException(status_code=500, detail=str(e))


def disconnect_patient_doctor(patient_id: str, doctor_id: str) -> dict:
    """
    Remove the connection between a doctor and a patient.
    Returns {"message": "Unlinked", ...}. Raises HTTPException 404 if link not found.
    """
    try:
        res = supabase.table("patient_doctors").delete().eq("patient_id", patient_id).eq("doctor_id", doctor_id).execute()
        if res.data is not None and len(res.data) > 0:
            return {"message": "Unlinked", "patient_id": patient_id, "doctor_id": doctor_id}
        raise HTTPException(status_code=404, detail="Link not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
