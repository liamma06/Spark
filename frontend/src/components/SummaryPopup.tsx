import { useNavigate } from 'react-router-dom';

interface SummaryPopupProps {
  isOpen: boolean;
  summary: string;
  onClose: () => void;
}

export function SummaryPopup({ isOpen, summary, onClose }: SummaryPopupProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleReturnToDashboard = () => {
    navigate('/patient');
  };

  // Simple markdown rendering (basic support for **bold**, *italic*, and lists)
  const renderMarkdown = (text: string) => {
    // Split by lines and process
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

  // Process inline formatting (**bold**, *italic*)
  const processInlineFormatting = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    let currentIndex = 0;

    // Match **bold** and *italic*
    const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Add formatted text
      if (match[1].startsWith('**')) {
        // Bold
        parts.push(<strong key={match.index}>{match[2]}</strong>);
      } else {
        // Italic
        parts.push(<em key={match.index}>{match[3]}</em>);
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">Conversation Summary</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-slate max-w-none">
            {renderMarkdown(summary)}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={handleReturnToDashboard}
            className="px-6 py-2.5 bg-gradient-to-r from-green-gradient-dark to-green-gradient-light text-white rounded-full font-medium hover:opacity-90 transition-all shadow-sm"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
