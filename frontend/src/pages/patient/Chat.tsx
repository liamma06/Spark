import { useState, useRef, useEffect } from "react";
import { useAppStore } from "../../stores/appStore";
import { Chat as ChatComponent } from "../../components/Chat";
import { SummaryPopup } from "../../components/SummaryPopup";
import { getCurrentUserId } from "../../lib/auth";

export function PatientChat() {
  const { currentPatientId } = useAppStore();
  const [userId, setUserId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const chatEndCallRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    getCurrentUserId().then((id) => {
      setUserId(id || null);
    });
  }, []);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/IconGreen.svg"
              alt="CareBridge AI"
              className="w-12 h-12 rounded-2xl"
            />
            <div>
              <h1 className="text-2xl font-medium text-slate-800">
                Care Companion
              </h1>
              <p className="text-sm secondary-text mt-0.5">
                Your AI healthcare assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!callEnded && (
              <button
                onClick={async () => {
                  setCallEnded(true);
                  if (chatEndCallRef.current) {
                    await chatEndCallRef.current();
                  }
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-sm flex items-center gap-2"
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
                    d="M16 8l-8 8m0-8l8 8"
                  />
                </svg>
                End Call
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Chat takes full remaining height with wider layout for 3D model */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-8">
        <div className="h-[calc(100vh-180px)]">
          <ChatComponent 
            patientId={currentPatientId || userId || ""} 
            onEndCall={(result) => {
              setSummary(result.summary);
              setShowSummary(true);
            }}
            endCallRef={chatEndCallRef}
          />
        </div>
      </main>

      {/* Summary Popup */}
      <SummaryPopup
        isOpen={showSummary}
        summary={summary}
        onClose={() => setShowSummary(false)}
      />
    </div>
  );
}
