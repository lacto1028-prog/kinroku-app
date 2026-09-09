import { create } from "zustand";
import { persist } from "zustand/middleware";
import { monthKeyOf } from "../lib/format";
import type { SheetState } from "../types";

export type ThemeId = "earth" | "paper" | "ember" | "neon" | "ocean" | "forest" | "midnight" | "pastel" | "vintage" | "monochrome" | "carbon" | "obsidian" | "cyberpunk" | "titanium";

interface UiStore {
  sheet: SheetState;
  toast: string | null;
  /** 現在フォーカスされている月（"YYYY-MM"）。今月がデフォルト */
  selectedMonth: string;
  /** 現在のテーマ */
  theme: ThemeId;
  /** カスタム挨拶メッセージ（空の場合はデフォルトを使用） */
  customGreeting: string;
  /** 非表示にする部位IDの配列 */
  hiddenMuscles: string[];
  openSheet: (sheet: Exclude<SheetState, null>) => void;
  closeSheet: () => void;
  notify: (message: string) => void;
  setSelectedMonth: (key: string) => void;
  resetSelectedMonth: () => void;
  setTheme: (theme: ThemeId) => void;
  setCustomGreeting: (message: string) => void;
  toggleMuscleVisibility: (muscleId: string) => void;
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
      openSheet: (sheet) => set({ sheet }),
      closeSheet: () => set({ sheet: null }),
      setSelectedMonth: (key) => set({ selectedMonth: key }),
      resetSelectedMonth: () => set({ selectedMonth: monthKeyOf(new Date()) }),
      setTheme: (theme) => {
        set({ theme });
        // DOMにも反映
        document.documentElement.setAttribute("data-theme", theme);
      },
      setCustomGreeting: (message) => set({ customGreeting: message }),
      toggleMuscleVisibility: (muscleId) =>
        set((state) => ({
          hiddenMuscles: state.hiddenMuscles.includes(muscleId)
            ? state.hiddenMuscles.filter((id) => id !== muscleId)
            : [...state.hiddenMuscles, muscleId],
        })),
      notify: (message) => {
        if (toastTimer) clearTimeout(toastTimer);
        set({ toast: message });
        toastTimer = setTimeout(() => set({ toast: null }), 2400);
      },
    }),
    {
      name: "kinroku-ui-v1",
      onRehydrateStorage: () => (state) => {
        // 復元時にDOMにテーマを適用
        if (state?.theme) {
          document.documentElement.setAttribute("data-theme", state.theme);
        }
      },
    }
  )
);