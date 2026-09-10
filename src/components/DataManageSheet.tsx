import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Image as ImageIcon,
  Maximize,
  Maximize2,
  Minimize2,
  Pencil,
  Plus,
  Ruler,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SIZE_FIELDS, bodyVisual, type SizeKey } from "../data/meta";
import { dayLabel, toIso } from "../lib/format";
import { compressImages } from "../lib/imageUtils";
import { sortedParts, useStore } from "../store/useStore";
import { useUiStore } from "../store/useUiStore";
import type { DataTab, SizeRecord, WorkoutRecord } from "../types";
import ImageModal from "./ImageModal";
import Sheet from "./Sheet";

const TABS: Array<{ id: DataTab; label: string; icon: LucideIcon }> = [
  { id: "records", label: "記録", icon: FileText },
  { id: "sizes", label: "サイズ", icon: Ruler },
  { id: "templates", label: "テンプレート", icon: Plus },
  { id: "parts", label: "部位", icon: ArrowUp },
];

const inputCls =
  "w-full rounded-lg border border-sand bg-cream px-2.5 py-2 text-[13px] font-medium text-bark placeholder:text-latte/60 focus:border-caramel focus:outline-none";
const saveBtn =
  "tap mt-3 w-full rounded-lg bg-bark py-2.5 text-[12.5px] font-extrabold text-cream transition-all duration-200 hover:bg-espresso active:scale-[0.98]";
const labelCls = "mb-1 block text-[9.5px] font-bold text-latte";

function useArmed() {
  const [armedId, setArmedId] = useState<string | null>(null);
  const ask = (id: string) => {
    if (armedId === id) {
      setArmedId(null);
      return true;
    }
    setArmedId(id);
    setTimeout(() => setArmedId((cur) => (cur === id ? null : cur)), 3000);
    return false;
  };
  const reset = () => setArmedId(null);
  return { armedId, ask, reset };
}

function RowActions({
  onEdit,
  onDelete,
  onCopy,
  armed,
}: {
  onEdit?: () => void;
  onDelete: () => void;
  onCopy?: () => void;
  armed: boolean;
}) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      {onCopy && (
        <button
          type="button"
          aria-label="コピー"
          onClick={onCopy}
          className="tap rounded-md border border-sand bg-cream p-1.5 text-cocoa transition hover:border-sand-deep active:scale-90"
        >
          <Copy size={12} />
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          aria-label="編集"
          onClick={onEdit}
          className="tap rounded-md border border-sand bg-cream p-1.5 text-cocoa transition hover:border-sand-deep active:scale-90"
        >
          <Pencil size={12} />
        </button>
      )}
      <button
        type="button"
        aria-label="削除"
        onClick={onDelete}
        className={`tap rounded-md border p-1.5 transition active:scale-90 ${
          armed
            ? "border-clay bg-clay text-cream"
            : "border-sand bg-cream text-cocoa hover:border-clay/50 hover:text-clay"
        }`}
      >
        <Trash2 size={12} />
      </button>
    </span>
  );
}

