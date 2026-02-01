import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../stores/appStore";
import { RoleToggleRegister } from "../components/RoleToggle";
import { login, registerPatient, registerProvider } from "../lib/auth";
import type { LoginError } from "../lib/auth";
import { PatientRegisterModal } from "../components/PatientRegisterModal";
import { ProviderRegisterModal } from "../components/ProviderRegisterModal";
import type { Patient, Provider } from "../types";

export function RegisterPage() {
  const navigate = useNavigate();
  const { role } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);

  const errorMessages: Record<LoginError, string> = {
    empty_fields: "Please enter both username and password",
    invalid_credentials: "Invalid username or password",
    server_error: "An error occurred. Please try again later",
    incorrect_role: "Incorrect role"
  };
  const registerProviderInternal = async (
    email: string,
    password: string,
    pro: Provider,
  ) => {
    setModal(false);
    const res = await registerProvider(email, password, pro);

    if (res.success) {
      navigate("/provider");
      setError(null);
      setLoading(false);
    } else {
      setError("invalid_credentials");
      setLoading(false);
    }
  };
  const registerPatientInternal = async (
    email: string,
    password: string,
    pat: Patient,
  ) => {
    setModal(false);
    const res = await registerPatient(email, password, pat);

    if (res.success) {
      navigate("/patient");
      setError(null);
      setLoading(false);
    } else {
      setError("invalid_credentials");
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (email == "" || password == "") {
      setError("empty_fields");
    } else {
      setLoading(true);
      setModal(true);
      setError(null);
    }
  };

  const handleInputChange = () => {
    setError(null);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-lg flex max-w-2xl w-full overflow-hidden h-150 flex-row-reverse">
        {/* Right side - Form */}
        <div className="flex-1 p-8 flex flex-col justify-center">
          <h1 className="font-medium text-[1.7em] pb-5">
            {role == "patient" ? "Patient" : "Provider"} Registration
          </h1>

          {/* Login Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Email
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
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
          <RoleToggleRegister></RoleToggleRegister>
          <a
            className="text-primary text-sm hover:underline"
            onClick={() => {navigate("/")}}
          >
            Already Registered?  Sign in
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
              `Register as ${role === "patient" ? "Patient" : "Provider"}`
            )}
          </button>
          
          {/* Demo notice */}
          <p className="text-center text-slate-400 text-sm mt-6">
            Demo mode - no login required
          </p>
        </div>

        {/* Left side - Logo & Title */}
        <div className="flex-1 bg-gradient-to-br from-green-gradient-dark to-green-gradient-light flex flex-col items-center justify-center p-8">
          <img
            src="/Logo.png"
            alt="CareBridge AI"
            className="w-20 h-20 mb-4 rounded-2xl"
          />
          <h1 className="text-3xl font-bold text-slate-100 text-center">CareBridge AI</h1>
          <p className="font-light text-slate-200 mt-4 text-center max-w-xs">
            Your AI-powered healthcare companion
          </p>
        </div>
      </div>
      {role == "provider" ? (
        <ProviderRegisterModal
          isOpen={modal}
          onClose={() => {
            setLoading(false);
            setModal(false);
          }}
          onSubmit={(pro) => {
            registerProviderInternal(email, password, pro);
          }}
        ></ProviderRegisterModal>
      ) : (
        <PatientRegisterModal
          isOpen={modal}
          onClose={() => {
            setLoading(false);
            setModal(false);
          }}
          onSubmit={(pat) => {
            registerPatientInternal(email, password, pat);
          }}
        ></PatientRegisterModal>
      )}
    </div>
  );
}
