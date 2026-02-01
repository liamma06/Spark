import type { Provider } from "../types";

interface ProviderCardProps {
  provider: Provider;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 transition">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            {provider.name}
          </h3>
          <p className="text-sm font-medium text-primary mt-1">
            {provider.specialty}
          </p>
        </div>
        <svg
          className="w-10 h-10 text-slate-200"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
        </svg>
      </div>

      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
        {provider.bio}
      </p>

      <div className="flex items-start gap-2 mb-4">
        <svg
          className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0"
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
        <p className="text-xs text-slate-500 leading-relaxed">
          {provider.address}
        </p>
      </div>

      <button className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
        View Profile
      </button>
    </div>
  );
}
