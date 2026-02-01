import { useParams, Link } from "react-router-dom";
import { usePatient, useTimeline, useAlerts } from "../../hooks/usePatients";
import { Timeline } from "../../components/Timeline";
import { AlertCard } from "../../components/AlertCard";
import { DecisionGraph } from "../../components/DecisionGraph";
import { RoleToggleRegister } from "../../components/RoleToggle";
import { cn, getRiskColor } from "../../lib/utils";
import type { DecisionGraph as DecisionGraphType } from "../../types";

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const { patient, loading: patientLoading } = usePatient(id || null);
  const { events, loading: timelineLoading, refetch: refetchTimeline } = useTimeline(id || null);
  const { alerts, acknowledgeAlert } = useAlerts(id);

  // Mock decision graph based on patient risk level
  const mockGraph: DecisionGraphType = patient
    ? {
        nodes: [
          { id: "1", label: "Chest tightness", type: "symptom" },
          { id: "2", label: "Shortness of breath", type: "symptom" },
          {
            id: "3",
            label: "Age > 60",
            type: "factor",
            riskContribution: "medium",
          },
          {
            id: "4",
            label: "Diabetes history",
            type: "factor",
            riskContribution: "high",
          },
          {
            id: "5",
            label: "Cardiac symptoms",
            type: "factor",
            riskContribution: "high",
          },
          { id: "6", label: "Urgent evaluation", type: "recommendation" },
          { id: "7", label: "ECG recommended", type: "recommendation" },
        ],
        edges: [
          { from: "1", to: "5" },
          { from: "2", to: "5" },
          { from: "3", to: "6" },
          { from: "4", to: "6" },
          { from: "5", to: "6" },
          { from: "5", to: "7" },
        ],
      }
    : { nodes: [], edges: [] };

  if (patientLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-slate-600">Patient not found</p>
          <Link
            to="/provider"
            className="text-sky-500 hover:underline mt-2 block"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const patientAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/provider"
              className="text-slate-600 hover:text-slate-800 transition-colors"
            >
              ← Back
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏥</span>
              <h1 className="text-xl font-bold text-slate-800">
                Patient Detail
              </h1>
            </div>
          </div>
          <RoleToggleRegister />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Patient Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-2xl">
              {patient.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-800">
                {patient.name}
              </h2>
              <p className="text-slate-500">Age {patient.age}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {patient.conditions.map((condition, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full"
                  >
                    {condition}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <span
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold capitalize",
                  getRiskColor(patient.riskLevel),
                )}
              >
                {patient.riskLevel} Risk
              </span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {patientAlerts.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              🚨 Active Alerts
            </h3>
            <div className="space-y-4">
              {patientAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={acknowledgeAlert}
                />
              ))}
            </div>
          </div>
        )}

        {/* Two column layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Decision Graph */}
          <DecisionGraph graph={mockGraph} />

          {/* Timeline */}
          <Timeline 
            events={events} 
            loading={timelineLoading} 
            patientId={id || undefined}
            onEventsChange={refetchTimeline}
          />
        </div>

        {/* Summary packet */}
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">
              📋 Summary Packet
            </h3>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Print / Export
            </button>
          </div>
          <div className="prose prose-sm max-w-none text-slate-600">
            <p>
              <strong>Patient:</strong> {patient.name}, {patient.age} years old
            </p>
            <p>
              <strong>Conditions:</strong>{" "}
              {patient.conditions.join(", ") || "None reported"}
            </p>
            <p>
              <strong>Current Risk Level:</strong>{" "}
              <span className="capitalize">{patient.riskLevel}</span>
            </p>
            <p>
              <strong>Recent Events:</strong> {events.length} events in timeline
            </p>
            <p>
              <strong>AI Recommendation:</strong> Based on reported symptoms and
              medical history, this patient may benefit from further cardiac
              evaluation. The combination of age, diabetes history, and recent
              chest tightness symptoms warrant closer monitoring.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
