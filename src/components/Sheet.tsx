import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

interface SheetProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

/** スマホ定番のボトムシート。背景タップ / Esc で閉じる */
export default function Sheet({ open, title, subtitle, onClose, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="閉じる"
        onClick={onClose}
        className="anim-fade absolute inset-0 w-full bg-bark/45 backdrop-blur-[2px]"
      />
      <div className="anim-sheet-up absolute inset-x-0 bottom-0 mx-auto flex max-h-[86dvh] w-full max-w-md flex-col rounded-t-[1.75rem] border-t border-x border-sand bg-cream shadow-lift">
        <div className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-sand-deep" />
        <div className="flex items-start justify-between gap-3 px-5 pt-3.5 pb-3">
          <div>
            <h2 className="font-display text-lg leading-tight font-extrabold text-bark">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-latte">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="tap rounded-full border border-sand bg-paper p-2 text-cocoa transition hover:bg-sand/60 active:scale-90"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}