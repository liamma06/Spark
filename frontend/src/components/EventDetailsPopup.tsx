import type { TimelineEvent } from "../types";

interface EventDetailsPopupProps {
  isOpen: boolean;
  event: TimelineEvent | null;
  onClose: () => void;
  onDelete: (eventId: string) => Promise<void>;
  isDeleting?: boolean;
}

// Markdown rendering functions (reused from SummaryPopup)
const processInlineFormatting = (text: string) => {
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let key = 0;

  // Process **bold**
  const boldRegex = /\*\*(.*?)\*\*/g;
  let match;
  const boldMatches: Array<{ start: number; end: number; text: string }> = [];
  while ((match = boldRegex.exec(text)) !== null) {
    boldMatches.push({ start: match.index, end: match.index + match[0].length, text: match[1] });
  }

  // Process *italic*
  const italicRegex = /(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g;
  const italicMatches: Array<{ start: number; end: number; text: string }> = [];
  while ((match = italicRegex.exec(text)) !== null) {
    italicMatches.push({ start: match.index, end: match.index + match[0].length, text: match[1] });
  }

  // Combine and sort all matches
  const allMatches = [
    ...boldMatches.map(m => ({ ...m, type: 'bold' as const })),
    ...italicMatches.map(m => ({ ...m, type: 'italic' as const }))
  ].sort((a, b) => a.start - b.start);

  // Build parts array
  allMatches.forEach((match) => {
    if (match.start > lastIndex) {
      parts.push(text.substring(lastIndex, match.start));
    }
    if (match.type === 'bold') {
      parts.push(<strong key={key++}>{match.text}</strong>);
    } else {
      parts.push(<em key={key++}>{match.text}</em>);
    }
    lastIndex = match.end;
  });

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let inList = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Headers
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={index} className="text-2xl font-bold mt-6 mb-3 text-slate-800">
          {trimmed.substring(2)}
        </h1>
      );
      inList = false;
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={index} className="text-xl font-bold mt-4 mb-2 text-slate-800">
          {trimmed.substring(3)}
        </h2>
      );
      inList = false;
    } else if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={index} className="text-lg font-semibold mt-3 mb-2 text-slate-700">
          {trimmed.substring(4)}
        </h3>
      );
      inList = false;
    }
    // List items
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        elements.push(<ul key={`list-${index}`} className="list-disc list-inside mb-2 space-y-1" />);
        inList = true;
      }
      const content = trimmed.substring(2);
      const processed = processInlineFormatting(content);
      elements.push(
        <li key={index} className="text-slate-700 ml-4">
          {processed}
        </li>
      );
    }
    // Regular paragraphs
    else if (trimmed) {
      inList = false;
      const processed = processInlineFormatting(trimmed);
      elements.push(
        <p key={index} className="mb-2 text-slate-700">
          {processed}
        </p>
      );
    } else {
      inList = false;
      elements.push(<br key={index} />);
    }
  });

  return elements;
};

export function EventDetailsPopup({ isOpen, event, onClose, onDelete, isDeleting = false }: EventDetailsPopupProps) {
  if (!isOpen || !event) return null;

  const handleDelete = async () => {
    await onDelete(event.id);
    onClose();
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
        className="bg-white rounded-2xl shadow-xl max-w-3xl w-full mx-4 pointer-events-auto flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-slate-800">Event Details</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
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
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">
                Date
              </label>
              <p className="text-slate-800">{formatDate(event.createdAt)}</p>
            </div>
            {event.details && (
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">
                  Details
                </label>
                <div className="text-slate-800 prose prose-slate max-w-none">
                  {renderMarkdown(typeof event.details === 'string' ? event.details : event.details.text || '')}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 flex-shrink-0">
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
  );
}