/* ================= 記録タブ ================= */
function RecordsTab({ presetBodyPartId }: { presetBodyPartId?: string }) {
  const records = useStore((s) => s.workoutRecords);
  const templates = useStore((s) => s.templates);
  const bodyParts = useStore((s) => s.bodyParts);
  const orderedParts = useMemo(() => sortedParts(bodyParts), [bodyParts]);
  const addWorkoutRecord = useStore((s) => s.addWorkoutRecord);
  const updateWorkoutRecord = useStore((s) => s.updateWorkoutRecord);
  const deleteWorkoutRecord = useStore((s) => s.deleteWorkoutRecord);
  const notify = useUiStore((s) => s.notify);
  const { armedId, ask, reset } = useArmed();

  const [filter, setFilter] = useState<string | null>(presetBodyPartId ?? null);
  const [form, setForm] = useState<{
    id: string | null;
    date: string;
    bodyPartId: string;
    templateId: string;
    content: string;
    images: string[];
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [textareaSize, setTextareaSize] = useState<"small" | "medium" | "large">("medium");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setFilter(presetBodyPartId ?? null), [presetBodyPartId]);

  const list = useMemo(
    () =>
      [...records]
        .filter((r) => !filter || r.bodyPartId === filter)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [records, filter]
  );

  const nameOf = (id: string) => orderedParts.find((p) => p.id === id)?.name ?? id;
  const selectedMonth = useUiStore((s) => s.selectedMonth);

  const openAdd = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const monthEnd = new Date(year, month, 0);
    setForm({
      id: null,
      date: toIso(monthEnd),
      bodyPartId: filter ?? orderedParts[0]?.id ?? "",
      templateId: "",
      content: "",
      images: [],
    });
  };

  const save = () => {
    if (!form) return;
    if (!form.bodyPartId || !form.content.trim()) {
      notify("部位と内容を入力してください");
      return;
    }
    const payload = {
      date: form.date,
      bodyPartId: form.bodyPartId,
      templateId: form.templateId || null,
      content: form.content.trim(),
      images: form.images.length > 0 ? form.images : undefined,
    };
    if (form.id) {
      updateWorkoutRecord(form.id, payload);
      notify("記録を更新しました");
    } else {
      addWorkoutRecord(payload);
      notify("記録を追加しました");
    }
    setForm(null);
    reset();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0 || !form) return;

    setIsUploading(true);
    try {
      const compressed = await compressImages(files);
      setForm({ ...form, images: [...form.images, ...compressed] });
      notify(`${compressed.length}枚の画像を追加しました`);
    } catch (error) {
      notify("画像のアップロードに失敗しました");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    if (!form) return;
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  };

  return (
    <div>
      {/* 部位フィルター */}
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2">
        <button
          type="button"
          onClick={() => setFilter(null)}
          className={`tap shrink-0 rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition active:scale-95 ${
            filter === null ? "border-bark bg-bark text-cream" : "border-sand bg-paper text-cocoa"
          }`}
        >
          すべて
        </button>
        {orderedParts.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setFilter(p.id)}
            className={`tap shrink-0 rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition active:scale-95 ${
              filter === p.id ? "border-bark bg-bark text-cream" : "border-sand bg-paper text-cocoa"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {!form && (
        <button
          type="button"
          onClick={openAdd}
          className="tap flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-sand-deep bg-paper/60 py-2.5 text-[11px] font-extrabold text-cocoa transition hover:border-caramel hover:text-caramel-deep active:scale-[0.99]"
        >
          <Plus size={13} strokeWidth={3} /> 記録を追加
        </button>
      )}

      {form && (
        <div className="anim-pop mt-2 rounded-xl border border-caramel/50 bg-paper p-3.5">
          <p className="mb-2 flex items-center justify-between text-[11px] font-extrabold text-caramel-deep">
            {form.id ? "記録を編集" : "新しい記録"}
            <button type="button" aria-label="閉じる" onClick={() => setForm(null)} className="tap rounded-full p-1 text-latte hover:bg-sand/60">
              <X size={13} />
            </button>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>日付</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>部位</label>
              <select
                value={form.bodyPartId}
                onChange={(e) => setForm({ ...form, bodyPartId: e.target.value })}
                className={inputCls}
              >
                {orderedParts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className={labelCls}>テンプレート（任意）</label>
          <select
            value={form.templateId}
            onChange={(e) => {
              const tpl = templates.find((t) => t.id === e.target.value);
              setForm({ ...form, templateId: e.target.value, content: tpl ? tpl.content : form.content });
            }}
            className={inputCls}
          >
            <option value="">使わない</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <div className="mt-2 flex items-center justify-between">
            <label className={labelCls}>内容（自由記述）</label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTextareaSize("small")}
                className={`tap rounded p-1 transition ${
                  textareaSize === "small" ? "bg-caramel/20 text-caramel-deep" : "text-latte hover:text-cocoa"
                }`}
                title="小さく"
              >
                <Minimize2 size={12} />
              </button>
              <button
                type="button"
                onClick={() => setTextareaSize("large")}
                className={`tap rounded p-1 transition ${
                  textareaSize === "large" ? "bg-caramel/20 text-caramel-deep" : "text-latte hover:text-cocoa"
                }`}
                title="大きく"
              >
                <Maximize2 size={12} />
              </button>
              <button
                type="button"
                onClick={() => setIsFullScreen(true)}
                className="tap rounded p-1 text-latte transition hover:text-cocoa"
                title="全画面で編集"
              >
                <Maximize size={12} />
              </button>
            </div>
          </div>
          <textarea
            rows={textareaSize === "small" ? 3 : textareaSize === "large" ? 12 : 5}
            value={form.content}
            placeholder={"ベンチプレス 80kg × 8 × 3\nメモ：フォームを意識して丁寧に。"}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className={`${inputCls} resize-y leading-relaxed`}
          />

          {/* 画像アップロード */}
          <label className={`${labelCls} mt-2`}>画像（任意）</label>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`tap flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-sand-deep bg-cream/50 py-2.5 text-[11px] font-bold transition ${
                isUploading ? "cursor-wait opacity-60" : "hover:border-caramel hover:text-caramel-deep active:scale-[0.99]"
              }`}
            >
              <ImageIcon size={13} />
              {isUploading ? "アップロード中..." : "画像を追加"}
            </button>

            {/* 画像プレビュー */}
            {form.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {form.images.map((img, index) => (
                  <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border border-sand">
                    <img src={img} alt={`画像 ${index + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 rounded-full bg-bark/80 p-1 text-cream opacity-0 transition group-hover:opacity-100"
                      aria-label="画像を削除"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="button" onClick={save} className={saveBtn}>
            {form.id ? "更新する" : "保存する"}
          </button>
        </div>
      )}

      {/* フルスクリーン編集モーダル */}
      {isFullScreen && form && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-cream">
          <div className="flex items-center justify-between border-b border-sand bg-paper px-4 py-3">
            <h3 className="text-sm font-bold text-bark">記録を編集</h3>
            <button
              type="button"
              onClick={() => setIsFullScreen(false)}
              className="tap rounded-full border border-sand bg-cream p-2 text-cocoa transition hover:border-sand-deep active:scale-90"
              aria-label="閉じる"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <textarea
              value={form.content}
              placeholder={"ベンチプレス 80kg × 8 × 3\nメモ：フォームを意識して丁寧に。"}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="h-full w-full resize-none rounded-lg border border-sand bg-paper p-4 text-base leading-relaxed text-bark placeholder:text-latte/60 focus:border-caramel focus:outline-none"
              autoFocus
            />
          </div>
          <div className="border-t border-sand bg-paper px-4 py-3">
            <button
              type="button"
              onClick={() => setIsFullScreen(false)}
              className="tap w-full rounded-lg bg-bark py-3 text-sm font-extrabold text-cream transition hover:bg-espresso active:scale-[0.98]"
            >
              完了
            </button>
          </div>
        </div>
      )}

      <p className="mt-3 mb-1.5 text-[9.5px] font-bold tracking-[0.22em] text-latte">
        {filter ? `${nameOf(filter)}の記録` : "すべての記録"}（{list.length}件）
      </p>
      <div className="space-y-2">
        {list.slice(0, 30).map((r: WorkoutRecord) => {
          const vis = bodyVisual(r.bodyPartId);
          return (
            <div key={r.id} className="rounded-xl border border-sand bg-paper px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold"
                  style={{ backgroundColor: `${vis.color}1f`, color: vis.color }}
                >
                  {nameOf(r.bodyPartId)}
                </span>
                <span className="text-[10.5px] font-bold text-cocoa">{dayLabel(r.date)}</span>
                <span className="ml-auto">
                  <RowActions
                    armed={armedId === r.id}
                    onEdit={() =>
                      setForm({
                        id: r.id,
                        date: r.date,
                        bodyPartId: r.bodyPartId,
                        templateId: r.templateId ?? "",
                        content: r.content,
                        images: r.images ?? [],
                      })
                    }
                    onCopy={() => {
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
                    onDelete={() => {
                      if (ask(r.id)) {
                        deleteWorkoutRecord(r.id);
                        notify("記録を削除しました");
                      }
                    }}
                  />
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed break-words whitespace-pre-line text-bark/80">
                {r.content}
              </p>
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
            </div>
          );
        })}
        {list.length === 0 && (
          <p className="rounded-xl border border-dashed border-sand-deep bg-paper/60 px-4 py-5 text-center text-[11px] text-latte">
            記録がありません
          </p>
        )}
      </div>

      {modalImage && (
        <ImageModal src={modalImage} onClose={() => setModalImage(null)} />
      )}
    </div>
  );
}

