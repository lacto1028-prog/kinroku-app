import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildSeed } from "../data/seed";
import type {
  BodyPart,
  Goal,
  SizeRecord,
  SortMode,
  Template,
  WorkoutRecord,
} from "../types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

interface WorkoutStore {
  bodyParts: BodyPart[];
  workoutRecords: WorkoutRecord[];
  sizeRecords: SizeRecord[];
  templates: Template[];
  goals: Goal[];
  sortMode: SortMode;

  /* ---- BodyPart ---- */
  addBodyPart: (name: string) => void;
  updateBodyPart: (id: string, name: string) => void;
  deleteBodyPart: (id: string) => void;
  moveBodyPart: (id: string, dir: -1 | 1) => void;
  reorderBodyParts: (fromId: string, toId: string) => void;

  /* ---- WorkoutRecord ---- */
  addWorkoutRecord: (r: Omit<WorkoutRecord, "id">) => void;
  updateWorkoutRecord: (id: string, patch: Partial<Omit<WorkoutRecord, "id">>) => void;
  deleteWorkoutRecord: (id: string) => void;

  /* ---- SizeRecord ---- */
  addSizeRecord: (r: Omit<SizeRecord, "id">) => void;
  updateSizeRecord: (id: string, patch: Partial<Omit<SizeRecord, "id">>) => void;
  deleteSizeRecord: (id: string) => void;

  /* ---- Template ---- */
  addTemplate: (t: Omit<Template, "id">) => void;
  updateTemplate: (id: string, patch: Partial<Omit<Template, "id">>) => void;
  deleteTemplate: (id: string) => void;

  /* ---- Goal ---- */
  addGoal: (g: Omit<Goal, "id" | "createdAt">) => void;
  updateGoal: (id: string, patch: Partial<Omit<Goal, "id" | "createdAt">>) => void;
  deleteGoal: (id: string) => void;

  /* ---- その他 ---- */
  setSortMode: (m: SortMode) => void;
  resetData: () => void;
  clearAllData: () => void;
  /** バックアップファイルの内容で全データを上書き */
  importData: (data: {
    bodyParts: BodyPart[];
    workoutRecords: WorkoutRecord[];
    sizeRecords: SizeRecord[];
    templates: Template[];
    goals: Goal[];
    sortMode: SortMode;
  }) => void;
}

const withOrder = (parts: BodyPart[]): BodyPart[] =>
  parts.map((p, i) => ({ ...p, order: i }));

/** order 順に並べ替えたコピーを返す（コンポーネント側の useMemo と併用） */
export const sortedParts = (parts: BodyPart[]): BodyPart[] =>
  [...parts].sort((a, b) => a.order - b.order);

/**
 * アプリの全データを持つストア。
 * - 起動時: persist ミドルウェアが localStorage("kinroku-data-v1") から復元
 *   （初回起動時は buildSeed() のデモデータがそのまま使われる）
 * - 変更時: どのアクションで状態が変わっても自動で localStorage に保存される
 */
export const useStore = create<WorkoutStore>()(
  persist(
    (set) => ({
      ...buildSeed(),
      sortMode: "new",

      /* ---- BodyPart ---- */
      addBodyPart: (name) =>
        set((s) => ({
          bodyParts: withOrder([
            ...s.bodyParts,
            { id: uid(), name: name.trim() || "新しい部位", order: s.bodyParts.length },
          ]),
        })),
      updateBodyPart: (id, name) =>
        set((s) => ({
          bodyParts: s.bodyParts.map((p) => (p.id === id ? { ...p, name } : p)),
        })),
      deleteBodyPart: (id) =>
        set((s) => ({
          bodyParts: withOrder(s.bodyParts.filter((p) => p.id !== id)),
          workoutRecords: s.workoutRecords.filter((r) => r.bodyPartId !== id),
        })),
      moveBodyPart: (id, dir) =>
        set((s) => {
          const sorted = [...s.bodyParts].sort((a, b) => a.order - b.order);
          const idx = sorted.findIndex((p) => p.id === id);
          const to = idx + dir;
          if (idx < 0 || to < 0 || to >= sorted.length) return s;
          const next = [...sorted];
          [next[idx], next[to]] = [next[to], next[idx]];
          return { bodyParts: withOrder(next) };
        }),
      reorderBodyParts: (fromId, toId) =>
        set((s) => {
          const sorted = [...s.bodyParts].sort((a, b) => a.order - b.order);
          const from = sorted.findIndex((p) => p.id === fromId);
          const to = sorted.findIndex((p) => p.id === toId);
          if (from < 0 || to < 0) return s;
          const next = [...sorted];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          return { bodyParts: withOrder(next) };
        }),

      /* ---- WorkoutRecord ---- */
      addWorkoutRecord: (r) =>
        set((s) => ({
          workoutRecords: [...s.workoutRecords, { ...r, id: uid() }],
        })),
      updateWorkoutRecord: (id, patch) =>
        set((s) => ({
          workoutRecords: s.workoutRecords.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      deleteWorkoutRecord: (id) =>
        set((s) => ({ workoutRecords: s.workoutRecords.filter((r) => r.id !== id) })),

      /* ---- SizeRecord ---- */
      addSizeRecord: (r) =>
        set((s) => ({ sizeRecords: [...s.sizeRecords, { ...r, id: uid() }] })),
      updateSizeRecord: (id, patch) =>
        set((s) => ({
          sizeRecords: s.sizeRecords.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      deleteSizeRecord: (id) =>
        set((s) => ({ sizeRecords: s.sizeRecords.filter((r) => r.id !== id) })),

      /* ---- Template ---- */
      addTemplate: (t) =>
        set((s) => ({ templates: [...s.templates, { ...t, id: uid() }] })),
      updateTemplate: (id, patch) =>
        set((s) => ({
          templates: s.templates.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      deleteTemplate: (id) =>
        set((s) => ({
          templates: s.templates.filter((t) => t.id !== id),
          workoutRecords: s.workoutRecords.map((r) =>
            r.templateId === id ? { ...r, templateId: null } : r
          ),
        })),

      /* ---- Goal ---- */
      addGoal: (g) =>
        set((s) => ({
          goals: [...s.goals, { ...g, id: uid(), createdAt: new Date().toISOString() }],
        })),
      updateGoal: (id, patch) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),
      deleteGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      /* ---- その他 ---- */
      setSortMode: (m) => set({ sortMode: m }),
      resetData: () => set({ ...buildSeed(), sortMode: "new" }),
      clearAllData: () =>
        set({
          bodyParts: [],
          workoutRecords: [],
          sizeRecords: [],
          templates: [],
          goals: [],
          sortMode: "new",
        }),
      importData: (data) =>
        set({
          bodyParts: data.bodyParts,
          workoutRecords: data.workoutRecords,
          sizeRecords: data.sizeRecords,
          templates: data.templates,
          goals: data.goals,
          sortMode: data.sortMode,
        }),
    }),
    {
      name: "kinroku-data-v1",
      version: 1,
    }
  )
);