import { useState, useRef } from "react";
import { useAppStore } from "../../stores/appStore";
import { Chat as ChatComponent } from "../../components/Chat";
import { RoleToggleRegister } from "../../components/RoleToggle";
import { SummaryPopup } from "../../components/SummaryPopup";

export function PatientChat() {
  const { currentPatientId } = useAppStore();
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState("");
  const chatEndCallRef = useRef<(() => Promise<void>) | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏥</span>
              <h1 className="text-xl font-bold text-slate-800">
                Care Companion
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={async () => {
                if (chatEndCallRef.current) {
                  await chatEndCallRef.current();
                }
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              End Call
            </button>
            <RoleToggleRegister />
          </div>
        </div>
      </header>

      {/* Chat takes full remaining height with wider layout for 3D model */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <div className="h-[calc(100vh-140px)]">
          <ChatComponent 
            patientId={currentPatientId || "demo"} 
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
