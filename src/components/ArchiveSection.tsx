import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ArrowUpDown,
  CalendarRange,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { bodyVisual } from "../data/meta";
import { useReveal } from "../hooks/useReveal";
import { fmtNum, monthKeyOf } from "../lib/format";
import { computeMonths, computeYears } from "../lib/stats";
import { sortedParts, useStore } from "../store/useStore";
import { useUiStore } from "../store/useUiStore";
import type { MonthStats, SortMode, YearStats } from "../types";

const MODES: Array<{ mode: SortMode; label: string; icon: LucideIcon }> = [
  { mode: "year", label: "年次", icon: CalendarRange },
  { mode: "new", label: "新しい順", icon: ArrowDownWideNarrow },
  { mode: "old", label: "古い順", icon: ArrowUpNarrowWide },
];

const ITEMS_PER_PAGE = 12;

function StackedBar({
  byBodyPart,
  total,
  className,
}: {
  byBodyPart: Record<string, number>;
  total: number;
  className?: string;
}) {
  const ids = Object.keys(byBodyPart).filter((id) => byBodyPart[id] > 0);
  return (
    <span className={`flex h-2 overflow-hidden rounded-full bg-sand/60 ${className ?? ""}`}>
      {ids.map((id, i) => (
        <span
          key={id}
          title={`${id} ${byBodyPart[id]}回`}
          className="h-full"
          style={{
            width: `${(byBodyPart[id] / total) * 100}%`,
            backgroundColor: bodyVisual(id).color,
            marginLeft: i > 0 ? 2 : 0,
            borderRadius: 3,
          }}
        />
      ))}
    </span>
  );
}

