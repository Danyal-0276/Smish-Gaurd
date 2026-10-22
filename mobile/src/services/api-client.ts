/** Framework-independent transport. No credentials or message bodies are logged. */
export interface CredentialStore {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  clear(): Promise<void>;
}
export class ApiError extends Error {
  constructor(public code: string, message: string) { super(message); }
}
export interface ModelAssessment {
  request_id: string;
  status: "completed";
  mode: "backend_model";
  risk: "low" | "review" | "high";
  model_version: string;
  policy_version: string;
  coverage: string;
  indicators: { title: string; description: string }[];
  domains: string[];
  advice: string;
}
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const string = (value: unknown, max = 2000): value is string => typeof value === "string" && value.length <= max;

export function validateAssessment(data: unknown): ModelAssessment {
  if (object(data) && data.status === "unsupported") throw new ApiError("unsupported", "This text is outside the evaluated model coverage or has too little readable text. No risk verdict was assigned.");
  if (!object(data) || data.status !== "completed" || data.mode !== "backend_model" || !["low", "review", "high"].includes(String(data.risk)) || !string(data.request_id, 100) || !string(data.model_version, 100) || !string(data.policy_version, 100) || !string(data.coverage) || !string(data.advice) || !Array.isArray(data.indicators) || data.indicators.length > 20 || !data.indicators.every(v => object(v) && string(v.title) && string(v.description)) || !Array.isArray(data.domains) || data.domains.length > 20 || !data.domains.every(v => string(v, 253))) throw new ApiError("invalid_response", "The service returned an unsupported response. No result was saved.");
  return data as unknown as ModelAssessment;
}

export function createApiClient(base: string, store: CredentialStore, transport: typeof fetch = fetch) {
  let registration: Promise<string> | null = null;
  async function request(path: string, method: string, payload?: unknown, token?: string) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await transport(base.replace(/\/$/, "") + "/api/v1/" + path, {
        method, signal: controller.signal, cache: "no-store",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
        body: payload === undefined ? undefined : JSON.stringify(payload),
      });
      if (response.status === 401) {
        await store.clear();
        throw new ApiError("expired", "Your service connection expired. Tap Check again to reconnect. Your message was not retried automatically.");
      }
      if (!response.ok) {
        const messages: Record<number, string> = { 400: "The service could not accept this request. Check the input and consent.", 403: "This connection is not permitted. Check the backend configuration.", 413: "This message exceeds the service's request-size limit.", 429: "The checking limit was reached. Wait before trying again.", 503: "The model service is temporarily unavailable. No risk verdict was assigned." };
        throw new ApiError("http_" + response.status, messages[response.status] ?? "The service could not complete the request. No risk verdict was assigned.");
      }
      if (response.status === 204) return null;
      const raw = await response.text();
      if (raw.length > 65536) throw new ApiError("invalid_response", "The service response exceeded the expected size.");
      try { return JSON.parse(raw) as unknown; }
      catch { throw new ApiError("invalid_response", "The service returned an unreadable response."); }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("connection", "Could not reach the model service. Check the backend and USB connection, then try again.");
    } finally { clearTimeout(timer); }
  }
  async function credential(): Promise<string> {
    const saved = await store.get();
    if (saved) return saved;
    if (!registration) {
      registration = (async () => {
        const result = await request("installations", "POST", { app_version: "0.1.0", consent_version: "2026-10-22", cloud_analysis_consent: true });
        if (!object(result) || !string(result.credential, 150) || !/^sg1\.[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$/.test(result.credential)) throw new ApiError("invalid_response", "Service registration returned an invalid credential.");
        try { await store.set(result.credential); }
        catch {
          try { await request("installations/me", "DELETE", undefined, result.credential); } catch { /* no payload/secret logging */ }
          throw new ApiError("secure_storage", "Could not securely save the service credential. No message was sent.");
        }
        return result.credential;
      })();
    }
    try { return await registration; } finally { registration = null; }
  }
  return {
    async analyze(text: string, consent: boolean) {
      if (!consent) throw new ApiError("consent_required", "Enable online analysis before sending a message.");
      const token = await credential();
      return validateAssessment(await request("analyses", "POST", { text, cloud_analysis_consent: true }, token));
    },
    async reset() {
      const token = await store.get();
      if (token) await request("installations/me", "DELETE", undefined, token);
      await store.clear();
    },
  };
}
