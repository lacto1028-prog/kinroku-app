import { Flame, Settings } from "lucide-react";
import { useMemo } from "react";
import { currentStreak } from "../lib/stats";
import { useStore } from "../store/useStore";
import { useUiStore } from "../store/useUiStore";

export default function Header() {
  const records = useStore((s) => s.workoutRecords);
  const openSheet = useUiStore((s) => s.openSheet);
  const streak = useMemo(() => currentStreak(records), [records]);

  return (
    <header className="sticky top-0 z-40 border-b border-sand/80 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
        <img src="/icons/icon.svg" alt="" className="size-10 shrink-0 rounded-[0.8rem] shadow-soft" />
        <div className="min-w-0">
          <p className="font-display text-lg leading-none font-black tracking-tight text-bark">Kinroku</p>
          <p className="mt-1 text-[9px] font-bold tracking-[0.28em] text-latte">WORKOUT JOURNAL</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span
            className="flex items-center gap-1 rounded-full border border-sand bg-paper px-2.5 py-1.5 shadow-soft"
            title="連続記録日数"
          >
            <Flame size={14} className="anim-flicker text-caramel" fill="currentColor" strokeWidth={1.5} />
            <span className="font-display text-xs font-extrabold text-bark">{streak}日</span>
          </span>
          <button
            type="button"
            aria-label="設定を開く"
            onClick={() => openSheet({ type: "settings" })}
            className="tap rounded-full border border-sand bg-paper p-2.5 text-cocoa shadow-soft transition-all duration-200 hover:rotate-45 hover:text-bark active:scale-90"
          >
            <Settings size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}