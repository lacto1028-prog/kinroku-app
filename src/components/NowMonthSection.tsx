import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { ChevronLeft, ChevronRight, GripVertical, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReveal } from "../hooks/useReveal";
import { monthKeyOf, monthLabel } from "../lib/format";
import { sortedParts, useStore } from "../store/useStore";
import { useUiStore } from "../store/useUiStore";
import SortableMuscleCard, { MuscleCardVisual } from "./MuscleCard";
import SizeCard from "./SizeCard";

export default function NowMonthSection() {
  const bodyParts = useStore((s) => s.bodyParts);
  const hiddenMuscles = useUiStore((s) => s.hiddenMuscles);
  const orderedParts = useMemo(
    () => sortedParts(bodyParts).filter((p) => !hiddenMuscles.includes(p.id)),
    [bodyParts, hiddenMuscles]
  );
  const reorderBodyParts = useStore((s) => s.reorderBodyParts);
  const notify = useUiStore((s) => s.notify);
  const openSheet = useUiStore((s) => s.openSheet);
  const selectedMonth = useUiStore((s) => s.selectedMonth);
  const resetSelectedMonth = useUiStore((s) => s.resetSelectedMonth);

  const { ref, shown } = useReveal<HTMLElement>();
  const [activeId, setActiveId] = useState<string | null>(null);
  const lastDragEnd = useRef(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ canLeft: false, canRight: false, progress: 0, viewRatio: 1 });

  const currentMonth = monthKeyOf(new Date());
  const isCurrentMonth = selectedMonth === currentMonth;

  /* ---- 横スクロールの現在位置を追跡 ---- */
  const updateScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setScroll({
      canLeft: el.scrollLeft > 4,
      canRight: max > 4 && el.scrollLeft < max - 4,
      progress: max > 0 ? el.scrollLeft / max : 0,
      viewRatio: el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1,
    });
  }, []);

  useEffect(() => {
    updateScroll();
    window.addEventListener("resize", updateScroll);
    if (document.fonts?.ready) document.fonts.ready.then(updateScroll).catch(() => {});
    return () => window.removeEventListener("resize", updateScroll);
  }, [updateScroll]);

  // 月が変わったらスクロール位置をリセット
  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTo({ left: 0, behavior: "instant" });
      updateScroll();
    }
  }, [selectedMonth, updateScroll]);

  const scrollByCards = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.72), behavior: "smooth" });
  };

  /* ---- ドラッグ&ドロップ並び替え ---- */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    lastDragEnd.current = Date.now();
    const { active, over } = e;
    if (over && active.id !== over.id) {
      reorderBodyParts(String(active.id), String(over.id));
      notify("並び替えを保存しました");
    }
  };

  const thumbWidth = Math.max(0.14, scroll.viewRatio) * 100;

  return (
    <section ref={ref} className={`reveal ${shown ? "reveal-in" : ""} pt-1`}>
      {/* 見出し */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold tracking-[0.26em] text-caramel-deep">
            {isCurrentMonth ? "MONTHLY LOG" : "SELECTED MONTH"}
          </p>
          <h2 className="mt-1 font-display text-[21px] leading-tight font-black text-bark">
            {isCurrentMonth ? "今月の記録" : monthLabel(selectedMonth)}
            {!isCurrentMonth && (
              <span className="ml-1.5 text-[15px] font-extrabold text-cocoa">の記録</span>
            )}
          </h2>
        </div>
        {!isCurrentMonth && (
          <button
            type="button"
            onClick={resetSelectedMonth}
            className="tap mt-2 flex shrink-0 items-center gap-1 rounded-full border border-sand bg-paper px-3 py-1.5 text-[10px] font-bold text-cocoa shadow-soft transition-all duration-200 hover:border-sand-deep hover:text-bark active:scale-95"
          >
            <RotateCcw size={11} />
            今月に戻る
          </button>
        )}
      </div>

      {/* 部位カード見出し行 */}
      <div className="mt-5 mb-2 flex items-center gap-2">
        <p className="text-[10px] font-bold tracking-[0.2em] text-latte">部位カード</p>
        <p className="flex items-center gap-1 rounded-full border border-sand bg-paper px-2 py-1 text-[9.5px] font-bold text-latte">
          <GripVertical size={11} /> グリップをドラッグで並び替え
        </p>
        <span className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            aria-label="カードを左へスクロール"
            onClick={() => scrollByCards(-1)}
            disabled={!scroll.canLeft}
            className={`tap grid size-7 place-items-center rounded-full border border-sand bg-paper text-cocoa shadow-soft transition-all duration-200 ${
              scroll.canLeft
                ? "hover:border-sand-deep hover:text-bark active:scale-90"
                : "cursor-default opacity-35"
            }`}
          >
            <ChevronLeft size={15} strokeWidth={2.6} />
          </button>
          <button
            type="button"
            aria-label="カードを右へスクロール"
            onClick={() => scrollByCards(1)}
            disabled={!scroll.canRight}
            className={`tap grid size-7 place-items-center rounded-full border border-sand bg-paper text-cocoa shadow-soft transition-all duration-200 ${
              scroll.canRight
                ? "hover:border-sand-deep hover:text-bark active:scale-90"
                : "cursor-default opacity-35"
            }`}
          >
            <ChevronRight size={15} strokeWidth={2.6} />
          </button>
        </span>
      </div>

      {/* 横スクロール列（DnD並び替え対応） */}
      <div className="relative -mx-4">
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-1 left-0 z-[5] w-9 bg-gradient-to-r from-cream to-transparent transition-opacity duration-300 ${
            scroll.canLeft ? "opacity-100" : "opacity-0"
          }`}
        />
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-1 right-0 z-[5] w-9 bg-gradient-to-l from-cream to-transparent transition-opacity duration-300 ${
            scroll.canRight ? "opacity-100" : "opacity-0"
          }`}
        />
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext
            items={orderedParts.map((p) => p.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div
              ref={scrollerRef}
              onScroll={updateScroll}
              className="no-scrollbar flex snap-x gap-3 overflow-x-auto overscroll-x-contain px-4 pt-1 pb-3"
            >
              {orderedParts.map((p) => (
                <SortableMuscleCard
                  key={p.id}
                  id={p.id}
                  onOpen={() => {
                    if (Date.now() - lastDragEnd.current < 350) return;
                    openSheet({ type: "muscle", muscleId: p.id });
                  }}
                />
              ))}
              <SizeCard />
            </div>
          </SortableContext>
          <DragOverlay>{activeId ? <MuscleCardVisual id={activeId} overlay /> : null}</DragOverlay>
        </DndContext>
      </div>

      {/* スクロール位置インジケーター */}
      <div className="mx-auto -mt-0.5 h-1 w-24 overflow-hidden rounded-full bg-sand/70">
        <div
          className="h-full rounded-full bg-caramel transition-[width,margin-left] duration-200 ease-out"
          style={{
            width: `${thumbWidth}%`,
            marginLeft: `${scroll.progress * (100 - thumbWidth)}%`,
          }}
        />
      </div>
    </section>
  );
}