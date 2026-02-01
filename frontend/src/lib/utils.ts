import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind class merger (for shadcn/ui compatibility)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date for display
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Get risk level color classes
export function getRiskColor(risk: "low" | "medium" | "high"): string {
  switch (risk) {
    case "low":
      return "text-green-600 bg-green-100";
    case "medium":
      return "text-amber-600 bg-amber-100";
    case "high":
      return "text-red-600 bg-red-100";
  }
}

// Get timeline event icon
export function getEventIcon(type: string): string {
  switch (type) {
    case "symptom":
      return "🩺";
    case "appointment":
      return "📅";
    case "medication":
      return "💊";
    case "alert":
      return "⚠️";
    case "chat":
      return "💬";
    default:
      return "📌";
  }
}

// Get timeline event border color
export function getEventBorderColor(type: string): string {
  switch (type) {
    case "symptom":
      return "border-amber-500"; // Orange/amber for symptoms
    case "appointment":
      return "border-blue-500"; // Blue for appointments
    case "medication":
      return "border-purple-500"; // Purple for medications
    case "alert":
      return "border-red-500"; // Red for alerts
    case "chat":
      return "border-primary"; // Green (primary) for chat
    default:
      return "border-slate-400"; // Gray for unknown
  }
}

// Get timeline event dot color
export function getEventDotColor(type: string): string {
  switch (type) {
    case "symptom":
      return "bg-amber-500"; // Orange/amber for symptoms
    case "appointment":
      return "bg-blue-500"; // Blue for appointments
    case "medication":
      return "bg-purple-500"; // Purple for medications
    case "alert":
      return "bg-red-500"; // Red for alerts
    case "chat":
      return "bg-primary"; // Green (primary) for chat
    default:
      return "bg-slate-400"; // Gray for unknown
  }
}

// Generate a simple ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
