import { Link } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { Chat as ChatComponent } from '../../components/Chat';
import { RoleToggle } from '../../components/RoleToggle';

export function PatientChat() {
  const { currentPatientId } = useAppStore();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/patient" 
              className="text-slate-600 hover:text-slate-800 transition-colors"
            >
              ← Back
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏥</span>
              <h1 className="text-xl font-bold text-slate-800">Care Companion</h1>
            </div>
          </div>
          <RoleToggle />
        </div>
      </header>

      {/* Chat takes full remaining height */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6">
        <div className="h-[calc(100vh-140px)]">
          <ChatComponent patientId={currentPatientId || 'demo'} />
        </div>
      </main>
    </div>
  );
}
