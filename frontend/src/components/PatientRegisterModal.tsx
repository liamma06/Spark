import { useState } from "react";
import type { Patient } from "../types";

interface PatientRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (patient: Patient) => void;
  loading?: boolean;
}

const COMMON_CONDITIONS = [
  "Hypertension",
  "Type 2 Diabetes",
  "Asthma",
  "GERD",
  "Anxiety Disorder",
  "Depression",
];

export function PatientRegisterModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}: PatientRegisterModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [address, setAddress] = useState("");
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [customCondition, setCustomCondition] = useState("");

  const handleAddCondition = (condition: string) => {
    if (!selectedConditions.includes(condition)) {
      setSelectedConditions([...selectedConditions, condition]);
    }
  };

  const handleRemoveCondition = (condition: string) => {
    setSelectedConditions(selectedConditions.filter((c) => c !== condition));
  };

  const handleAddCustomCondition = () => {
    if (
      customCondition.trim() &&
      !selectedConditions.includes(customCondition)
    ) {
      setSelectedConditions([...selectedConditions, customCondition]);
      setCustomCondition("");
    }
  };

  const handleNextStep = () => {
    if (name.trim() && age && address.trim()) {
      setCurrentStep(2);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = () => {
    if (name.trim() && age && address.trim() && selectedConditions.length > 0) {
      onSubmit({
        name: name.trim(),
        age: parseInt(age),
        conditions: selectedConditions,
        address: address,
      });
      setName("");
      setAge("");
      setAddress("");
      setSelectedConditions([]);
      setCustomCondition("");
      setCurrentStep(1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20  flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-gradient-dark to-green-gradient-light text-white p-6">
          <h2 className="text-2xl font-semibold">Create Your Profile</h2>
          <p className="text-accent-secondary-text text-sm mt-1">
            {currentStep === 1
              ? "Let's start with your basic information"
              : "Now tell us about your health"}
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

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter your age"
                  min="1"
                  max="150"
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
            </>
          ) : (
            <>
              {/* Conditions */}
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-3">
                  Medical Conditions
                </label>

                {/* Common conditions */}
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-slate-500 font-medium">
                    Select common conditions:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {COMMON_CONDITIONS.map((condition) => (
                      <button
                        key={condition}
                        onClick={() =>
                          selectedConditions.includes(condition)
                            ? handleRemoveCondition(condition)
                            : handleAddCondition(condition)
                        }
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedConditions.includes(condition)
                            ? "bg-gradient-to-br from-green-gradient-dark to-green-gradient-light text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {condition}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom condition */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCondition}
                    onChange={(e) => setCustomCondition(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddCustomCondition();
                      }
                    }}
                    placeholder="Add custom condition"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
                  />
                  <button
                    onClick={handleAddCustomCondition}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90"
                  >
                    Add
                  </button>
                </div>

                {/* Selected conditions */}
                {selectedConditions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedConditions.map((condition) => (
                      <span
                        key={condition}
                        className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm flex items-center gap-2"
                      >
                        {condition}
                        <button
                          onClick={() => handleRemoveCondition(condition)}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
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
                disabled={!name.trim() || !age || !address.trim() || loading}
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
              disabled={selectedConditions.length === 0 || loading}
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
