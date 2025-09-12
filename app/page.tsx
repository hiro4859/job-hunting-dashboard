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
import type { CSSProperties } from "react";

// ===== v0.dev UIと追加UIのためのインポート（追加のみ。既存importは削除していません） =====

import { CompanySearchBar } from "@/components/app/company-search-bar";
import { CompanyCard } from "@/components/app/company-card";
import { SortAndFilterBar } from "@/components/app/sort-and-filter-bar";
import { WeekCalendar } from "@/components/app/week-calendar";
import { HomeButton } from "@/components/app/home-button";

// CSS 変数を安全に載せる型
type CSSVars = CSSProperties & { [key: `--${string}`]: string | number };

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
    nextMidnight.setHours(24, 0, 0, 0);
    const ms = nextMidnight.getTime() - now.getTime();
    const timer = window.setTimeout(() => setToday(new Date()), ms);
    return () => clearTimeout(timer);
  }, [today]);
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
  const m = s?.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
}
function pad2(n: number) {
  return n.toString().padStart(2, "0");
}
function formatHM(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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

  // ===== v0 風 UI 用のローカルUI状態（既存ロジックには影響しません） =====
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"created" | "deadline">("deadline");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [calendarStartDate, setCalendarStartDate] = useState(new Date());

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

  useMemo(() => companies.find((c) => c.name === selectedCompanyName), [companies, selectedCompanyName]);

  const reloadCompanies = () => setCompanies(listCompanies());

  /* ───────── メール解析フロー（既存） ───────── */
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
        setParsed({ event: data.event, date: data.date, location: data.location });
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
      setMsg(`${result.targetName ?? ""} に反映しました。${fields ? `（更新: ${fields}）` : ""}`);
    } else if (result.action === "no_change") {
      setMsg(`${result.targetName ?? ""} は更新ありませんでした。`);
    } else if (result.action === "skipped_no_company") {
      setMsg("企業名が未指定のため反映をスキップしました。");
    }
  }

  /* ───────── DnD：ドラッグ＆ドロップ（既存） ───────── */
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

  // ===== v0 CompanyCard 用に、既存 Company を“見た目”用途へ最小変換（ロジック非変更）=====
  function toV0CompanyShape(c: Company): any {
    return {
      id: String(c.id ?? c.name ?? Math.random()),
      name: c.name,
      industry: (c as any).industry ?? undefined, // 既存に業界が無ければ未設定でOK（見た目のみ）
      status: c.status ?? undefined,
      priority: (c as any).priority ?? undefined,
      deadline: c.flowDeadline?.split(" ")[0] ?? undefined, // v0は日付のみ想定。既存は "YYYY-MM-DD HH:mm"
      logoSrc: (c as any).logoSrc ?? undefined,
    };
  }

  // v0 の検索/業界フィルタ/並び替え（UI用途のみ・既存データに対する非破壊）
  const filteredCompaniesV0 = useMemo(() => {
    const v0list = companies.map(toV0CompanyShape);
    const matches = v0list.filter((company: any) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (company.name ?? "").toLowerCase().includes(q) ||
        (company.industry ?? "").toLowerCase().includes(q);
      const matchesIndustry =
        selectedIndustries.length === 0 || (company.industry && selectedIndustries.includes(company.industry));
      return matchesSearch && matchesIndustry;
    });
    const sorted = [...matches].sort((a: any, b: any) => {
      if (sortBy === "deadline") {
        const ad = new Date(a.deadline ?? "9999-12-31").getTime();
        const bd = new Date(b.deadline ?? "9999-12-31").getTime();
        return ad - bd;
      }
      // "created"想定 → 名前順で代替（見た目目的）
      return String(a.name ?? "").localeCompare(String(b.name ?? ""));
    });
    return sorted;
  }, [companies, searchQuery, selectedIndustries, sortBy]);

  // WeekCalendar 用の簡易イベント（既存データから可視化のみ作成／既存ロジックへ影響なし）
  const calendarEvents = useMemo(
    () =>
      companies
        .map((c) => {
          if (!c.flowDeadline) return null;
          const dateOnly = c.flowDeadline.split(" ")[0]; // "YYYY-MM-DD"
          return {
            id: String(c.id ?? c.name),
            title: c.nextAction || c.status || "予定",
            date: dateOnly,
            companyId: String(c.id ?? c.name),
          };
        })
        .filter(Boolean) as any[],
    [companies]
  );

  // v0的ハンドラ（UIのみ）
  const handleSearch = (q: string) => setSearchQuery(q);
  const handleCompanyClick = (_id: string) => {
    // 画面遷移などのロジック追加はしない（見た目のみ）
  };
  const handleIndustryToggle = (industry: string) => {
    setSelectedIndustries((prev) => (prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]));
  };
  const handlePrevWeek = () => {
    setCalendarStartDate((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() - 7);
      return d;
    });
  };
  const handleNextWeek = () => {
    setCalendarStartDate((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() + 7);
      return d;
    });
  };
  const handleEventSelect = (_evt: any) => {
    // 詳細ポップなどの新規ロジックは加えず、UIのみに留める
  };

  //* ───────── レンダリング ───────── */
return (
  <>
    <div className="min-h-screen p-6 pt-4 pb-32 bg-background">
      {/* ヘッダ */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">就活ダッシュボード</h1>
        <HomeButton />
      </div>

      {/* 検索バー */}
      <div className="mb-8">
        <CompanySearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={(q) => setSearchQuery(q)}
          placeholder="企業名・業界・キーワード"
        />
      </div>

      {/* 並び替え/業界フィルタ */}
      <div className="mb-4">
        <SortAndFilterBar
          sort={sortBy}
          onSortChange={setSortBy}
          industries={[]}
          selected={selectedIndustries}
          onToggle={handleIndustryToggle}
        />
      </div>

      {/* カードグリッド */}
      <div className="mb-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompaniesV0.map((c: any) => (
            <CompanyCard key={c.id} company={c} onClick={handleCompanyClick} />
          ))}
        </div>
        {filteredCompaniesV0.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">条件に一致する企業が見つかりませんでした。</p>
          </div>
        )}
      </div>
    </div>

    {/* 固定フッター：週カレンダー */}
    <div className="fixed bottom-0 left-0 right-0 z-30 p-2 bg-background/80 backdrop-blur-sm border-t">
      <div className="max-w-7xl mx-auto">
        <WeekCalendar
          startDate={calendarStartDate}
          events={calendarEvents as any}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onSelectEvent={handleEventSelect}
        />
      </div>
    </div>
  </>
);

}