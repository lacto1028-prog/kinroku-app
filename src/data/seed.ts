import { toIso } from "../lib/format";
import type { BodyPart, Goal, SizeRecord, Template, WorkoutRecord } from "../types";

/** 決定的な擬似乱数（毎回同じデモデータになる） */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WEIGHTS: Array<[string, number]> = [
  ["chest", 0.22],
  ["back", 0.2],
  ["legs", 0.2],
  ["arms", 0.15],
  ["shoulders", 0.13],
  ["core", 0.1],
];

const CONTENT_TEMPLATES: Record<string, string[]> = {
  chest: [
    "ベンチプレス 80kg×6回×3set\nインクラインダンベルプレス 28kg×8回×3set\nケーブルクロスオーバー 25kg×12回×3set",
    "ベンチプレス 82.5kg×5回×4set\nチェストプレス 70kg×10回×3set\nペックフライ 30kg×12回×3set",
    "ダンベルプレス 32kg×8回×3set\nディップス 体重+10kg×8回×3set\nプッシュアップ 20回×3set",
  ],
  back: [
    "デッドリフト 120kg×5回×3set\nラットプルダウン 70kg×10回×3set\nバーベルローイング 60kg×8回×3set",
    "懸垂 体重+5kg×8回×4set\nシーテッドロー 65kg×10回×3set\nワンハンドロー 32kg×10回×3set",
    "Tバーロー 50kg×10回×3set\nプルオーバー 20kg×12回×3set\nフェイスプル 15kg×15回×3set",
  ],
  legs: [
    "スクワット 100kg×8回×4set\nレッグプレス 180kg×10回×3set\nレッグカール 40kg×12回×3set",
    "フロントスクワット 80kg×6回×4set\nブルガリアンスクワット 20kg×10回×3set\nカーフレイズ 60kg×15回×3set",
    "ハックスクワット 120kg×8回×3set\nレッグエクステンション 50kg×12回×3set\nアブダクション 35kg×15回×3set",
  ],
  arms: [
    "EZバーカール 40kg×10回×3set\nトライセプスプレスダウン 30kg×12回×3set\nハンマーカール 16kg×10回×3set",
    "インクラインカール 18kg×10回×3set\nスカルクラッシャー 30kg×10回×3set\nコンセントレーションカール 14kg×12回×3set",
    "プリチャーカール 35kg×8回×3set\nキックバック 14kg×12回×3set\nケーブルカール 25kg×12回×3set",
  ],
  shoulders: [
    "オーバーヘッドプレス 50kg×6回×4set\nサイドレイズ 12kg×12回×3set\nリアレイズ 10kg×12回×3set",
    "アーノルドプレス 20kg×8回×3set\nアップライトロー 30kg×10回×3set\nフロントレイズ 12kg×12回×3set",
    "シーテッドプレス 40kg×8回×3set\nケーブルサイドレイズ 10kg×12回×3set\nフェイスプル 15kg×15回×3set",
  ],
  core: [
    "アブローラー 15回×3set\nプランク 60秒×3set\nハンギングレッグレイズ 12回×3set",
    "クランチ 20回×3set\nサイドプランク 45秒×3set\nバイシクルクランチ 20回×3set",
    "ドラゴンフラッグ 8回×3set\nケーブルクランチ 30kg×15回×3set\nトゥーレイズ 12回×3set",
  ],
};

