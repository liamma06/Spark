import type { Patient } from "../types";

export async function searchPatients(
  name: string,
): Promise<{ success: boolean; patients?: Patient[] }> {
  const res = await fetch(
    `http://localhost:8000/api/patients/search?name=${name}`,
  );

  if (!res.ok) {
    return { success: false };
  }

  const body: Patient[] = await res.json();

  return { success: true, patients: body };
}
