import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../stores/appStore";
import { RoleToggle } from "../components/RoleToggle";

export function Home() {
  const navigate = useNavigate();
  const { role } = useAppStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleStart = async () => {
    const res = await fetch(
      `http://localhost:8000/auth/signin?email=${username}&password=${password}`,
      {
        method: "POST",
      },
    );

    if (!res.ok) {
      console.log("Request did not go through");
      return;
    }
    const body = await res.json();

    console.log(body);

    if (role === "patient") {
      navigate("/patient");
    } else {
      navigate("/provider");
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg"
            style={{ backgroundColor: "#3F7B56" }}
          >
            🏥
          </div>
          <h1 className="text-3xl  text-slate-800">CareBridge AI</h1>
          <p className="font-light text-slate-400 mt-2">
            Your AI-powered healthcare companion
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8">
          <h1 className="font-medium text-[1.7em] pb-5">
            {role == "patient" ? "Patient" : "Provider"} Sign In
          </h1>

          {/* Login Inputs */}
          <div className="space-y-4 ">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>
          <RoleToggle />

          {/* Start Button */}
          <button
            onClick={handleStart}
            className="w-full py-3 text-white rounded-full cursor-pointer transition-colors mt-3 bg-primary"
          >
            Continue as {role === "patient" ? "Patient" : "Provider"}
          </button>
        </div>

        {/* Demo notice */}
        <p className="text-center text-slate-400 text-sm mt-6">
          Demo mode - no login required
        </p>
      </div>
    </div>
  );
}
