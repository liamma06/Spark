const API_BASE = "http://localhost:8000/api";

// Generic fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

// Patients API
export const patientsApi = {
  getAll: () => apiFetch<import("../types").Patient[]>("/patients"),
  getById: (id: string) =>
    apiFetch<import("../types").Patient>(`/patients/${id}`),
};

// Timeline API
export const timelineApi = {
  getByPatient: (patientId: string) =>
    apiFetch<import("../types").TimelineEvent[]>(
      `/timeline?patientId=${patientId}`,
    ),
  create: (
    patientId: string,
    type: string,
    title: string,
    details?: string,
    date?: string,
  ) =>
    apiFetch<import("../types").TimelineEvent>("/timeline", {
      method: "POST",
      body: JSON.stringify({
        patientId,
        type,
        title,
        details,
        createdAt: date,
      }),
    }),
  delete: (eventId: string) =>
    apiFetch<{ success: boolean; message: string }>(`/timeline/${eventId}`, {
      method: "DELETE",
    }),
};

// Alerts API
export const alertsApi = {
  getAll: () => apiFetch<import("../types").Alert[]>("/alerts"),
  getByPatient: (patientId: string) =>
    apiFetch<import("../types").Alert[]>(`/alerts?patientId=${patientId}`),
  acknowledge: (id: string) =>
    apiFetch<import("../types").Alert>(`/alerts/${id}/acknowledge`, {
      method: "POST",
    }),
};

// Chat API (streaming)
export async function* streamChat(
  messages: { role: string; content: string }[],
  patientId: string,
): AsyncGenerator<string> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, patientId }),
  });

  if (!res.ok || !res.body) {
    throw new Error("Chat stream failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value);
  }
}

// Greeting API - Get initial hardcoded greeting
export async function getGreeting(): Promise<{ text: string }> {
  const res = await fetch(`${API_BASE}/chat/greeting`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Failed to get greeting");
  }

  return res.json();
}

// End Call API - Get closing message and summary
export async function endCall(
  messages: { role: string; content: string }[],
  patientId: string,
): Promise<{ closingMessage: string; summary: string }> {
  const res = await fetch(`${API_BASE}/chat/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, patientId }),
  });

  if (!res.ok) {
    throw new Error("Failed to end call");
  }

  return res.json();
}

// TTS API - Generate speech audio from text
export async function generateSpeech(
  text: string,
  voiceId?: string,
): Promise<Blob> {
  const res = await fetch(`${API_BASE}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice_id: voiceId }),
  });

  if (!res.ok) {
    // Try to extract error message from response
    let errorMessage = "TTS generation failed";
    try {
      const errorData = await res.json();
      if (errorData.detail) {
        errorMessage = `TTS generation failed: ${errorData.detail}`;
      } else if (errorData.message) {
        errorMessage = `TTS generation failed: ${errorData.message}`;
      }
    } catch (e) {
      // If response is not JSON, use status text
      errorMessage = `TTS generation failed: ${res.status} ${res.statusText}`;
    }

    console.error("TTS API Error:", {
      status: res.status,
      statusText: res.statusText,
      message: errorMessage,
      text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
      voiceId: voiceId || "default",
    });

    throw new Error(errorMessage);
  }

  return res.blob();
}
