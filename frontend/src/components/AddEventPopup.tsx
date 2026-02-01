import { useState } from "react";
import type { TimelineEventType } from "../types";

interface AddEventPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: TimelineEventType, title: string, details?: string) => Promise<void>;
  isSubmitting?: boolean;
}

const EVENT_TYPES: TimelineEventType[] = [
  "symptom",
  "appointment",
  "medication",
  "alert",
  "chat",
];

export function AddEventPopup({ isOpen, onClose, onSubmit, isSubmitting = false }: AddEventPopupProps) {
  const [eventType, setEventType] = useState<TimelineEventType>("symptom");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please enter a title for the event.");
      return;
    }
    await onSubmit(eventType, title.trim(), details.trim() || undefined);
    // Reset form on success
    setTitle("");
    setDetails("");
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setTitle("");
      setDetails("");
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">Add Timeline Event</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as TimelineEventType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                required
                disabled={isSubmitting}
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                placeholder="Enter event title"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Details (optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                placeholder="Enter event details"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Adding..." : "Add Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
