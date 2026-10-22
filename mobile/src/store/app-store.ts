import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { demoResults } from "../data/fixtures";
import { metadataStorage } from "../services/storage";
import type { Preferences, ScanRecord, ScanResult } from "../types/domain";

const metadata = ({
  id,
  risk,
  createdAt,
  origin,
  indicatorCount,
  characterCount,
}: ScanResult): ScanRecord => ({
  id,
  risk,
  createdAt,
  origin,
  indicatorCount,
  characterCount,
});
interface AppState {
  hydrated: boolean;
  storageError: boolean;
  onboarded: boolean;
  history: ScanRecord[];
  results: Record<string, ScanResult>;
  completedLessons: string[];
  corrections: Record<string, boolean>;
  preferences: Preferences;
  finishOnboarding(): void;
  updatePreferences(value: Partial<Preferences>): void;
  addResult(result: ScanResult): void;
  deleteRecord(id: string): void;
  clearHistory(): void;
  completeLesson(id: string): void;
  correct(id: string): void;
  resetDemo(): void;
}
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hydrated: false,
      storageError: false,
      onboarded: false,
      history: demoResults.map(metadata),
      results: Object.fromEntries(demoResults.map((r) => [r.id, r])),
      completedLessons: [],
      corrections: {},
      preferences: {
        haptics: true,
        keepHistory: true,
        reduceMotion: false,
        notifications: false,
      },
      finishOnboarding: () => set({ onboarded: true }),
      updatePreferences: (value) =>
        set((state) => ({ preferences: { ...state.preferences, ...value } })),
      addResult: (result) =>
        set((state) => ({
          results: { ...state.results, [result.id]: result },
          history: state.preferences.keepHistory
            ? [metadata(result), ...state.history].slice(0, 200)
            : state.history,
        })),
      deleteRecord: (id) =>
        set((state) => {
          const results = { ...state.results };
          delete results[id];
          return { results, history: state.history.filter((r) => r.id !== id) };
        }),
      clearHistory: () => set({ history: [], results: {}, corrections: {} }),
      completeLesson: (id) =>
        set((state) => ({
          completedLessons: [...new Set([...state.completedLessons, id])],
        })),
      correct: (id) =>
        set((state) => ({ corrections: { ...state.corrections, [id]: true } })),
      resetDemo: () =>
        set({
          history: demoResults.map(metadata),
          results: Object.fromEntries(demoResults.map((r) => [r.id, r])),
        }),
    }),
    {
      name: "smishguard-metadata-v1",
      version: 1,
      storage: createJSONStorage(() => metadataStorage),
      partialize: (state) => ({
        onboarded: state.onboarded,
        history: state.history,
        preferences: state.preferences,
        completedLessons: state.completedLessons,
        corrections: state.corrections,
      }),
      onRehydrateStorage: () => (_state, error) => {
        // Deferred to avoid touching the store before initialization if a storage adapter is synchronous.
        queueMicrotask(() =>
          useAppStore.setState({
            hydrated: true,
            storageError: Boolean(error),
          }),
        );
      },
    },
  ),
);
