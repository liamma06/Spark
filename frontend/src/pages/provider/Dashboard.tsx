import { Link, useNavigate } from "react-router-dom";
import { usePatients, useAlerts } from "../../hooks/usePatients";
import { PatientCard } from "../../components/PatientCard";
import { AlertCard } from "../../components/AlertCard";
import { StatCard } from "../../components/StatCard";
import AccentButton from "../../components/AccentButton";
import { dummyTimelineEvents } from "../../types/dummyTimeline";
import { signOut } from "../../lib/auth";
import { useState} from "react";
import type{ Patient } from "../../types";

export function ProviderDashboard() {
  const navigate = useNavigate();
  const { patients, loading: patientsLoading } = usePatients();
  const { alerts, loading: alertsLoading, acknowledgeAlert } = useAlerts();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null> (null);


  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);
  const criticalAlerts = unacknowledgedAlerts.filter(
    (a) => a.severity === "critical",
  );

  const patientTimeline = selectedPatient
    ? dummyTimelineEvents.filter((e) => e.patientId === selectedPatient.id)
    : [];

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "symptom":
        return "🔔";
      case "appointment":
        return "📅";
      case "medication":
        return "💊";
      case "alert":
        return "⚠️";
      case "chat":
        return "💬";
      default:
        return "📝";
    }
  };

  return (
    <div className="grid grid-cols-[3fr_1fr] p-8 gap-3 bg-bg">
      <div className="min-h-screen flex flex-col gap-6">
        {/* Main */}
        <div className="bg-bg mx-auto px-6 py-8 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-medium  text-slate-800 ">
                Welcome back!
              </h2>
              <p className="secondary-text">
                Here is an overview of your patients
              </p>
            </div>
            <div className="flex items-center gap-3">
              <AccentButton
                isGreen
                onClick={handleSignOut}
                icon={
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                  </svg>
                }
              >
                Sign Out
              </AccentButton>
            </div>
          </div>
        </div>

        {/* Patient Stats Section */}
        { <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-medium text-slate-800 mb-4">
            {selectedPatient?.name ?? ""} - Patient Details
          </h3>
          <div className="grid grid-cols-6 gap-4 mb-6">
            <div className="bg-gradient-to-br bg-slate-200  rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1">Age</p>
              <p className="text-2xl font-bold text-slate-800">
                {selectedPatient?.age}
              </p>
            </div>
            <div className="bg-gradient-to-br bg-slate-200 rounded-lg p-4 col-span-2">
              <p className="text-sm text-slate-600 mb-1">Address</p>
              <p className="text-sm font-semibold text-slate-800">
                {selectedPatient?.address}
              </p>
            </div>
            <div className="bg-gradient-to-br bg-slate-200  rounded-lg p-4 col-span-3">
              <p className="text-sm text-slate-600 mb-1">Conditions</p>
              <p className="text-sm font-semibold text-slate-800 gap-2 space-x-2">
                {selectedPatient?.conditions.map((condition, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-sm rounded-full bg-green-gradient-light text-slate-100 font-medium"
                  >
                    {condition}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>}

        {/* Timeline Section */}
        {(patientTimeline != null)? <div className="bg-white rounded-2xl p-6 shadow-sm flex-1">
          <h3 className="text-xl font-medium text-slate-800 mb-4">
            Patient Timeline
          </h3>
          <div className="space-y-4 overflow-y-auto max-h-96 pr-4">
            {patientTimeline.length > 0 ? (
              patientTimeline.map((event, index) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-lg">
                      {getTypeIcon(event.type)}
                    </div>
                    {index < patientTimeline.length - 1 && (
                      <div className="w-1 h-12 bg-slate-200 mt-2"></div>
                    )}
                  </div>
                  <div className="pb-4 flex-1">
                    <p className="font-medium text-slate-800">{event.title}</p>
                    {event.details && (
                      <p className="text-sm text-slate-600 mt-1">
                        {event.details}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-8">
                No timeline events yet
              </p>
            )}
          </div>
        </div>: null}
      </div>
      <div className="flex flex-col h-[95vh]">
        <div className="mb-8 h-full bg-linear-to-br from-green-gradient-dark to-green-gradient-light rounded-2xl p-6 text-white overflow-y-scroll no-scrollbar">
          <div className="text-lg font-medium">Patient List</div>
          <div className="flex flex-col w-full gap-1 items-start justify-between mb-6 overflow-y-scroll mt-4">
            {patients.map((patient, index) => (
              <PatientCard
                key={index}
                patient={patient}
                onClick={() => setSelectedPatient(patient)}
                selected={selectedPatient?.id === patient.id}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
