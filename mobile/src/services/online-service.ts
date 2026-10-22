import { Platform } from "react-native";
import { createApiClient } from "./api-client";
import type { ScanResult } from "../types/domain";

export const backendUrl = process.env.EXPO_PUBLIC_API_URL ?? "";
const key = "smishguard.installation.v1";
async function secureStore() {
  if (Platform.OS === "web")
    throw new Error(
      "Online checking requires the Android development build with secure credential storage. The web preview supports demo checks.",
    );
  try {
    return await import("expo-secure-store");
  } catch {
    throw new Error(
      "Rebuild the Android app to enable secure credential storage before online checking.",
    );
  }
}
function checkEndpoint() {
  let url: URL;
  try {
    url = new URL(backendUrl);
  } catch {
    throw new Error(
      "Set EXPO_PUBLIC_API_URL in mobile/.env and restart Metro first.",
    );
  }
  const local = ["localhost", "127.0.0.1", "10.0.2.2"].includes(url.hostname);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    (url.protocol !== "https:" &&
      !(__DEV__ && local && url.protocol === "http:"))
  )
    throw new Error(
      "Use an HTTPS backend URL. Local HTTP is allowed only for development over localhost/USB or the emulator.",
    );
}
const client = createApiClient(backendUrl, {
  get: async () => (await secureStore()).getItemAsync(key),
  set: async (value) => {
    const secure = await secureStore();
    await secure.setItemAsync(key, value);
  },
  clear: async () => (await secureStore()).deleteItemAsync(key),
});

export async function analyzeOnline(
  text: string,
  consent: boolean,
): Promise<ScanResult> {
  checkEndpoint();
  const data = await client.analyze(text, consent);
  return {
    id: data.request_id,
    createdAt: new Date().toISOString(),
    risk: data.risk,
    origin: "manual-model",
    mode: "backend_model",
    text,
    indicators: data.indicators,
    indicatorCount: data.indicators.length,
    characterCount: text.length,
    domains: data.domains,
    advice: data.advice,
    modelVersion: data.model_version,
    policyVersion: data.policy_version,
    coverage: data.coverage,
  };
}
export async function resetOnlineInstallation() {
  checkEndpoint();
  await client.reset();
}
