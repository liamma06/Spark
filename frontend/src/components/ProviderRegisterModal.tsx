import { useState } from "react";
import type { Provider } from "../types";

interface ProviderRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (provider: Provider) => void;
  loading?: boolean;
}

export function ProviderRegisterModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}: ProviderRegisterModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");

  const handleNextStep = () => {
    if (name.trim() && address.trim() && specialty.trim()) {
      setCurrentStep(2);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = () => {
    if (name.trim() && address.trim() && specialty.trim() && bio.trim()) {
      onSubmit({
        name: name.trim(),
        address: address.trim(),
        specialty: specialty.trim(),
        bio: bio.trim(),
      });
      setName("");
      setAddress("");
      setSpecialty("");
      setBio("");
      setCurrentStep(1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30  flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-gradient-dark to-green-gradient-light text-white p-6">
          <h2 className="text-2xl font-semibold">
            Create Your Provider Profile
          </h2>
          <p className="text-accent-secondary-text text-sm mt-1">
            {currentStep === 1
              ? "Let's start with your basic information"
              : "Tell us about yourself"}
          </p>
          <div className="flex gap-2 mt-4">
            <div
              className={`h-1 flex-1 rounded ${
                currentStep >= 1 ? "bg-white" : "bg-white bg-opacity-30"
              }`}
            />
            <div
              className={`h-1 flex-1 rounded ${
                currentStep >= 2 ? "bg-white" : "bg-white bg-opacity-30"
              }`}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {currentStep === 1 ? (
            <>
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your address"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {/* Specialty */}
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Specialty
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Enter your specialty (e.g., Cardiology)"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
            </>
          ) : (
            <>
              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Professional Bio
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Write a short bio about yourself and your experience
                </p>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell patients about your experience, qualifications, and approach to care..."
                  rows={6}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                />
                <p className="text-xs text-slate-400 mt-2">
                  {bio.length}/500 characters
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200">
          {currentStep === 2 && (
            <button
              onClick={handlePreviousStep}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
          )}
          {currentStep === 1 ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleNextStep}
                disabled={
                  !name.trim() ||
                  !address.trim() ||
                  !specialty.trim() ||
                  loading
                }
                className="flex-1 px-4 py-2 bg-gradient-to-br from-green-gradient-dark to-green-gradient-light text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 flex items-center justify-center"
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
                  "Next"
                )}
              </button>
            </>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!bio.trim() || loading}
              className="flex-1 px-4 py-2 bg-gradient-to-br from-green-gradient-dark to-green-gradient-light text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 flex items-center justify-center"
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
                "Create Profile"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
