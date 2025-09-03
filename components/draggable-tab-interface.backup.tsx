"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/*  最小UI（依存なし）  */
// style / onClick など任意の div 属性を受けられるように
function Card(
  { className = "", ...rest }: React.HTMLAttributes<HTMLDivElement> & { className?: string }
) {
  return (
    <div
      {...rest}
      className={`rounded-xl shadow-lg border border-blue-200/50 ${className}`}
    />
  );
}

// children を任意にし、任意の button 属性（disabled など）も受ける
function Button(
  {
    className = "",
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string; children?: React.ReactNode }
) {
  return (
    <button
      {...props}
      className={
        "px-3 py-2 text-sm rounded-lg border bg-white/80 hover:bg-white/90 backdrop-blur-sm transition " +
        className
      }
    >
      {children}
    </button>
  );
}

function CheckboxBase({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <input
      id={id}
      type="checkbox"
      className="h-4 w-4 rounded border border-blue-400 accent-blue-600"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 outline-none " +
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
        "w-full min-h-28 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 outline-none " +
        (props.className ?? "")
      }
    />
  );
}

/*  型 & ストレージ  */
type ESDraft = {
  selfPR?: string;
  studentLife?: string;
  motivation?: string;
  strengths?: string;
  weaknesses?: string;
  free?: string;
};
type CompanyAnalysis = {
  revenue?: string;
  employees?: string;
  capital?: string;
  philosophy?: string;
  products?: string;
  business?: string;
  social?: string;
  history?: string;
  dutiesByDept?: string;
  careerPlan?: string;
  culture?: string;
  strengthsVsCompetitors?: string;
  focusAndVision?: string;
  managementPlanGrowth?: string;
  hiringCount?: string;
  salary?: string;
  benefits?: string;
  avgTenure?: string;
  overtime?: string;
  cmChecked?: string;
};
type Company = {
  id: string;
  name: string;
  industry?: string;
  status?: string;
  flowDeadline?: string;
  locationHint?: string;
  interviewFlow?: string;
  testFormat?: string;
  nextAction?: string;
  notes?: string;
  updatedAt: string;
  es?: ESDraft;
  analysis?: CompanyAnalysis;
};

const STORAGE_KEY = "jp.jobhunt.companies";

