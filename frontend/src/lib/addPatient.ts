import type { Patient } from "../types";

export async function addPatient(
  patient: Patient,
): Promise<{ success: boolean }> {
  const res = await fetch("http://localhost:8000/auth/getuser");

  if (!res.ok) {
    return { success: false };
  }

  const res_body = await res.json();

  const body = {
    patient_id: patient.user_id,
    doctor_id: res_body.uid,
  };

  const res2 = await fetch("http://localhost:8000/api/patient_doctors", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res2.ok) {
    return { success: false };
  }

  return { success: true };
}
