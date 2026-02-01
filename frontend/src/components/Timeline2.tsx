import { useState } from "react";
import type { TimelineEvent, TimelineEventType } from "../types";
import AccentButton from "./AccentButton";
import { timelineApi } from "../lib/api";
import { AddEventPopup } from "./AddEventPopup";
import { EventDetailsPopup } from "./EventDetailsPopup";
import { getEventBorderColor, getEventDotColor } from "../lib/utils";

interface Timeline2Props {
  events: TimelineEvent[];
  patientId?: string;
  onEventsChange?: () => void;
}
function Timeline2(props: Timeline2Props) {
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
    null,
  );
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddEvent = async (
    type: TimelineEventType,
    title: string,
    details?: string,
    date?: string,
  ) => {
    if (!props.patientId) {
      alert("User ID is required. Please sign in to add events.");
      return;
    }

    setIsSubmitting(true);
    try {
      await timelineApi.create(props.patientId, type, title, details, date);
      setShowAddPopup(false);
      if (props.onEventsChange) {
        props.onEventsChange();
      }
    } catch (error) {
      console.error("Failed to create event:", error);
      alert("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    setIsDeleting(true);
    try {
      await timelineApi.delete(eventId);
      if (props.onEventsChange) {
        props.onEventsChange();
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Failed to delete event. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setShowDetailsPopup(true);
  };
  const sortedEvents = () => {
    return props.events.sort((a, b) => {
      return new Date(a.created_at).getTime() > new Date(b.created_at).getTime()
        ? 1
        : -1;
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
                date={new Date(event.created_at)}
              >
                <div
                  className={`ml-[0.325em] border-l-2 border-b-2 ${getEventBorderColor(event.type)} pt-10 p-3 rounded-bl-2xl mr-10 mt-3`}
                >
                  <button
                    onClick={() => handleEventClick(event)}
                    className="text-sm font-medium pb-1 hover:underline cursor-pointer text-left w-full"
                  >
                    {event.title}
                  </button>
                  {event.details && (
                    <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {event.details.text}
                    </div>
                  )}
                </div>
              </TimelineNode>
            );
          })}
          <TimelineNode noTail date={new Date()} type={"medication"}>
            <div className="pt-4 h-full flex flex-col justify-center w-fit">
              <AccentButton
                onClick={() => setShowAddPopup(true)}
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
            </div>
          </TimelineNode>
        </div>
      </div>
      <AddEventPopup
        isOpen={showAddPopup}
        onClose={() => setShowAddPopup(false)}
        onSubmit={handleAddEvent}
        isSubmitting={isSubmitting}
      />
      <EventDetailsPopup
        isOpen={showDetailsPopup}
        event={selectedEvent}
        onClose={() => {
          setShowDetailsPopup(false);
          setSelectedEvent(null);
        }}
        onDelete={handleDeleteEvent}
        isDeleting={isDeleting}
      />
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
    if (date == undefined) return "Bad JSON boy";
    return date.toLocaleDateString("en-US", options);
  };
  return (
    <div className="flex flex-col min-w-70">
      <div className="text-xs pb-4 opacity-60">{date(props.date)}</div>
      <div className="flex flex-row justify-start items-center">
        <div className={`rounded-full h-3 w-3 ${getEventDotColor(props.type)} flex items-center justify-center`}>
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