/* ================= サイズタブ ================= */
function SizesTab() {
  const sizeRecords = useStore((s) => s.sizeRecords);
  const addSizeRecord = useStore((s) => s.addSizeRecord);
  const updateSizeRecord = useStore((s) => s.updateSizeRecord);
  const deleteSizeRecord = useStore((s) => s.deleteSizeRecord);
  const notify = useUiStore((s) => s.notify);
  const selectedMonth = useUiStore((s) => s.selectedMonth);
  const { armedId, ask, reset } = useArmed();

  const [form, setForm] = useState<{ id: string | null; date: string; values: Record<SizeKey, string> } | null>(null);
  const [page, setPage] = useState(0);

  const list = useMemo(
    () => [...sizeRecords].sort((a, b) => b.date.localeCompare(a.date)),
    [sizeRecords]
  );

  const ITEMS_PER_PAGE = 15;
  const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(0, totalPages - 1));
  const startIdx = currentPage * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const pageItems = list.slice(startIdx, endIdx);

  const openAdd = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const monthEnd = new Date(year, month, 0);
    setForm({
      id: null,
      date: toIso(monthEnd),
      values: Object.fromEntries(SIZE_FIELDS.map((f) => [f.key, ""])) as Record<SizeKey, string>,
    });
  };

  const save = () => {
    if (!form) return;
    const parsed = {} as Record<SizeKey, number>;
    for (const f of SIZE_FIELDS) {
      const v = parseFloat(form.values[f.key]);
      if (Number.isNaN(v) || v <= 0) {
        notify(`${f.label}を正しく入力してください`);
        return;
      }
      parsed[f.key] = Math.round(v * 10) / 10;
    }
    if (form.id) {
      updateSizeRecord(form.id, { date: form.date, ...parsed });
      notify("サイズ記録を更新しました");
    } else {
      addSizeRecord({ date: form.date, ...parsed });
      notify("サイズ記録を追加しました");
    }
    setForm(null);
    reset();
  };

  return (
    <div>
      {!form && (
        <button
          type="button"
          onClick={openAdd}
          className="tap flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-sand-deep bg-paper/60 py-2.5 text-[11px] font-extrabold text-cocoa transition hover:border-caramel hover:text-caramel-deep active:scale-[0.99]"
        >
          <Plus size={13} strokeWidth={3} /> サイズ記録を追加
        </button>
      )}

      {form && (
        <div className="anim-pop rounded-xl border border-caramel/50 bg-paper p-3.5">
          <p className="mb-2 flex items-center justify-between text-[11px] font-extrabold text-caramel-deep">
            {form.id ? "サイズ記録を編集" : "新しいサイズ記録"}
            <button
              type="button"
              onClick={() => setForm(null)}
              className="tap rounded-full p-1 text-latte hover:bg-sand/60"
            >
              <X size={13} />
            </button>
          </p>
          <label className={labelCls}>日付</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={inputCls}
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            {SIZE_FIELDS.map((f) => (
              <div key={f.key}>
                <label className={labelCls}>
                  {f.label}（{f.unit}）
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={form.values[f.key]}
                  onChange={(e) => setForm({ ...form, values: { ...form.values, [f.key]: e.target.value } })}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
          <button type="button" onClick={save} className={saveBtn}>
            {form.id ? "更新する" : "保存する"}
          </button>
        </div>
      )}

      <p className="mt-3 mb-1.5 text-[9.5px] font-bold tracking-[0.22em] text-latte">
        履歴（{list.length}件）
        {totalPages > 1 && <span className="ml-2 text-[10px] text-cocoa">ページ {currentPage + 1}/{totalPages}</span>}
      </p>
      <div key={currentPage} className="space-y-2">
        {pageItems.map((r: SizeRecord) => (
          <div key={r.id} className="rounded-xl border border-sand bg-paper px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-bold text-cocoa">{dayLabel(r.date)}</span>
              <span className="ml-auto">
                <RowActions
                  armed={armedId === r.id}
                  onEdit={() =>
                    setForm({
                      id: r.id,
                      date: r.date,
                      values: Object.fromEntries(SIZE_FIELDS.map((f) => [f.key, String(r[f.key])])) as Record<SizeKey, string>,
                    })
                  }
                  onDelete={() => {
                    if (ask(r.id)) {
                      deleteSizeRecord(r.id);
                      notify("サイズ記録を削除しました");
                    }
                  }}
                />
              </span>
            </div>
            <div className="mt-1.5 grid grid-cols-4 gap-1 text-[10px] tabular-nums">
              <span className="text-cocoa">
                体重 <b className="text-bark">{r.weight.toFixed(1)}</b>
              </span>
              <span className="text-cocoa">
                胸囲 <b className="text-bark">{r.chest.toFixed(1)}</b>
              </span>
              <span className="text-cocoa">
                腕 <b className="text-bark">{r.leftArm.toFixed(1)}/{r.rightArm.toFixed(1)}</b>
              </span>
              <span className="text-cocoa">
                脚 <b className="text-bark">{r.leftLeg.toFixed(1)}/{r.rightLeg.toFixed(1)}</b>
              </span>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <p className="rounded-xl border border-dashed border-sand-deep bg-paper/60 px-4 py-5 text-center text-[11px] text-latte">
            サイズ記録がありません
          </p>
        )}
      </div>

      {totalPages > 1 && (
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
    </div>
  );
}

/* ================= テンプレートタブ ================= */
function TemplatesTab() {
  const templates = useStore((s) => s.templates);
  const addTemplate = useStore((s) => s.addTemplate);
  const updateTemplate = useStore((s) => s.updateTemplate);
  const deleteTemplate = useStore((s) => s.deleteTemplate);
  const notify = useUiStore((s) => s.notify);
  const { armedId, ask, reset } = useArmed();

  const [form, setForm] = useState<{ id: string | null; name: string; content: string } | null>(null);

  const openAdd = () => setForm({ id: null, name: "", content: "" });

  const save = () => {
    if (!form) return;
    if (!form.name.trim() || !form.content.trim()) {
      notify("名前と内容を入力してください");
      return;
    }
    if (form.id) {
      updateTemplate(form.id, { name: form.name.trim(), content: form.content.trim() });
      notify("テンプレートを更新しました");
    } else {
      addTemplate({ name: form.name.trim(), content: form.content.trim() });
      notify("テンプレートを追加しました");
    }
    setForm(null);
    reset();
  };

  return (
    <div>
      {!form && (
        <button
          type="button"
          onClick={openAdd}
          className="tap flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-sand-deep bg-paper/60 py-2.5 text-[11px] font-extrabold text-cocoa transition hover:border-caramel hover:text-caramel-deep active:scale-[0.99]"
        >
          <Plus size={13} strokeWidth={3} /> テンプレートを追加
        </button>
      )}

      {form && (
        <div className="anim-pop rounded-xl border border-caramel/50 bg-paper p-3.5">
          <p className="mb-2 flex items-center justify-between text-[11px] font-extrabold text-caramel-deep">
            {form.id ? "テンプレートを編集" : "新しいテンプレート"}
            <button
              type="button"
              onClick={() => setForm(null)}
              className="tap rounded-full p-1 text-latte hover:bg-sand/60"
            >
              <X size={13} />
            </button>
          </p>
          <label className={labelCls}>名前</label>
          <input
            type="text"
            value={form.name}
            placeholder="胸の定番"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputCls}
          />
          <label className={labelCls}>内容</label>
          <textarea
            rows={6}
            value={form.content}
            placeholder={"ベンチプレス 80kg × 8 × 3\n..."}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className={`${inputCls} resize-y leading-relaxed`}
          />
          <button type="button" onClick={save} className={saveBtn}>
            {form.id ? "更新する" : "保存する"}
          </button>
        </div>
      )}

      <p className="mt-3 mb-1.5 text-[9.5px] font-bold tracking-[0.22em] text-latte">テンプレート一覧（{templates.length}件）</p>
      <div className="space-y-2">
        {templates.map((t) => (
          <div key={t.id} className="rounded-xl border border-sand bg-paper px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <span className="flex-1 text-[11px] font-extrabold text-bark">{t.name}</span>
              <span className="ml-auto">
                <RowActions
                  armed={armedId === t.id}
                  onEdit={() => setForm({ id: t.id, name: t.name, content: t.content })}
                  onDelete={() => {
                    if (ask(t.id)) {
                      deleteTemplate(t.id);
                      notify("テンプレートを削除しました");
                    }
                  }}
                />
              </span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-[10.5px] leading-relaxed break-words whitespace-pre-line text-bark/80">
              {t.content}
            </p>
          </div>
        ))}
        {templates.length === 0 && (
          <p className="rounded-xl border border-dashed border-sand-deep bg-paper/60 px-4 py-5 text-center text-[11px] text-latte">
            テンプレートがありません
          </p>
        )}
      </div>
    </div>
  );
}

/* ================= 部位タブ ================= */
function PartsTab() {
  const bodyParts = useStore((s) => s.bodyParts);
  const orderedParts = useMemo(() => sortedParts(bodyParts), [bodyParts]);
  const addBodyPart = useStore((s) => s.addBodyPart);
  const updateBodyPart = useStore((s) => s.updateBodyPart);
  const deleteBodyPart = useStore((s) => s.deleteBodyPart);
  const moveBodyPart = useStore((s) => s.moveBodyPart);
  const notify = useUiStore((s) => s.notify);
  const { armedId, ask, reset } = useArmed();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateBodyPart(editingId, editName.trim());
    notify("部位名を更新しました");
    setEditingId(null);
    setEditName("");
    reset();
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          const name = prompt("新しい部位名を入力してください");
          if (name && name.trim()) {
            addBodyPart(name.trim());
            notify("部位を追加しました");
          }
        }}
        className="tap flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-sand-deep bg-paper/60 py-2.5 text-[11px] font-extrabold text-cocoa transition hover:border-caramel hover:text-caramel-deep active:scale-[0.99]"
      >
        <Plus size={13} strokeWidth={3} /> 部位を追加
      </button>

      <p className="mt-3 mb-1.5 text-[9.5px] font-bold tracking-[0.22em] text-latte">部位一覧（{orderedParts.length}件）</p>
      <div className="space-y-2">
        {orderedParts.map((p, idx) => {
          const vis = bodyVisual(p.id);
          const Icon = vis.icon;
          return (
            <div key={p.id} className="rounded-xl border border-sand bg-paper px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <span
                  className="grid size-7 shrink-0 place-items-center rounded-lg"
                  style={{ backgroundColor: vis.soft, color: vis.color }}
                >
                  <Icon size={13} strokeWidth={2.4} />
                </span>
                {editingId === p.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 rounded border border-caramel bg-cream px-2 py-1 text-[11px] text-bark focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <span className="flex-1 text-[11px] font-extrabold text-bark">{p.name}</span>
                )}
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveBodyPart(p.id, -1)}
                    disabled={idx === 0}
                    className={`tap rounded-md border border-sand bg-cream p-1.5 text-cocoa transition ${
                      idx === 0 ? "opacity-30" : "hover:border-sand-deep active:scale-90"
                    }`}
                    aria-label="上に移動"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBodyPart(p.id, 1)}
                    disabled={idx === orderedParts.length - 1}
                    className={`tap rounded-md border border-sand bg-cream p-1.5 text-cocoa transition ${
                      idx === orderedParts.length - 1 ? "opacity-30" : "hover:border-sand-deep active:scale-90"
                    }`}
                    aria-label="下に移動"
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(p.id, p.name)}
                    className="tap rounded-md border border-sand bg-cream p-1.5 text-cocoa transition hover:border-sand-deep active:scale-90"
                    aria-label="編集"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (ask(p.id)) {
                        deleteBodyPart(p.id);
                        notify("部位を削除しました");
                      }
                    }}
                    className={`tap rounded-md border p-1.5 transition active:scale-90 ${
                      armedId === p.id
                        ? "border-clay bg-clay text-cream"
                        : "border-sand bg-cream text-cocoa hover:border-clay/50 hover:text-clay"
                    }`}
                    aria-label="削除"
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              </div>
              {armedId === p.id && (
                <p className="anim-fade mt-1 text-[9.5px] font-bold text-clay">
                  もう一度押すと削除します（関連する記録も削除されます）
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================= メイン ================= */
export default function DataManageSheet() {
  const sheet = useUiStore((s) => s.sheet);
  const closeSheet = useUiStore((s) => s.closeSheet);
  const [tab, setTab] = useState<DataTab>("records");

  const open = sheet?.type === "data";
  const presetBodyPartId = open && sheet.tab === "records" ? sheet.presetBodyPartId : undefined;

  useEffect(() => {
    if (open && sheet.tab) setTab(sheet.tab);
  }, [open, sheet]);

  return (
    <Sheet open={open} title="データ管理" subtitle="記録・サイズ・テンプレート・部位を管理" onClose={closeSheet}>
      {/* タブ切り替え */}
      <div className="mb-4 flex gap-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`tap flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-2 text-[10.5px] font-bold transition-all duration-200 ${
                active
                  ? "border-bark bg-bark text-cream shadow-soft"
                  : "border-sand bg-cream text-cocoa hover:border-sand-deep"
              }`}
            >
              <Icon size={13} strokeWidth={2.2} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "records" && <RecordsTab presetBodyPartId={presetBodyPartId} />}
      {tab === "sizes" && <SizesTab />}
      {tab === "templates" && <TemplatesTab />}
      {tab === "parts" && <PartsTab />}
    </Sheet>
  );
}