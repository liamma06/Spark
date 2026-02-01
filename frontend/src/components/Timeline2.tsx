import { useState } from "react";
import type { TimelineEvent, TimelineEventType } from "../types";
import AccentButton from "./AccentButton";
import { timelineApi } from "../lib/api";

interface Timeline2Props {
  events: TimelineEvent[];
  patientId?: string;
  onEventsChange?: () => void;
}
function Timeline2(props: Timeline2Props) {
  console.log("Timeline2 rendered with patientId:", props.patientId, "props:", props);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEventType, setNewEventType] = useState<TimelineEventType>("symptom");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDetails, setNewEventDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const EVENT_TYPES: TimelineEventType[] = [
    "symptom",
    "appointment",
    "medication",
    "alert",
    "chat",
  ];

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("handleAddEvent called", { 
      patientId: props.patientId, 
      title: newEventTitle, 
      type: newEventType,
      details: newEventDetails 
    });
    
    if (!props.patientId) {
      console.error("No patientId provided");
      alert("Patient ID is required. Please sign in or select a patient.");
      return;
    }
    
    if (!newEventTitle.trim()) {
      console.error("Title is required");
      alert("Please enter a title for the event.");
      return;
    }

    setIsSubmitting(true);
    console.log("Submitting event...");
    try {
      const result = await timelineApi.create(
        props.patientId,
        newEventType,
        newEventTitle.trim(),
        newEventDetails.trim() || undefined
      );
      console.log("Event created successfully:", result);
      setShowAddForm(false);
      setNewEventTitle("");
      setNewEventDetails("");
      if (props.onEventsChange) {
        console.log("Calling onEventsChange");
        props.onEventsChange();
      }
    } catch (error) {
      console.error("Failed to create event:", error);
      alert("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const sortedEvents = () => {
    return props.events.sort((a, b) => {
      return a.createdAt.getTime() > b.createdAt.getTime() ? 1 : -1;
    });
  };
  return (
    <div className="bg-white flex flex-col p-6 rounded-2xl">
      <div className="text-lg font-medium pb-2">Health Timeline</div>
      <div
        className="flex flex-col justify-center w-full h-70 rounded-2xl relative overflow-x-scroll no-scrollbar scroll-m"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        }}
      >
        {/* absolute */}

        <div className="flex flex-row z-10 ml-40">
          {/* start node */}
          {sortedEvents().map((event, index) => {
            return (
              <TimelineNode
                key={index + event.title}
                type={event.type}
                date={event.createdAt}
              >
                <div
                  className={`ml-[0.325em] border-l-2 border-b-2 ${event.type == "medication" ? "border-red-500" : "border-primary"} pt-10 p-3 rounded-bl-2xl mr-10 mt-3`}
                >
                  <div className="text-sm font-medium pb-1">{event.title}</div>
                  <div className="text-xs">{event.details}</div>
                </div>
              </TimelineNode>
            );
          })}
          <TimelineNode noTail date={new Date()} type={"medication"}>
            <div className="pt-4 h-full flex flex-col justify-center w-fit">
              {!showAddForm ? (
                <AccentButton
                  onClick={() => {
                    console.log("Add Event button clicked in Timeline2");
                    setShowAddForm(true);
                  }}
                  icon={
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
                      />
                    </svg>
                  }
                >
                  Add Event
                </AccentButton>
              ) : (
                <form 
                  onSubmit={(e) => {
                    console.log("Form onSubmit triggered");
                    handleAddEvent(e);
                  }}
                  className="bg-white p-4 rounded-lg border border-slate-200 min-w-[300px]"
                >
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
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setNewEventTitle("");
                          setNewEventDetails("");
                        }}
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        onClick={(e) => {
                          console.log("Submit button clicked");
                          // Let the form handle submission
                        }}
                        disabled={isSubmitting || !newEventTitle.trim()}
                        className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmitting ? "Adding..." : "Add"}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </TimelineNode>
        </div>
      </div>
    </div>
  );
}
interface TimelineNodeProps {
  date: Date;
  children?: React.ReactNode;
  type: TimelineEventType;
  noTail?: boolean;
}
function TimelineNode(props: TimelineNodeProps) {
  const date = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };
  return (
    <div className="flex flex-col min-w-70">
      <div className="text-xs pb-4 opacity-60">{date(props.date)}</div>
      <div className="flex flex-row justify-start items-center">
        <div className="rounded-full h-3 w-3 bg-primary flex items-center justify-center">
          <div className="rounded-full h-2 w-2 bg-bg"></div>
        </div>

        {!props.noTail ? (
          <div className="rounded-full w-full h-0.5 bg-primary mx-2"></div>
        ) : undefined}
      </div>
      {props.children}
    </div>
  );
}

export default Timeline2;
