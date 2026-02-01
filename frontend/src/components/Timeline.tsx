import { useState } from "react";
import { cn, formatDate, getEventIcon, getRiskColor } from "../lib/utils";
import type { TimelineEvent, TimelineEventType } from "../types";
import { timelineApi } from "../lib/api";

interface TimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
  patientId?: string;
  onEventsChange?: () => void;
}

const EVENT_TYPES: TimelineEventType[] = [
  "symptom",
  "appointment",
  "medication",
  "alert",
  "chat",
];

export function Timeline({ events, loading, patientId, onEventsChange }: TimelineProps) {
  console.log("Timeline component rendered", { patientId, eventsCount: events.length });
  const [filter, setFilter] = useState<TimelineEventType | "all">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Test function to verify button works
  const handleButtonClick = () => {
    alert("Button clicked! Current state: " + showAddForm);
    console.log("Button handler called");
    setShowAddForm(!showAddForm);
  };
  const [newEventType, setNewEventType] = useState<TimelineEventType>("symptom");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDetails, setNewEventDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    
    try {
      await timelineApi.delete(eventId);
      if (onEventsChange) {
        onEventsChange();
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Failed to delete event. Please try again.");
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !newEventTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await timelineApi.create(
        patientId,
        newEventType,
        newEventTitle.trim(),
        newEventDetails.trim() || undefined
      );
      setShowAddForm(false);
      setNewEventTitle("");
      setNewEventDetails("");
      if (onEventsChange) {
        onEventsChange();
      }
    } catch (error) {
      console.error("Failed to create event:", error);
      alert("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEvents =
    filter === "all" ? events : events.filter((e) => e.type === filter);

  // Sort by date descending
  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-800">
            Health Timeline
          </h2>
          <button
            type="button"
            onClick={handleButtonClick}
            style={{ zIndex: 10, position: 'relative' }}
            className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors cursor-pointer"
          >
            {showAddForm ? "Cancel" : "+ Add Event"}
          </button>
        </div>
        {showAddForm && patientId && (
          <form onSubmit={handleAddEvent} className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Type
                </label>
                <select
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value as TimelineEventType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                  required
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                  placeholder="Enter event title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Details (optional)
                </label>
                <textarea
                  value={newEventDetails}
                  onChange={(e) => setNewEventDetails(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                  placeholder="Enter event details"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !newEventTitle.trim()}
                className="w-full px-4 py-2 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Adding..." : "Add Event"}
              </button>
            </div>
          </form>
        )}
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
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-800">
                          {event.title}
                        </h3>
                        {event.details && (
                          <p className="text-sm text-slate-600 mt-1">
                            {typeof event.details === 'string' 
                              ? event.details 
                              : event.details.text || JSON.stringify(event.details)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {formatDate(event.created_at)}
                        </span>
                        {patientId && (
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Delete event"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
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
