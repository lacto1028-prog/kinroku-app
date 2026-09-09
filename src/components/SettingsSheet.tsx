import {
  AlertCircle,
  Calendar,
  Check,
  Database,
  Download,
  Eye,
  FileUp,
  GripVertical,
  Info,
  Lock,
  MessageSquare,
  Palette,
  RotateCcw,
  Smartphone,
  Target,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toIso } from "../lib/format";
import { useStore } from "../store/useStore";
import { useUiStore } from "../store/useUiStore";
import type { BackupData } from "../types";
import GoalsEditor from "./GoalsEditor";
import Sheet from "./Sheet";

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 mb-1.5 text-[9.5px] font-bold tracking-[0.22em] text-latte first:mt-0">
      {children}
    </p>
  );
}

function ActionRow({
  icon: Icon,
  title,
  desc,
  danger,
  highlight,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  danger?: boolean;
  highlight?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200 active:scale-[0.99] ${
        danger
          ? "border-clay/50 bg-clay/10 hover:bg-clay/15"
          : highlight
            ? "border-caramel/50 bg-caramel/10 hover:bg-caramel/15"
            : "border-sand bg-paper hover:border-sand-deep hover:shadow-soft"
      }`}
    >
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-lg border ${
          danger
            ? "border-clay/40 bg-clay/15 text-clay"
            : highlight
              ? "border-caramel/40 bg-caramel/15 text-caramel-deep"
              : "border-sand bg-cream text-cocoa"
        }`}
      >
        <Icon size={15} />
      </span>
      <span className="min-w-0">
        <span className={`block text-[13px] font-bold ${danger ? "text-clay" : "text-bark"}`}>
          {title}
        </span>
        <span className="mt-0.5 block text-[10.5px] leading-relaxed text-latte">{desc}</span>
      </span>
    </button>
  );
}

