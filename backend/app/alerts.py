"""
Alerts (Supabase).
Same pattern as app.patients / app.doctors: one module for public.alerts.
"""

from fastapi import HTTPException

from app.supabase import supabase


def get_alerts(patient_id: str | None = None, doctor_id: str | None = None) -> list:
    """
    List alerts from public.alerts, scoped so doctors only see their patients.

    - If doctor_id is set: return alerts only for patients linked to that doctor.
    - Else if patient_id is set: return alerts for that patient only.
    - Else: return empty list (caller must provide patientId or doctorId).

    Returns list of rows (snake_case keys). Empty list when no access or no rows.
    """
    try:
        if doctor_id:
            # Doctors: only alerts for their assigned patients
            links = supabase.table("patient_doctors").select("patient_id").eq("doctor_id", doctor_id).execute()
            if not links.data:
                return []
            patient_ids = [r["patient_id"] for r in links.data]
            res = supabase.table("alerts").select("*").in_("patient_id", patient_ids).execute()
            data = res.data or []
        elif patient_id:
            res = supabase.table("alerts").select("*").eq("patient_id", patient_id).execute()
            data = res.data or []
        else:
            return []
        # Critical first, then by created_at descending (newest first)
        data.sort(key=lambda r: (0 if r.get("severity") == "critical" else 1, r.get("created_at") or ""), reverse=True)
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def acknowledge_alert(alert_id: str) -> dict:
    """
    Set acknowledged = true for an alert.
    Raises HTTPException 404 if not found, 500 on Supabase error.
    """
    try:
        res = supabase.table("alerts").update({"acknowledged": True}).eq("id", alert_id).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Alert not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def create_alert(
    patient_user_id: str,
    severity: str,
    message: str,
    reasoning: str | None = None,
) -> dict:
    """
    Insert an alert row. alerts.patient_id references patients(user_id), so we store patient_user_id.
    severity: 'warning' or 'critical'. Returns the created row.
    """
    try:
        payload = {
            "patient_id": patient_user_id,
            "severity": severity,
            "message": message,
            "reasoning": reasoning,
            "acknowledged": False,
        }
        res = supabase.table("alerts").insert(payload).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to create alert")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
