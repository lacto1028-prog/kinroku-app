/** 部位（表示順 order を持つ） */
export interface BodyPart {
  id: string;
  name: string;
  order: number;
}

/** トレーニング記録（内容は自由記述） */
export interface WorkoutRecord {
  id: string;
  /** ISO日付 yyyy-mm-dd */
  date: string;
  bodyPartId: string;
  content: string;
  templateId: string | null;
  images?: string[]; // Base64形式の画像配列
}

/** サイズ記録（腕・脚は左右別） */
export interface SizeRecord {
  id: string;
  date: string;
  leftArm: number;
  rightArm: number;
  chest: number;
  leftLeg: number;
  rightLeg: number;
  waist: number;
  weight: number;
}

/** 入力テンプレート */
export interface Template {
  id: string;
  name: string;
  content: string;
}

/** 目標設定 */
export interface Goal {
  id: string;
  type: 'weight' | 'size';
  targetKey?: SizeKey; // sizeの場合のみ
  targetValue: number;
  unit: string;
  deadline?: string; // ISO date
  createdAt: string;
  completedAt?: string;
}

export type SizeKey = 'weight' | 'chest' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg' | 'waist';

/** エクスポート/インポート用のバックアップファイル形式 */
export interface BackupData {
  app: "Kinroku";
  version: number;
  exportedAt: string;
  bodyParts: BodyPart[];
  workoutRecords: WorkoutRecord[];
  sizeRecords: SizeRecord[];
  templates: Template[];
  goals: Goal[];
  sortMode: SortMode;
}

export type DataTab = "records" | "sizes" | "templates" | "parts";

export type SortMode = "new" | "old" | "year";

export interface MonthStats {
  key: string;
  year: number;
  month: number;
  records: number;
  days: number;
  byBodyPart: Record<string, number>;
}

export interface YearStats {
  year: number;
  records: number;
  months: number;
  byBodyPart: Record<string, number>;
}

export type SheetState =
  | { type: "settings" }
  | { type: "sizes" }
  | { type: "muscle"; muscleId: string }
  | { type: "data"; tab?: DataTab; presetBodyPartId?: string }
  | { type: "calendar" }
  | null;