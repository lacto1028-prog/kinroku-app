import { Lock } from "lucide-react";
import { useEffect } from "react";
import ArchiveSection from "./components/ArchiveSection";
import CalendarSheet from "./components/CalendarSheet";
import DataManageSheet from "./components/DataManageSheet";
import Header from "./components/Header";
import MuscleDetailSheet from "./components/MuscleDetailSheet";
import NowMonthSection from "./components/NowMonthSection";
import SettingsSheet from "./components/SettingsSheet";
import SizeDetailSheet from "./components/SizeDetailSheet";
import Toast from "./components/Toast";
import { greeting, todayLong } from "./lib/format";
import { useUiStore } from "./store/useUiStore";

export default function App() {
  const theme = useUiStore((s) => s.theme);
  const customGreeting = useUiStore((s) => s.customGreeting);
  const fontSize = useUiStore((s) => s.fontSize);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const sizeMap = {
      small: "14px",
      medium: "16px",
      large: "18px",
    };
    document.documentElement.style.fontSize = sizeMap[fontSize];
  }, [fontSize]);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md">
      <Header />
      <main className="px-4 pb-12">
        <div className="anim-rise pt-5 pb-4">
          <p className="text-[10.5px] font-bold tracking-[0.22em] text-latte">{todayLong()}</p>
          <h1 className="mt-1 font-display text-[25px] leading-snug font-black text-bark">
            {customGreeting ? (
              customGreeting
            ) : (
              <>
                {greeting()}。
                <br />
                今日も<span className="text-caramel-deep">コツコツ</span>いこう。
              </>
            )}
          </h1>
        </div>

        <NowMonthSection />
        <ArchiveSection />

        <footer className="mt-10 border-t border-dashed border-sand-deep pt-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[10.5px] font-medium text-latte">
            <Lock size={11} /> すべてのデータはこの端末内にのみ保存されます
          </p>
          <p className="mt-1.5 font-display text-[11px] font-extrabold text-cocoa">Kinroku v1.1.0</p>
        </footer>
      </main>

      <SettingsSheet />
      <SizeDetailSheet />
      <MuscleDetailSheet />
      <DataManageSheet />
      <CalendarSheet />
      <Toast />
    </div>
  );
}