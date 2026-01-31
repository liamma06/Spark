import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { Chat as ChatComponent } from '../../components/Chat';
import { RoleToggle } from '../../components/RoleToggle';

export function PatientChat() {
  const { currentPatientId } = useAppStore();
  const navigate = useNavigate();
  const endChatRef = useRef<(() => Promise<{ closingMessage: string; summary: string } | null>) | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [isEndingChat, setIsEndingChat] = useState(false);
  const [chatEnded, setChatEnded] = useState(false);

  const handleEndChatClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmEndChat = async () => {
    setShowConfirmDialog(false);
    setIsEndingChat(true);
    
    try {
      if (endChatRef.current) {
        const result = await endChatRef.current();
        if (result) {
          setSummary(result.summary);
          setChatEnded(true);
          setIsEndingChat(false);
        }
      }
    } catch (error) {
      console.error('Error ending chat:', error);
      setIsEndingChat(false);
    }
  };

  const handleReturnToDashboard = () => {
    setShowSummaryModal(true);
  };

  const handleCloseSummary = () => {
    setShowSummaryModal(false);
    navigate('/patient');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {chatEnded ? (
              <button
                onClick={handleReturnToDashboard}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 transition-colors"
              >
                Return to Dashboard
              </button>
            ) : (
              <button
                onClick={handleEndChatClick}
                disabled={isEndingChat}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                End Chat
              </button>
            )}
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏥</span>
              <h1 className="text-xl font-bold text-slate-800">Care Companion</h1>
            </div>
          </div>
          <RoleToggle />
        </div>
      </header>

      {/* Chat takes full remaining height with wider layout for 3D model */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <div className="h-[calc(100vh-140px)]">
          <ChatComponent 
            patientId={currentPatientId || 'demo'} 
            onEndChatReady={(endChatFn) => {
              endChatRef.current = endChatFn;
            }}
          />
        </div>
      </main>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">End Chat Session?</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to end this chat session? A summary will be generated and saved to your timeline.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEndChat}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                End Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Chat Session Summary</h3>
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <p className="text-slate-700 whitespace-pre-wrap">{summary}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleCloseSummary}
                className="px-6 py-2 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