/** 2024年1月〜2026年2月までのデモデータを生成 */
export function buildSeed(): {
  bodyParts: BodyPart[];
  workoutRecords: WorkoutRecord[];
  sizeRecords: SizeRecord[];
  templates: Template[];
  goals: Goal[];
  sortMode: "new" | "old" | "year";
} {
  const rand = mulberry32(20240101);
  const today = new Date();
  const records: WorkoutRecord[] = [];
  let id = 0;

  const pickMuscle = () => {
    let r = rand();
    for (const [mid, w] of WEIGHTS) {
      r -= w;
      if (r <= 0) return mid;
    }
    return "chest";
  };

  const addRecord = (date: Date, muscleId: string) => {
    const templates = CONTENT_TEMPLATES[muscleId] ?? ["トレーニング実施"];
    const content = templates[Math.floor(rand() * templates.length)];
    records.push({
      id: `w${++id}`,
      date: toIso(date),
      bodyPartId: muscleId,
      content,
      templateId: null,
    });
  };

  // 2024年1月〜2026年2月（今月）まで
  const startDate = new Date(2024, 0, 1);
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // 週に3〜5回トレーニング（確率的）
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const trainProb = isWeekend ? 0.7 : 0.5;

    if (rand() < trainProb) {
      // 1日に1〜2部位
      const numParts = rand() < 0.3 ? 2 : 1;
      const usedParts = new Set<string>();
      for (let i = 0; i < numParts; i++) {
        let part = pickMuscle();
        let attempts = 0;
        while (usedParts.has(part) && attempts < 5) {
          part = pickMuscle();
          attempts++;
        }
        usedParts.add(part);
        addRecord(new Date(d), part);
      }
    }
  }

  // ストリークが生きるように、直近3日を確実に記録
  addRecord(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2), "back");
  addRecord(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), "legs");
  addRecord(today, "chest");

  records.sort((a, b) => a.date.localeCompare(b.date));

  // サイズ記録：2024年1月から2週間おき
  const sizeRecords: SizeRecord[] = [];
  let sizeId = 0;
  const sizeStart = new Date(2024, 0, 7); // 2024年1月7日
  for (let d = new Date(sizeStart); d <= today; d.setDate(d.getDate() + 14)) {
    const daysSinceStart = Math.floor((d.getTime() - sizeStart.getTime()) / 86400000);
    const progress = daysSinceStart / 790; // 約26か月

    sizeRecords.push({
      id: `s${++sizeId}`,
      date: toIso(new Date(d)),
      weight: Math.round((75 - 3 * progress + (rand() - 0.5) * 0.8) * 10) / 10,
      chest: Math.round((95 + 3 * progress + (rand() - 0.5) * 0.6) * 10) / 10,
      rightArm: Math.round((30 + 2.5 * progress + (rand() - 0.5) * 0.4) * 10) / 10,
      leftArm: Math.round((29.5 + 2.5 * progress + (rand() - 0.5) * 0.4) * 10) / 10,
      rightLeg: Math.round((54 + 2 * progress + (rand() - 0.5) * 0.5) * 10) / 10,
      leftLeg: Math.round((53.5 + 2 * progress + (rand() - 0.5) * 0.5) * 10) / 10,
      waist: Math.round((80 - 4 * progress + (rand() - 0.5) * 0.7) * 10) / 10,
    });
  }

  // 部位
  const bodyParts: BodyPart[] = [
    { id: "chest", name: "胸", order: 0 },
    { id: "back", name: "背中", order: 1 },
    { id: "legs", name: "脚", order: 2 },
    { id: "arms", name: "腕", order: 3 },
    { id: "shoulders", name: "肩", order: 4 },
    { id: "core", name: "腹", order: 5 },
  ];

  // テンプレート
  const templates: Template[] = [
    {
      id: "t1",
      name: "胸の定番",
      content: "ベンチプレス 80kg×6回×3set\nインクラインダンベルプレス 28kg×8回×3set\nケーブルクロスオーバー 25kg×12回×3set",
    },
    {
      id: "t2",
      name: "背中の定番",
      content: "デッドリフト 120kg×5回×3set\nラットプルダウン 70kg×10回×3set\nバーベルローイング 60kg×8回×3set",
    },
    {
      id: "t3",
      name: "脚の定番",
      content: "スクワット 100kg×8回×4set\nレッグプレス 180kg×10回×3set\nレッグカール 40kg×12回×3set",
    },
    {
      id: "t4",
      name: "腕集中",
      content: "EZバーカール 40kg×10回×3set\nトライセプスプレスダウン 30kg×12回×3set\nハンマーカール 16kg×10回×3set",
    },
    {
      id: "t5",
      name: "肩トレ",
      content: "オーバーヘッドプレス 50kg×6回×4set\nサイドレイズ 12kg×12回×3set\nリアレイズ 10kg×12回×3set",
    },
    {
      id: "t6",
      name: "腹筋メニュー",
      content: "アブローラー 15回×3set\nプランク 60秒×3set\nハンギングレッグレイズ 12回×3set",
    },
  ];

  // 目標（デモデータ）
  const goals: Goal[] = [
    {
      id: "g1",
      type: "weight",
      targetValue: 70,
      unit: "kg",
      createdAt: new Date().toISOString(),
    },
    {
      id: "g2",
      type: "size",
      targetKey: "rightArm",
      targetValue: 35,
      unit: "cm",
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    bodyParts,
    workoutRecords: records,
    sizeRecords,
    templates,
    goals,
    sortMode: "new",
  };
}