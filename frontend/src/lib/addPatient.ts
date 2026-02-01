import type { Patient } from "../types";

export async function addPatient(
  patient: Patient,
): Promise<{ success: boolean }> {
  const res = await fetch("http://localhost:8000/auth/getuser");

  if (!res.ok) {
    return { success: false };
  }

  const { uid }: { uid: string } = await res.json();

  const body = {
    patientId: patient.id,
    doctorId: uid,
  };

  const res2 = await fetch("http://localhost:8000/api/patient_doctors/", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res2.ok) {
    return { success: false };
  }

  return { success: true };
}
