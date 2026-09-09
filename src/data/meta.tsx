import {
  Dumbbell,
  Footprints,
  Hand,
  PersonStanding,
  Ruler,
  Scale,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** 部位カードの見た目（色・アイコン）。ユーザー追加部位はフォールバック。 */
export interface BodyVisual {
  en: string;
  color: string;
  soft: string;
  icon: LucideIcon;
}

export const BODY_VISUALS: Record<string, BodyVisual> = {
  chest: { en: "CHEST", color: "#B4713B", soft: "#F1E0CF", icon: Dumbbell },
  back: { en: "BACK", color: "#6E7F4F", soft: "#E7EBD9", icon: PersonStanding },
  legs: { en: "LEGS", color: "#57683D", soft: "#E2E7D6", icon: Footprints },
  arms: { en: "ARMS", color: "#C08A3E", soft: "#F2E7CE", icon: Hand },
  shoulders: { en: "SHOULDERS", color: "#8C5A3C", soft: "#EDDFD2", icon: Zap },
  core: { en: "CORE", color: "#A98467", soft: "#EDE2D4", icon: Target },
};

const FALLBACK_VISUAL: BodyVisual = {
  en: "PART",
  color: "#A98467",
  soft: "#EDE2D4",
  icon: Dumbbell,
};

export const bodyVisual = (id: string): BodyVisual => BODY_VISUALS[id] ?? FALLBACK_VISUAL;

export type SizeKey =
  | "weight"
  | "chest"
  | "rightArm"
  | "leftArm"
  | "rightLeg"
  | "leftLeg"
  | "waist";

export interface SizeField {
  key: SizeKey;
  label: string;
  unit: string;
  icon: LucideIcon;
  /** 数値が下がった方を「良い変化」として緑表示する */
  goodWhenDown?: boolean;
}

export const SIZE_FIELDS: SizeField[] = [
  { key: "weight", label: "体重", unit: "kg", icon: Scale, goodWhenDown: true },
  { key: "chest", label: "胸囲", unit: "cm", icon: Ruler },
  { key: "rightArm", label: "右腕周り", unit: "cm", icon: Hand },
  { key: "leftArm", label: "左腕周り", unit: "cm", icon: Hand },
  { key: "rightLeg", label: "右脚周り", unit: "cm", icon: Footprints },
  { key: "leftLeg", label: "左脚周り", unit: "cm", icon: Footprints },
  { key: "waist", label: "ウエスト", unit: "cm", icon: Ruler, goodWhenDown: true },
];

/** トップページのサイズカードに表示する主要項目 */
export const MAIN_SIZE_KEYS: SizeKey[] = ["weight", "chest", "rightArm", "rightLeg", "waist"];