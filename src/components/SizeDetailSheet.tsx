import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SIZE_FIELDS, type SizeKey } from "../data/meta";
import { diffColorOnLight, formatDiff } from "../lib/diffColor";
import { dayLabel, toIso } from "../lib/format";
import { useStore } from "../store/useStore";
import { useUiStore } from "../store/useUiStore";
import type { SizeRecord } from "../types";
import Sheet from "./Sheet";
import Sparkline from "./Sparkline";

type FormValues = Record<SizeKey, string>;

const emptyValues = (): FormValues =>
  Object.fromEntries(SIZE_FIELDS.map((f) => [f.key, ""])) as FormValues;

const inputCls =
  "w-full rounded-lg border border-sand bg-cream px-2.5 py-2 text-[13px] font-medium text-bark placeholder:text-latte/60 focus:border-caramel focus:outline-none";

const ITEMS_PER_PAGE = 15;

/** サイズ記録の詳細シート（7項目・追加/編集/削除つき） */
export default function SizeDetailSheet() {
  const sheet = useUiStore((s) => s.sheet);
  const closeSheet = useUiStore((s) => s.closeSheet);
  const notify = useUiStore((s) => s.notify);
  const sizeRecords = useStore((s) => s.sizeRecords);
  const addSizeRecord = useStore((s) => s.addSizeRecord);
  const updateSizeRecord = useStore((s) => s.updateSizeRecord);
  const deleteSizeRecord = useStore((s) => s.deleteSizeRecord);

  const open = sheet?.type === "sizes";

  const [selected, setSelected] = useState<SizeKey>("weight");
  const [form, setForm] = useState<{ id: string | null; date: string; values: FormValues } | null>(
    null
  );
  const [armedId, setArmedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!open) {
      setForm(null);
      setArmedId(null);
    }
  }, [open]);

  const sortedAsc = useMemo(
    () => [...sizeRecords].sort((a, b) => a.date.localeCompare(b.date)),
    [sizeRecords]
  );
  const sortedDesc = useMemo(() => [...sortedAsc].reverse(), [sortedAsc]);

  const latest = sortedAsc[sortedAsc.length - 1];
  const field = SIZE_FIELDS.find((f) => f.key === selected)!;
  const series = useMemo(() => sortedAsc.map((e) => e[selected]), [sortedAsc, selected]);

  const weekAgoBase = useMemo(() => {
    const limit = new Date();
    limit.setDate(limit.getDate() - 7);
    const limitIso = toIso(limit);
    const older = sortedAsc.filter((e) => e.date <= limitIso);
    return older.length > 0 ? older[older.length - 1] : sortedAsc[0];
  }, [sortedAsc]);

  const selectedMonth = useUiStore((s) => s.selectedMonth);

  // ページネーション
  const totalPages = Math.ceil(sortedDesc.length / ITEMS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(0, totalPages - 1));
  const startIdx = currentPage * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const pageItems = sortedDesc.slice(startIdx, endIdx);

  const openAdd = () => {
    // 選択月の月末をデフォルト日付に
    const [year, month] = selectedMonth.split("-").map(Number);
    const monthEnd = new Date(year, month, 0); // 月の最終日
    setForm({ id: null, date: toIso(monthEnd), values: emptyValues() });
  };
  const openEdit = (r: SizeRecord) =>
    setForm({
      id: r.id,
      date: r.date,
      values: Object.fromEntries(SIZE_FIELDS.map((f) => [f.key, String(r[f.key])])) as FormValues,
    });

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
  };

  const del = (id: string) => {
    if (armedId !== id) {
      setArmedId(id);
      setTimeout(() => setArmedId((cur) => (cur === id ? null : cur)), 3000);
      return;
    }
    deleteSizeRecord(id);
    setArmedId(null);
    notify("サイズ記録を削除しました");
  };

  const diff =
    latest && weekAgoBase ? Math.round((latest[selected] - weekAgoBase[selected]) * 10) / 10 : 0;

  return (
    <Sheet open={open} title="サイズ記録" subtitle="左右別の7項目を記録・管理できます" onClose={closeSheet}>
      {/* 項目切り替え（折り返し対応） */}
      <div className="flex flex-wrap gap-1.5">
        {SIZE_FIELDS.map((f) => {
          const Icon = f.icon;
          const active = selected === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setSelected(f.key)}
              className={`tap flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[10.5px] font-bold transition-all duration-200 active:scale-95 ${
                active
                  ? "border-bark bg-bark text-cream shadow-soft"
                  : "border-sand bg-paper text-cocoa hover:border-sand-deep"
              }`}
            >
              <Icon size={11} className={active ? "text-caramel" : ""} />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* 選択項目の推移 */}
      {latest ? (
        <div className="mt-3 rounded-xl border border-sand bg-paper p-3.5">
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] font-bold tracking-[0.18em] text-latte">
              {field.label}（最新 {dayLabel(latest.date)}）
            </p>
            <p className="text-[10.5px] font-bold tabular-nums" style={{ color: diffColorOnLight(selected, diff) }}>
              1週間前比 {formatDiff(diff)}
            </p>
          </div>
          <p className="mt-1 font-display text-[30px] leading-none font-black text-bark">
            {latest[selected].toFixed(1)}
            <span className="ml-1 text-sm font-extrabold text-cocoa">{field.unit}</span>
          </p>
          <Sparkline data={series} stroke="#A8732C" className="mt-3 h-14 w-full" strokeWidth={2.4} />
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-sand-deep bg-paper/60 px-4 py-6 text-center text-[11.5px] text-latte">
          まだサイズ記録がありません
        </p>
      )}

      {/* 追加 / 編集フォーム */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-[9.5px] font-bold tracking-[0.22em] text-latte">記録の管理</p>
        {!form && (
          <button
            type="button"
            onClick={openAdd}
            className="tap flex items-center gap-1 rounded-full bg-bark px-2.5 py-1 text-[10px] font-extrabold text-cream transition-all duration-200 hover:bg-espresso active:scale-95"
          >
            <Plus size={11} strokeWidth={3} /> 記録を追加
          </button>
        )}
      </div>
      {form && (
        <div className="anim-pop mt-2 rounded-xl border border-caramel/50 bg-paper p-3.5">
          <p className="mb-2 flex items-center justify-between text-[11px] font-extrabold text-caramel-deep">
            {form.id ? "記録を編集" : "新しいサイズ記録"}
            <button
              type="button"
              aria-label="フォームを閉じる"
              onClick={() => setForm(null)}
              className="tap rounded-full p-1 text-latte hover:bg-sand/60"
            >
              <X size={13} />
            </button>
          </p>
          <label className="mb-1 block text-[9.5px] font-bold text-latte">日付</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={inputCls}
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            {SIZE_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-[9.5px] font-bold text-latte">
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
          <button
            type="button"
            onClick={save}
            className="tap mt-3 w-full rounded-lg bg-bark py-2.5 text-[12.5px] font-extrabold text-cream transition-all duration-200 hover:bg-espresso active:scale-[0.98]"
          >
            {form.id ? "更新する" : "保存する"}
          </button>
        </div>
      )}

      {/* 履歴（ページネーション付き） */}
      <div key={currentPage} className="mt-3 space-y-2">
        {pageItems.map((r) => (
          <div key={r.id} className="rounded-xl border border-sand bg-paper px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-extrabold text-bark">{dayLabel(r.date)}</p>
              <span className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  aria-label="編集"
                  onClick={() => openEdit(r)}
                  className="tap rounded-md border border-sand bg-cream p-1.5 text-cocoa transition hover:border-sand-deep active:scale-90"
                >
                  <Pencil size={12} />
                </button>
                <button
                  type="button"
                  aria-label="削除"
                  onClick={() => del(r.id)}
                  className={`tap rounded-md border p-1.5 transition active:scale-90 ${
                    armedId === r.id
                      ? "border-clay bg-clay text-cream"
                      : "border-sand bg-cream text-cocoa hover:border-clay/50 hover:text-clay"
                  }`}
                >
                  <Trash2 size={12} />
                </button>
              </span>
            </div>
            {armedId === r.id && (
              <p className="anim-fade mt-1 text-[9.5px] font-bold text-clay">
                もう一度押すと削除します
              </p>
            )}
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
      </div>

      {/* ページネーション */}
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
    </Sheet>
  );
}