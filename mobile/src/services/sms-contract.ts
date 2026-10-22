import { validateAssessment, type ModelAssessment } from "./api-client";
export function parseSmsReport(raw:string|null):ModelAssessment|null {
  if (!raw) return null;
  try { return validateAssessment(JSON.parse(raw)); } catch { return null; }
}
export function localReasons(raw:string):string[] {
  try { const values:unknown = JSON.parse(raw); return Array.isArray(values) ? values.filter((v):v is string=> typeof v === "string").slice(0,10) : []; } catch { return []; }
}
export function queueLabel(state:string):string {
  switch(state) {
    case "completed": return "Model report ready · offline observations retained";
    case "pending": return "Offline report ready · queued for model analysis";
    case "paused": return "Offline report ready · automatic uploads paused";
    case "local_only": return "Offline only · detected OTP/code text is excluded from uploads";
    case "unsupported": return "Offline report retained · no model verdict is available for this text";
    default: return "Offline report available";
  }
}

