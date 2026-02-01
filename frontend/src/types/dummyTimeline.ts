import type { TimelineEvent } from "./index";

export const dummyTimelineEvents: TimelineEvent[] = [
  {
    id: "event-1",
    patientId: "patient-001",
    type: "symptom",
    title: "Persistent Cough",
    details:
      "Patient reported a persistent dry cough that started this morning. No fever or other respiratory symptoms noted.",
    created_at: new Date("2024-01-05"),
  },
  {
    id: "event-2",
    patientId: "patient-001",
    type: "appointment",
    title: "Virtual Check-up",
    details:
      "Initial consultation with Dr. Sarah Mitchell via video call. Blood pressure 120/80 mmHg, normal. Prescribed cough medicine.",
    created_at: new Date("2024-01-08"),
  },
  {
    id: "event-3",
    patientId: "patient-001",
    type: "medication",
    title: "Cough Suppressant Prescribed",
    details:
      "Prescribed: Dextromethorphan 15mg - Take 1 tablet every 6 hours as needed. Refill date: 2024-02-08",
    created_at: new Date("2024-01-08"),
  },
  {
    id: "event-4",
    patientId: "patient-001",
    type: "chat",
    title: "Follow-up Virtual Chat",
    details:
      "Patient checked in via chat. Reported improvement in symptoms after 3 days of medication. Cough frequency reduced by 60%.",
    created_at: new Date("2024-01-11"),
  },
  {
    id: "event-5",
    patientId: "patient-001",
    type: "symptom",
    title: "Mild Headache",
    details:
      "Patient reported mild headache in the afternoon. Possibly related to stress from work. No other symptoms.",
    created_at: new Date("2024-01-15"),
  },
  {
    id: "event-6",
    patientId: "patient-001",
    type: "appointment",
    title: "In-Person Follow-up",
    details:
      "Physical examination completed. Chest clear, no wheezing. Blood work ordered for routine health check. Overall condition excellent.",
    created_at: new Date("2024-01-22"),
  },
  {
    id: "event-7",
    patientId: "patient-001",
    type: "medication",
    title: "Prescription Renewal Needed",
    details:
      "Current prescription for Dextromethorphan expires on 2024-02-08. Recommend refill before expiration.",
    created_at: new Date("2024-01-30"),
  },
  {
    id: "event-8",
    patientId: "patient-001",
    type: "alert",
    title: "Upcoming Appointment",
    details:
      "Reminder: Quarterly check-up scheduled for 2024-02-14 at 2:00 PM with Dr. Mitchell. Please arrive 10 minutes early.",
    created_at: new Date("2024-01-31"),
  },
  {
    id: "event-9",
    patientId: "patient-001",
    type: "appointment",
    title: "Quarterly Health Check",
    details:
      "Comprehensive health assessment. BMI: 24.5 (normal), Blood Pressure: 118/76 mmHg, Heart Rate: 72 bpm. All vitals normal.",
    created_at: new Date("2024-02-14"),
  },
  {
    id: "event-10",
    patientId: "patient-001",
    type: "medication",
    title: "Vitamin D Supplement Recommended",
    details:
      "Based on blood work results, Vitamin D levels slightly low. Recommended: Vitamin D3 1000 IU daily. No prescription needed.",
    created_at: new Date("2024-02-15"),
  },
];
