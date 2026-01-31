import { cn, getRiskColor } from '../lib/utils';
import type { Patient } from '../types';

interface PatientCardProps {
  patient: Patient;
  onClick?: () => void;
  selected?: boolean;
}

export function PatientCard({ patient, onClick, selected }: PatientCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 rounded-xl border-2 transition-all cursor-pointer',
        selected
          ? 'border-sky-500 bg-sky-50'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      )}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-xl">
          {patient.name.charAt(0)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 truncate">{patient.name}</h3>
          <p className="text-sm text-slate-500">Age {patient.age}</p>
        </div>

        {/* Risk badge */}
        <span
          className={cn(
            'px-3 py-1 rounded-full text-sm font-medium capitalize',
            getRiskColor(patient.riskLevel)
          )}
        >
          {patient.riskLevel}
        </span>
      </div>

      {/* Conditions */}
      {patient.conditions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {patient.conditions.map((condition, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full"
            >
              {condition}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
