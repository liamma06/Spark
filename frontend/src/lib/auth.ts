import type { Patient, Provider, UserRole } from "../types";

export type LoginError =
  | "empty_fields"
  | "invalid_credentials"
  | "server_error"
  | "incorrect_role";

export async function login(
  email: string,
  password: string,
  role: UserRole,
): Promise<{ success: boolean; error?: LoginError; userId?: string }> {
  if (email == "" || password == "") {
    return { success: false, error: "empty_fields" };
  }
  const res = await fetch(
    `http://localhost:8000/auth/signin?email=${email}&password=${password}&role=${role == "provider" ? "doctor" : "patient"}`,
    {
      method: "POST",
    },
  );
  if (res.status === 401) {
    return { success: false, error: "incorrect_role" };
  }
  if (!res.ok) {
    console.log("Request did not go through");
    return { success: false, error: "invalid_credentials" };
  }
  const body = await res.json();
  console.log(body);
  const userId = typeof body === "string" ? body : body?.user?.id || body?.id;
  if (userId) {
    localStorage.setItem("userId", userId);
  }
  return { success: true, userId };
}
export async function registerPatient(
  email: string,
  password: string,
  patient: Patient,
): Promise<{ success: boolean; error?: LoginError }> {
  if (email == "" || password == "") {
    return { success: false, error: "empty_fields" };
  }
  const body = {
    email: email,
    password: password,
    age: patient.age,
    address: patient.address,
    condition: patient.conditions,
    name: patient.name,
  };
  const res = await fetch("http://localhost:8000/auth/patient/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // 3. Set the Content-Type header
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return { error: "invalid_credentials", success: false };
  }
  const jsonBody = await res.json();
  console.log(jsonBody);

  return { success: true };
}
export async function registerProvider(
  email: string,
  password: string,
  provider: Provider,
): Promise<{ success: boolean; error?: LoginError }> {
  if (email == "" || password == "") {
    return { success: false, error: "empty_fields" };
  }
  const body = {
    email: email,
    password: password,
    speciality: provider.specialty,
    address: provider.address,
    bio: provider.bio,
    name: provider.name,
  };
  const res = await fetch("http://localhost:8000/auth/doctor/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // 3. Set the Content-Type header
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return { error: "invalid_credentials", success: false };
  }

  const jsonBody = await res.json();
  console.log(jsonBody);
  return { success: true };
}

export async function signOut() {
  const res = await fetch("http://localhost:8000/auth/signout", {
    method: "POST",
  });

  if (!res.ok) {
    return { error: "invalid_credentials", success: false };
  }

  localStorage.removeItem("userId");
  return { success: true };
}

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cached = localStorage.getItem("userId");
    if (cached) {
      // Verify with backend that this user ID is still valid
      const res = await fetch(`http://localhost:8000/auth/getuser?userId=${cached}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 200 && data.user?.id) {
          return data.user.id;
        }
      }
      // If verification fails, clear cache and try again
      localStorage.removeItem("userId");
    }
    const res = await fetch("http://localhost:8000/auth/getuser");
    if (!res.ok) {
      console.error("getCurrentUserId: Response not OK", res.status);
      return null;
    }
    const data = await res.json();
    console.log("getCurrentUserId response:", data);
    if (data.status === 200 && data.user?.id) {
      console.log("Found user ID:", data.user.id);
      localStorage.setItem("userId", data.user.id);
      return data.user.id;
    }
    console.warn("getCurrentUserId: No user ID found in response", data);
    return null;
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
}
