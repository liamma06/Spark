import type { TimelineEvent, TimelineEventType } from "../types";
import AccentButton from "./AccentButton";

interface Timeline2Props {
  events: TimelineEvent[];
}
function Timeline2(props: Timeline2Props) {
  const sortedEvents = () => {
    return props.events.sort((a, b) => {
      return a.createdAt.getTime() > b.createdAt.getTime() ? 1 : -1;
    });
  };
  return (
    <div className="bg-white flex flex-col p-6 rounded-2xl">
      <div className="text-lg font-medium pb-2">Health Timeline</div>
      <div
        className="flex flex-col justify-center bg-bg w-full h-70 rounded-2xl relative overflow-x-scroll scroll-m"
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
              <AccentButton
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
