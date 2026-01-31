import { create } from 'zustand';
import type { UserRole, Patient, Alert } from '../types';

interface AppState {
  // Current user role (patient or provider view)
  role: UserRole;
  setRole: (role: UserRole) => void;
  
  // Current patient (for patient view, or selected patient in provider view)
  currentPatientId: string | null;
  setCurrentPatientId: (id: string | null) => void;
  
  // Cached patients list
  patients: Patient[];
  setPatients: (patients: Patient[]) => void;
  
  // Unacknowledged alerts count (for provider badge)
  unacknowledgedAlerts: number;
  setUnacknowledgedAlerts: (count: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Default to patient role for demo
  role: 'patient',
  setRole: (role) => set({ role }),
  
  // Demo patient ID
  currentPatientId: 'patient-maria',
  setCurrentPatientId: (currentPatientId) => set({ currentPatientId }),
  
  patients: [],
  setPatients: (patients) => set({ patients }),
  
  unacknowledgedAlerts: 0,
  setUnacknowledgedAlerts: (unacknowledgedAlerts) => set({ unacknowledgedAlerts }),
}));
