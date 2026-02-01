import type { Provider } from "../types";

interface ProviderProfileModalProps {
  isOpen: boolean;
  provider: Provider | null;
  onClose: () => void;
}

export function ProviderProfileModal({
  isOpen,
  provider,
  onClose,
}: ProviderProfileModalProps) {
  if (!isOpen || !provider) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-gradient-dark to-green-gradient-light text-white p-6 sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{provider.name}</h2>
              <p className="text-accent-secondary-text text-sm mt-1">
                {provider.specialty}
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
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Card */}
          <div className="flex items-center gap-4 bg-slate-50 rounded-lg p-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-gradient-dark to-green-gradient-light rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {provider.name}
              </h3>
              <p className="text-sm font-medium text-primary mt-1">
                {provider.specialty}
              </p>
              <p className="text-xs text-slate-500 mt-2">Healthcare Provider</p>
            </div>
          </div>

          {/* Biography */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">About</h4>
            <p className="text-slate-600 leading-relaxed">{provider.bio}</p>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-3">
              Contact Information
            </h4>
            <div className="space-y-3">
              {/* Address */}
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">
                    Office Address
                  </p>
                  <p className="text-slate-700">{provider.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Specialty Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <p className="font-semibold text-blue-900">Specialty</p>
                <p className="text-sm text-blue-800 mt-1">
                  This provider specializes in{" "}
                  <span className="font-medium">{provider.specialty}</span> and
                  is here to help manage your health needs in this area.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50 sticky bottom-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            Close
          </button>
          <button
            onClick={() => {
              window.location.href = `mailto:${provider.email}`;
            }}
            className="flex-1 px-4 py-2 bg-gradient-to-br from-green-gradient-dark to-green-gradient-light text-white rounded-lg font-medium hover:opacity-90 transition"
          >
            Message Provider
          </button>
        </div>
      </div>
    </div>
  );
}
