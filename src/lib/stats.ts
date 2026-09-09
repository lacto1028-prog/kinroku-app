import type { MonthStats, WorkoutRecord, YearStats } from "../types";
import { shiftDays, toIso } from "./format";

const keyOf = (date: string) => date.slice(0, 7);

/** 月ごとの統計（昇順） */
export function computeMonths(records: WorkoutRecord[]): MonthStats[] {
  const map = new Map<string, { records: number; dates: Set<string>; byBodyPart: Record<string, number> }>();
  for (const r of records) {
    const key = keyOf(r.date);
    let m = map.get(key);
    if (!m) {
      m = { records: 0, dates: new Set(), byBodyPart: {} };
      map.set(key, m);
    }
    m.records += 1;
    m.dates.add(r.date);
    m.byBodyPart[r.bodyPartId] = (m.byBodyPart[r.bodyPartId] ?? 0) + 1;
  }
  return [...map.entries()]
    .map(([key, m]) => {
      const [year, month] = key.split("-").map(Number);
      return { key, year, month, records: m.records, days: m.dates.size, byBodyPart: m.byBodyPart };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}

/** 年ごとの統計（昇順） */
export function computeYears(monthsAsc: MonthStats[]): YearStats[] {
  const map = new Map<number, YearStats>();
  for (const m of monthsAsc) {
    let y = map.get(m.year);
    if (!y) {
      y = { year: m.year, records: 0, months: 0, byBodyPart: {} };
      map.set(m.year, y);
    }
    y.records += m.records;
    y.months += 1;
    for (const [id, c] of Object.entries(m.byBodyPart)) {
      y.byBodyPart[id] = (y.byBodyPart[id] ?? 0) + c;
    }
  }
  return [...map.values()].sort((a, b) => a.year - b.year);
}

/** 今日（または昨日）まで何日連続で記録があるか */
export function currentStreak(records: WorkoutRecord[]): number {
  const dates = new Set(records.map((r) => r.date));
  let day = new Date();
  if (!dates.has(toIso(day))) day = shiftDays(day, -1);
  let streak = 0;
  while (dates.has(toIso(day))) {
    streak += 1;
    day = shiftDays(day, -1);
  }
  return streak;
}

/** 指定月の部位別記録数 */
export function bodyPartMonthly(
  records: WorkoutRecord[],
  bodyPartId: string,
  year: number,
  month: number
): number {
  const key = `${year}-${String(month + 1).padStart(2, "0")}`;
  return records.filter((r) => r.bodyPartId === bodyPartId && keyOf(r.date) === key).length;
}

/** 先月比の増減（%）。先月が0件なら null */
export function bodyPartTrend(records: WorkoutRecord[], bodyPartId: string): number | null {
  const now = new Date();
  const cur = bodyPartMonthly(records, bodyPartId, now.getFullYear(), now.getMonth());
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prev = bodyPartMonthly(records, bodyPartId, prevDate.getFullYear(), prevDate.getMonth());
  if (prev === 0) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

/** 直近 n 週の記録数（インデックスが若いほど古い週） */
export function weeklyCounts(
  records: WorkoutRecord[],
  bodyPartId: string | null,
  weeks: number
): number[] {
  const buckets = new Array<number>(weeks).fill(0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const r of records) {
    if (bodyPartId && r.bodyPartId !== bodyPartId) continue;
    const d = new Date(`${r.date}T00:00:00`);
    const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
    if (diff < 0 || diff >= weeks * 7) continue;
    buckets[weeks - 1 - Math.floor(diff / 7)] += 1;
  }
  return buckets;
}