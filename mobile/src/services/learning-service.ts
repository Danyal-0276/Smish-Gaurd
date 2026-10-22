import { parseLessons } from "./content-contract";
const backendUrl = process.env.EXPO_PUBLIC_API_URL ?? "";

export async function refreshLessons() {
  let url: URL;
  try {
    url = new URL(backendUrl);
  } catch {
    throw new Error(
      "Configure the backend URL and restart Metro to refresh lessons.",
    );
  }
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    (url.protocol !== "https:" &&
      !(
        __DEV__ &&
        url.protocol === "http:" &&
        ["127.0.0.1", "localhost", "10.0.2.2"].includes(url.hostname)
      ))
  )
    throw new Error("Use a trusted HTTPS or local development backend URL.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(
      backendUrl.replace(/\/$/, "") + "/api/v1/lessons",
      {
        signal: controller.signal,
        credentials: "omit",
        redirect: "error",
        cache: "no-store",
      },
    );
    if (!response.ok)
      throw new Error(
        "Published lessons are unavailable. Bundled or previously refreshed lessons remain available.",
      );
    const raw = await response.text();
    if (raw.length > 262144)
      throw new Error("Published content exceeds this app's supported size.");
    return parseLessons(JSON.parse(raw));
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("Published") || error.message.includes("lesson"))
    )
      throw error;
    throw new Error(
      "Could not refresh lessons. Existing lessons remain available.",
    );
  } finally {
    clearTimeout(timer);
  }
}
