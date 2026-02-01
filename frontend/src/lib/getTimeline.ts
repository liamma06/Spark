import type { TimelineEvent } from "../types";

export async function getTimeline(id: string): Promise<{
  success: boolean;
  timeline_events?: TimelineEvent[];
}> {
  const res = await fetch(`http://localhost:8000/api/timeline?patientId=${id}`);

  if (!res.ok) {
    return { success: false };
  }

  const body: TimelineEvent[] = await res.json();
  return { success: true, timeline_events: body };
}
