"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  type Company,
  type CompanyAnalysis,
  upsertCompany,
  listCompanies,
  findByName,
} from "../app/utils/companyStore";

/* ───────────────── v0風の最小UI部品（依存を増やさない） ───────────────── */
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400 " +
        (props.className ?? "")
      }
    />
  );
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={
        "w-full min-h-28 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400 " +
        (props.className ?? "")
      }
    />
  );
}
function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "h-10 px-4 rounded-xl text-sm font-medium shadow-sm bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 " +
        (props.className ?? "")
      }
    />
  );
}
function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "h-9 px-3 rounded-lg text-sm font-medium bg-white/80 hover:bg-white text-slate-700 ring-1 ring-slate-200 " +
        (props.className ?? "")
      }
    />
  );
}

/* ───────────────── 会社編集モデル ───────────────── */
type ESDraft = {
  selfPR?: string;
  studentLife?: string;
  motivation?: string;
  strengths?: string;
  weaknesses?: string;
  free?: string;
};
type EditModel = Company & {
  es?: ESDraft;
  analysis?: CompanyAnalysis;
};

/* ───────────────── ユーティリティ ───────────────── */
function useDebouncedCallback<T>(cb: (v: T) => void, delay = 500) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (v: T) => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => cb(v), delay);
  };
}

/* ───────────────── タブ定義（色はヘッダー帯だけで使用） ───────────────── */
type TabKey = "es" | "info" | "analysis";
type TabDef = { key: TabKey; title: string; color: string };
const ALL_TABS: TabDef[] = [
  { key: "es", title: "ES", color: "bg-blue-500" },
  { key: "info", title: "企業情報", color: "bg-emerald-500" },
  { key: "analysis", title: "企業分析", color: "bg-purple-500" },
];

