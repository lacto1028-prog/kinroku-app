import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { bodyVisual } from "../data/meta";
import { bodyPartMonthly, bodyPartTrend, weeklyCounts } from "../lib/stats";
import { useStore } from "../store/useStore";
import { useUiStore } from "../store/useUiStore";
import Sparkline from "./Sparkline";

interface CardVisualProps {
  id: string;
  overlay?: boolean;
  handle?: ReactNode;
  onClick?: () => void;
}

/** 部位カードの中身（通常表示 / ドラッグ中のオーバーレイ兼用） */
export function MuscleCardVisual({ id, overlay, handle, onClick }: CardVisualProps) {
  const records = useStore((s) => s.workoutRecords);
  const part = useStore((s) => s.bodyParts.find((p) => p.id === id));
  const meta = bodyVisual(id);
  const Icon = meta.icon;
  const selectedMonth = useUiStore((s) => s.selectedMonth);

  const [year, month] = selectedMonth.split("-").map(Number);
  const count = useMemo(
    () => bodyPartMonthly(records, id, year, month - 1),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records, id, selectedMonth]
  );
  const trend = useMemo(() => bodyPartTrend(records, id), [records, id]);
  const weekly = useMemo(() => weeklyCounts(records, id, 8), [records, id]);
  const latest = useMemo(() => {
    const list = records.filter((r) => r.bodyPartId === id);
    if (list.length === 0) return null;
    return list.reduce((a, b) => (a.date >= b.date ? a : b));
  }, [records, id]);

  const trendBadge =
    trend === null ? (
      <span className="flex items-center gap-0.5 rounded-full bg-sand/70 px-1.5 py-0.5 text-[10px] font-bold text-cocoa">
        <Minus size={10} /> ー
      </span>
    ) : trend >= 0 ? (
      <span className="flex items-center gap-0.5 rounded-full bg-moss/15 px-1.5 py-0.5 text-[10px] font-bold text-moss-deep">
        <TrendingUp size={10} /> +{trend}%
      </span>
    ) : (
      <span className="flex items-center gap-0.5 rounded-full bg-clay/15 px-1.5 py-0.5 text-[10px] font-bold text-clay">
        <TrendingDown size={10} /> {trend}%
      </span>
    );

  const base =
    "relative w-[150px] shrink-0 snap-start rounded-[1.25rem] border bg-paper p-3.5 text-left shadow-soft transition-all duration-200";
  const look = overlay
    ? "border-caramel/70 shadow-lift rotate-2 scale-105"
    : "tap cursor-pointer border-sand hover:-translate-y-0.5 hover:border-sand-deep hover:shadow-lift active:scale-[0.97]";

  const inner = (
    <>
      {handle}
      <div className="flex items-start">
        <span
          className="grid size-9 place-items-center rounded-[0.65rem]"
          style={{ backgroundColor: meta.soft, color: meta.color }}
        >
          <Icon size={18} strokeWidth={2.2} />
        </span>
      </div>
      <p className="mt-2.5 flex items-baseline gap-1.5">
        <span className="font-display text-[15px] font-extrabold text-bark">{part?.name ?? id}</span>
        <span className="text-[9px] font-bold tracking-[0.18em] text-latte">{meta.en}</span>
      </p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="font-display text-[26px] leading-none font-black text-bark">{count}</span>
        <span className="text-xs font-bold text-cocoa">回</span>
        <span className="ml-auto text-[9px] font-bold text-latte">今月</span>
      </p>
      <Sparkline data={weekly} stroke={meta.color} className="mt-2 h-8 w-full" />
      <p className="mt-1 min-h-[14px] text-[9.5px] leading-snug font-medium text-latte">
        {latest ? (
          <span className="line-clamp-1">{latest.content.split("\n")[0]}</span>
        ) : (
          <span className="italic">まだ記録なし</span>
        )}
      </p>
      <p className="mt-1.5 flex items-center gap-1.5">
        {trendBadge}
        <span className="text-[9px] font-medium text-latte">
          {trend === null ? "先月データなし" : "先月比"}
        </span>
      </p>
    </>
  );

  if (onClick && !overlay) {
    return (
      <button type="button" onClick={onClick} className={`${base} ${look} block`}>
        {inner}
      </button>
    );
  }
  return <div className={`${base} ${look}`}>{inner}</div>;
}

/** 並び替え可能な部位カード（ドラッグはグリップからのみ → 横スクロールと両立） */
export default function SortableMuscleCard({ id, onOpen }: { id: string; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const name = useStore((s) => s.bodyParts.find((p) => p.id === id)?.name ?? id);

  const handle = (
    <span
      ref={setActivatorNodeRef}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-label={`${name}カードをドラッグで並び替え`}
      className="absolute top-2.5 right-2.5 cursor-grab touch-none rounded-md p-1 text-sand-deep transition-colors hover:bg-sand/60 hover:text-cocoa active:cursor-grabbing"
    >
      <GripVertical size={15} />
    </span>
  );

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`shrink-0 snap-start ${isDragging ? "relative z-10 opacity-30" : ""}`}
    >
      <MuscleCardVisual id={id} handle={handle} onClick={onOpen} />
    </div>
  );
}