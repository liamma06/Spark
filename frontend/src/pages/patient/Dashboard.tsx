import { Link } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { useTimeline } from '../../hooks/usePatients';
import { Timeline } from '../../components/Timeline';
import { RoleToggle } from '../../components/RoleToggle';

export function PatientDashboard() {
  const { currentPatientId } = useAppStore();
  const { events, loading } = useTimeline(currentPatientId);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-2xl">🏥</Link>
            <h1 className="text-xl font-bold text-slate-800">CareBridge</h1>
          </div>
          <RoleToggle />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Welcome back! 👋</h2>
          <p className="text-slate-600">How are you feeling today?</p>
        </div>

        {/* Quick actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Link
            to="/patient/chat"
            className="p-6 bg-sky-500 text-white rounded-2xl hover:bg-sky-600 transition-colors shadow-lg shadow-sky-500/25"
          >
            <div className="text-3xl mb-3">💬</div>
            <h3 className="text-lg font-semibold">Talk to Care Companion</h3>
            <p className="text-sky-100 text-sm mt-1">
              Describe your symptoms or ask health questions
            </p>
          </Link>

          <div className="p-6 bg-white rounded-2xl border border-slate-200">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="text-lg font-semibold text-slate-800">Upcoming</h3>
            <p className="text-slate-500 text-sm mt-1">
              No upcoming appointments
            </p>
          </div>
        </div>

        {/* Timeline */}
        <Timeline events={events} loading={loading} />
      </main>
    </div>
  );
}
