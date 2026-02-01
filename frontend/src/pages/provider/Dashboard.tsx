import { useNavigate } from "react-router-dom";
import { useAlerts } from "../../hooks/usePatients";
import { PatientCard } from "../../components/PatientCard";
import { AlertCard } from "../../components/AlertCard";
import { StatCard } from "../../components/StatCard";
import AccentButton from "../../components/AccentButton";
import { signOut } from "../../lib/auth";
import { usePatients } from "../../lib/getPatients";
import { AddPatientModal } from "../../components/AddPatientModal";
import { useState } from "react";
import { addPatient } from "../../lib/addPatient";
import type{ Patient, TimelineEvent } from "../../types";
import { getTimeline } from "../../lib/getTimeline";
import Timeline2 from "../../components/Timeline2";

export function ProviderDashboard() {
  const navigate = useNavigate();
  const patients = usePatients();
  const [addPatients, setAddPatients] = useState(false);
  const { alerts, loading: alertsLoading, acknowledgeAlert } = useAlerts();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null> (null);
  const [patientTimeline, setSelectedTimeline] = useState<TimelineEvent[]> ([]);



  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);


  const handleSignOut = () => {
    signOut();
    navigate("/");
  };


  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    getTimeline(patient.user_id)
      .then((res) => {
        console.log(res);
        if (res.success){
          setSelectedTimeline(res.timeline_events!);
        }
        else{
          console.log(res);
        }
      })
    
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
    <div className="grid grid-cols-[5fr_0.7fr] p-8 gap-8 bg-bg px-[120px]">
      <div className="min-h-screen flex flex-col gap-6">
        {/* Main */}
        <div className="bg-bg px-6 py-8 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-medium  text-slate-800 text-left">
                Welcome back!
              </h2>
              <p className="secondary-text">
                Here is an overview of your patients
              </p>
            </div>
            <div className="flex items-center gap-3">
              
            </div>
          </div>
        </div>

        {/* Patient Stats Section */}
        {selectedPatient ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-medium text-slate-800 mb-4">
              {selectedPatient.name} - Patient Details
            </h3>
            <div className="grid grid-cols-6 gap-4 mb-6">
              <div className="bg-gradient-to-br bg-slate-200 rounded-lg p-4 h-32 flex flex-col justify-between">
                <p className="text-md text-slate-600">Age</p>
                <p className="text-2xl font-bold text-slate-800">
                  {selectedPatient.age}
                </p>
              </div>
              <div className="bg-gradient-to-br bg-slate-200 rounded-lg p-4 col-span-2 h-32 flex flex-col justify-between">
                <p className="text-md text-slate-600">Address</p>
                <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                  {selectedPatient.address}
                </p>
              </div>
              <div className="bg-gradient-to-br bg-slate-200 rounded-lg p-4 col-span-3 h-32 flex flex-col justify-between overflow-hidden">
                <p className="text-md text-slate-600">Conditions</p>
                <div className="flex flex-wrap gap-2 overflow-y-auto scrollbar-hide">
                  {selectedPatient.conditions.map((condition, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-sm rounded-full bg-green-gradient-light text-slate-100 font-medium"
                    >
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-sm flex items-center justify-center min-h-64">
            <div className="text-center">
              <p className="text-slate-400 text-lg">No patient selected</p>
              <p className="text-slate-300 text-sm mt-2">Select a patient from the list to view their details</p>
            </div>
          </div>
        )}

        {/* Timeline Section */}
        {`${patientTimeline.length} bababoeey`}
        {patientTimeline.length > 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm flex-1">
            <h3 className="text-xl font-medium text-slate-800 mb-4">Patient Timeline</h3>
            <div className="space-y-4 overflow-y-auto max-h-96 pr-4">
              <Timeline2 events={patientTimeline}/>
              
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-sm flex items-center justify-center flex-1">
            <div className="text-center">
              <p className="text-slate-400 text-lg">
                {selectedPatient ? "No timeline events" : "Select a patient to view timeline"}
              </p>
              <p className="text-slate-300 text-sm mt-2">
                {selectedPatient ? "This patient has no recorded events yet" : "Timeline events will appear here"}
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col h-[95vh] sticky top-8">
        <div className="mb-8 h-full bg-linear-to-br from-green-gradient-dark to-green-gradient-light rounded-2xl p-6 text-white overflow-hidden flex flex-col">
          {/* Header */}
          <div className="text-lg font-medium mb-4">Patient List</div>

          {/* Patient List */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {patients.loading ? (
              <div className="flex flex-col w-full gap-3">
                <div className="h-16 bg-white/20 rounded-lg" />
                <div className="h-16 bg-white/20 rounded-lg" />
                <div className="h-16 bg-white/20 rounded-lg" />
                <div className="h-16 bg-white/20 rounded-lg" />
              </div>
            ) : (
              <div className="flex flex-col w-full gap-2">
                {patients.patients.map((patient, index) => (
                  <PatientCard
                    key={index}
                    patient={patient}
                    onClick={() => handleSelectPatient(patient)}
                    selected={selectedPatient?.id === patient.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Logo and Buttons at bottom */}
          <div className="mt-6 pt-6 border-t border-white/20 flex flex-col items-center gap-3">

            {/* Buttons Container */}
            <div className="flex flex-col gap-2 w-full">
              {/* Add Patient Button */}
              <button
                onClick={() => setAddPatients(true)}
                className="w-full bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-all duration-300 font-semibold text-white shadow-md hover:shadow-lg active:scale-95 overflow-hidden flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                <span className="whitespace-nowrap">
                  Add Patient
                </span>
              </button>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="w-full bg-red-500/50 hover:bg-red-500/60 p-3 rounded-xl transition-all duration-300 font-semibold text-white shadow-md hover:shadow-lg active:scale-95 overflow-hidden flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                </svg>
                <span className="whitespace-nowrap">
                  Sign Out
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <AddPatientModal
        isOpen={addPatients}
        onClose={() => {
          setAddPatients(false);
        }}
        onAddPatient={(pat) => {
          addPatient(pat);
        }}
      ></AddPatientModal>
    </div>
  );
}
