import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTimeline } from "../../hooks/usePatients";
import { dummyTimelineEvents } from "../../types/dummyTimeline";
import CircleArrow from "../../components/CircleArrow";
import Timeline2 from "../../components/Timeline2";
import { ProviderConnections } from "../../components/ProviderConnections";
import { ProviderProfileModal } from "../../components/ProviderProfileModal";
import { signOut, getCurrentUserId } from "../../lib/auth";
import { useMyDoctors } from "../../lib/getMyDoctor";
import type { Provider } from "../../types";

export function PatientDashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null,
  );

  useEffect(() => {
    // Get the current user's ID (user_id from auth) - this is what we use for timeline events
    getCurrentUserId().then((id) => {
      console.log("Dashboard: Got userId:", id);
      setUserId(id);
    });
  }, []);

  // Use userId for timeline (patient_id in DB is actually user_id)
  const { events, refetch: refetchTimeline } = useTimeline(userId);

  // Fetch user's doctors
  const {
    doctors,
    loading: doctorsLoading,
    error: doctorsError,
  } = useMyDoctors();

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  return (
    <div className=" bg-bg p-8 px-30">
      {/* Main */}
      <main className="bg-bg p-4 gap-3 rounded-2xl w-full">
        {/* Welcome */}
        <div className="rounded-2xl bg-bg p-4 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/IconGreen.svg"
                alt="CareBridge AI"
                className="w-12 h-12 rounded-2xl"
              />
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-medium  text-slate-800 ">
                  Welcome back!
                </h2>
                <p className="secondary-text">How are you feeling today?</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSignOut}
                className="pl-4 pr-6 py-3 rounded-full bg-gradient-to-b from-green-gradient-dark to-green-gradient-light flex items-center gap-2 cursor-pointer"
                title="Sign out"
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                </svg>
                <span className="text-white text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mb-3">
          <Link
            to="/patient/chat"
            className="p-6 bg-linear-to-b from-green-gradient-dark to-green-gradient-light text-white rounded-2xl block"
          >
            <div className="grid grid-cols-2 justify-items-end">
              <div className="flex flex-col w-full">
                <h3 className="text-lg font-medium">
                  Chat With Care Companion
                </h3>
                <p className="text-white/70 text-sm">
                  Chat with your care companion
                </p>
              </div>
              <CircleArrow colorFill></CircleArrow>
            </div>
          </Link>
        </div>
        <div className="pb-3">
          {/* Provider Connections */}
          <ProviderConnections
            providers={doctors}
            error={doctorsError}
            onProviderClick={setSelectedProvider}
          />
        </div>

        {/* Provider Profile Modal */}
        <ProviderProfileModal
          isOpen={selectedProvider !== null}
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
        />

        <div>
          {/* Timeline */}
          {userId ? (
            <Timeline2
              events={events.length > 0 ? events : dummyTimelineEvents}
              patientId={userId}
              onEventsChange={refetchTimeline}
            />
          ) : (
            <div className="bg-white flex flex-col p-6 rounded-2xl">
              <div className="text-lg font-medium pb-2">Health Timeline</div>
              <p className="text-slate-400">Loading user information...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
