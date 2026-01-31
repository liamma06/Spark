// Patient types
export interface Patient {
  id: string;
  name: string;
  age: number;
  conditions: string[];
  createdAt: Date;
  address: string;
}
export interface Provider {
  name: string;
  address: string;
  specialty: string;
  bio: string;
}

// Chat types
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  patientId: string;
  messages: Message[];
}

// Timeline types
export type TimelineEventType =
  | "symptom"
  | "appointment"
  | "medication"
  | "alert"
  | "chat";

export interface TimelineEvent {
  id: string;
  patientId: string;
  type: TimelineEventType;
  title: string;
  details?: string;
  createdAt: Date;
}

// Alert types
export type AlertSeverity = "warning" | "critical";

export interface Alert {
  id: string;
  patientId: string;
  severity: AlertSeverity;
  message: string;
  reasoning?: string;
  acknowledged: boolean;
  createdAt: Date;
}

// Decision graph types
export interface DecisionNode {
  id: string;
  label: string;
  type: "symptom" | "factor" | "recommendation";
  riskContribution?: "low" | "medium" | "high";
}

export interface DecisionEdge {
  from: string;
  to: string;
}

export interface DecisionGraph {
  nodes: DecisionNode[];
  edges: DecisionEdge[];
}

// App state types
export type UserRole = "patient" | "provider";
