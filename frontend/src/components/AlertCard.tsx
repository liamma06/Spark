import { cn } from '../lib/utils';
import type { Alert } from '../types';

interface AlertCardProps {
  alert: Alert;
  onAcknowledge?: (id: string) => void;
  showPatientName?: boolean;
}

export function AlertCard({ alert, onAcknowledge, showPatientName }: AlertCardProps) {
  const isCritical = alert.severity === 'critical';

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-4 transition-all',
        isCritical
          ? 'border-red-300 bg-red-50'
          : 'border-amber-300 bg-amber-50',
        alert.acknowledged && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0',
            isCritical ? 'bg-red-200' : 'bg-amber-200'
          )}
        >
          {isCritical ? '🚨' : '⚠️'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                'text-xs font-semibold uppercase px-2 py-0.5 rounded',
                isCritical
                  ? 'bg-red-200 text-red-700'
                  : 'bg-amber-200 text-amber-700'
              )}
            >
              {alert.severity}
            </span>
            {alert.acknowledged && (
              <span className="text-xs text-slate-500">✓ Acknowledged</span>
            )}
          </div>

          <p className={cn(
            'font-medium',
            isCritical ? 'text-red-800' : 'text-amber-800'
          )}>
            {alert.message}
          </p>

          {alert.reasoning && (
            <p className="text-sm text-slate-600 mt-2 bg-white/50 rounded p-2">
              <span className="font-medium">AI Reasoning:</span> {alert.reasoning}
            </p>
          )}

          {!alert.acknowledged && onAcknowledge && (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className={cn(
                'mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                isCritical
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              )}
            >
              Acknowledge Alert
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
