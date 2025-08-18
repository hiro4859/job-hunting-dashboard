"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  listCompanies,
  type Company,
  upsertFromParsedEmail,
  removeCompany,
} from "./utils/companyStore";
import { usePathname } from "next/navigation";




// ───────── 定数/型 ─────────
const STORAGE_KEY_LAYOUT = "jp.jobhunt.layout.widgets.v1";
type WidgetId = "today" | "roadmap" | "assistant" | "companies" | "mail";
const DEFAULT_LAYOUT: WidgetId[] = ["today", "roadmap", "assistant", "companies", "mail"];


/* 今日の日付を保持し、真夜中に自動更新するフック */
function useTodayDate() {
  const [today, setToday] = useState(new Date());
  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0); // 今日の24:00（= 明日の0:00）
    const ms = nextMidnight.getTime() - now.getTime();
    const timer = window.setTimeout(() => setToday(new Date()), ms);
    return () => clearTimeout(timer);
  }, [today]); // 更新後に次の真夜中タイマーを再セット
  return today;
}

/* 日付表示（例：8月16日（土）） */
const fmtJP = (d: Date) => {
  const md = `${d.getMonth() + 1}月${d.getDate()}日`;
  const w = new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(d);
  return `${md}（${w}）`;
};

/* 予定系ユーティリティ */
function parseStart(s?: string): Date | null {
  // "YYYY-MM-DD HH:mm 〜 ..." から開始日時のみ取得
  const m = s?.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
  if (!m) return null;
  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5])
  );
}
function pad2(n: number) {
  return n.toString().padStart(2, "0");
}
function formatHM(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

type Parsed = { event?: string; date?: string; location?: string };

/* ───────── ページ本体 ───────── */
export default function DashboardPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [msg, setMsg] = useState("");

  // メール解析用
  const [emailText, setEmailText] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState("");

  // 並び替えUI（HTML5 DnD）
  const [order, setOrder] = useState<WidgetId[]>(DEFAULT_LAYOUT);
  const [editMode, setEditMode] = useState(false);
  const dragSrc = useRef<WidgetId | null>(null);

  useEffect(() => {
    setCompanies(listCompanies());
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LAYOUT);
      if (raw) {
        const arr = JSON.parse(raw) as WidgetId[];
        const cleaned = arr.filter((w) => DEFAULT_LAYOUT.includes(w));
        const withMissing = [...cleaned];
        DEFAULT_LAYOUT.forEach((w) => {
          if (!withMissing.includes(w)) withMissing.push(w);
        });
        setOrder(withMissing);
      }
    } catch {
      /* noop */
    }
  }, []);

  useMemo(
    () => companies.find((c) => c.name === selectedCompanyName),
    [companies, selectedCompanyName]
  ); // 参照だけ（未使用でも問題なし）

  const reloadCompanies = () => setCompanies(listCompanies());

  /* ───────── メール解析フロー ───────── */
  async function handleParse() {
    setMsg("");
    setParsed(null);
    if (!emailText.trim()) {
      setMsg("メール本文を入力してください。");
      return;
    }
    try {
      const res = await fetch("/api/email/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText }),
      });
      const data = await res.json();
      if (res.ok) {
        setParsed({
          event: data.event,
          date: data.date,
          location: data.location,
        });
      } else {
        setMsg(data?.error ?? "解析に失敗しました。");
      }
    } catch {
      setMsg("ネットワークエラー：解析できませんでした。");
    }
  }

  function handleApply() {
    setMsg("");
    if (!selectedCompanyName) {
      setMsg("反映先の企業を選んでください。");
      return;
    }
    const payload = {
      company: selectedCompanyName,
      event: parsed?.event ?? "",
      date: parsed?.date ?? "",
      location: parsed?.location ?? "",
    };
    const result = upsertFromParsedEmail(payload);
    reloadCompanies();
    if (result.action === "updated" || result.action === "created") {
      const fields = (result.updatedFields ?? []).join(", ");
      setMsg(
        `${result.targetName ?? ""} に反映しました。${
          fields ? `（更新: ${fields}）` : ""
        }`
      );
    } else if (result.action === "no_change") {
      setMsg(`${result.targetName ?? ""} は更新ありませんでした。`);
    } else if (result.action === "skipped_no_company") {
      setMsg("企業名が未指定のため反映をスキップしました。");
    }
  }

  /* ───────── DnD：ドラッグ＆ドロップ ───────── */
  function onDragStart(id: WidgetId) {
    if (!editMode) return;
    dragSrc.current = id;
  }
  function onDragOver(e: React.DragEvent) {
    if (!editMode) return;
    e.preventDefault();
  }
  function onDrop(target: WidgetId) {
    if (!editMode) return;
    const src = dragSrc.current;
    dragSrc.current = null;
    if (!src || src === target) return;
    setOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(src);
      const to = next.indexOf(target);
      if (from < 0 || to < 0) return prev;
      next.splice(from, 1);
      next.splice(to, 0, src);
      localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(next));
      return next;
    });
  }
  function resetLayout() {
    setOrder(DEFAULT_LAYOUT);
    localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(DEFAULT_LAYOUT));
  }

  /* ───────── レンダリング ───────── */
  return (
    <div className="min-h-screen bg-[#e9f0f5] text-gray-900">
      <div className="mx-auto flex max-w-7xl gap-4 p-4">
        {/* サイドバー（参考レイアウト） */}
        <aside className="hidden w-16 shrink-0 flex-col gap-3 rounded-2xl bg-[#2b5276] p-4 text-white md:flex">
          <IconButton title="ホーム" href="/">
          <HomeIcon />
          </IconButton>
          <IconButton title="メール例文" href="/mail-templates">
          <MailIcon />
          </IconButton>
          <IconButton title="会社" href="/company">
          <BuildingIcon />
          </IconButton>
          <IconButton title="カレンダー" disabled>
          <CalendarIcon />
          </IconButton>
          <IconButton title="設定" disabled>
          <SettingsIcon />
          </IconButton>
        </aside>


        {/* メイン */}
        <main className="flex-1">
          {/* トップバー */}
          <header className="flex items-center justify-between rounded-2xl bg-white/90 px-4 py-3 shadow-sm">
            <h1 className="text-lg font-bold text-[#2b5276]">就活ダッシュボード</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode((v) => !v)}
                className={`rounded-xl px-3 py-1.5 text-sm font-semibold ring-1 ring-slate-200 ${
                  editMode
                    ? "bg-amber-500 text-white hover:brightness-110"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
                title="並び替えをロック/編集"
              >
                {editMode ? "編集モード: ON" : "編集モード: OFF"}
              </button>
              <button
                onClick={resetLayout}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                初期配置に戻す
              </button>
              <TopIcon>
                <UserIcon />
              </TopIcon>
            </div>
          </header>

          {/* ウィジェット群（順番は order で制御） */}
          <section className="mt-4 grid grid-cols-1 gap-4">
            {order.map((id) => (
              <WidgetShell
                key={id}
                id={id}
                editMode={editMode}
                onDragStart={() => onDragStart(id)}
                onDragOver={onDragOver}
                onDrop={() => onDrop(id)}
              >
                {id === "today" && <WidgetToday companies={companies} />}
                {id === "roadmap" && <WidgetRoadmap />}
                {id === "assistant" && <WidgetAssistant companies={companies} />}
                {id === "companies" && (
                  <WidgetCompanies
                    companies={companies}
                    onRefresh={reloadCompanies}
                  />
                )}
                {id === "mail" && (
                  <WidgetMail
                    companies={companies}
                    selectedCompanyName={selectedCompanyName}
                    setSelectedCompanyName={setSelectedCompanyName}
                    emailText={emailText}
                    setEmailText={setEmailText}
                    parsed={parsed}
                    setParsed={setParsed}
                    onParse={handleParse}
                    onApply={handleApply}
                    msg={msg}
                    setMsg={setMsg}
                  />
                )}
              </WidgetShell>
            ))}
          </section>

          {/* フッタ導線 */}
          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              onClick={reloadCompanies}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-white"
            >
              ダッシュボード更新
            </button>
            <Link
              href="/company"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              企業情報を編集
            </Link>
            <Link
    href="/mail-templates"
    className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
  >
    メール例文ジェネレーターへ
  </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ───────── ウィジェットの外枠 ───────── */
function WidgetShell({
  id,
  editMode,
  onDragStart,
  onDragOver,
  onDrop,
  children,
}: {
  id: WidgetId;
  editMode: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      draggable={editMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition ${
        editMode ? "cursor-move hover:ring-2 hover:ring-amber-400" : ""
      }`}
      title={editMode ? "ドラッグで並べ替え" : ""}
    >
      {editMode && (
        <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <GripIcon className="h-4 w-4" /> ドラッグで移動
          </span>
          <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-700 ring-1 ring-amber-200">
            {labelOf(id)}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

function labelOf(id: WidgetId) {
  switch (id) {
    case "today":
      return "今日と次アクション";
    case "assistant":
      return "準備サマリ";
    case "companies":
      return "企業管理";
    case "mail":
      return "メール取り込み";
    case "roadmap":
      return "選考ロードマップ";

  }
}




/* ───────── 各ウィジェット ───────── */
function WidgetToday({ companies }: { companies: Company[] }) {
  const today = useTodayDate();

  const todays = useMemo(() => {
    const arr: { company: Company; start: Date }[] = [];
    for (const c of companies) {
      const start = parseStart(c.flowDeadline || "");
      if (start && isSameDay(start, today)) arr.push({ company: c, start });
    }
    return arr.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [companies, today]);

  return (
    <section>
      <div className="rounded-xl bg-[#eff5fb] p-4">
        <div className="text-2xl font-bold">{fmtJP(today)}</div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* 本日の予定 */}
        <CardRow title="本日の予定">
          {todays.length === 0 ? (
            <div className="text-sm text-slate-600">今日は予定がありません。</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {todays.map(({ company, start }) => (
                <li
                  key={company.id}
                  className="flex items-center justify-between rounded border p-2 bg-white"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="rounded bg-[#e7eef6] px-2 py-0.5 text-xs text-[#2b5276]">
                      {formatHM(start)}
                    </span>
                    <span className="truncate font-medium">{company.name}</span>
                  </div>
                  <div className="ml-2 shrink-0 text-xs text-slate-600">
                    {company.status || "—"} / {company.locationHint || "—"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardRow>

        {/* 次アクション（本日分から最大3件） */}
        <CardRow title="次アクション">
          {todays.length === 0 ? (
            <div className="text-sm text-slate-600">直近の会社から自動作成します。</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {todays.slice(0, 3).map(({ company, start }) => (
                <li key={company.id} className="rounded border p-2 bg-white">
                  <div className="font-medium">{company.name}</div>
                  <div className="text-xs text-slate-600">
                    {company.nextAction || "—"}（{formatHM(start)}）
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardRow>
      </div>
    </section>
  );
}

function WidgetAssistant({ companies }: { companies: Company[] }) {
  const today = useTodayDate();

  const stats = useMemo(() => {
    const now = new Date();
    const startToday = startOfDay(today);
    const startTomorrow = addDays(startToday, 1);
    const startIn7 = addDays(startToday, 7);

    const withStart = companies
      .map((c) => ({ c, start: parseStart(c.flowDeadline || "") }))
      .filter((x) => x.start) as { c: Company; start: Date }[];

    const todayCnt = withStart.filter((x) => isSameDay(x.start, startToday)).length;
    const tomorrowCnt = withStart.filter((x) => isSameDay(x.start, startTomorrow)).length;
    const weekCnt = withStart.filter((x) => x.start >= startToday && x.start < startIn7).length;
    const overdueCnt = withStart.filter((x) => x.start.getTime() < now.getTime()).length;

    const upcoming3 = withStart
      .filter((x) => x.start >= now)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 3);

    const missingAction = companies.filter((c) => !c.nextAction?.trim()).length;

    return { todayCnt, tomorrowCnt, weekCnt, overdueCnt, upcoming3, missingAction };
  }, [companies, today]);

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-800">準備サマリ</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl border border-slate-200 bg-[#f6fbff] px-4 py-3">
              今日：<span className="font-semibold">{stats.todayCnt}</span> 件 / 明日：
              <span className="font-semibold">{stats.tomorrowCnt}</span> 件
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[#f6fbff] px-4 py-3">
              7日以内：<span className="font-semibold">{stats.weekCnt}</span> 件 / 期限切れ：
              <span className="font-semibold">{stats.overdueCnt}</span> 件
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[#f6fbff] px-4 py-3 col-span-2">
              次にやること（直近3件）
              <ul className="mt-2 space-y-1 text-xs">
                {stats.upcoming3.length === 0 ? (
                  <li className="text-slate-600">直近の予定はありません。</li>
                ) : (
                  stats.upcoming3.map(({ c, start }) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between rounded bg-white p-2 ring-1 ring-slate-200"
                    >
                      <span className="truncate">{c.name}：{c.nextAction || "—"}</span>
                      <span className="ml-2 shrink-0 rounded bg-[#e7eef6] px-2 py-0.5 text-[11px] text-[#2b5276]">
                        {fmtJP(start)} {formatHM(start)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[#fff7ed] px-4 py-3 col-span-2 text-amber-800">
              次アクション未設定：<span className="font-semibold">{stats.missingAction}</span> 社（/ 企業編集で設定推奨）
            </div>
          </div>
        </div>
        <div className="hidden h-36 w-36 items-center justify-center rounded-full bg-[#e7eef6] md:flex">
          <HeadsetIcon className="h-16 w-16 text-[#2b5276]" />
        </div>
      </div>
    </section>
  );
}

/* 企業カード（既存＋分析サマリ） */
function WidgetCompanies({
  companies,
  onRefresh,
}: {
  companies: Company[];
  onRefresh: () => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-800">企業管理</h3>
        <div className="flex items-center gap-2">
          <Link
            href="/company"
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            企業登録・編集へ
          </Link>
          <button
            onClick={onRefresh}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            一覧を更新
          </button>
        </div>
      </div>

      <div className="no-scrollbar -mx-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-2 py-1">
        {companies.length === 0 ? (
          <div className="px-2 text-sm text-slate-500">
            企業がありません。右上の「企業登録・編集へ」から登録してください。
          </div>
        ) : (
          companies.map((c) => (
            <article
              key={c.id}
              className="min-w-[280px] snap-start rounded-2xl border border-slate-200 bg-[#f7fbff] p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="truncate font-semibold">{c.name}</div>
                <span className="rounded bg-white px-2 py-0.5 text-[11px] text-slate-600 ring-1 ring-slate-200">
                  締切 {c.flowDeadline || "—"}
                </span>
              </div>
              <div className="mt-2 text-sm text-slate-700">
                {c.status || "—"}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                次アクション：{c.nextAction || "—"}
              </div>
              <div className="mt-2 text-xs text-slate-600">
                場所/形式：{c.locationHint || "—"}
              </div>

              {(c.analysis && Object.values(c.analysis).some(Boolean)) && (
                <div className="mt-3 rounded-lg bg-white p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                  <div className="mb-1 font-semibold text-slate-800">分析</div>
                  <ul className="space-y-1">
                    {[
                      c.analysis.culture && `社風：${c.analysis.culture}`,
                      c.analysis.strengthsVsCompetitors && `強み：${c.analysis.strengthsVsCompetitors}`,
                      c.analysis.managementPlanGrowth && `成長性：${c.analysis.managementPlanGrowth}`,
                      c.analysis.focusAndVision && `注力×自分のビジョン：${c.analysis.focusAndVision}`,
                    ]
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((line, i) => (
                        <li key={i} className="truncate">{line as string}</li>
                      ))}
                    <li>
                      <Link href="/company" className="text-sky-700 underline-offset-2 hover:underline">
                        詳細を編集 →
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function WidgetMail({
  companies,
  selectedCompanyName,
  setSelectedCompanyName,
  emailText,
  setEmailText,
  parsed,
  setParsed,
  onParse,
  onApply,
  msg,
  setMsg,
}: {
  companies: Company[];
  selectedCompanyName: string;
  setSelectedCompanyName: (v: string) => void;
  emailText: string;
  setEmailText: (v: string) => void;
  parsed: Parsed | null;
  setParsed: (v: Parsed | null) => void;
  onParse: () => void;
  onApply: () => void;
  msg: string;
  setMsg: (v: string) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-800">メール取り込み</h3>
        <div className="flex items-center gap-2">
          <select
            className="rounded border p-2 text-sm"
            value={selectedCompanyName}
            onChange={(e) => setSelectedCompanyName(e.target.value)}
          >
            <option value="">— 反映先の企業を選択 —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <Link
            href="/company"
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            title="反映先の企業が無ければ登録してください"
          >
            企業を登録
          </Link>
        </div>
      </div>

      <div className="grid gap-3">
        <textarea
          className="min-h-[140px] w-full rounded-xl border border-slate-200 p-3"
          placeholder="企業からのメール本文を貼り付け"
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            onClick={onParse}
            className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            解析する
          </button>
          <button
            onClick={onApply}
            disabled={!parsed || !selectedCompanyName}
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            反映する
          </button>
          <button
            onClick={() => {
              setParsed(null);
              setEmailText("");
              setMsg("");
            }}
            className="rounded border px-4 py-2 text-sm hover:bg-slate-50"
          >
            クリア
          </button>
        </div>

        <div className="grid gap-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
          <div>
            <span className="inline-block w-28 text-slate-500">イベント</span>
            <span>{parsed?.event || "—"}</span>
          </div>
          <div>
            <span className="inline-block w-28 text-slate-500">日時</span>
            <span>{parsed?.date || "—"}</span>
          </div>
          <div>
            <span className="inline-block w-28 text-slate-500">場所/形式</span>
            <span>{parsed?.location || "—"}</span>
          </div>
        </div>

        {msg && <p className="text-sm text-slate-700">{msg}</p>}
      </div>
    </section>
  );
}

/* ───────── 小コンポーネント ───────── */
function IconButton({
  children,
  title,
  href,
  selected,
  disabled = false,
}: {
  children: React.ReactNode;
  title: string;
  href?: string;          // 追加: 遷移先
  selected?: boolean;
  disabled?: boolean;
}) {
  const pathname = usePathname();
  const isActive = selected ?? (href ? pathname === href : false);

  const base =
    `grid place-items-center rounded-xl p-2 transition ` +
    (isActive ? "bg-white/15 ring-1 ring-white/30" : "hover:bg-white/10") +
    (disabled ? " opacity-60 cursor-not-allowed" : "");

  // href があれば Link、なければ普通のボタン
  if (href && !disabled) {
    return (
      <Link href={href} title={title} aria-label={title} className={base}>
        <div className="h-6 w-6">{children}</div>
      </Link>
    );
  }
  return (
    <button title={title} aria-label={title} className={base} disabled={disabled}>
      <div className="h-6 w-6">{children}</div>
    </button>
  );
}

function TopIcon({ children }: { children: React.ReactNode }) {
  return (
    <button className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50">
      <div className="h-5 w-5">{children}</div>
    </button>
  );
}
function CardRow({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-[13px] font-semibold text-slate-700">{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

/* ───────── SVG ───────── */
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="opacity-90">
      <path d="M12 3 3 12h2v8h6v-5h2v5h6v-8h2z" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="opacity-90">
      <path d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2zM3 10h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}
function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="opacity-90">
      <path d="M3 21V7l9-4 9 4v14h-7v-5H10v5zM5 9h4v3H5zm0 5h4v3H5zm6-5h4v3h-4zm0 5h4v3h-4z" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="opacity-90">
      <path d="M12 8a4 4 0 100 8 4 4 0 000-8zm8.94 3a7.94 7.94 0 0 0-.39-1l2.05-1.59-2-3.46-2.45 1a7.94 7.94 0 0 0-1.73-1L16.5 1h-4l-.42 2.95a7.94 7.94 0 0 0-1.73-1l-2.45-1-2 3.46L5.95 10a7.94 7.94 0 0 0 0 2l-2.05 1.59 2 3.46 2.45-1a7.94 7.94 0 0 0 1.73 1L12.5 23h4l.42-2.95a7.94 7.94 0 0 0 1.73-1l2.45 1 2-3.46L20.95 12a7.94 7.94 0 0 0-.01-1z" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="opacity-90">
      <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm-7 9a7 7 0 0 1 14 0v1H5z" />
    </svg>
  );
}
function HeadsetIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 3a7 7 0 0 0-7 7v5a3 3 0 0 0 3 3h1v-6H6v-2a6 6 0 1 1 12 0v2h-3v6h1a3 3 0 0 0 3-3v-5a7 7 0 0 0-7-7z" />
    </svg>
  );
}
function GripIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor">
      <path d="M7 4h2v2H7V4zm4 0h2v2h-2V4zM7 9h2v2H7V9zm4 0h2v2h-2V9zM7 14h2v2H7v-2zm4 0h2v2h-2v-2z" />
    </svg>
  );
}
function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9z" />
    </svg>
  );
}
/* ───────── 選考ロードマップ（歩くキャラ付き：全期間表示 & 正確位置） ───────── */
function WidgetRoadmap() {
  const today = useTodayDate();

  // 3年の4/1 を起点、4年の10/31 を終点とする（19ヶ月）
  const start = getAcademicStart(today); // 3年4/1
  const end = new Date(start.getFullYear() + 1, 9, 31, 23, 59, 59, 999);

  // 月数（両端含む）
  const totalMonths = diffMonthsInclusive(start, end);

  // 「今の月の中での進捗」も加味して、より正確に位置決め
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthsBefore = Math.max(0, diffMonthsInclusive(start, monthStart) - 1);
  const daysInThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const fractionInMonth = daysInThisMonth > 1 ? (today.getDate() - 1) / (daysInThisMonth - 1) : 0;
  const ratio = clamp((monthsBefore + fractionInMonth) / (totalMonths - 1), 0, 1); // 0〜1

  // ラベル（4月〜翌年10月）
  const monthLabels = Array.from({ length: totalMonths }, (_, i) => {
    const d = addMonths(start, i);
    const m = d.getMonth() + 1;
    return `${m}月`;
  });

  // フェーズ帯（目安）
  const bands: { label: string; from: number; to: number; cls: string }[] = [
    { label: "自己分析",                 from: 0,  to: 11, cls: "bg-blue-700" },
    { label: "業界・企業・職種研究",     from: 0,  to: 8,  cls: "bg-blue-600" },
    { label: "サマー（インターン等）",   from: 3,  to: 5,  cls: "bg-sky-600" },
    { label: "ウィンター（インターン等）", from: 8,  to: 10, cls: "bg-sky-600" },
    { label: "採用情報公開・エントリー", from: 11, to: 13, cls: "bg-amber-600" },
    { label: "ES・筆記試験・面接",       from: 14, to: 17, cls: "bg-indigo-600" },
    { label: "内々定",                   from: 17, to: 18, cls: "bg-emerald-600" },
  ];

  // Hydration差異を避ける：マーカー表示はクライアントマウント後に
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => setIsHydrated(true), []);

  return (
    <section>
      <h3 className="mb-3 text-base font-bold text-slate-800">選考ロードマップ</h3>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-hidden">

        {/* スクロールは無し。全期間が常に表示されるように幅は親幅100% */}
        <div className="relative">
          <div className="relative w-full pt-20 md:pt-24">

            {/* 月グリッド：全期間が常に1画面に収まる */}
            <div
              className="relative grid w-full grid-cols-[repeat(var(--cols),minmax(0,1fr))] gap-0"
              style={{ ["--cols" as any]: totalMonths }}
            >
              {monthLabels.map((m, i) => (
                <div key={i} className="relative h-24 border-l border-slate-200/70">
                  <div className="absolute top-0 -translate-y-full text-[11px] text-slate-600">{m}</div>

                  {/* 1月〜12月の月頭に印（上に小さく）※ 4月始まりなので 9, 21 が1, 12月付近 */}
                  {/* ここでは各月に小目盛り、特定月に太字なども可能 */}
                </div>
              ))}
              <div className="absolute inset-y-0 right-0 w-px bg-slate-200/70" />
            </div>

            {/* フェーズ帯（absoluteで重ねる） */}
            <div className="relative -mt-14 space-y-2">
              {bands.map((b, idx) => (
                <div
                  key={idx}
                  className={`h-6 rounded-full text-[11px] font-medium text-white ${b.cls} ring-1 ring-black/5`}
                  style={{
                    position: "absolute",
                    left: `${(b.from / (totalMonths - 1)) * 100}%`,
                    width: `${((b.to - b.from + 1) / (totalMonths - 1)) * 100}%`,
                  }}
                >
                  <div className="px-2 leading-6">{b.label}</div>
                </div>
              ))}
            </div>

            {/* マイルストーンの縦線（例） */}
            {[
              { i: 11, label: "3月：情報公開/エントリー開始" },
              { i: 14, label: "6月：本選考スタート" },
            ].map((m) => (
              <div
                key={m.i}
                className="pointer-events-none absolute inset-y-0"
                style={{ left: `${(m.i / (totalMonths - 1)) * 100}%` }}
              >
                <div className="today-line" />
                <div className="absolute top-0 -translate-y-full -translate-x-1/2 z-10 whitespace-nowrap rounded bg-white px-1.5 py-0.5 text-[10px] text-slate-600 ring-1 ring-slate-200 shadow-sm">
                 {m.label}
                   </div>

              </div>
            ))}

            {/* 今日ライン & マスコット（クライアントマウント後に表示） */}
            {isHydrated && (
              <div
                className="pointer-events-none absolute inset-y-0 z-20"
                style={{ left: `${ratio * 100}%` }}
              >
                <div className="today-line" />
                <div className="mascot-wrapper">
                  <div className="mascot-badge mascot-bob">
                    <img
                      src="/mascot.png"
                      alt="進捗マスコット"
                      className="mascot-img"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/favicon.ico";
                      }}
                    />
                  </div>
                  <div className="mt-1 text-center text-[10px] text-slate-600">きょう</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 今月のフォーカス（簡易ToDo） */}
        <RoadmapTips start={start} totalMonths={totalMonths} />
      </div>

      {/* ローカルCSS（ライン太め、マスコット見やすく） */}
      <style jsx>{`
        .today-line {
          width: 3px;
          height: 100%;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(15, 23, 42, 0.28) 10%,
            rgba(15, 23, 42, 0.28) 90%,
            transparent 100%
          );
        }
        .mascot-wrapper {
          position: absolute;
          bottom: 5.7rem;
          transform: translateX(-50%);
          display: grid;
          justify-items: center;
        }
        .mascot-badge {
          width: 100px;
          height: 100px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.98);
          padding: 10px;
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
          border: 2px solid rgba(15, 23, 42, 0.06);
        }
        @media (max-width: 480px) {
          .mascot-badge { width: 84px; height: 84px; padding: 8px; }
        }
        .mascot-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        @keyframes bob {
          0% { transform: translateX(-50%) translateY(0); }
          100% { transform: translateX(-50%) translateY(-8px); }
        }
        .mascot-bob { animation: bob 1.6s ease-in-out infinite alternate; }
      `}</style>
    </section>
  );
}

/* 今月のフォーカス（tipsForMonth を利用） */
function RoadmapTips({ start, totalMonths }: { start: Date; totalMonths: number }) {
  const today = useTodayDate();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const idx = clampInt(diffMonthsInclusive(start, monthStart) - 1, 0, totalMonths - 1);
  const tips = tipsForMonth(idx);
  return (
    <div className="mt-6 rounded-xl bg-[#f6fbff] p-3 ring-1 ring-slate-200/60">
      <div className="mb-1 text-sm font-semibold text-slate-800">今月のフォーカス</div>
      <ul className="list-disc pl-5 text-sm text-slate-800">
        {tips.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </div>
  );
}


/* 画像が無い場合の簡易フォールバックSVG */
function MascotSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="16" fill="#60a5fa" />
      <circle cx="24" cy="28" r="3" fill="#fff" />
      <circle cx="40" cy="28" r="3" fill="#fff" />
      <path d="M24 40c4 4 12 4 16 0" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M16 36c-2 0-6 4-6 8 0 2 2 4 4 4h8" fill="#93c5fd" />
      <path d="M48 36c2 0 6 4 6 8 0 2-2 4-4 4h-8" fill="#93c5fd" />
    </svg>
  );
}


/* ===== ヘルパー群（WidgetRoadmap専用） ===== */
function getAcademicStart(d: Date) {
  // 3年の4/1を返す（4〜12月は当年、1〜3月は前年）
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return new Date(y, 3, 1);
}
function addMonths(base: Date, months: number) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}
function diffMonthsInclusive(a: Date, b: Date) {
  // aの月もbの月も数える（例：4月〜5月→2）
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1;
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(n)));
}

// 今月のおすすめタスク（要約版）
function tipsForMonth(idx: number): string[] {
  // 0=3年4月, ... 11=3年3月, 12=4年4月, 14=4年6月, 18=4年10月
  if (idx <= 2) {
    return [
      "自己分析を開始：強み・価値観・将来像を言語化",
      "業界/職種/企業研究のインプットを並行開始",
      "夏インターンを見据えてES・適性検査の準備着手",
    ];
  } else if (idx <= 5) {
    return [
      "サマー期：インターン応募・参加、振り返りで自己分析を更新",
      "志望業界の“就活の軸”をブラッシュアップ",
      "適性検査の演習を習慣化（SPI/玉手箱 など）",
    ];
  } else if (idx <= 10) {
    return [
      "オータム/ウィンター期：追加インターンやOBOG訪問を実施",
      "ES・履歴書のたたき台を完成／添削→更新ループ",
      "面接/グループディスカッションの練習を開始",
    ];
  } else if (idx === 11) {
    return [
      "採用情報公開：本選考エントリー・企業説明会に参加",
      "募集要項と締切をダッシュボードで一元管理",
      "志望動機を企業ごとに具体化（研究内容と接続）",
    ];
  } else if (idx <= 13) {
    return [
      "会社説明会を活用し質問を準備→熱意を可視化",
      "ES提出のスケジュール逆算（締切・必要書類を確認）",
      "OBOG訪問の実施・記録（学び→志望理由へ反映）",
    ];
  } else if (idx <= 17) {
    return [
      "筆記試験・面接の本番期：過去問/模擬面接でPDCA",
      "面接ログを残し改善点を次回までに反映",
      "複数社のフロー進捗と提出物を確実にトラッキング",
    ];
  } else {
    return [
      "内々定期：比較軸で意思決定、入社後の学習計画を設計",
      "残り選考があれば最後まで丁寧に対応",
      "お礼連絡・入社前準備（必要書類/研修情報）",
    ];
  }
}

function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18a2 2 0 002-2V8a2 2 0 00-2-2H3a2 2 0 00-2 2v6a2 2 0 002 2z"
      />
    </svg>
  );
}
