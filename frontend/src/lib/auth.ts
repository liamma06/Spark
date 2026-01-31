import type { Patient, Provider } from "../types";

export type LoginError =
  | "empty_fields"
  | "invalid_credentials"
  | "server_error";

export async function login(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: LoginError }> {
  if (email == "" || password == "") {
    return { success: false, error: "empty_fields" };
  }
  const res = await fetch(
    `http://localhost:8000/auth/signin?email=${email}&password=${password}`,
    {
      method: "POST",
    },
  );

  if (!res.ok) {
    console.log("Request did not go through");
    return { success: false, error: "invalid_credentials" };
  }
  const body = await res.json();
  console.log(body);
  return { success: true };
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
    conditions: patient.conditions,
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
    specialty: provider.specialty,
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