function MonthRow({
  m,
  isCurrent,
  isSelected,
  expanded,
  onToggle,
  onSelect,
  index,
  nameOf,
  hiddenMuscles,
}: {
  m: MonthStats;
  isCurrent: boolean;
  isSelected: boolean;
  expanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  index: number;
  nameOf: (id: string) => string;
  hiddenMuscles: string[];
}) {
  const maxCount = Math.max(...Object.values(m.byBodyPart), 1);
  const ids = Object.keys(m.byBodyPart).filter((id) => m.byBodyPart[id] > 0 && !hiddenMuscles.includes(id));
  return (
    <div className="anim-rise" style={{ animationDelay: `${index * 40}ms` }}>
      <div
        className={`rounded-[1.1rem] border transition-all duration-200 ${
          isSelected
            ? "border-caramel/60 bg-caramel/5 shadow-lift"
            : "border-sand bg-paper shadow-soft"
        }`}
      >
        <button
          type="button"
          onClick={onSelect}
          className="tap w-full p-3.5 text-left"
        >
          <span className="flex items-center gap-2.5">
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="font-display text-[15.5px] font-extrabold text-bark">
                  {m.year}年{m.month}月
                </span>
                {isCurrent && (
                  <span className="rounded-full bg-caramel/15 px-1.5 py-0.5 text-[9px] font-extrabold text-caramel-deep">
                    今月
                  </span>
                )}
                {isSelected && (
                  <span className="rounded-full bg-caramel px-1.5 py-0.5 text-[9px] font-extrabold text-cream">
                    表示中
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-[10.5px] font-medium text-latte">
                記録 {m.records}回 ・ トレーニング{m.days}日
              </span>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="tap rounded-full p-1.5 hover:bg-sand/50 active:scale-90"
              aria-expanded={expanded}
              aria-label="詳細を表示"
            >
              <ChevronDown
                size={16}
                className={`text-latte transition-transform duration-300 ${expanded ? "rotate-180 text-caramel-deep" : ""}`}
              />
            </button>
          </span>
          <StackedBar byBodyPart={m.byBodyPart} total={m.records} className="mt-3" />
        </button>
        {expanded && (
          <div className="anim-fade border-t border-dashed border-sand px-3.5 pb-3.5 pt-3">
            <div className="space-y-2.5">
              {ids.map((id) => {
                const count = m.byBodyPart[id];
                const vis = bodyVisual(id);
                return (
                  <span key={id} className="block">
                    <span className="flex items-center gap-2 text-[11px]">
                      <span className="size-2 rounded-full" style={{ backgroundColor: vis.color }} />
                      <span className="font-bold text-bark">{nameOf(id)}</span>
                      <span className="ml-auto font-bold text-cocoa tabular-nums">{count}回</span>
                    </span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-sand/60">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: vis.color }}
                      />
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function YearCard({
  y,
  index,
  isExpanded,
  onToggle,
  months,
  nameOf,
  selectedMonth,
  onSelectMonth,
  hiddenMuscles,
}: {
  y: YearStats;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  months: MonthStats[];
  nameOf: (id: string) => string;
  selectedMonth: string;
  onSelectMonth: (key: string) => void;
  hiddenMuscles: string[];
}) {
  return (
    <div
      className="anim-rise overflow-hidden rounded-[1.1rem] border border-espresso/25 bg-gradient-to-br from-paper to-cream shadow-soft"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="tap w-full p-4 text-left"
      >
        <p className="flex items-baseline gap-2">
          <span className="font-display text-[22px] font-black text-bark">{y.year}年</span>
          <span className="rounded-full bg-bark px-2 py-0.5 text-[9.5px] font-extrabold text-cream">
            {y.months}か月分
          </span>
          <ChevronDown
            size={16}
            className={`ml-auto text-latte transition-transform duration-300 ${isExpanded ? "rotate-180 text-caramel-deep" : ""}`}
          />
        </p>
        <p className="mt-1.5 text-[12px] font-bold text-cocoa">
          合計 {y.records}回の記録
          <span className="mx-1 text-sand-deep">·</span>
          月平均 {fmtNum(y.records / y.months)}回
        </p>
        <StackedBar byBodyPart={y.byBodyPart} total={y.records} className="mt-3" />
      </button>
      {isExpanded && (
        <div className="anim-fade space-y-2 border-t border-dashed border-sand-deep/40 bg-cream/50 p-3">
          {months.map((m, i) => (
            <MonthRow
              key={m.key}
              m={m}
              index={i}
              isCurrent={m.key === monthKeyOf(new Date())}
              isSelected={m.key === selectedMonth}
              expanded={false}
              onToggle={() => {}}
              onSelect={() => onSelectMonth(m.key)}
              nameOf={nameOf}
              hiddenMuscles={hiddenMuscles}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ArchiveSection() {
  const records = useStore((s) => s.workoutRecords);
  const bodyParts = useStore((s) => s.bodyParts);
  const hiddenMuscles = useUiStore((s) => s.hiddenMuscles);
  const orderedParts = useMemo(() => sortedParts(bodyParts), [bodyParts]);
  const sortMode = useStore((s) => s.sortMode);
  const setSortMode = useStore((s) => s.setSortMode);
  const notify = useUiStore((s) => s.notify);
  const selectedMonth = useUiStore((s) => s.selectedMonth);
  const setSelectedMonth = useUiStore((s) => s.setSelectedMonth);

  const { ref, shown } = useReveal<HTMLElement>();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [page, setPage] = useState(0);

  const monthsAsc = useMemo(() => computeMonths(records), [records]);
  const years = useMemo(() => computeYears(monthsAsc), [monthsAsc]);
  const currentKey = monthKeyOf(new Date());
  const nameOf = (id: string) => orderedParts.find((p) => p.id === id)?.name ?? id;

  // 並び替え変更時に1ページ目に戻る
  const handleSortChange = (mode: SortMode) => {
    setSortMode(mode);
    setPage(0);
    notify(`「${MODES.find((m) => m.mode === mode)?.label}」で並び替えました`);
  };

  const handleSelectMonth = (key: string) => {
    setSelectedMonth(key);
    // トップにスクロールして「今月の記録」セクションを表示
    window.scrollTo({ top: 0, behavior: "smooth" });
    notify(`${key.replace("-", "年")}月の記録を表示中`);
  };

  let list: ReactNode;
  let totalPages = 1;
  let currentPage = 0;

  if (sortMode === "year") {
    // 年次モードはページネーションなし（年カードが少ない）
    list = years.map((y, i) => {
      const yearMonths = monthsAsc.filter((m) => m.year === y.year);
      return (
        <YearCard
          key={y.year}
          y={y}
          index={i}
          isExpanded={expandedYear === y.year}
          onToggle={() => setExpandedYear((cur) => (cur === y.year ? null : y.year))}
          months={yearMonths}
          nameOf={nameOf}
          selectedMonth={selectedMonth}
          onSelectMonth={handleSelectMonth}
          hiddenMuscles={hiddenMuscles}
        />
      );
    });
  } else {
    // 月次・新しい順・古い順は12件ずつページネーション
    const ordered = sortMode === "new" ? [...monthsAsc].reverse() : monthsAsc;
    totalPages = Math.ceil(ordered.length / ITEMS_PER_PAGE);
    currentPage = Math.min(page, totalPages - 1);
    
    const startIdx = currentPage * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const pageItems = ordered.slice(startIdx, endIdx);

    list = pageItems.map((m, i) => (
      <Fragment key={m.key}>
        <MonthRow
          m={m}
          index={i}
          isCurrent={m.key === currentKey}
          isSelected={m.key === selectedMonth}
          expanded={expanded === m.key}
          onToggle={() => setExpanded((cur) => (cur === m.key ? null : m.key))}
          onSelect={() => handleSelectMonth(m.key)}
          nameOf={nameOf}
          hiddenMuscles={hiddenMuscles}
        />
      </Fragment>
    ));
  }

  return (
    <section ref={ref} className={`reveal ${shown ? "reveal-in" : ""} mt-8`}>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.26em] text-caramel-deep">ARCHIVE</p>
          <h2 className="mt-1 font-display text-[21px] leading-tight font-black text-bark">各月の記録</h2>
        </div>
        <p className="text-[10.5px] font-bold text-latte">全{monthsAsc.length}か月</p>
      </div>

      {/* ソートが変わるたびにフェードインし直す */}
      <div key={`${sortMode}-${currentPage}`} className="mt-3 space-y-2.5">
        {list}
      </div>

      {/* ページネーション（月次・新しい順・古い順のみ） */}
      {sortMode !== "year" && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className={`tap flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all duration-200 ${
              currentPage === 0
                ? "cursor-default border-sand bg-cream text-latte/50"
                : "border-sand bg-paper text-cocoa shadow-soft hover:border-sand-deep hover:text-bark active:scale-95"
            }`}
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
            前へ
          </button>
          <span className="font-display text-[12px] font-extrabold text-cocoa">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className={`tap flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all duration-200 ${
              currentPage === totalPages - 1
                ? "cursor-default border-sand bg-cream text-latte/50"
                : "border-sand bg-paper text-cocoa shadow-soft hover:border-sand-deep hover:text-bark active:scale-95"
            }`}
          >
            次へ
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* 並び替えボタン（下部） */}
      <div className="mt-5 rounded-[1.25rem] border border-sand bg-paper p-3 shadow-soft">
        <p className="mb-2 flex items-center gap-1.5 text-[9.5px] font-bold tracking-[0.2em] text-latte">
          <ArrowUpDown size={11} /> 並び替え
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {MODES.map(({ mode, label, icon: Icon }) => {
            const active = sortMode === mode;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={active}
                onClick={() => handleSortChange(mode)}
                className={`tap flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[10.5px] font-bold transition-all duration-200 active:scale-95 ${
                  active
                    ? "border-bark bg-bark text-cream shadow-soft"
                    : "border-sand bg-cream text-cocoa hover:border-sand-deep hover:text-bark"
                }`}
              >
                <Icon size={15} strokeWidth={2.2} className={active ? "text-caramel" : ""} />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}