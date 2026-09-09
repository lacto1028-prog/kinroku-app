import { CalendarDays, ChevronDown, Copy, FileText, Layers, Pencil, Plus, Save, X, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { bodyVisual } from "../data/meta";
import { dayLabel, fmtNum, monthKeyOf, monthLabel, toIso } from "../lib/format";
import { bodyPartMonthly, weeklyCounts } from "../lib/stats";
import { useStore } from "../store/useStore";
import { useUiStore } from "../store/useUiStore";
import type { WorkoutRecord } from "../types";
import ImageModal from "./ImageModal";
import Sheet from "./Sheet";
import Sparkline from "./Sparkline";

/** 部位カードをタップした時の詳細シート */
export default function MuscleDetailSheet() {
  const sheet = useUiStore((s) => s.sheet);
  const closeSheet = useUiStore((s) => s.closeSheet);
  const openSheet = useUiStore((s) => s.openSheet);
  const records = useStore((s) => s.workoutRecords);
  const templates = useStore((s) => s.templates);
  const part = useStore((s) =>
    sheet?.type === "muscle" ? s.bodyParts.find((p) => p.id === sheet.muscleId) : undefined
  );

  const muscleId = sheet?.type === "muscle" ? sheet.muscleId : null;
  const meta = bodyVisual(muscleId ?? "");
  const Icon = meta.icon;
  const selectedMonth = useUiStore((s) => s.selectedMonth);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
  const [editingRecord, setEditingRecord] = useState<WorkoutRecord | null>(null);
  const [editContent, setEditContent] = useState("");
  const updateWorkoutRecord = useStore((s) => s.updateWorkoutRecord);
  const addWorkoutRecord = useStore((s) => s.addWorkoutRecord);
  const notify = useUiStore((s) => s.notify);

  const [year, month] = selectedMonth.split("-").map(Number);
  const prevDate = new Date(year, month - 2, 1); // 前月

  const curCount = useMemo(
    () => (muscleId ? bodyPartMonthly(records, muscleId, year, month - 1) : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records, muscleId, selectedMonth]
  );
  const prevCount = useMemo(
    () =>
      muscleId ? bodyPartMonthly(records, muscleId, prevDate.getFullYear(), prevDate.getMonth()) : 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records, muscleId, selectedMonth]
  );
  const total = useMemo(
    () => records.filter((r) => r.bodyPartId === muscleId).length,
    [records, muscleId]
  );
  const weekly = useMemo(
    () => (muscleId ? weeklyCounts(records, muscleId, 8) : []),
    [records, muscleId]
  );
  const monthList = useMemo(
    () =>
      records
        .filter(
          (r) => r.bodyPartId === muscleId && monthKeyOf(new Date(`${r.date}T00:00:00`)) === selectedMonth
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [records, muscleId, selectedMonth]
  );

  const stats = [
    { icon: CalendarDays, label: "今月", value: String(curCount), unit: "回" },
    { icon: Layers, label: "先月", value: String(prevCount), unit: "回" },
    { icon: Trophy, label: "累計", value: fmtNum(total), unit: "回" },
  ];

  return (
    <Sheet
      open={muscleId !== null}
      title={`${part?.name ?? "部位"}の記録`}
      subtitle={`${meta.en} ─ ${monthLabel(selectedMonth)}`}
      onClose={closeSheet}
    >
      {/* ヘッダー */}
      <div
        className="rounded-xl border p-4"
        style={{ backgroundColor: meta.soft, borderColor: `${meta.color}33` }}
      >
        <div className="flex items-center gap-3">
          <span
            className="grid size-11 place-items-center rounded-xl bg-paper shadow-soft"
            style={{ color: meta.color }}
          >
            <Icon size={22} strokeWidth={2.2} />
          </span>
          <div>
            <p className="font-display text-lg leading-tight font-black text-bark">
              {part?.name ?? muscleId}
              <span className="ml-1.5 text-[10px] font-bold tracking-[0.2em] text-cocoa">{meta.en}</span>
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[10.5px] font-bold" style={{ color: meta.color }}>
              <FileText size={11} /> テンプレート活用で入力を時短
            </p>
          </div>
        </div>
      </div>

      {/* 統計 */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {stats.map((s) => {
          const SIcon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-sand bg-paper px-3 py-2.5">
              <p className="flex items-center gap-1 text-[9px] font-bold text-latte">
                <SIcon size={10} className="text-caramel-deep" /> {s.label}
              </p>
              <p className="mt-1 font-display text-[18px] leading-none font-black text-bark">
                {s.value}
                <span className="ml-0.5 text-[10px] font-extrabold text-cocoa">{s.unit}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* 週別記録数 */}
      <div className="mt-3 rounded-xl border border-sand bg-paper p-3.5">
        <p className="text-[10px] font-bold tracking-[0.18em] text-latte">週別記録数（直近8週間）</p>
        <Sparkline data={weekly.length ? weekly : [0, 0]} stroke={meta.color} className="mt-2 h-14 w-full" strokeWidth={2.4} />
      </div>

      {/* 今月のセッション一覧 */}
      <div className="mt-5 mb-1.5 flex items-center justify-between">
        <p className="text-[9.5px] font-bold tracking-[0.22em] text-latte">今月の記録</p>
        <button
          type="button"
          onClick={() =>
            muscleId && openSheet({ type: "data", tab: "records", presetBodyPartId: muscleId })
          }
          className="tap flex items-center gap-1 rounded-full bg-bark px-2.5 py-1 text-[10px] font-extrabold text-cream transition-all duration-200 hover:bg-espresso active:scale-95"
        >
          <Plus size={11} strokeWidth={3} /> 記録を追加
        </button>
      </div>
      {monthList.length === 0 ? (
        <p className="rounded-xl border border-dashed border-sand-deep bg-paper/60 px-4 py-6 text-center text-[11.5px] text-latte">
          今月はまだ記録がありません
        </p>
      ) : (
        <div className="space-y-2">
          {monthList.map((r) => {
            const tpl = templates.find((t) => t.id === r.templateId);
            const isExpanded = expandedRecords.has(r.id);
            const isEditing = editingRecord?.id === r.id;
            return (
              <div key={r.id} className="rounded-xl border border-sand bg-paper px-3.5 py-2.5">
                {isEditing ? (
                  // 編集モード
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10.5px] font-bold text-cocoa">{dayLabel(r.date)}</p>
                      <button
                        type="button"
                        onClick={() => setEditingRecord(null)}
                        className="tap rounded-full p-1 text-latte hover:bg-sand/60"
                        aria-label="キャンセル"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={5}
                      className="w-full resize-y rounded-lg border border-sand bg-cream px-3 py-2 text-[12px] leading-relaxed text-bark placeholder:text-latte/60 focus:border-caramel focus:outline-none"
                      placeholder="記録内容を入力..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (editContent.trim()) {
                          updateWorkoutRecord(r.id, { content: editContent.trim() });
                          setEditingRecord(null);
                          notify("記録を更新しました");
                        }
                      }}
                      className="tap flex w-full items-center justify-center gap-1 rounded-lg bg-bark py-2 text-[11px] font-extrabold text-cream transition-all duration-200 hover:bg-espresso active:scale-[0.98]"
                    >
                      <Save size={12} />
                      保存
                    </button>
                  </div>
                ) : (
                  // 表示モード
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const newSet = new Set(expandedRecords);
                        if (isExpanded) {
                          newSet.delete(r.id);
                        } else {
                          newSet.add(r.id);
                        }
                        setExpandedRecords(newSet);
                      }}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between">
                        <p className="flex items-center gap-2 text-[10.5px] font-bold text-cocoa">
                          {dayLabel(r.date)}
                          {tpl && (
                            <span
                              className="rounded-full px-1.5 py-0.5 text-[8.5px] font-extrabold"
                              style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
                            >
                              {tpl.name}
                            </span>
                          )}
                        </p>
                        <ChevronDown
                          size={14}
                          className={`text-latte transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                      <p
                        className={`mt-1 text-[11.5px] leading-relaxed break-words whitespace-pre-line text-bark/85 ${
                          isExpanded ? "" : "line-clamp-2"
                        }`}
                      >
                        {r.content}
                      </p>
                    </button>
                    {r.images && r.images.length > 0 && (
                      <div className="mt-2 flex gap-1.5 overflow-x-auto">
                        {r.images.slice(0, 3).map((img, index) => (
                          <img
                            key={index}
                            src={img}
                            alt={`画像 ${index + 1}`}
                            className="h-12 w-12 shrink-0 cursor-zoom-in rounded border border-sand object-cover transition hover:opacity-80"
                            onClick={() => setModalImage(img)}
                          />
                        ))}
                        {r.images.length > 3 && (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-sand bg-cream text-[10px] font-bold text-cocoa">
                            +{r.images.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRecord(r);
                          setEditContent(r.content);
                        }}
                        className="tap flex items-center gap-1 rounded-lg border border-sand bg-cream px-2 py-1 text-[10px] font-bold text-cocoa transition hover:border-sand-deep hover:text-bark active:scale-95"
                      >
                        <Pencil size={10} />
                        編集
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const today = toIso(new Date());
                          addWorkoutRecord({
                            date: today,
                            bodyPartId: r.bodyPartId,
                            content: r.content,
                            templateId: r.templateId,
                            images: r.images,
                          });
                          notify("記録をコピーしました");
                        }}
                        className="tap flex items-center gap-1 rounded-lg border border-sand bg-cream px-2 py-1 text-[10px] font-bold text-cocoa transition hover:border-sand-deep hover:text-bark active:scale-95"
                      >
                        <Copy size={10} />
                        コピー
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalImage && (
        <ImageModal src={modalImage} onClose={() => setModalImage(null)} />
      )}
    </Sheet>
  );
}