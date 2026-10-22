import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { demoResults, lessons as bundledLessons } from "../data/fixtures";
import { metadataStorage } from "../services/storage";
import {
  retainHistory,
  toMetadata as metadata,
  MAX_HISTORY,
} from "../services/history-policy";
import type {
  Lesson,
  Preferences,
  ScanRecord,
  ScanResult,
} from "../types/domain";

interface AppState {
  hydrated: boolean;
  storageError: boolean;
  onboarded: boolean;
  history: ScanRecord[];
  results: Record<string, ScanResult>;
  completedLessons: string[];
  lessons: Lesson[];
  setLessons(lessons: Lesson[]): void;
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
      lessons: bundledLessons,
      setLessons: (lessons) => set({ lessons }),
      corrections: {},
      preferences: {
        haptics: true,
        keepHistory: true,
        reduceMotion: false,
        notifications: false,
        cloudAnalysis: false,
      },
      finishOnboarding: () => set({ onboarded: true }),
      updatePreferences: (value) =>
        set((state) => ({ preferences: { ...state.preferences, ...value } })),
      addResult: (result) =>
        set((state) => ({
          results: Object.fromEntries(
            Object.entries({ ...state.results, [result.id]: result }).slice(
              -MAX_HISTORY,
            ),
          ),
          history: state.preferences.keepHistory
            ? retainHistory([metadata(result), ...state.history])
            : state.history,
        })),
      deleteRecord: (id) =>
        set((state) => {
          const results = { ...state.results };
          const corrections = { ...state.corrections };
          delete results[id];
          delete corrections[id];
          return {
            results,
            corrections,
            history: state.history.filter((r) => r.id !== id),
          };
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
        queueMicrotask(() => {
          const state = useAppStore.getState();
          const history = retainHistory(state.history);
          const retained = new Set(history.map((r) => r.id));
          useAppStore.setState({
            hydrated: true,
            storageError: Boolean(error),
            history,
            corrections: Object.fromEntries(
              Object.entries(state.corrections).filter(([id]) =>
                retained.has(id),
              ),
            ),
          });
        });
      },
    },
  ),
);
