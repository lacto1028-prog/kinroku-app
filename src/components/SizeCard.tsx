import { ChevronRight, Minus, Ruler, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { MAIN_SIZE_KEYS, SIZE_FIELDS } from "../data/meta";
import { diffColorOnDark, formatDiff } from "../lib/diffColor";
import { toIso } from "../lib/format";
import { useStore } from "../store/useStore";
import { useUiStore } from "../store/useUiStore";
import Sparkline from "./Sparkline";

/** 横スクロール列の右端に置く「サイズ記録」リンクカード（直近1週間を表示） */
export default function SizeCard() {
  const sizeRecords = useStore((s) => s.sizeRecords);
  const openSheet = useUiStore((s) => s.openSheet);
  const selectedMonth = useUiStore((s) => s.selectedMonth);

  const sortedAsc = useMemo(
    () => [...sizeRecords].sort((a, b) => a.date.localeCompare(b.date)),
    [sizeRecords]
  );

  const { latest, base, monthCount, weightTrend, weightSeries } = useMemo(() => {
    // 選択月の月末を取得
    const [year, month] = selectedMonth.split("-").map(Number);
    const monthEnd = new Date(year, month, 0); // 月の最終日
    const monthEndIso = toIso(monthEnd);
    
    // 選択月の月初を取得
    const monthStart = new Date(year, month - 1, 1);
    const monthStartIso = toIso(monthStart);
    
    // 選択月内のレコード
    const monthRecords = sortedAsc.filter((e) => e.date >= monthStartIso && e.date <= monthEndIso);
    const latestEntry = monthRecords[monthRecords.length - 1] ?? sortedAsc[sortedAsc.length - 1];
    
    // 前月のレコード
    const prevMonthEnd = new Date(year, month - 1, 0);
    const prevMonthEndIso = toIso(prevMonthEnd);
    const older = sortedAsc.filter((e) => e.date <= prevMonthEndIso);
    const baseEntry = older.length > 0 ? older[older.length - 1] : sortedAsc[0];
    
    // 選択月内のレコード数
    const count = monthRecords.length;
    
    // 体重の先月比（%）
    let trend: number | null = null;
    if (latestEntry && baseEntry && baseEntry.weight > 0) {
      trend = Math.round(((latestEntry.weight - baseEntry.weight) / baseEntry.weight) * 100);
    }
    
    // 選択月内の体重推移（スパークライン用）
    const series = monthRecords.map((r) => r.weight);
    
    return {
      latest: latestEntry,
      base: baseEntry,
      monthCount: count,
      weightTrend: trend,
      weightSeries: series,
    };
  }, [sortedAsc, selectedMonth]);

  if (!latest) return null;

  const mainFields = SIZE_FIELDS.filter((f) => MAIN_SIZE_KEYS.includes(f.key));

  return (
    <button
      type="button"
      onClick={() => openSheet({ type: "sizes" })}
      className="tap relative w-[224px] shrink-0 snap-start overflow-hidden rounded-[1.25rem] border border-espresso/40 bg-espresso p-4 text-left text-cream shadow-lift transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
      style={{
        backgroundImage:
          "radial-gradient(20rem 12rem at 110% -20%, rgba(192,138,62,0.35), transparent 60%)",
      }}
    >
      <span className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-[0.65rem] bg-cream/15 text-caramel">
          <Ruler size={17} strokeWidth={2.2} />
        </span>
        <span>
          <span className="block font-display text-[15px] leading-tight font-extrabold">サイズ記録</span>
          <span className="mt-0.5 block text-[9.5px] font-medium tracking-wide text-cream/60">
            体重・胸囲・腕・脚・ウエスト
          </span>
        </span>
        <ChevronRight size={16} className="ml-auto text-cream/50" />
      </span>

      {/* 今月の記録数 */}
      <p className="mt-2.5 flex items-baseline gap-1">
        <span className="font-display text-[26px] leading-none font-black">{monthCount}</span>
        <span className="text-xs font-bold text-cream/80">件</span>
        <span className="ml-auto text-[9px] font-bold text-cream/60">今月</span>
      </p>

      {/* 体重推移スパークライン */}
      {weightSeries.length > 0 && (
        <Sparkline data={weightSeries} stroke="#C08A3E" className="mt-2 h-8 w-full" />
      )}

      <span className="mt-3 block">
        {mainFields.map((f) => {
          const Icon = f.icon;
          const value = latest[f.key];
          const d = Math.round((value - base[f.key]) * 10) / 10;
          return (
            <span
              key={f.key}
              className="flex items-center gap-2 border-b border-cream/10 py-[5px] last:border-0"
            >
              <Icon size={12} className="shrink-0 text-cream/55" />
              <span className="text-[11px] font-medium text-cream/80">{f.label}</span>
              <span className="ml-auto font-display text-[13px] font-extrabold">
                {value.toFixed(1)}
                <span className="ml-0.5 text-[9px] font-bold text-cream/55">{f.unit}</span>
              </span>
              <span
                className="w-9 text-right text-[10px] font-bold tabular-nums"
                style={{ color: diffColorOnDark(f.key, d) }}
              >
                {formatDiff(d)}
              </span>
            </span>
          );
        })}
      </span>

      {/* 体重の先月比トレンドバッジ */}
      <p className="mt-2 flex items-center gap-1.5">
        {weightTrend === null ? (
          <span className="flex items-center gap-0.5 rounded-full bg-cream/15 px-1.5 py-0.5 text-[10px] font-bold text-cream/70">
            <Minus size={10} /> ー
          </span>
        ) : weightTrend >= 0 ? (
          <span className="flex items-center gap-0.5 rounded-full bg-moss/30 px-1.5 py-0.5 text-[10px] font-bold text-moss">
            <TrendingUp size={10} /> +{weightTrend}%
          </span>
        ) : (
          <span className="flex items-center gap-0.5 rounded-full bg-clay/30 px-1.5 py-0.5 text-[10px] font-bold text-clay">
            <TrendingDown size={10} /> {weightTrend}%
          </span>
        )}
        <span className="text-[9px] font-medium text-cream/70">
          {weightTrend === null ? "先月データなし" : "体重の先月比"}
        </span>
      </p>

      <span className="mt-3 flex items-center justify-between rounded-lg bg-cream/10 px-2.5 py-2">
        <span className="text-[10px] font-medium text-cream/75">この月で{monthCount}件を記録</span>
        <span className="flex items-center gap-0.5 text-[10.5px] font-extrabold text-caramel">
          すべて見る <ChevronRight size={11} strokeWidth={3} />
        </span>
      </span>
    </button>
  );
}