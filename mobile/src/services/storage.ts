import { Platform } from "react-native";
import type { StateStorage } from "zustand/middleware";

/** Metadata/preferences only. Message bodies and credentials never enter this store. */
const nativeDb =
  Platform.OS !== "web"
    ? import("expo-sqlite").then(async (SQLite) => {
        const db = await SQLite.openDatabaseAsync("smishguard-local.db");
        await db.execAsync(
          "CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)",
        );
        return db;
      })
    : null;

export const metadataStorage: StateStorage = {
  async getItem(name) {
    if (Platform.OS === "web") {
      try {
        return typeof localStorage === "undefined"
          ? null
          : localStorage.getItem(name);
      } catch {
        return null;
      }
    }
    const row = await (
      await nativeDb!
    ).getFirstAsync<{ value: string }>(
      "SELECT value FROM app_state WHERE key = ?",
      name,
    );
    return row?.value ?? null;
  },
  async setItem(name, value) {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined")
        localStorage.setItem(name, value);
      return;
    }
    await (
      await nativeDb!
    ).runAsync(
      "INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)",
      name,
      value,
    );
  },
  async removeItem(name) {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.removeItem(name);
      return;
    }
    await (
      await nativeDb!
    ).runAsync("DELETE FROM app_state WHERE key = ?", name);
  },
};
