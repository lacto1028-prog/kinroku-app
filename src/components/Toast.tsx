import { Check } from "lucide-react";
import { useUiStore } from "../store/useUiStore";

export default function Toast() {
  const toast = useUiStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-6">
      <div
        key={toast}
        className="anim-pop flex items-center gap-2 rounded-full bg-bark py-2.5 pr-4 pl-3 text-sm font-medium text-cream shadow-lift"
      >
        <span className="grid size-5 place-items-center rounded-full bg-moss text-cream">
          <Check size={12} strokeWidth={3} />
        </span>
        {toast}
      </div>
    </div>
  );
}