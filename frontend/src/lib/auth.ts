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
