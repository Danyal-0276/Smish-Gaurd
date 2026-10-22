import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { lessons as bundledLessons } from "../data/lessons";
import { metadataStorage } from "../services/storage";
import type { Lesson, Preferences } from "../types/domain";
interface AppState {
  hydrated: boolean;
  storageError: boolean;
  onboarded: boolean;
  completedLessons: string[];
  lessons: Lesson[];
  preferences: Preferences;
  setLessons(lessons: Lesson[]): void;
  finishOnboarding(): void;
  updatePreferences(value: Partial<Preferences>): void;
  completeLesson(id: string): void;
}
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hydrated: false,
      storageError: false,
      onboarded: false,
      completedLessons: [],
      lessons: bundledLessons,
      preferences: { haptics: true, reduceMotion: false },
      setLessons: (lessons) => set({ lessons }),
      finishOnboarding: () => set({ onboarded: true }),
      updatePreferences: (value) =>
        set((state) => ({ preferences: { ...state.preferences, ...value } })),
      completeLesson: (id) =>
        set((state) => ({
          completedLessons: [...new Set([...state.completedLessons, id])],
        })),
    }),
    {
      name: "smishguard-metadata-v1",
      version: 2,
      storage: createJSONStorage(() => metadataStorage),
      migrate: (saved) => {
        const old = saved as Partial<AppState>;
        return {
          onboarded: false,
          completedLessons: old.completedLessons ?? [],
          preferences: {
            haptics: old.preferences?.haptics ?? true,
            reduceMotion: old.preferences?.reduceMotion ?? false,
          },
        };
      },
      partialize: (state) => ({
        onboarded: state.onboarded,
        completedLessons: state.completedLessons,
        preferences: state.preferences,
      }),
      onRehydrateStorage: () => (_state, error) => {
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