/** 確認モーダル（温かみのあるデザイン） */
function ConfirmModal({
  open,
  title,
  message,
  confirmText,
  cancelText,
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="anim-fade absolute inset-0 bg-bark/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="anim-pop relative z-10 w-full max-w-sm rounded-2xl border border-sand bg-paper p-5 shadow-lift">
        <div className="flex items-start gap-3">
          <span
            className={`grid size-10 shrink-0 place-items-center rounded-xl ${
              danger ? "bg-clay/15 text-clay" : "bg-caramel/15 text-caramel-deep"
            }`}
          >
            {danger ? <AlertCircle size={20} /> : <FileUp size={20} />}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[15px] font-extrabold text-bark">{title}</h3>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-cocoa">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="tap flex-1 rounded-xl border border-sand bg-cream px-4 py-2.5 text-[12px] font-bold text-cocoa transition-all duration-200 hover:border-sand-deep hover:bg-sand/50 active:scale-95"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`tap flex-1 rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-cream transition-all duration-200 active:scale-95 ${
              danger
                ? "bg-clay hover:bg-clay/90"
                : "bg-bark hover:bg-espresso"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/** エラーモーダル */
function ErrorModal({ open, message, onClose }: { open: boolean; message: string; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="anim-fade absolute inset-0 bg-bark/40 backdrop-blur-sm" onClick={onClose} />
      <div className="anim-pop relative z-10 w-full max-w-sm rounded-2xl border border-clay/30 bg-paper p-5 shadow-lift">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-clay/15 text-clay">
            <AlertCircle size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[15px] font-extrabold text-clay">インポートエラー</h3>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-cocoa">{message}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl border border-sand bg-cream px-4 py-2.5 text-[12px] font-bold text-cocoa transition-all duration-200 hover:border-sand-deep hover:bg-sand/50 active:scale-95"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

/** 削除確認モーダル（2段階確認） */
function ConfirmDeleteModal({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    if (!open) {
      setStep(1);
      setInputText("");
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    if (step === 1) {
      setStep(2);
    } else if (inputText === "削除") {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="anim-fade absolute inset-0 bg-bark/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="anim-pop relative z-10 w-full max-w-sm rounded-2xl border border-clay/30 bg-paper p-5 shadow-lift">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-clay/15 text-clay">
            <AlertCircle size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[15px] font-extrabold text-clay">
              {step === 1 ? "本当に削除しますか？" : "最終確認"}
            </h3>
            {step === 1 ? (
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-cocoa">
                すべての記録が完全に削除されます。この操作は取り消せません。
                <br />
                <span className="font-bold">事前にバックアップを取ることを強く推奨します。</span>
              </p>
            ) : (
              <div className="mt-1.5">
                <p className="text-[11.5px] leading-relaxed text-cocoa">
                  本当に削除する場合は、<span className="font-extrabold text-clay">「削除」</span>と入力してください。
                </p>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="削除"
                  className="mt-2 w-full rounded-lg border border-clay/30 bg-cream px-3 py-2 text-[13px] font-medium text-bark placeholder:text-latte/60 focus:border-clay focus:outline-none"
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="tap flex-1 rounded-xl border border-sand bg-cream px-4 py-2.5 text-[12px] font-bold text-cocoa transition-all duration-200 hover:border-sand-deep hover:bg-sand/50 active:scale-95"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={step === 2 && inputText !== "削除"}
            className={`tap flex-1 rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-cream transition-all duration-200 active:scale-95 ${
              step === 2 && inputText !== "削除"
                ? "cursor-not-allowed bg-clay/50"
                : "bg-clay hover:bg-clay/90"
            }`}
          >
            {step === 1 ? "次へ" : "削除する"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 挨拶メッセージ編集コンポーネント */
function GreetingEditor() {
  const customGreeting = useUiStore((s) => s.customGreeting);
  const setCustomGreeting = useUiStore((s) => s.setCustomGreeting);
  const notify = useUiStore((s) => s.notify);

  const PRESETS = [
    "今日もコツコツいこう。",
    "限界を超えろ。",
    "継続は力なり。",
    "自分を信じて。",
    "一歩ずつ前に。",
  ];

  return (
    <div className="rounded-xl border border-sand bg-paper p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <MessageSquare size={12} className="text-caramel-deep" />
        <p className="text-[9.5px] font-bold tracking-[0.18em] text-latte">トップページのメッセージ</p>
      </div>
      <input
        type="text"
        value={customGreeting}
        onChange={(e) => setCustomGreeting(e.target.value)}
        placeholder="今日もコツコツいこう。"
        className="w-full rounded-lg border border-sand bg-cream px-3 py-2 text-[13px] font-medium text-bark placeholder:text-latte/60 focus:border-caramel focus:outline-none"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setCustomGreeting(preset);
              notify(`メッセージを設定しました`);
            }}
            className="tap rounded-full border border-sand bg-cream px-2 py-1 text-[9px] font-bold text-cocoa transition-all duration-200 hover:border-sand-deep hover:text-bark active:scale-95"
          >
            {preset}
          </button>
        ))}
        {customGreeting && (
          <button
            type="button"
            onClick={() => {
              setCustomGreeting("");
              notify("メッセージをリセットしました");
            }}
            className="tap rounded-full border border-clay/50 bg-clay/10 px-2 py-1 text-[9px] font-bold text-clay transition-all duration-200 hover:bg-clay/15 active:scale-95"
          >
            リセット
          </button>
        )}
      </div>
    </div>
  );
}

/** 部位カード表示設定コンポーネント */
function MuscleVisibilitySettings() {
  const bodyParts = useStore((s) => s.bodyParts);
  const hiddenMuscles = useUiStore((s) => s.hiddenMuscles);
  const toggleMuscleVisibility = useUiStore((s) => s.toggleMuscleVisibility);
  const notify = useUiStore((s) => s.notify);

  const orderedParts = [...bodyParts].sort((a, b) => a.order - b.order);

  return (
    <div className="rounded-xl border border-sand bg-paper p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <Eye size={12} className="text-caramel-deep" />
        <p className="text-[9.5px] font-bold tracking-[0.18em] text-latte">部位カードの表示</p>
      </div>
      <div className="space-y-1.5">
        {orderedParts.map((part) => {
          const isHidden = hiddenMuscles.includes(part.id);
          return (
            <button
              key={part.id}
              type="button"
              onClick={() => {
                toggleMuscleVisibility(part.id);
                notify(isHidden ? `${part.name}を表示しました` : `${part.name}を非表示にしました`);
              }}
              className={`tap flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all duration-200 active:scale-[0.98] ${
                isHidden
                  ? "border-sand bg-cream/50 text-latte"
                  : "border-sand bg-cream text-bark hover:border-sand-deep"
              }`}
            >
              <span className="flex-1 text-[12px] font-bold">{part.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                  isHidden ? "bg-sand text-latte" : "bg-caramel/15 text-caramel-deep"
                }`}
              >
                {isHidden ? "非表示" : "表示中"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** テーマ選択コンポーネント */
function ThemeSelector() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const notify = useUiStore((s) => s.notify);

  const themes = [
    { id: "earth" as const, name: "Earth", desc: "アースカラー", colors: ["#f6f0e4", "#c08a3e", "#6e7f4f"] },
    { id: "paper" as const, name: "Paper", desc: "ミニマル", colors: ["#f8f9fa", "#6c63ff", "#212529"] },
    { id: "ember" as const, name: "Ember", desc: "情熱的", colors: ["#fdf5f0", "#e85d3a", "#c0392b"] },
    { id: "neon" as const, name: "Neon", desc: "ダーク×ネオン", colors: ["#1a1a2e", "#00d9ff", "#4ecdc4"] },
    { id: "ocean" as const, name: "Ocean", desc: "クール", colors: ["#f0f8ff", "#17a2b8", "#1b4f72"] },
    { id: "forest" as const, name: "Forest", desc: "自然で落ち着き", colors: ["#f5f7f2", "#8b9d6f", "#4a6741"] },
    { id: "midnight" as const, name: "Midnight", desc: "上品ダーク", colors: ["#0f1419", "#7c9cbf", "#2a3040"] },
    { id: "pastel" as const, name: "Pastel", desc: "柔らかい色合い", colors: ["#fef9f3", "#ffb3ba", "#baffc9"] },
    { id: "vintage" as const, name: "Vintage", desc: "レトロで重厚", colors: ["#f4e8d0", "#b8860b", "#a0522d"] },
    { id: "monochrome" as const, name: "Mono", desc: "究極ミニマル", colors: ["#f5f5f5", "#333333", "#1a1a1a"] },
    { id: "carbon" as const, name: "Carbon", desc: "スポーツ感", colors: ["#1a1a1a", "#ff6b35", "#00d9ff"] },
    { id: "obsidian" as const, name: "Obsidian", desc: "高級感和紙", colors: ["#0a0a0a", "#d4af37", "#ffd700"] },
    { id: "cyberpunk" as const, name: "Cyber", desc: "未来的テック", colors: ["#0d0d0d", "#ff00ff", "#00ffff"] },
    { id: "titanium" as const, name: "Titanium", desc: "洗練ミニマル", colors: ["#f5f5f7", "#0071e3", "#86868b"] },
  ];

  return (
    <div className="rounded-xl border border-sand bg-paper p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <Palette size={12} className="text-caramel-deep" />
        <p className="text-[9.5px] font-bold tracking-[0.18em] text-latte">デザインテーマ</p>
      </div>
      <div className="grid grid-cols-5 gap-2 pb-2">
        {themes.map((t) => {
          const active = theme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                if (!active) {
                  setTheme(t.id);
                  notify(`テーマを「${t.name}」に変更しました`);
                }
              }}
              className={`tap flex flex-col items-center gap-1 rounded-lg border p-2 transition-all duration-200 active:scale-95 ${
                active
                  ? "border-caramel bg-caramel/10 shadow-soft"
                  : "border-sand bg-cream hover:border-sand-deep"
              }`}
            >
              {/* カラープレビュー */}
              <div className="flex h-6 w-full overflow-hidden rounded">
                <div className="flex-1" style={{ backgroundColor: t.colors[0] }} />
                <div className="flex-1" style={{ backgroundColor: t.colors[1] }} />
                <div className="flex-1" style={{ backgroundColor: t.colors[2] }} />
              </div>
              <span className="text-[9px] font-bold text-bark">{t.name}</span>
              {active && (
                <Check size={10} className="absolute -top-1 -right-1 rounded-full bg-caramel p-0.5 text-cream" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SettingsSheet() {
  const sheet = useUiStore((s) => s.sheet);
  const closeSheet = useUiStore((s) => s.closeSheet);
  const openSheet = useUiStore((s) => s.openSheet);
  const notify = useUiStore((s) => s.notify);
  const resetData = useStore((s) => s.resetData);
  const clearAllData = useStore((s) => s.clearAllData);
  const importData = useStore((s) => s.importData);
  const [armed, setArmed] = useState(false);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const open = sheet?.type === "settings";

  useEffect(() => {
    if (!open) {
      setArmed(false);
      setImportConfirmOpen(false);
      setDeleteConfirmOpen(false);
      setErrorModalOpen(false);
      setPendingFile(null);
    }
  }, [open]);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3200);
    return () => clearTimeout(t);
  }, [armed]);

  /** エクスポート：workout_backup_YYYYMMDD.json */
  const handleExport = () => {
    const { bodyParts, workoutRecords, sizeRecords, templates, goals, sortMode } = useStore.getState();
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const backup: BackupData = {
      app: "Kinroku",
      version: 1,
      exportedAt: now.toISOString(),
      bodyParts,
      workoutRecords,
      sizeRecords,
      templates,
      goals,
      sortMode,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workout_backup_${dateStr}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("バックアップを書き出しました");
  };

  /** インポート：ファイル選択 */
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  /** ファイル選択後：確認モーダル表示 */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setImportConfirmOpen(true);
    // inputをリセット（同じファイルを再度選択できるように）
    e.target.value = "";
  };

  /** インポート実行 */
  const executeImport = async () => {
    if (!pendingFile) return;
    setImportConfirmOpen(false);

    try {
      const text = await pendingFile.text();
      const data = JSON.parse(text) as Partial<BackupData>;

      // バリデーション
      if (data.app !== "Kinroku") {
        throw new Error("このファイルはKinrokuのバックアップではありません");
      }
      if (!Array.isArray(data.bodyParts) || !Array.isArray(data.workoutRecords) || 
          !Array.isArray(data.sizeRecords) || !Array.isArray(data.templates)) {
        throw new Error("ファイルの形式が正しくありません");
      }

      // インポート実行
      importData({
        bodyParts: data.bodyParts,
        workoutRecords: data.workoutRecords,
        sizeRecords: data.sizeRecords,
        templates: data.templates,
        goals: data.goals ?? [],
        sortMode: data.sortMode ?? "new",
      });

      setPendingFile(null);
      notify("データをインポートしました");
      
      // 画面をリロードしてデータを反映
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setPendingFile(null);
      setErrorMessage(err instanceof Error ? err.message : "ファイルの読み込みに失敗しました");
      setErrorModalOpen(true);
    }
  };

  const handleReset = () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    resetData();
    setArmed(false);
    notify("デモデータを再生成しました");
  };

  const handleClearAll = () => {
    clearAllData();
    setDeleteConfirmOpen(false);
    notify("すべてのデータを削除しました");
  };

  return (
    <>
      <Sheet open={open} title="設定" subtitle="ローカル専用 ─ 外部との通信は一切ありません" onClose={closeSheet}>
        <GroupLabel>データ</GroupLabel>
        <div className="space-y-2">
          <ActionRow
            icon={Calendar}
            highlight
            title="カレンダー表示"
            desc="月間カレンダーで記録日を視覚化"
            onClick={() => openSheet({ type: "calendar" })}
          />
          <ActionRow
            icon={Database}
            highlight
            title="データ管理"
            desc="記録・サイズ・テンプレート・部位の追加/編集/削除"
            onClick={() => openSheet({ type: "data" })}
          />
          <ActionRow
            icon={Download}
            title="データのエクスポート"
            desc="全データをJSONファイルとして保存（機種変更時に使用）"
            onClick={handleExport}
          />
          <ActionRow
            icon={FileUp}
            title="データのインポート"
            desc="バックアップファイルからデータを復元"
            onClick={handleImportClick}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileSelect}
          />
          <ActionRow
            icon={RotateCcw}
            danger={armed}
            title={armed ? "もう一度押すとリセットします" : "デモデータをリセット"}
            desc={armed ? "現在の記録は消えて、新しいデモデータになります" : "記録を初期のデモデータに戻します"}
            onClick={handleReset}
          />
          <ActionRow
            icon={Trash2}
            danger
            title="全データを削除"
            desc="すべての記録を完全に削除します（2段階確認あり）"
            onClick={() => setDeleteConfirmOpen(true)}
          />
        </div>

        <GroupLabel>メッセージ</GroupLabel>
        <GreetingEditor />

        <GroupLabel>目標設定</GroupLabel>
        <GoalsEditor />

        <GroupLabel>部位カード</GroupLabel>
        <MuscleVisibilitySettings />

        <GroupLabel>テーマ</GroupLabel>
        <ThemeSelector />

        <GroupLabel>並び替え</GroupLabel>
        <div className="flex items-center gap-3 rounded-xl border border-sand bg-paper px-3.5 py-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-sand bg-cream text-cocoa">
            <GripVertical size={15} />
          </span>
          <p className="text-[10.5px] leading-relaxed text-latte">
            部位カードは<span className="font-bold text-bark">グリップをドラッグ</span>して並び替えられます。
            順番はこの端末に自動保存されます。
          </p>
        </div>

        <GroupLabel>このアプリについて</GroupLabel>
        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-xl border border-sand bg-paper px-3.5 py-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-sand bg-cream text-cocoa">
              <Lock size={15} />
            </span>
            <p className="text-[10.5px] leading-relaxed text-latte">
              記録はこの端末のlocalStorage（kinroku-data-v1）に保存されます。
              サーバーへの送信はありません。
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-sand bg-paper px-3.5 py-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-sand bg-cream text-cocoa">
              <Smartphone size={15} />
            </span>
            <p className="text-[10.5px] leading-relaxed text-latte">
              PWA対応 ─ ブラウザの「ホーム画面に追加」でアプリのように使えます。
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-sand bg-paper px-3.5 py-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-sand bg-cream text-cocoa">
              <Info size={15} />
            </span>
            <p className="text-[10.5px] leading-relaxed text-latte">
              Kinroku v1.1.0 ─ 毎日の筋トレを、あたたかく記録する。
            </p>
          </div>
        </div>
      </Sheet>

      {/* インポート確認モーダル */}
      <ConfirmModal
        open={importConfirmOpen}
        title="データをインポートしますか？"
        message={`ファイル「${pendingFile?.name}」からデータを復元します。\n\n既存のデータはすべて上書きされます。この操作は取り消せません。`}
        confirmText="インポートする"
        cancelText="キャンセル"
        danger
        onConfirm={executeImport}
        onCancel={() => {
          setImportConfirmOpen(false);
          setPendingFile(null);
        }}
      />

      {/* エラーモーダル */}
      <ErrorModal
        open={errorModalOpen}
        message={errorMessage}
        onClose={() => setErrorModalOpen(false)}
      />

      {/* 削除確認モーダル（2段階確認） */}
      <ConfirmDeleteModal
        open={deleteConfirmOpen}
        onConfirm={handleClearAll}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </>
  );
}