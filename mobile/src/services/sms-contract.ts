import { validateAssessment, type ModelAssessment } from "./api-client";
import type { Risk } from "../types/domain";
export function resultCopy(risk: Risk, model: boolean) {
  if (risk === "high")
    return {
      title: model ? "Likely phishing." : "Warning signs found.",
      action:
        "Don’t tap links or share codes. Verify through the official app.",
    };
  if (risk === "review")
    return {
      title: "Check before you act.",
      action: "Contact the sender through a number you already trust.",
    };
  return {
    title: model ? "Low detected risk." : "No rule signals found.",
    action: "Unexpected request? Verify it before replying.",
  };
}
export function parseSmsReport(raw: string | null): ModelAssessment | null {
  if (!raw) return null;
  try {
    return validateAssessment(JSON.parse(raw));
  } catch {
    return null;
  }
}
export function localReasons(raw: string): string[] {
  try {
    const values: unknown = JSON.parse(raw);
    return Array.isArray(values)
      ? values.filter((v): v is string => typeof v === "string").slice(0, 10)
      : [];
  } catch {
    return [];
  }
}
export function queueLabel(state: string): string {
  switch (state) {
    case "completed":
      return "Model report ready";
    case "pending":
      return "Model check queued · offline check ready";
    case "paused":
      return "Offline check ready · uploads paused";
    case "local_only":
      return "Code message · kept on this phone";
    case "unsupported":
      return "No model verdict · offline check only";
    default:
      return "Offline report available";
  }
}
