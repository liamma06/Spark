import type { TimelineEvent } from "../types";

export async function getTimeline(): Promise<{
  sucess: boolean;
  timeline_events?: TimelineEvent[];
}> {
  const res = await fetch("http://localhost:8000/api/timeline");

  if (!res.ok) {
    return { sucess: false };
  }

  const body: { events: TimelineEvent[] } = await res.json();

  return { sucess: true, timeline_events: body.events };
}
