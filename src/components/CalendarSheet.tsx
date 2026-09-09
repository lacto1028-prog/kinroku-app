import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { bodyVisual } from "../data/meta";
import { useStore } from "../store/useStore";
import { useUiStore } from "../store/useUiStore";
import type { WorkoutRecord } from "../types";
import Sheet from "./Sheet";

/** カレンダー表示シート */
export default function CalendarSheet() {
  const sheet = useUiStore((s) => s.sheet);
  const closeSheet = useUiStore((s) => s.closeSheet);
  const records = useStore((s) => s.workoutRecords);
  const bodyParts = useStore((s) => s.bodyParts);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const open = sheet?.type === "calendar";

  // 月の記録を日付ごとにグループ化
  const recordsByDate = useMemo(() => {
    const map = new Map<string, WorkoutRecord[]>();
    records.forEach((r) => {
      const existing = map.get(r.date) || [];
      existing.push(r);
      map.set(r.date, existing);
    });
    return map;
  }, [records]);

  // カレンダーの日付配列を生成
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: Array<{ date: string; day: number; isCurrentMonth: boolean }> = [];

    // 前月の日付
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      days.push({
        date: date.toISOString().split("T")[0],
        day,
        isCurrentMonth: false,
      });
    }

    // 今月の日付
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date: date.toISOString().split("T")[0],
        day,
        isCurrentMonth: true,
      });
    }

    // 次月の日付（6行になるように調整）
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date: date.toISOString().split("T")[0],
        day,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // 月切り替え
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // 選択された日の記録
  const selectedRecords = selectedDate ? recordsByDate.get(selectedDate) || [] : [];

  // 部位名の取得
  const getBodyPartName = (id: string) => {
    return bodyParts.find((p) => p.id === id)?.name || id;
  };

  return (
    <Sheet open={open} title="カレンダー" onClose={closeSheet}>
      {/* 月切り替え */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="tap rounded-full p-2 text-cocoa hover:bg-sand/50"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-display text-lg font-bold text-bark">
          {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
        </h2>
        <button
          onClick={nextMonth}
          className="tap rounded-full p-2 text-cocoa hover:bg-sand/50"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
          <div
            key={day}
            className={`text-center text-xs font-bold ${
              day === "日" ? "text-clay" : day === "土" ? "text-ocean" : "text-cocoa"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dayInfo, idx) => {
          const dayRecords = recordsByDate.get(dayInfo.date) || [];
          const hasRecords = dayRecords.length > 0;
          const isSelected = selectedDate === dayInfo.date;
          const isToday = dayInfo.date === new Date().toISOString().split("T")[0];

          return (
            <button
              key={idx}
              onClick={() => hasRecords && setSelectedDate(dayInfo.date)}
              disabled={!hasRecords}
              className={`tap relative aspect-square rounded-lg border transition-all ${
                isSelected
                  ? "border-caramel bg-caramel/10"
                  : isToday
                  ? "border-caramel/50 bg-caramel/5"
                  : hasRecords
                  ? "border-sand hover:border-caramel/50 hover:bg-sand/30"
                  : "border-transparent"
              } ${!dayInfo.isCurrentMonth ? "opacity-40" : ""}`}
            >
              <div className="flex h-full flex-col items-center justify-center">
                <span
                  className={`text-xs font-bold ${
                    !dayInfo.isCurrentMonth
                      ? "text-latte"
                      : isToday
                      ? "text-caramel-deep"
                      : "text-bark"
                  }`}
                >
                  {dayInfo.day}
                </span>

                {/* 記録がある場合、部位別の色でドット表示 */}
                {hasRecords && (
                  <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                    {Array.from(new Set(dayRecords.map((r) => r.bodyPartId)))
                      .slice(0, 3)
                      .map((bodyPartId) => {
                        const visual = bodyVisual(bodyPartId);
                        return (
                          <div
                            key={bodyPartId}
                            className="size-1.5 rounded-full"
                            style={{ backgroundColor: visual.color }}
                            title={getBodyPartName(bodyPartId)}
                          />
                        );
                      })}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 凡例 */}
      <div className="mt-4 rounded-lg border border-sand bg-paper p-3">
        <p className="mb-2 text-xs font-bold text-cocoa">部位の色分け</p>
        <div className="flex flex-wrap gap-2">
          {bodyParts.map((part) => {
            const visual = bodyVisual(part.id);
            return (
              <div key={part.id} className="flex items-center gap-1">
                <div
                  className="size-2 rounded-full"
                  style={{ backgroundColor: visual.color }}
                />
                <span className="text-xs text-cocoa">{part.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 選択された日の記録表示 */}
      {selectedDate && selectedRecords.length > 0 && (
        <div className="mt-4 rounded-lg border border-caramel/30 bg-caramel/5 p-4">
          <h3 className="mb-3 text-sm font-bold text-bark">
            {new Date(selectedDate).toLocaleDateString("ja-JP", {
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
            の記録
          </h3>
          <div className="space-y-3">
            {selectedRecords.map((record) => {
              const visual = bodyVisual(record.bodyPartId);
              return (
                <div
                  key={record.id}
                  className="rounded-lg border border-sand bg-paper p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: visual.color }}
                    />
                    <span className="text-sm font-bold text-bark">
                      {getBodyPartName(record.bodyPartId)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-xs text-cocoa">
                    {record.content}
                  </p>
                  {record.images && record.images.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {record.images.slice(0, 3).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`記録画像 ${idx + 1}`}
                          className="h-12 w-12 rounded object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Sheet>
  );
}