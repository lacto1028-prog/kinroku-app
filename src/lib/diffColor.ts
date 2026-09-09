import { SIZE_FIELDS, type SizeKey } from "../data/meta";

export function formatDiff(v: number) {
  const r = Math.round(v * 10) / 10;
  if (r === 0) return "±0";
  return `${r > 0 ? "+" : ""}${r.toFixed(1)}`;
}

/** 濃い背景（エスプレッソ）用の差分カラー */
export function diffColorOnDark(key: SizeKey, d: number) {
  if (d === 0) return "#D9CFBB";
  const field = SIZE_FIELDS.find((f) => f.key === key)!;
  const good = field.goodWhenDown ? d < 0 : d > 0;
  return good ? "#A9C288" : "#E2A184";
}

/** 明るい背景（ペーパー）用の差分カラー */
export function diffColorOnLight(key: SizeKey, d: number) {
  if (d === 0) return "#9A8670";
  const field = SIZE_FIELDS.find((f) => f.key === key)!;
  const good = field.goodWhenDown ? d < 0 : d > 0;
  return good ? "#57683D" : "#B4713B";
}