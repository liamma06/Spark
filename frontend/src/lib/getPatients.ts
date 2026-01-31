import { useEffect, useState } from "react";
import type { Patient } from "../types";

export async function getPatients(): Promise<{
  success: boolean;
  patient_list?: Patient[];
}> {
  const res = await fetch("http://localhost:8000/api/doctors/me/patients");

  if (!res.ok) {
    console.log("error");
    console.log(await res.json());
    return { success: false };
  }

  const body: {
    patients: Patient[];
  } = await res.json();

  return { success: true, patient_list: body.patients };
}

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getPatients().then((res) => {
      setLoading(false);
      if (res.success) {
        setPatients(res.patient_list!);
        setError(false);
      } else {
        console.log("error");
        setError(true);
      }
    });
  });
  return {
    error: error,
    patients: patients,
    loading: loading,
  };
}
