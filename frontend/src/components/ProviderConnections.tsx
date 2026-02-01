import type { Provider } from "../types";
import { ProviderCard } from "./ProviderCard";

interface ProviderConnectionsProps {
  providers: Provider[];
  error?: boolean;
}

export function ProviderConnections({ providers, error }: ProviderConnectionsProps) {
  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Your Care Team
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {providers.length} connected provider{providers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-gradient-to-br from-green-gradient-dark to-green-gradient-light text-white text-sm font-medium hover:opacity-90 transition">
          Add Provider
        </button>
      </div>

      {error ? (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 text-red-200 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-slate-600 font-medium">Failed to load providers</p>
          <p className="text-sm text-slate-500 mt-1">
            There was an error fetching your care team. Please try again later.
          </p>
        </div>
      ) : providers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((provider, index) => (
            <ProviderCard key={index} provider={provider} />
          ))}
        </div>
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
              strokeWidth={1.5}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          <p className="text-slate-600 font-medium">No providers connected</p>
          <p className="text-sm text-slate-500 mt-1">
            Add your healthcare providers to start managing your care
          </p>
        </div>
      )}
    </div>
  );
}
