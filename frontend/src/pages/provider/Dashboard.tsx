import { Link } from 'react-router-dom';
import { usePatients, useAlerts } from '../../hooks/usePatients';
import { PatientCard } from '../../components/PatientCard';
import { AlertCard } from '../../components/AlertCard';
import { RoleToggle } from '../../components/RoleToggle';

export function ProviderDashboard() {
  const { patients, loading: patientsLoading } = usePatients();
  const { alerts, loading: alertsLoading, acknowledgeAlert } = useAlerts();

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);
  const criticalAlerts = unacknowledgedAlerts.filter((a) => a.severity === 'critical');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-2xl">🏥</Link>
            <h1 className="text-xl font-bold text-slate-800">CareBridge</h1>
            <span className="text-sm text-slate-500">Provider Portal</span>
          </div>
          <RoleToggle />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <p className="text-sm text-slate-500">Total Patients</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">
              {patients.length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <p className="text-sm text-slate-500">Active Alerts</p>
            <p className="text-3xl font-bold text-amber-500 mt-1">
              {unacknowledgedAlerts.length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <p className="text-sm text-slate-500">Critical</p>
            <p className="text-3xl font-bold text-red-500 mt-1">
              {criticalAlerts.length}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Alerts Section */}
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              🚨 Active Alerts
            </h2>
            {alertsLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-24 bg-slate-200 rounded-xl" />
                <div className="h-24 bg-slate-200 rounded-xl" />
              </div>
            ) : unacknowledgedAlerts.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <p className="text-4xl mb-2">✅</p>
                <p className="text-slate-500">No active alerts</p>
              </div>
            ) : (
              <div className="space-y-4">
                {unacknowledgedAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={acknowledgeAlert}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Patients Section */}
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              👥 Patients
            </h2>
            {patientsLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-24 bg-slate-200 rounded-xl" />
                <div className="h-24 bg-slate-200 rounded-xl" />
              </div>
            ) : patients.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <p className="text-slate-500">No patients found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {patients.map((patient) => (
                  <Link key={patient.id} to={`/provider/patient/${patient.id}`}>
                    <PatientCard patient={patient} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
