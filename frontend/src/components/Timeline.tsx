import { useState } from "react";
import { cn, formatDate, getEventIcon, getRiskColor } from "../lib/utils";
import type { TimelineEvent, TimelineEventType } from "../types";

interface TimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
}

const EVENT_TYPES: TimelineEventType[] = [
  "symptom",
  "appointment",
  "medication",
  "alert",
  "chat",
];

export function Timeline({ events, loading }: TimelineProps) {
  const [filter, setFilter] = useState<TimelineEventType | "all">("all");

  const filteredEvents =
    filter === "all" ? events : events.filter((e) => e.type === filter);

  // Sort by date descending
  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl ">
      {/* Header with filters */}
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Health Timeline
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium transition-colors",
              filter === "all"
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            All
          </button>
          {EVENT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors",
                filter === type
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {getEventIcon(type)} {type}
            </button>
          ))}
        </div>
      </div>

      {/* Events */}
      <div className="p-6">
        {sortedEvents.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No events to show</p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />

            <div className="space-y-6">
              {sortedEvents.map((event) => (
                <div key={event.id} className="relative pl-10">
                  {/* Icon */}
                  <div className="absolute left-0 w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-sm">
                    {getEventIcon(event.type)}
                  </div>

                  {/* Content */}
                  <div
                    className={cn(
                      "p-4 rounded-lg border",
                      event.type === "alert"
                        ? "border-red-200 bg-red-50"
                        : "border-slate-200 bg-slate-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-slate-800">
                          {event.title}
                        </h3>
                        {event.details && (
                          <p className="text-sm text-slate-600 mt-1">
                            {event.details}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(event.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
