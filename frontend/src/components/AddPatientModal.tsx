import { useState } from "react";
import type { Patient } from "../types";
import { searchPatients } from "../lib/searchPatients";

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPatient: (patient: Patient) => void;
}

export function AddPatientModal({
  isOpen,
  onClose,
  onAddPatient,
}: AddPatientModalProps) {
  const [currentStep, setCurrentStep] = useState<"search" | "detail">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);

  const filteredPatients = searchQuery.trim()
    ? patients.filter((patient) =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentStep("detail");
  };

  const handleBackToSearch = () => {
    setCurrentStep("search");
    setSelectedPatient(null);
  };

  const handleAddPatient = () => {
    if (selectedPatient) {
      onAddPatient(selectedPatient);
      setSearchQuery("");
      setSelectedPatient(null);
      setCurrentStep("search");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-gradient-dark to-green-gradient-light text-white p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold">
                {currentStep === "search" ? "Add Patient" : "Patient Details"}
              </h2>
              <p className="text-accent-secondary-text text-sm mt-1">
                {currentStep === "search"
                  ? "Search for a patient by name to add to your list"
                  : "Review patient information and add to your list"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Progress indicators */}
          <div className="flex gap-2">
            <div
              className={`h-1 flex-1 rounded ${
                currentStep === "search" ? "bg-white" : "bg-white/30"
              }`}
            />
            <div
              className={`h-1 flex-1 rounded ${
                currentStep === "detail" ? "bg-white" : "bg-white/30"
              }`}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === "search" ? (
            // Search Step
            <div className="space-y-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Patient Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchPatients(e.target.value).then((res) => {
                        if (res.success) {
                          setPatients(res.patients!);
                        }
                      });
                    }}
                    placeholder="Search by patient name..."
                    className="w-full px-4 py-3 pl-11 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-gradient-dark"
                  />
                  <svg
                    className="absolute left-3 top-3.5 w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Results */}
              {searchQuery.trim() ? (
                filteredPatients.length > 0 ? (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-3">
                      Found {filteredPatients.length} match
                      {filteredPatients.length !== 1 ? "es" : ""}
                    </p>
                    <div className="space-y-2">
                      {filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          onClick={() => handleSelectPatient(patient)}
                          className="w-full text-left p-4 border border-slate-200 rounded-lg hover:border-green-gradient-dark hover:bg-green-50 transition group"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-slate-800">
                                {patient.name}
                              </p>
                              <p className="text-sm text-slate-500 mt-1">
                                Age {patient.age} • {patient.conditions.length}{" "}
                                condition
                                {patient.conditions.length !== 1 ? "s" : ""}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {patient.conditions
                                  .slice(0, 2)
                                  .map((condition) => (
                                    <span
                                      key={condition}
                                      className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded"
                                    >
                                      {condition}
                                    </span>
                                  ))}
                                {patient.conditions.length > 2 && (
                                  <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
                                    +{patient.conditions.length - 2} more
                                  </span>
                                )}
                              </div>
                            </div>
                            <svg
                              className="w-5 h-5 text-slate-400 group-hover:text-green-gradient-dark transition mt-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg
                      className="w-12 h-12 text-slate-300 mx-auto mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-slate-600 font-medium">
                      No patients found
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Try searching with a different name
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-slate-200 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <p className="text-slate-500 font-medium">
                    Start typing to search for patients
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Detail Step
            selectedPatient && (
              <div className="space-y-6">
                {/* Patient Info Card */}
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">
                        {selectedPatient.name}
                      </h3>
                      <p className="text-slate-600 mt-1">
                        Patient ID: {selectedPatient.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Age</p>
                      <p className="text-2xl font-semibold text-slate-800">
                        {selectedPatient.age}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Address */}
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                      Address
                    </p>
                    <p className="text-slate-800 font-medium">
                      {selectedPatient.address || "Not provided"}
                    </p>
                  </div>

                  {/* Member Since */}
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                      Member Since
                    </p>
                    <p className="text-slate-800 font-medium">
                      {new Date(selectedPatient.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Medical Conditions */}
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">
                    Medical Conditions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatient.conditions.length > 0 ? (
                      selectedPatient.conditions.map((condition) => (
                        <span
                          key={condition}
                          className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200"
                        >
                          {condition}
                        </span>
                      ))
                    ) : (
                      <p className="text-slate-500 text-sm">
                        No conditions recorded
                      </p>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Note:</span> Adding this
                    patient will give you access to their medical records,
                    health timeline, and allow you to monitor their health
                    status.
                  </p>
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50 sticky bottom-0">
          {currentStep === "detail" && (
            <button
              onClick={handleBackToSearch}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              Back
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            {currentStep === "search" ? "Close" : "Cancel"}
          </button>
          {currentStep === "detail" && (
            <button
              onClick={handleAddPatient}
              className="flex-1 px-4 py-2 bg-gradient-to-br from-green-gradient-dark to-green-gradient-light text-white rounded-lg font-medium hover:opacity-90 transition"
            >
              Add Patient
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
