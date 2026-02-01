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

export function ProviderDashboard() {
  const navigate = useNavigate();
  const patients = usePatients();
  const [addPatients, setAddPatients] = useState(false);
  const { alerts, loading: alertsLoading, acknowledgeAlert } = useAlerts();

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);
  const criticalAlerts = unacknowledgedAlerts.filter(
    (a) => a.severity === "critical",
  );

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  return (
    <div className="grid grid-cols-[3fr_1fr] p-8 gap-3 bg-bg">
      <div className="min-h-screen">
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
                onClick={() => {
                  setAddPatients(true);
                }}
                icon={
                  <svg
                    className="w-4 h-4 text-slate-800"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                }
              >
                Add Patient
              </AccentButton>

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

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard
              title="Total Patients"
              stat={patients.patients.length}
              badgeStat="5"
              badgeDetails="More Patients This Month"
              statColor="text-slate-800"
            />
            <StatCard
              title="Active Alerts"
              stat={unacknowledgedAlerts.length}
              badgeStat="2"
              badgeDetails="More Critical Patients"
              statColor="text-amber-500"
            />
            <StatCard
              title="Critical"
              stat={criticalAlerts.length}
              badgeStat="2"
              badgeDetails="More Critical Patients"
              statColor="text-red-500"
            />
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
                Summary
              </h2>
            </section>
          </div>
        </div>
      </div>
      {/* Patient Side List */}
      <div className="flex flex-col h-[95vh]">
        <div className="mb-8 h-full bg-linear-to-br from-green-gradient-dark to-green-gradient-light rounded-2xl p-6 text-white overflow-y-scroll no-scrollbar">
          <div className="text-lg font-medium">Patient List</div>

          {patients.loading ? (
            <div className="flex flex-col w-full gap-3 mt-4 ">
              <div className="h-16 bg-white/20 rounded-lg" />
              <div className="h-16 bg-white/20 rounded-lg" />
              <div className="h-16 bg-white/20 rounded-lg" />
              <div className="h-16 bg-white/20 rounded-lg" />
            </div>
          ) : (
            <div className="flex flex-col w-full gap-1 items-start justify-between mb-6 overflow-y-scroll mt-4">
              {patients.patients.map((patient, index) => (
                <PatientCard key={index} patient={patient} />
              ))}
            </div>
          )}
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
