const pad = (n: number) => String(n).padStart(2, "0");

export const toIso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fmtNum = (n: number) => Math.round(n).toLocaleString("ja-JP");

export const monthKeyOf = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return `${y}年${m}月`;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export const dayLabel = (isoDate: string) => {
  const d = new Date(`${isoDate}T00:00:00`);
  return `${d.getMonth() + 1}/${d.getDate()}（${WEEKDAYS[d.getDay()]}）`;
};

export const todayLong = () => {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS[d.getDay()]}）`;
};

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 11) return "おはようございます";
  if (h < 18) return "こんにちは";
  return "こんばんは";
};

export const shiftDays = (from: Date, days: number) => {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
};