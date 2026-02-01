import { useEffect, useState } from "react";
import type { Provider } from "../types";
import { getCurrentUserId } from "./auth";

export async function getMyDoctors(userId: string): Promise<{
  success: boolean;
  doctors?: Provider[];
}> {
  try {
    const res = await fetch(
      `http://localhost:8000/api/patients/${userId}/doctors`,
    );

    if (!res.ok) {
      console.error("Error fetching doctors:", await res.json());
      return { success: false };
    }

    const body: Provider[] = await res.json();
    console.log(body);

    return { success: true, doctors: body };
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return { success: false };
  }
}

export function useMyDoctors() {
  const [doctors, setDoctors] = useState<Provider[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      const userId = await getCurrentUserId();

      if (!userId) {
        setError(true);
        setLoading(false);
        return;
      }

      const res = await getMyDoctors(userId);

      if (res.success) {
        setDoctors(res.doctors || []);
        setError(false);
      } else {
        setError(true);
      }

      setLoading(false);
    };

    fetchDoctors();
  }, []);

  return {
    doctors,
    error,
    loading,
  };
}
