import { useAppStore } from '../stores/appStore';
import { cn } from '../lib/utils';
import type { UserRole } from '../types';

export function RoleToggle() {
  const { role, setRole } = useAppStore();

  const roles: { value: UserRole; label: string; icon: string }[] = [
    { value: 'patient', label: 'Patient', icon: '👤' },
    { value: 'provider', label: 'Provider', icon: '👨‍⚕️' },
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
      {roles.map((r) => (
        <button
          key={r.value}
          onClick={() => setRole(r.value)}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            role === r.value
              ? 'bg-white shadow-sm text-slate-800'
              : 'text-slate-600 hover:text-slate-800'
          )}
        >
          <span className="mr-2">{r.icon}</span>
          {r.label}
        </button>
      ))}
    </div>
  );
}
