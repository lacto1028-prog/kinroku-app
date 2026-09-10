import { create } from "zustand";
import { persist } from "zustand/middleware";
import { monthKeyOf } from "../lib/format";
import type { SheetState } from "../types";

export type ThemeId = "earth" | "paper" | "ember" | "neon" | "ocean" | "forest" | "midnight" | "pastel" | "vintage" | "monochrome" | "carbon" | "obsidian" | "cyberpunk" | "titanium";

export type FontSize = "small" | "medium" | "large";

interface UiStore {
  sheet: SheetState;
  toast: string | null;
  selectedMonth: string;
  theme: ThemeId;
  customGreeting: string;
  hiddenMuscles: string[];
  fontSize: FontSize;
  openSheet: (sheet: Exclude<SheetState, null>) => void;
  closeSheet: () => void;
  notify: (message: string) => void;
  setSelectedMonth: (key: string) => void;
  resetSelectedMonth: () => void;
  setTheme: (theme: ThemeId) => void;
  setCustomGreeting: (message: string) => void;
  toggleMuscleVisibility: (muscleId: string) => void;
  setFontSize: (size: FontSize) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      sheet: null,
      toast: null,
      selectedMonth: monthKeyOf(new Date()),
      theme: "earth",
      customGreeting: "",
      hiddenMuscles: [],
      fontSize: "medium",
      openSheet: (sheet) => set({ sheet }),
      closeSheet: () => set({ sheet: null }),
      setSelectedMonth: (key) => set({ selectedMonth: key }),
      resetSelectedMonth: () => set({ selectedMonth: monthKeyOf(new Date()) }),
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute("data-theme", theme);
      },
      setCustomGreeting: (message) => set({ customGreeting: message }),
      toggleMuscleVisibility: (muscleId) =>
        set((state) => ({
          hiddenMuscles: state.hiddenMuscles.includes(muscleId)
            ? state.hiddenMuscles.filter((id) => id !== muscleId)
            : [...state.hiddenMuscles, muscleId],
        })),
      setFontSize: (size) => set({ fontSize: size }),
      notify: (message) => {
        if (toastTimer) clearTimeout(toastTimer);
        set({ toast: message });
        toastTimer = setTimeout(() => set({ toast: null }), 2400);
      },
    }),
    {
      name: "kinroku-ui-v1",
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          document.documentElement.setAttribute("data-theme", state.theme);
        }
      },
    }
  )
);