import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../stores/appStore";
import { RoleToggle } from "../components/RoleToggle";
import { login } from "../lib/auth";
import type { LoginError } from "../lib/auth";

export function Home() {
  const navigate = useNavigate();
  const { role } = useAppStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);

  const errorMessages: Record<LoginError, string> = {
    empty_fields: "Please enter both username and password",
    invalid_credentials: "Invalid username or password",
    server_error: "An error occurred. Please try again later",
    incorrect_role: "Signed into the wrong role"
  };

  const handleStart = async () => {
    setError(null);
    setLoading(true);
    const res = await login(username, password, role);
    setLoading(false);
    if (res.success) {
      if (role === "patient") {
        navigate("/patient");
      } else {
        navigate("/provider");
      }
    } else if (res.error) {
      setError(res.error);
    }
  };

  const handleInputChange = () => {
    setError(null);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-lg flex max-w-2xl w-full overflow-hidden h-150">
        {/* Left side - Form */}
        <div className="flex-1 p-8 flex flex-col justify-center">
          <h1 className="font-medium text-[1.7em] pb-5">
            {role == "patient" ? "Patient" : "Provider"} Sign In
          </h1>

          {/* Login Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  handleInputChange();
                }}
                placeholder="Enter your Email"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  handleInputChange();
                }}
                placeholder="Enter your password"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>
          <RoleToggle></RoleToggle>
          <a
            className="text-primary text-sm hover:underline"
            onClick={() => {navigate("/register")}}
          >
            Register?
          </a>
          <div className="text-red-400 text-sm ml-1">
            {error ? errorMessages[error] : ""}
          </div>
          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-3 text-white rounded-full cursor-pointer transition-colors mt-9 bg-primary disabled:opacity-70 flex items-center justify-center"
          >
            {loading ? (
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            ) : (
              `Continue as ${role === "patient" ? "Patient" : "Provider"}`
            )}
          </button>

          {/* Demo notice */}
          <p className="text-center text-slate-400 text-sm mt-6">
            Demo mode - no login required
          </p>
        </div>

        {/* Right side - Logo & Title */}
        <div className="flex-1 bg-gradient-to-br from-green-gradient-dark to-green-gradient-light flex flex-col items-center justify-center p-8">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-4 shadow-lg"
            style={{ backgroundColor: "#3F7B56" }}
          >
            🏥
          </div>
          <h1 className="text-3xl font-bold text-slate-100 text-center">CareBridge AI</h1>
          <p className="font-light text-slate-200 mt-4 text-center max-w-xs">
            Your AI-powered healthcare companion
          </p>
        </div>
      </div>
    </div>
  );
}
