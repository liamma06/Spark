import type { TimelineEvent } from "../types";

export async function getTimeline(id: string): Promise<{
  sucess: boolean;
  timeline_events?: TimelineEvent[];
}> {
  const res = await fetch(`http://localhost:8000/api/timeline?patientId=${id}`);

  if (!res.ok) {
    return { sucess: false };
  }
  console.log(res);

  const body: TimelineEvent[] = await res.json();
  return { sucess: true, timeline_events: body };
}
