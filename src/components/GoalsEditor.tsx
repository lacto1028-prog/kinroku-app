import { Pencil, Plus, Target, Trash2, X } from "lucide-react";
import { useState } from "react";
import { SIZE_FIELDS } from "../data/meta";
import { useStore } from "../store/useStore";
import { useUiStore } from "../store/useUiStore";
import type { Goal, SizeKey } from "../types";

const inputCls =
  "w-full rounded-lg border border-sand bg-cream px-2.5 py-2 text-[13px] font-medium text-bark placeholder:text-latte/60 focus:border-caramel focus:outline-none";
const labelCls = "mb-1 block text-[9.5px] font-bold text-latte";

export default function GoalsEditor() {
  const goals = useStore((s) => s.goals);
  const sizeRecords = useStore((s) => s.sizeRecords);
  const addGoal = useStore((s) => s.addGoal);
  const updateGoal = useStore((s) => s.updateGoal);
  const deleteGoal = useStore((s) => s.deleteGoal);
  const notify = useUiStore((s) => s.notify);

  const [form, setForm] = useState<{
    id: string | null;
    type: "weight" | "size";
    targetKey: SizeKey | "";
    targetValue: string;
    deadline: string;
  } | null>(null);

  // 最新のサイズ記録を取得
  const getLatestSize = (key: SizeKey): number | null => {
    if (sizeRecords.length === 0) return null;
    const sorted = [...sizeRecords].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0][key];
  };

  // 進捗を計算
  const getProgress = (goal: Goal): { current: number; target: number; percent: number } | null => {
    let current: number | null = null;
    if (goal.type === "weight") {
      current = getLatestSize("weight");
    } else if (goal.targetKey) {
      current = getLatestSize(goal.targetKey);
    }
    if (current === null) return null;
    const target = goal.targetValue;
    const percent = Math.min(100, Math.max(0, (current / target) * 100));
    return { current, target, percent };
  };

  const openAdd = () => {
    setForm({
      id: null,
      type: "weight",
      targetKey: "",
      targetValue: "",
      deadline: "",
    });
  };

  const openEdit = (g: Goal) => {
    setForm({
      id: g.id,
      type: g.type,
      targetKey: g.targetKey ?? "",
      targetValue: String(g.targetValue),
      deadline: g.deadline ?? "",
    });
  };

  const save = () => {
    if (!form) return;
    const value = parseFloat(form.targetValue);
    if (Number.isNaN(value) || value <= 0) {
      notify("目標値を正しく入力してください");
      return;
    }
    if (form.type === "size" && !form.targetKey) {
      notify("項目を選択してください");
      return;
    }

    const goalData = {
      type: form.type,
      targetKey: form.type === "size" ? (form.targetKey as SizeKey) : undefined,
      targetValue: value,
      unit: form.type === "weight" ? "kg" : SIZE_FIELDS.find((f) => f.key === form.targetKey)?.unit ?? "",
      deadline: form.deadline || undefined,
    };

    if (form.id) {
      updateGoal(form.id, goalData);
      notify("目標を更新しました");
    } else {
      addGoal(goalData);
      notify("目標を追加しました");
    }
    setForm(null);
  };

  const del = (id: string) => {
    deleteGoal(id);
    notify("目標を削除しました");
  };

  return (
    <div>
      {!form ? (
        <button
          type="button"
          onClick={openAdd}
          className="tap flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-sand-deep bg-paper/60 py-2.5 text-[11px] font-extrabold text-cocoa transition hover:border-caramel hover:text-caramel-deep active:scale-[0.99]"
        >
          <Plus size={13} strokeWidth={3} /> 目標を追加
        </button>
      ) : (
        <div className="anim-pop rounded-xl border border-caramel/50 bg-paper p-3.5">
          <p className="mb-2 flex items-center justify-between text-[11px] font-extrabold text-caramel-deep">
            {form.id ? "目標を編集" : "新しい目標"}
            <button
              type="button"
              aria-label="閉じる"
              onClick={() => setForm(null)}
              className="tap rounded-full p-1 text-latte hover:bg-sand/60"
            >
              <X size={13} />
            </button>
          </p>

          <label className={labelCls}>種類</label>
          <div className="mb-2 flex gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, type: "weight", targetKey: "" })}
              className={`tap flex-1 rounded-lg border px-3 py-2 text-[11px] font-bold transition ${
                form.type === "weight"
                  ? "border-caramel bg-caramel/10 text-caramel-deep"
                  : "border-sand bg-cream text-cocoa hover:border-sand-deep"
              }`}
            >
              体重
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, type: "size" })}
              className={`tap flex-1 rounded-lg border px-3 py-2 text-[11px] font-bold transition ${
                form.type === "size"
                  ? "border-caramel bg-caramel/10 text-caramel-deep"
                  : "border-sand bg-cream text-cocoa hover:border-sand-deep"
              }`}
            >
              サイズ
            </button>
          </div>

          {form.type === "size" && (
            <>
              <label className={labelCls}>項目</label>
              <select
                value={form.targetKey}
                onChange={(e) => setForm({ ...form, targetKey: e.target.value as SizeKey })}
                className={inputCls}
              >
                <option value="">選択してください</option>
                {SIZE_FIELDS.filter((f) => f.key !== "weight").map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </>
          )}

          <label className={labelCls}>目標値</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            placeholder="0.0"
            value={form.targetValue}
            onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
            className={inputCls}
          />

          <label className={labelCls}>期限（任意）</label>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className={inputCls}
          />

          <button
            type="button"
            onClick={save}
            className="tap mt-3 w-full rounded-lg bg-bark py-2.5 text-[12.5px] font-extrabold text-cream transition-all duration-200 hover:bg-espresso active:scale-[0.98]"
          >
            {form.id ? "更新する" : "追加する"}
          </button>
        </div>
      )}

      <p className="mt-3 mb-1.5 text-[9.5px] font-bold tracking-[0.22em] text-latte">
        設定中の目標（{goals.length}件）
      </p>
      <div className="space-y-2">
        {goals.length === 0 && (
          <p className="rounded-xl border border-dashed border-sand-deep bg-paper/60 px-4 py-5 text-center text-[11px] text-latte">
            目標が設定されていません
          </p>
        )}
        {goals.map((g) => {
          const progress = getProgress(g);
          const field = g.type === "size" && g.targetKey ? SIZE_FIELDS.find((f) => f.key === g.targetKey) : null;
          const label = g.type === "weight" ? "体重" : field?.label ?? "";
          const isAchieved = progress && progress.current >= progress.target;

          return (
            <div key={g.id} className="rounded-xl border border-sand bg-paper px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <Target size={14} className={isAchieved ? "text-moss" : "text-caramel-deep"} />
                <p className="flex-1 text-[11px] font-extrabold text-bark">
                  {label} {g.targetValue}
                  {g.unit}
                </p>
                <span className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="編集"
                    onClick={() => openEdit(g)}
                    className="tap rounded-md border border-sand bg-cream p-1.5 text-cocoa transition hover:border-sand-deep active:scale-90"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    type="button"
                    aria-label="削除"
                    onClick={() => del(g.id)}
                    className="tap rounded-md border border-sand bg-cream p-1.5 text-cocoa transition hover:border-clay/50 hover:text-clay active:scale-90"
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              </div>

              {progress && (
                <div className="mt-2">
                  <div className="mb-1 flex items-baseline justify-between text-[10px]">
                    <span className="font-bold text-cocoa">
                      現在: <b className="text-bark">{progress.current.toFixed(1)}{g.unit}</b>
                    </span>
                    <span className={`font-extrabold ${isAchieved ? "text-moss" : "text-caramel-deep"}`}>
                      {isAchieved ? "達成！" : `${progress.percent.toFixed(0)}%`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-sand/60">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isAchieved ? "bg-moss" : "bg-caramel"
                      }`}
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {g.deadline && (
                <p className="mt-1.5 text-[9px] font-bold text-latte">
                  期限: {new Date(g.deadline).toLocaleDateString("ja-JP")}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}