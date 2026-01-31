const API_BASE = 'http://localhost:8000/api';

// Generic fetch wrapper
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
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
  getAll: () => apiFetch<import('../types').Patient[]>('/patients'),
  getById: (id: string) => apiFetch<import('../types').Patient>(`/patients/${id}`),
};

// Timeline API
export const timelineApi = {
  getByPatient: (patientId: string) => 
    apiFetch<import('../types').TimelineEvent[]>(`/timeline?patientId=${patientId}`),
};

// Alerts API
export const alertsApi = {
  getAll: () => apiFetch<import('../types').Alert[]>('/alerts'),
  getByPatient: (patientId: string) => 
    apiFetch<import('../types').Alert[]>(`/alerts?patientId=${patientId}`),
  acknowledge: (id: string) => 
    apiFetch<import('../types').Alert>(`/alerts/${id}/acknowledge`, { method: 'POST' }),
};

// Chat API (streaming)
export async function* streamChat(
  messages: { role: string; content: string }[],
  patientId: string
): AsyncGenerator<string> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, patientId }),
  });

  if (!res.ok || !res.body) {
    throw new Error('Chat stream failed');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value);
  }
}