function loadAll(): Company[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Company[]) : [];
  } catch {
    return [];
  }
}
function saveAll(items: Company[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
function upsertCompany(input: Company): Company {
  const all = loadAll();
  const idx = all.findIndex((c) => c.id === input.id);
  const now = new Date().toISOString();
  const next = { ...input, updatedAt: now };
  if (idx >= 0) all[idx] = next;
  else all.push(next);
  saveAll(all);
  return next;
}

/*  v0 風タブ  */
type Tab = { id: "es" | "info" | "analysis"; titleJP: string; color: string };
const tabs: Tab[] = [
  { id: "es", titleJP: "ES", color: "bg-blue-500" },
  { id: "info", titleJP: "企業情報", color: "bg-green-500" },
  { id: "analysis", titleJP: "企業分析", color: "bg-purple-500" },
];

export function DraggableTabInterface() {
  /* 企業データ */
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  /* 画面モード */
  const [activeTab, setActiveTab] = useState(1); // 0,1,2
  const [selectedTabs, setSelectedTabs] = useState<string[]>(["info"]);
  const [viewMode, setViewMode] = useState<"carousel" | "fullscreen">("carousel");

  /* 分割ハンドル用 */
  const [splitRatio, setSplitRatio] = useState(50);
  const [threeScreenRatios, setThreeScreenRatios] = useState([33.33, 33.33, 33.34]);

  /* スワイプ */
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  /* 初期ロード */
  useEffect(() => {
    const all = loadAll();
    setCompanies(all);
    if (all[0]) setSelectedCompanyId(all[0].id);
  }, []);

  const current = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId]
  );

  /* 会社の追加 */
  function createCompanyByName(name: string) {
    const id = (globalThis.crypto as any)?.randomUUID?.() ?? String(Date.now());
    const base: Company = {
      id,
      name: name.trim(),
      updatedAt: new Date().toISOString(),
      es: {},
      analysis: {},
    };
    const saved = upsertCompany(base);
    setCompanies(loadAll());
    setSelectedCompanyId(saved.id);
  }

  /* 値変更（current を編集  保存デバウンス） */
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function patch(path: string, value: string) {
    setCompanies((prev) => {
      const idx = prev.findIndex((c) => c.id === selectedCompanyId);
      if (idx < 0) return prev;
      const next = structuredClone(prev) as Company[];
      const target: any = next[idx];
      const seg = path.split(".");
      let cur = target;
      for (let i = 0; i < seg.length - 1; i++) cur[seg[i]] ??= {};
      cur[seg.at(-1)!] = value;
      target.updatedAt = new Date().toISOString();
      return next;
    });

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const latestIdx = companies.findIndex((c) => c.id === selectedCompanyId);
      if (latestIdx >= 0) {
        upsertCompany(companies[latestIdx]);
        setCompanies(loadAll());
      }
    }, 500);
  }

  /* タブ選択 */
  const handleTabSelect = (tabId: string, checked: boolean) => {
    if (checked) setSelectedTabs((prev) => Array.from(new Set([...prev, tabId])));
    else setSelectedTabs((prev) => prev.filter((id) => id !== tabId));
  };

  /* スワイプ */
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX.current;
    const threshold = 100;
    if (deltaX > threshold && activeTab > 0) {
      setActiveTab((v) => v - 1);
      dragStartX.current = e.clientX;
    } else if (deltaX < -threshold && activeTab < 2) {
      setActiveTab((v) => v + 1);
      dragStartX.current = e.clientX;
    }
  };
  const handleMouseUp = () => setIsDragging(false);

  /* 分割バー */
  const handleSplitResize = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startRatio = splitRatio;
    const move = (ev: MouseEvent) => {
      const box = containerRef.current;
      if (!box) return;
      const w = box.offsetWidth;
      const delta = ((ev.clientX - startX) / w) * 100;
      setSplitRatio(Math.max(20, Math.min(80, startRatio + delta)));
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };
  const handleThreeScreenResize = (i: number, e: React.MouseEvent) => {
    const startX = e.clientX;
    const start = [...threeScreenRatios];
    const move = (ev: MouseEvent) => {
      const box = containerRef.current;
      if (!box) return;
      const w = box.offsetWidth;
      const delta = ((ev.clientX - startX) / w) * 100;
      const next = [...start];
      if (i === 0) {
        next[0] = Math.max(15, Math.min(70, start[0] + delta));
        next[1] = Math.max(15, Math.min(70, start[1] - delta));
      } else {
        next[1] = Math.max(15, Math.min(70, start[1] + delta));
        next[2] = Math.max(15, Math.min(70, start[2] - delta));
      }
      setThreeScreenRatios(next);
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };

  const navigateLeft = () => activeTab > 0 && setActiveTab((v) => v - 1);
  const navigateRight = () => activeTab < 2 && setActiveTab((v) => v + 1);

  /* カード位置 */
  const getTabTransform = (index: number) => {
    const offset = (index - activeTab) * 300;
    const scale = index === activeTab ? 1 : 0.85;
    const zIndex = index === activeTab ? 10 : 5;
    return { transform: `translateX(${offset}px) scale(${scale})`, zIndex, opacity: Math.abs(index - activeTab) > 1 ? 0.3 : 1 };
  };

  /* 小物 */
  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <label className="grid gap-1">
        <span className="text-xs font-semibold text-white/90">{label}</span>
        {children}
      </label>
    );
  }
  function FormEmptyHint() {
    return <div className="text-sm text-white/90">上の「企業を選択」または「新規作成」を行ってください。</div>;
  }

  /* フォーム */
  function EsForm() {
    if (!current) return <FormEmptyHint />;
    return (
      <div className="grid gap-3">
        <Field label="自己PR"><Textarea value={current.es?.selfPR ?? ""} onChange={(e) => patch("es.selfPR", e.target.value)} /></Field>
        <Field label="学生時代に力を入れたこと（ガクチカ）"><Textarea value={current.es?.studentLife ?? ""} onChange={(e) => patch("es.studentLife", e.target.value)} /></Field>
        <Field label="志望動機"><Textarea value={current.es?.motivation ?? ""} onChange={(e) => patch("es.motivation", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="強み"><Textarea value={current.es?.strengths ?? ""} onChange={(e) => patch("es.strengths", e.target.value)} /></Field>
          <Field label="弱み"><Textarea value={current.es?.weaknesses ?? ""} onChange={(e) => patch("es.weaknesses", e.target.value)} /></Field>
        </div>
        <Field label="自由記述"><Textarea value={current.es?.free ?? ""} onChange={(e) => patch("es.free", e.target.value)} /></Field>
      </div>
    );
  }
  function InfoForm() {
    if (!current) return <FormEmptyHint />;
    return (
      <div className="grid gap-3">
        <Field label="企業名"><Input value={current.name} onChange={(e) => patch("name", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="業種"><Input value={current.industry ?? ""} onChange={(e) => patch("industry", e.target.value)} /></Field>
          <Field label="現ステータス"><Input value={current.status ?? ""} onChange={(e) => patch("status", e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="次回日時（YYYY-MM-DD HH:mm）"><Input value={current.flowDeadline ?? ""} onChange={(e) => patch("flowDeadline", e.target.value)} /></Field>
          <Field label="場所/形式"><Input value={current.locationHint ?? ""} onChange={(e) => patch("locationHint", e.target.value)} /></Field>
        </div>
        <Field label="選考フロー（例：書類一次面接最終面接）"><Textarea value={current.interviewFlow ?? ""} onChange={(e) => patch("interviewFlow", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="筆記/適性（テスト形式）"><Input value={current.testFormat ?? ""} onChange={(e) => patch("testFormat", e.target.value)} /></Field>
          <Field label="次アクション"><Input value={current.nextAction ?? ""} onChange={(e) => patch("nextAction", e.target.value)} /></Field>
        </div>
        <Field label="メモ"><Textarea value={current.notes ?? ""} onChange={(e) => patch("notes", e.target.value)} /></Field>
      </div>
    );
  }
  function AnalysisForm() {
    if (!current) return <FormEmptyHint />;
    return (
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="売上"><Input value={current.analysis?.revenue ?? ""} onChange={(e) => patch("analysis.revenue", e.target.value)} /></Field>
          <Field label="従業員数"><Input value={current.analysis?.employees ?? ""} onChange={(e) => patch("analysis.employees", e.target.value)} /></Field>
          <Field label="資本金"><Input value={current.analysis?.capital ?? ""} onChange={(e) => patch("analysis.capital", e.target.value)} /></Field>
          <Field label="採用人数"><Input value={current.analysis?.hiringCount ?? ""} onChange={(e) => patch("analysis.hiringCount", e.target.value)} /></Field>
        </div>
        <Field label="企業理念"><Textarea value={current.analysis?.philosophy ?? ""} onChange={(e) => patch("analysis.philosophy", e.target.value)} /></Field>
        <Field label="製品サービス（顧客理解）"><Textarea value={current.analysis?.products ?? ""} onChange={(e) => patch("analysis.products", e.target.value)} /></Field>
        <Field label="事業内容（業種カテゴライズ）"><Textarea value={current.analysis?.business ?? ""} onChange={(e) => patch("analysis.business", e.target.value)} /></Field>
        <Field label="会社の経歴"><Textarea value={current.analysis?.history ?? ""} onChange={(e) => patch("analysis.history", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="社風"><Textarea value={current.analysis?.culture ?? ""} onChange={(e) => patch("analysis.culture", e.target.value)} /></Field>
          <Field label="福利厚生"><Textarea value={current.analysis?.benefits ?? ""} onChange={(e) => patch("analysis.benefits", e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="年収"><Input value={current.analysis?.salary ?? ""} onChange={(e) => patch("analysis.salary", e.target.value)} /></Field>
          <Field label="平均勤続年数"><Input value={current.analysis?.avgTenure ?? ""} onChange={(e) => patch("analysis.avgTenure", e.target.value)} /></Field>
          <Field label="残業時間"><Input value={current.analysis?.overtime ?? ""} onChange={(e) => patch("analysis.overtime", e.target.value)} /></Field>
        </div>
        <Field label="競合と比較した強み"><Textarea value={current.analysis?.strengthsVsCompetitors ?? ""} onChange={(e) => patch("analysis.strengthsVsCompetitors", e.target.value)} /></Field>
        <Field label="注力領域"><Textarea value={current.analysis?.business ?? ""} onChange={(e) => patch("analysis.business", e.target.value)} /></Field>
        <Field label="自分のビジョンとの接続"><Textarea value={current.analysis?.focusAndVision ?? ""} onChange={(e) => patch("analysis.focusAndVision", e.target.value)} /></Field>
        <Field label="経営計画成長性"><Textarea value={current.analysis?.managementPlanGrowth ?? ""} onChange={(e) => patch("analysis.managementPlanGrowth", e.target.value)} /></Field>
        <Field label="社会貢献（CSR）"><Textarea value={current.analysis?.social ?? ""} onChange={(e) => patch("analysis.social", e.target.value)} /></Field>
        <Field label="CM確認"><Textarea value={current.analysis?.cmChecked ?? ""} onChange={(e) => patch("analysis.cmChecked", e.target.value)} /></Field>
      </div>
    );
  }

  /* カルーセル（スクショ風） */
  const renderCarouselView = () => (
    <div className="relative h-96 overflow-hidden">
      <div
        className="flex items-center justify-center h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {[EsForm, InfoForm, AnalysisForm].map((FormComp, index) => (
          <Card
            key={tabs[index].id}
            className="absolute w-[28rem] h-[20rem] bg-blue-50/60 backdrop-blur-sm transition-all duration-300 ease-out cursor-pointer"
            style={getTabTransform(index)}
            onClick={() => setActiveTab(index)}
          >
            <div className={`h-full rounded-xl ${tabs[index].color} text-white p-5 flex flex-col`}>
              <div className="text-2xl font-bold mb-3 text-center">{tabs[index].titleJP}</div>
              <div className="flex-1 overflow-auto rounded-md bg-white/12 p-3 backdrop-blur-sm">
                <FormComp />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button
        className="absolute left-4 top-1/2 -translate-y-1/2"
        onClick={navigateLeft}
        disabled={activeTab === 0}
      >
        
      </Button>
      <Button
        className="absolute right-4 top-1/2 -translate-y-1/2"
        onClick={navigateRight}
        disabled={activeTab === 2}
      >
        
      </Button>

      {/* ドット */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${i === activeTab ? "bg-white" : "bg-white/50"}`}
            onClick={() => setActiveTab(i)}
          />
        ))}
      </div>
    </div>
  );

  /* 全画面（1〜3パネル分割） */
  const selectedTabData = tabs.filter((t) => selectedTabs.includes(t.id));
  const renderFullscreenView = () => {
    const panels = { es: <EsForm />, info: <InfoForm />, analysis: <AnalysisForm /> } as const;

    if (selectedTabData.length === 1) {
      const t = selectedTabData[0];
      return (
        <div className="fixed inset-0 z-50">
          <div className={`h-full ${t.color} text-white p-8 flex flex-col`}>
            <div className="text-5xl font-bold mb-6 text-center">{t.titleJP}</div>
            <div className="flex-1 max-w-5xl mx-auto w-full overflow-auto rounded-xl bg-white/10 p-6 backdrop-blur-sm">
              {panels[t.id]}
            </div>
          </div>
        </div>
      );
    }

    if (selectedTabData.length === 2) {
      const [a, b] = selectedTabData;
      return (
        <div ref={containerRef} className="fixed inset-0 z-50 flex">
          <div className="h-full transition-all duration-200" style={{ width: `${splitRatio}%` }}>
            <div className={`h-full ${a.color} text-white p-6 flex flex-col`}>
              <div className="text-3xl font-bold mb-4 text-center">{a.titleJP}</div>
              <div className="flex-1 overflow-auto rounded-xl bg-white/10 p-4 backdrop-blur-sm">{panels[a.id]}</div>
            </div>
          </div>
          <div className="w-2 bg-white/30 cursor-col-resize hover:bg-white/50 transition-colors" onMouseDown={handleSplitResize} />
          <div className="h-full transition-all duration-200" style={{ width: `${100 - splitRatio}%` }}>
            <div className={`h-full ${b.color} text-white p-6 flex flex-col`}>
              <div className="text-3xl font-bold mb-4 text-center">{b.titleJP}</div>
              <div className="flex-1 overflow-auto rounded-xl bg-white/10 p-4 backdrop-blur-sm">{panels[b.id]}</div>
            </div>
          </div>
        </div>
      );
    }

    if (selectedTabData.length === 3) {
      const [a, b, c] = selectedTabData;
      return (
        <div ref={containerRef} className="fixed inset-0 z-50 flex">
          {[a, b, c].map((t, i) => (
            <div key={t.id} className="h-full transition-all duration-200" style={{ width: `${threeScreenRatios[i]}%` }}>
              <div className={`h-full ${t.color} text-white p-5 flex flex-col`}>
                <div className="text-2xl font-bold mb-3 text-center">{t.titleJP}</div>
                <div className="flex-1 overflow-auto rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                  {(t.id === "es" && <EsForm />) || (t.id === "info" && <InfoForm />) || <AnalysisForm />}
                </div>
              </div>
            </div>
          ))}
          <div className="w-2 bg-white/30 cursor-col-resize hover:bg-white/50 transition-colors" onMouseDown={(e) => handleThreeScreenResize(0, e)} />
          <div className="w-2 bg-white/30 cursor-col-resize hover:bg-white/50 transition-colors" onMouseDown={(e) => handleThreeScreenResize(1, e)} />
        </div>
      );
    }

    return (
      <div className="h-96 flex items-center justify-center">
        <p className="text-gray-100">上のチェックで表示タブを選んでください</p>
      </div>
    );
  };

  /*  画面  */
  if (viewMode === "fullscreen" && selectedTabs.length > 0) {
    return (
      <>
        {renderFullscreenView()}
        <Button className="fixed top-4 right-4 z-[60]" onClick={() => setViewMode("carousel")}></Button>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Draggable Tab Interface</h1>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setViewMode("carousel")}>Carousel</Button>
            <Button onClick={() => setViewMode("fullscreen")}>Fullscreen</Button>
          </div>
        </div>

        {/* 企業選択／新規 */}
        <Card className="p-4 bg-blue-50/60 backdrop-blur-sm">
          <div className="grid gap-3 md:grid-cols-[minmax(220px,280px),1fr,auto] md:items-end">
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-1">企業を選択</div>
              <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white/70" value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value)}>
                {companies.length === 0 && <option value="">（未登録）</option>}
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-1">新規作成（社名を入力して Enter）</div>
              <Input placeholder="例：ABC株式会社" onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = (e.currentTarget.value || "").trim();
                  if (!v) return;
                  createCompanyByName(v);
                  e.currentTarget.value = "";
                }
              }} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => {
                const cur = companies.find((c) => c.id === selectedCompanyId);
                if (cur) { upsertCompany(cur); setCompanies(loadAll()); }
              }}>保存</Button>
            </div>
          </div>
        </Card>

        {/* タブ選択 */}
        <Card className="p-4 bg-blue-50/60 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">表示するタブ</h3>
          <div className="flex space-x-6">
            {tabs.map((tab) => (
              <div key={tab.id} className="flex items-center space-x-2">
                <CheckboxBase id={tab.id} checked={selectedTabs.includes(tab.id)} onChange={(checked) => handleTabSelect(tab.id, checked)} />
                <label htmlFor={tab.id} className="text-sm font-medium cursor-pointer text-gray-700">{tab.titleJP}</label>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Selected: {selectedTabs.length} tab(s) 
            {selectedTabs.length === 1 && " Single view"}
            {selectedTabs.length === 2 && " Split view (resizable)"}
            {selectedTabs.length === 3 && " Triple view (resizable)"}
          </p>
        </Card>

        {/* メイン（カルーセル） */}
        <Card className="p-6 bg-blue-50/60 backdrop-blur-sm">{renderCarouselView()}</Card>

        {/* 使い方 */}
        <Card className="p-4 bg-blue-50/40 backdrop-blur-sm">
          <h4 className="font-semibold mb-2 text-gray-800">How to use:</h4>
          <ul className="text-sm space-y-1 text-gray-700">
            <li> Carousel: クリック/ドラッグ/矢印/ドットで切替</li>
            <li> Fullscreen: 上のチェックで 1〜3 タブを全画面表示（分割リサイズ可）</li>
            <li> 入力は 0.5 秒デバウンスで自動保存（手動保存ボタンも可）</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
