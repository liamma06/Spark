import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../../stores/appStore";
import { useTimeline } from "../../hooks/usePatients";
import { Timeline } from "../../components/Timeline";
import { dummyTimelineEvents } from "../../types/dummyTimeline";
import CircleArrow from "../../components/CircleArrow";
import Timeline2 from "../../components/Timeline2";
import { signOut } from "../../lib/auth";

export function PatientDashboard() {
  const navigate = useNavigate();
  const { currentPatientId } = useAppStore();
  const { events, loading } = useTimeline(currentPatientId);

  const handleSignOut = () => {
    signOut()
    navigate("/");
  };

  return (
    <div className=" bg-bg p-8">
      {/* Main */}
      <main className="bg-bg p-4 gap-3 rounded-2xl w-full">
        {/* Welcome */}
        <div className="rounded-2xl bg-bg p-4 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-medium  text-slate-800 ">
                Welcome back!
              </h2>
              <p className="secondary-text">How are you feeling today?</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="pl-4 pr-6 py-3 rounded-full bg-white border flex items-center gap-2 cursor-pointer"
                style={{ borderColor: "#3f7b56", color: "#3f7b56" }}
                title="Add"
              >
                <svg
                  className="w-4 h-4 text-slate-800"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                <span className="text-sm font-medium">Add</span>
              </button>
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
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="grid grid-cols-1 gap-3">
            <Link
              to="/patient/chat"
              className="p-6 bg-linear-to-b from-green-gradient-dark to-green-gradient-light text-white rounded-2xl "
            >
              <div className="grid grid-cols-2 justify-items-end">
                <div className="flex flex-col w-full">
                  <h3 className="text-lg font-medium">
                    Chat With Care Compainion
                  </h3>
                  <p className="text-white/70 text-sm">
                    Chat with your care compainion
                  </p>
                </div>
                <CircleArrow colorFill></CircleArrow>
              </div>
            </Link>
            <Link
              to="/patient/chat"
              className="flex flex-col gap-1 p-6 bg-white rounded-2xl transition-colors"
            >
              <div className="grid grid-cols-2 justify-items-end">
                <div>
                  <h3 className="text-lg font-medium">Book Appointment</h3>
                  <p className="text-secondary-text text-sm">
                    Book an appointment with your primary care provider
                  </p>
                </div>
                <CircleArrow></CircleArrow>
              </div>
            </Link>
          </div>

          <div className="p-6 bg-white rounded-2xl ">
            <h3 className="text-lg font-medium text-slate-800 pb-1">
              Next Appointment
            </h3>
            <p className="text-slate-500 text-sm">
              Your next appointments will appear here...
            </p>
            <div className="pt-15  text-slate-500 text-sm w-full text-center">
              No appointments booked...
            </div>
            <div className=" mb-10 mt-1 text-sm w-full text-center text-primary cursor-pointer hover:underline">
              Book appointments here
            </div>
          </div>
        </div>
        <div>
          {/* Timeline */}
          <Timeline2 events={dummyTimelineEvents}></Timeline2>
        </div>
      </main>
    </div>
  );
}
