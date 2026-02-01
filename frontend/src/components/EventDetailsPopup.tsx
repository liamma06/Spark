import type { TimelineEvent } from "../types";

interface EventDetailsPopupProps {
  isOpen: boolean;
  event: TimelineEvent | null;
  onClose: () => void;
  onDelete: (eventId: string) => Promise<void>;
  isDeleting?: boolean;
}

export function EventDetailsPopup({ isOpen, event, onClose, onDelete, isDeleting = false }: EventDetailsPopupProps) {
  if (!isOpen || !event) return null;

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      await onDelete(event.id);
      onClose();
    }
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const getEventTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">Event Details</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">
                Type
              </label>
              <p className="text-slate-800">{getEventTypeLabel(event.type)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">
                Title
              </label>
              <p className="text-slate-800 font-medium">{event.title}</p>
            </div>
            {event.details && (
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">
                  Details
                </label>
                <p className="text-slate-800 whitespace-pre-wrap">{event.details}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">
                Date
              </label>
              <p className="text-slate-800">{formatDate(event.createdAt)}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDeleting ? "Deleting..." : "Delete Event"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