/* ───────────────── 本体 ───────────────── */
export function DraggableTabInterface() {
  // 会社データ
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [model, setModel] = useState<EditModel | null>(null);

  // 選択タブ（チェックボックス）
  const [selectedTabKeys, setSelectedTabKeys] = useState<TabKey[]>(["es"]);

  // フルスクリーン表示フラグ
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 分割比率（2分割/3分割）
  const [split2, setSplit2] = useState(50); // 左パネルの%幅
  const [split3, setSplit3] = useState<[number, number, number]>([33.34, 33.33, 33.33]);

  // v0 風カードのアクティブインデックス（通常画面の見た目用）
  const [activeTab, setActiveTab] = useState(0);

  // 初期ロード：会社一覧→先頭を選択
  useEffect(() => {
    const list = listCompanies();
    setAllCompanies(list);
    if (list.length > 0) {
      const first = list[0];
      setCompanyName(first.name);
      setModel({
        ...first,
        es: first.es ?? {},
        analysis: first.analysis ?? {},
      });
    }
  }, []);

  // 会社読み込み or 新規作成
  const loadOrCreate = (name: string) => {
    if (!name.trim()) return;
    const existing = findByName(name);
    if (existing) {
      setModel({
        ...existing,
        es: existing.es ?? {},
        analysis: existing.analysis ?? {},
      });
    } else {
      const now = new Date().toISOString();
      setModel({
        id: crypto?.randomUUID?.() ?? String(Date.now()),
        name: name.trim(),
        updatedAt: now,
        es: {},
        analysis: {},
      } as EditModel);
    }
  };

  // 任意フィールド setter
  const setField =
    (path: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.target.value;
      setModel((prev) => {
        if (!prev) return prev;
        const next: any = structuredClone(prev);
        const seg = path.split(".");
        let cur = next;
        for (let i = 0; i < seg.length - 1; i++) cur[seg[i]] ??= {};
        cur[seg.at(-1)!] = v;
        next.updatedAt = new Date().toISOString();
        return next as EditModel;
      });
    };

  // 自動保存（500ms デバウンス）
  const autosave = useDebouncedCallback<EditModel | null>((m) => {
    if (!m) return;
    const saved = upsertCompany(m);
    setAllCompanies(listCompanies()); // 新規作成に備え一覧更新
    setCompanyName(saved.name);
  }, 500);
  useEffect(() => {
    autosave(model);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  // タブ選択チェックボックス
  const toggleTab = (key: TabKey, checked: boolean) => {
    setSelectedTabKeys((prev) => {
      if (checked) {
        return prev.includes(key) ? prev : [...prev, key];
      } else {
        return prev.filter((k) => k !== key);
      }
    });
  };
  const selectedTabs: TabDef[] = useMemo(
    () => ALL_TABS.filter((t) => selectedTabKeys.includes(t.key)),
    [selectedTabKeys]
  );

  // ───────── 2枚リサイズ ─────────
  const containerRef2 = useRef<HTMLDivElement>(null);
  const onDragBar2 = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const start = split2;
    const move = (ev: MouseEvent) => {
      const el = containerRef2.current;
      if (!el) return;
      const w = el.offsetWidth;
      const dx = ev.clientX - startX;
      const r = Math.max(20, Math.min(80, start + (dx / w) * 100));
      setSplit2(r);
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };

  // ───────── 3枚リサイズ（左右2本） ─────────
  const containerRef3 = useRef<HTMLDivElement>(null);
  const onDragBar3 =
    (barIndex: 0 | 1) => (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const [a0, b0, c0] = split3;
      const move = (ev: MouseEvent) => {
        const el = containerRef3.current;
        if (!el) return;
        const w = el.offsetWidth;
        const dx = ev.clientX - startX;
        const delta = (dx / w) * 100;
        let a = a0,
          b = b0,
          c = c0;
        if (barIndex === 0) {
          a = Math.max(15, Math.min(70, a0 + delta));
          b = Math.max(15, Math.min(70, b0 - delta));
        } else {
          b = Math.max(15, Math.min(70, b0 + delta));
          c = Math.max(15, Math.min(70, c0 - delta));
        }
        const total = a + b + c;
        const k = 100 / total; // 合計100%に正規化
        setSplit3([a * k, b * k, c * k]);
      };
      const up = () => {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
      };
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    };

  // v0.app 風 Carousel の位置計算
  const getTabTransform = (index: number) => {
    const offset = (index - activeTab) * 300;
    const scale = index === activeTab ? 1 : 0.85;
    const zIndex = index === activeTab ? 10 : 5;
    return {
      transform: `translateX(${offset}px) scale(${scale})`,
      zIndex,
      opacity: Math.abs(index - activeTab) > 1 ? 0.3 : 1,
    } as React.CSSProperties;
  };

  /* ───────────────── 描画 ───────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
      <div className="mx-auto max-w-7xl p-4">
        {/* ヘッダー */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-lg bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-white"
            >
              ← ホームへ
            </Link>
            <span className="text-lg font-bold text-slate-800">企業登録・編集（v0風）</span>
          </div>
          <div className="flex gap-2">
            <GhostButton
              onClick={() => setIsFullscreen(true)}
              disabled={selectedTabs.length === 0 || !model}
              title="選択タブをフルスクリーンで開く"
            >
              フルスクリーン
            </GhostButton>
          </div>
        </div>

        {/* 企業選択／新規作成（既存ロジック） */}
        <div className="mb-4 grid gap-3 rounded-2xl bg-white/90 p-4 ring-1 ring-slate-200 md:grid-cols-[minmax(220px,280px),1fr,auto] md:items-end">
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-500">企業を選択</div>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                loadOrCreate(e.target.value);
              }}
            >
              {allCompanies.length === 0 && <option value="">（未登録）</option>}
              {allCompanies.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-500">新規作成（社名を入力）</div>
            <Input
              placeholder="例：サンプル株式会社"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = (e.currentTarget.value || "").trim();
                  if (!v) return;
                  setCompanyName(v);
                  loadOrCreate(v);
                  e.currentTarget.value = "";
                }
              }}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (model) {
                  upsertCompany(model);
                  setAllCompanies(listCompanies());
                }
              }}
            >
              保存
            </Button>
          </div>
        </div>

        {/* タブ選択（チェックボックス） */}
        <div className="mb-4 rounded-2xl bg-white/90 p-4 ring-1 ring-slate-200">
          <div className="mb-2 text-sm font-semibold text-slate-700">表示するタブを選択 → フルスクリーン</div>
          <div className="flex flex-wrap gap-4">
            {ALL_TABS.map((t) => {
              const checked = selectedTabKeys.includes(t.key);
              return (
                <label key={t.key} className="flex cursor-pointer select-none items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 accent-slate-800"
                    checked={checked}
                    onChange={(e) => toggleTab(t.key, e.currentTarget.checked)}
                  />
                  <span className="text-sm text-slate-700">{t.title}</span>
                </label>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-slate-600">
            1枚：単一タブ全画面／2枚：左右分割（リサイズ可）／3枚：左・中央・右（リサイズ可）
          </div>
        </div>

        {/* v0.app 風のカードビュー（通常画面の見た目） */}
        <div className="rounded-2xl bg-white/80 p-6 shadow ring-1 ring-slate-200">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">タブカードビュー（v0風）</h2>
          <div className="relative h-96 overflow-hidden">
            <div className="flex h-full items-center justify-center">
              {ALL_TABS.map((tab, index) => (
                <div
                  key={tab.key}
                  className="absolute h-80 w-80 cursor-pointer rounded-xl text-white shadow-xl transition-all duration-300 ease-out"
                  style={getTabTransform(index)}
                  onClick={() => setActiveTab(index)}
                >
                  <div className={`flex h-full w-full flex-col items-center justify-center rounded-xl p-6 ${tab.color}`}>
                    <h3 className="mb-4 text-2xl font-bold">{tab.title}</h3>
                    <p className="text-center opacity-90">
                      {tab.key === "es" && "エントリーシートを書く・保存"}
                      {tab.key === "info" && "会社基本情報・フロー管理"}
                      {tab.key === "analysis" && "競合分析・注力領域まとめ"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* ドットナビ */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform">
              <div className="flex gap-2">
                {ALL_TABS.map((_, i) => (
                  <button
                    key={i}
                    className={`h-2 w-2 rounded-full ${i === activeTab ? "bg-slate-900" : "bg-slate-300"}`}
                    onClick={() => setActiveTab(i)}
                    aria-label={`go tab ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 通常画面では本文は出さず、フルスクリーンで編集表示 */}
        <div className="mt-4 rounded-2xl bg-white/70 p-6 text-sm text-slate-700 ring-1 ring-slate-200">
          上部でタブを選んで「フルスクリーン」を押すと表示します。
        </div>
      </div>

      {/* ───────── フルスクリーンオーバーレイ ───────── */}
      {isFullscreen && model && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
          {/* トップバー */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-lg bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-white"
              >
                ← ホームへ
              </Link>
              <span className="text-sm font-semibold text-slate-700">フルスクリーン表示</span>
            </div>
            <div className="flex gap-2">
              <GhostButton onClick={() => setIsFullscreen(false)}>閉じる</GhostButton>
            </div>
          </div>

          {/* 1/2/3 枚分岐 */}
          {/* 1枚：単一タブ全画面 */}
          {selectedTabs.length === 1 && (
            <div className="h-[calc(100vh-56px)] p-4">
              <div className="mx-auto h-full max-w-7xl">
                <PanelCard tab={selectedTabs[0]} model={model} setField={setField} />
              </div>
            </div>
          )}

          {/* 2枚：左右分割＋ドラッグでリサイズ */}
          {selectedTabs.length === 2 && (
            <div ref={containerRef2} className="h-[calc(100vh-56px)] p-4">
              <div className="flex h-full gap-2">
                <div className="h-full" style={{ width: `${split2}%` }}>
                  <PanelCard tab={selectedTabs[0]} model={model} setField={setField} />
                </div>
                <div
                  className="w-2 cursor-col-resize rounded-full bg-white/40 transition hover:bg-white/60"
                  onMouseDown={onDragBar2}
                  title="ドラッグでサイズ変更"
                />
                <div className="h-full" style={{ width: `${100 - split2}%` }}>
                  <PanelCard tab={selectedTabs[1]} model={model} setField={setField} />
                </div>
              </div>
            </div>
          )}

          {/* 3枚：左・中央・右＋ドラッグでリサイズ */}
          {selectedTabs.length === 3 && (
            <div ref={containerRef3} className="h-[calc(100vh-56px)] p-4">
              <div className="flex h-full gap-2">
                <div className="h-full" style={{ width: `${split3[0]}%` }}>
                  <PanelCard tab={selectedTabs[0]} model={model} setField={setField} />
                </div>
                <div
                  className="w-2 cursor-col-resize rounded-full bg-white/40 transition hover:bg-white/60"
                  onMouseDown={onDragBar3(0)}
                  title="ドラッグでサイズ変更"
                />
                <div className="h-full" style={{ width: `${split3[1]}%` }}>
                  <PanelCard tab={selectedTabs[1]} model={model} setField={setField} />
                </div>
                <div
                  className="w-2 cursor-col-resize rounded-full bg-white/40 transition hover:bg-white/60"
                  onMouseDown={onDragBar3(1)}
                  title="ドラッグでサイズ変更"
                />
                <div className="h-full" style={{ width: `${split3[2]}%` }}>
                  <PanelCard tab={selectedTabs[2]} model={model} setField={setField} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────────── パネルカード（白カード＋色帯） ───────────────── */
function PanelCard({
  tab,
  model,
  setField,
}: {
  tab: TabDef;
  model: EditModel;
  setField: (path: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl bg-white/95 text-slate-900 shadow-xl ring-1 ring-slate-200">
      {/* v0風アクセント */}
      <div className={`h-2 w-full rounded-t-2xl ${tab.color}`} />
      <div className="px-6 pt-4 pb-2">
        <h2 className="text-xl font-bold">{tab.title}</h2>
      </div>
      <div className="flex-1 overflow-auto px-6 pb-6">
        {tab.key === "es" && <ESTab model={model} setField={setField} />}
        {tab.key === "info" && <InfoTab model={model} setField={setField} />}
        {tab.key === "analysis" && <AnalysisTab model={model} setField={setField} />}
      </div>
    </div>
  );
}

/* ───────────────── タブ中身：ES ───────────────── */
function ESTab({
  model,
  setField,
}: {
  model: EditModel;
  setField: (path: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">企業名</div>
        <Input value={model.name} onChange={setField("name")} />
      </div>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">自己PR</div>
        <Textarea value={model.es?.selfPR ?? ""} onChange={setField("es.selfPR")} placeholder="強み・再現性・定量" />
      </div>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">学生時代に力を入れたこと（ガクチカ）</div>
        <Textarea value={model.es?.studentLife ?? ""} onChange={setField("es.studentLife")} />
      </div>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">志望動機</div>
        <Textarea value={model.es?.motivation ?? ""} onChange={setField("es.motivation")} />
      </div>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">強み</div>
        <Textarea value={model.es?.strengths ?? ""} onChange={setField("es.strengths")} />
      </div>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">弱み</div>
        <Textarea value={model.es?.weaknesses ?? ""} onChange={setField("es.weaknesses")} />
      </div>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 xl:col-span-2">
        <div className="mb-1 text-xs font-semibold text-slate-500">自由記述</div>
        <Textarea value={model.es?.free ?? ""} onChange={setField("es.free")} />
      </div>
    </section>
  );
}

/* ───────────────── タブ中身：企業情報 ───────────────── */
function InfoTab({
  model,
  setField,
}: {
  model: EditModel;
  setField: (path: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* トップレベル（既存構造） */}
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">業種</div>
        <Input value={model.industry ?? ""} onChange={setField("industry")} placeholder="例：ITコンサル" />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">現ステータス</div>
        <Input value={model.status ?? ""} onChange={setField("status")} placeholder="例：一次面接" />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">次回日時（flowDeadline）</div>
        <Input value={model.flowDeadline ?? ""} onChange={setField("flowDeadline")} placeholder="YYYY-MM-DD HH:mm" />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">場所/形式</div>
        <Input value={model.locationHint ?? ""} onChange={setField("locationHint")} placeholder="例：Zoom / 本社" />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">選考フロー（例：書類→一次面接→最終面接）</div>
        <Textarea value={model.interviewFlow ?? ""} onChange={setField("interviewFlow")} />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">筆記/適性（テスト形式）</div>
        <Input value={model.testFormat ?? ""} onChange={setField("testFormat")} placeholder="SPI / 玉手箱 など" />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">次アクション</div>
        <Input value={model.nextAction ?? ""} onChange={setField("nextAction")} placeholder="例：一次面接の準備" />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 xl:col-span-2">
        <div className="mb-1 text-xs font-semibold text-slate-500">メモ</div>
        <Textarea value={model.notes ?? ""} onChange={setField("notes")} />
      </div>

      {/* 会社基本情報（analysis 側） */}
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">売上</div>
        <Input
          value={model.analysis?.revenue ?? ""}
          onChange={setField("analysis.revenue")}
          placeholder="例：1,234億円（2024）"
        />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">従業員数</div>
        <Input value={model.analysis?.employees ?? ""} onChange={setField("analysis.employees")} />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">資本金</div>
        <Input value={model.analysis?.capital ?? ""} onChange={setField("analysis.capital")} />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 xl:col-span-2">
        <div className="mb-1 text-xs font-semibold text-slate-500">企業理念</div>
        <Textarea value={model.analysis?.philosophy ?? ""} onChange={setField("analysis.philosophy")} />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 xl:col-span-2">
        <div className="mb-1 text-xs font-semibold text-slate-500">製品・サービス（顧客理解/顧客先など）</div>
        <Textarea value={model.analysis?.products ?? ""} onChange={setField("analysis.products")} />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 xl:col-span-2">
        <div className="mb-1 text-xs font-semibold text-slate-500">事業内容（業種カテゴライズ）</div>
        <Textarea value={model.analysis?.business ?? ""} onChange={setField("analysis.business")} />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 xl:col-span-2">
        <div className="mb-1 text-xs font-semibold text-slate-500">会社の経歴</div>
        <Textarea value={model.analysis?.history ?? ""} onChange={setField("analysis.history")} />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 xl:col-span-2">
        <div className="mb-1 text-xs font-semibold text-slate-500">業務内容（部門ごと）</div>
        <Textarea value={model.analysis?.dutiesByDept ?? ""} onChange={setField("analysis.dutiesByDept")} />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">キャリアプラン</div>
        <Textarea value={model.analysis?.careerPlan ?? ""} onChange={setField("analysis.careerPlan")} />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">社風</div>
        <Textarea value={model.analysis?.culture ?? ""} onChange={setField("analysis.culture")} />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">採用人数</div>
        <Input value={model.analysis?.hiringCount ?? ""} onChange={setField("analysis.hiringCount")} />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">年収</div>
        <Input value={model.analysis?.salary ?? ""} onChange={setField("analysis.salary")} />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">福利厚生</div>
        <Textarea value={model.analysis?.benefits ?? ""} onChange={setField("analysis.benefits")} />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">平均勤続年数</div>
        <Input value={model.analysis?.avgTenure ?? ""} onChange={setField("analysis.avgTenure")} />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">残業時間</div>
        <Input value={model.analysis?.overtime ?? ""} onChange={setField("analysis.overtime")} />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 xl:col-span-2">
        <div className="mb-1 text-xs font-semibold text-slate-500">CM確認</div>
        <Textarea value={model.analysis?.cmChecked ?? ""} onChange={setField("analysis.cmChecked")} />
      </div>
    </section>
  );
}

/* ───────────────── タブ中身：企業分析 ───────────────── */
function AnalysisTab({
  model,
  setField,
}: {
  model: EditModel;
  setField: (path: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 xl:col-span-2">
        <div className="mb-1 text-xs font-semibold text-slate-500">顧客理解（誰に何を提供？）</div>
        <Textarea
          value={model.analysis?.products ?? ""}
          onChange={setField("analysis.products")}
          placeholder="主要顧客・提供価値"
        />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">競合と比較した強み</div>
        <Textarea
          value={model.analysis?.strengthsVsCompetitors ?? ""}
          onChange={setField("analysis.strengthsVsCompetitors")}
        />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">注力領域（何に力を入れているか）</div>
        <Textarea value={model.analysis?.business ?? ""} onChange={setField("analysis.business")} />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 xl:col-span-2">
        <div className="mb-1 text-xs font-semibold text-slate-500">自分のキャリアビジョンとの接続</div>
        <Textarea value={model.analysis?.focusAndVision ?? ""} onChange={setField("analysis.focusAndVision")} />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">経営計画・成長性</div>
        <Textarea
          value={model.analysis?.managementPlanGrowth ?? ""}
          onChange={setField("analysis.managementPlanGrowth")}
        />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-1 text-xs font-semibold text-slate-500">社会貢献（CSR）</div>
        <Textarea value={model.analysis?.social ?? ""} onChange={setField("analysis.social")} />
      </div>
    </section>
  );
}

export default DraggableTabInterface;
