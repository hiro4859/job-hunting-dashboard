"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Company, AdvancePolicy } from "../utils/companyStore";
import { listCompanies, upsertCompany, removeCompany } from "../utils/companyStore";

/* =========================================================
   レイアウト：3パネル（ES / 企業分析 / 企業情報）
   - ドラックでの並べ替え（HTML5 DnD）
   - 幅リサイズ（両端＆パネル間／掴みハンドルは常時表示＆厚め）
   - 折りたたみ（各タブ右上の「— たたむ」）
   - 2枚/3枚 同時表示OK。たたんだタブは右上の「開く」ボタンで復帰
   - 見た目は既存Glass調を踏襲
   ========================================================= */

type ColId = "es" | "analysis" | "info";
const ALL: ColId[] = ["es", "analysis", "info"];
const spring = { transitionTimingFunction: "cubic-bezier(.22,.68,0,1.12)" } as const;

// 幅の下限/上限（%）
const MIN_W = 20;
const MAX_W = 80;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/* ============ 並び/ドラッグ ============ */
function useColumns(orderInit: ColId[] = ["es", "analysis", "info"]) {
  const [cols, setCols] = useState<ColId[]>(orderInit);
  const [dragId, setDragId] = useState<ColId | null>(null);
  const [pressing, setPressing] = useState<ColId | null>(null);
  const [lastHover, setLastHover] = useState<ColId | null>(null);

  const centerize = (id: ColId) =>
    setCols((prev) => {
      const others = prev.filter((x) => x !== id);
      return [others[0], id, others[1]];
    });

  const onDragStart = (id: ColId) => {
    setDragId(id);
    setLastHover(null);
  };

  const onDragOverPanel =
    (target: ColId): React.DragEventHandler =>
    (e) => {
      e.preventDefault();
      if (!dragId || dragId === target || lastHover === target) return;
      setLastHover(target);
      setCols((prev) => {
        const next = [...prev];
        const from = next.indexOf(dragId);
        const to = next.indexOf(target);
        if (from < 0 || to < 0) return prev;
        next.splice(from, 1);
        next.splice(to, 0, dragId);
        return next;
      });
    };

  const onDrop = () => {
    setDragId(null);
    setLastHover(null);
  };

  return { cols, centerize, onDragStart, onDragOverPanel, onDrop, pressing, setPressing, dragId };
}

/* ============ パネル枠（Glass） ============ */
function PanelShell({
  id,
  title,
  children,
  onCenter,
  onDragStart,
  onDragOver,
  onDrop,
  pressing,
  setPressing,
  isDragging,
  onCollapse,
}: {
  id: ColId;
  title: string;
  children: React.ReactNode;
  onCenter: () => void;
  onDragStart: () => void;
  onDragOver: React.DragEventHandler;
  onDrop: () => void;
  pressing: boolean;
  setPressing: (v: ColId | null) => void;
  isDragging: boolean;
  onCollapse: () => void;
}) {
  return (
    <section
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseDown={() => setPressing(id)}
      onMouseUp={() => setPressing(null)}
      onMouseLeave={() => setPressing(null)}
      className={[
        "relative rounded-2xl border border-white/30 bg-white/30 backdrop-blur-xl",
        "transition-[transform,box-shadow,opacity] duration-500 will-change-transform",
        "ring-1 ring-white/50 shadow-[0_16px_48px_rgba(2,6,23,0.16)]",
        pressing ? "scale-[0.99]" : "scale-100",
        isDragging ? "ring-2 ring-sky-400" : "",
        "p-3",
      ].join(" ")}
      style={spring}
      title="ドラッグで入れ替え / 右上ボタンで中央へ"
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-white/90">{title}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onCenter}
            className="rounded-md bg-white/70 px-2 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-white/60 transition active:scale-95"
            style={spring}
          >
            中央へ
          </button>
          <button
            onClick={onCollapse}
            className="rounded-md bg-white/70 px-2 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-white/60 transition active:scale-95"
            title="パネルをたたむ"
          >
            — たたむ
          </button>
          <span
            className="cursor-grab select-none rounded-md bg-white/60 px-2 py-1 text-[11px] text-slate-700 ring-1 ring-white/70"
            title="ドラッグで移動"
          >
            ⇅
          </span>
        </div>
      </div>
      <div className="rounded-xl bg-white/60 p-3 ring-1 ring-white/50 overflow-auto max-h-[78vh]">
        {children}
      </div>
    </section>
  );
}

/* ============ リサイズ管理 ============ */
function useResizer(initial: Record<ColId, number> = { es: 33, analysis: 34, info: 33 }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sizes, setSizes] = useState<Record<ColId, number>>(initial);
  const [visible, setVisible] = useState<ColId[]>([...ALL]);

  // 折りたたみ/復元
  const collapse = (id: ColId) => setVisible((v) => v.filter((x) => x !== id));
  const expand = (id: ColId) => setVisible((v) => (v.includes(id) ? v : [...v, id]));

  // 2/3枚で合計100%に再配分（たたんだ/復元時）
  useEffect(() => {
    const v = visible;
    if (v.length === 0) return;
    const avg = Math.floor(100 / v.length);
    setSizes((prev) => {
      const next = { ...prev };
      v.forEach((id) => (next[id] = clamp(prev[id] ?? avg, MIN_W, MAX_W)));
      // 非表示分は残す（履歴のため）
      // 合計をざっくり100に寄せる
      const sum = v.reduce((a, b) => a + (next[b] ?? 0), 0);
      v.forEach((id) => (next[id] = Math.round((next[id] / sum) * 100)));
      return next;
    });
  }, [visible.join("|")]);

  // ドラッグで幅調整
  const resizingRef = useRef<{
    a: ColId;
    b: ColId;
    startX: number;
    aW: number;
    bW: number;
  } | null>(null);

  const startResize = (a: ColId, b: ColId, e: React.MouseEvent) => {
    if (!containerRef.current) return;
    resizingRef.current = {
      a,
      b,
      startX: e.clientX,
      aW: sizes[a],
      bW: sizes[b],
    };
    window.addEventListener("mousemove", onMouseMove, { passive: false });
    window.addEventListener("mouseup", onMouseUp, { passive: false });
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!resizingRef.current || !containerRef.current) return;
    e.preventDefault();
    const { a, b, startX, aW, bW } = resizingRef.current;
    const rect = containerRef.current.getBoundingClientRect();
    const dxPx = e.clientX - startX;
    const dxPercent = (dxPx / rect.width) * 100;

    const newA = clamp(aW + dxPercent, MIN_W, MAX_W);
    let newB = clamp(bW - dxPercent, MIN_W, MAX_W);


    // 片側の
    const corr = aW + bW - (newA + newB);
    if (Math.abs(corr) > 0.01) {
      if (corr > 0) {
        // a+b が小さくなりすぎ → b を増やす
        newB = clamp(newB + corr, MIN_W, MAX_W);
      } else {
        // a+b が大きすぎ → b を減らす
        newB = clamp(newB + corr, MIN_W, MAX_W);
      }
    }

    setSizes((prev) => ({ ...prev, [a]: newA, [b]: newB }));
  };

  const onMouseUp = () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    resizingRef.current = null;
  };

  return {
    containerRef,
    sizes,
    visible,
    setVisible,
    collapse,
    expand,
    startResize,
  };
}

/* =========================================================
   ページ本体：ここから下は既存フォーム/状態ロジックをほぼそのまま
   ========================================================= */
export default function CompanyPage() {
  // --- state 群（あなたの既存コードをそのまま踏襲）---
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [name, setName] = useState(""); const [industry, setIndustry] = useState("");
  const [interest, setInterest] = useState(3);
  const [homepageUrl, setHomepageUrl] = useState(""); const [portalId, setPortalId] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [status, setStatus] = useState(""); const [flowDeadline, setFlowDeadline] = useState("");
  const [locationHint, setLocationHint] = useState(""); const [nextAction, setNextAction] = useState("");
  const [notes, setNotes] = useState(""); const [testFormat, setTestFormat] = useState("");
  const [advancePolicy, setAdvancePolicy] = useState<AdvancePolicy>("byDate");
  const [analysis, setAnalysis] = useState({
    revenue:"", employees:"", capital:"", philosophy:"",
    products:"", business:"", social:"", history:"",
    dutiesByDept:"", careerPlan:"", culture:"", strengthsVsCompetitors:"",
    focusAndVision:"", managementPlanGrowth:"",
    hiringCount:"", salary:"", benefits:"", avgTenure:"", overtime:"",
    cmChecked:"",
  });
  const [flowSteps, setFlowSteps] = useState<string[]>([]); const [newStep, setNewStep] = useState<string>("");
  const [message, setMessage] = useState("");
  const [esText, setEsText] = useState("");
  const esKey = (nm: string) => `jp.jobhunt.es.${nm || "unknown"}`;

  useEffect(() => {
    const all = listCompanies(); setCompanies(all);
    if (all.length > 0) setSelectedId(all[0].id);
  }, []);

  useEffect(() => {
    const target = companies.find((c) => c.id === selectedId);
    if (!target) {
      setName(""); setIndustry(""); setInterest(3); setHomepageUrl(""); setPortalId("");
      setPortalPassword(""); setStatus(""); setFlowDeadline(""); setLocationHint(""); setNextAction("");
      setNotes(""); setTestFormat(""); setFlowSteps([]); setAdvancePolicy("byDate");
      setAnalysis({
        revenue:"", employees:"", capital:"", philosophy:"",
        products:"", business:"", social:"", history:"",
        dutiesByDept:"", careerPlan:"", culture:"", strengthsVsCompetitors:"",
        focusAndVision:"", managementPlanGrowth:"",
        hiringCount:"", salary:"", benefits:"", avgTenure:"", overtime:"",
        cmChecked:"",
      });
      setEsText(""); return;
    }
    setName(target.name ?? ""); setIndustry(target.industry ?? ""); setInterest(target.interest ?? 3);
    setHomepageUrl(target.homepageUrl ?? ""); setPortalId(target.portalId ?? ""); setPortalPassword(target.portalPassword ?? "");
    setStatus(target.status ?? ""); setFlowDeadline(target.flowDeadline ?? ""); setLocationHint(target.locationHint ?? "");
    setNextAction(target.nextAction ?? ""); setNotes(target.notes ?? ""); setTestFormat(target.testFormat ?? "");
    setFlowSteps(deserializeFlow(target.interviewFlow)); setAdvancePolicy((target.advancePolicy as AdvancePolicy) ?? "byDate");
    setAnalysis({
      revenue: target.analysis?.revenue ?? "", employees: target.analysis?.employees ?? "",
      capital: target.analysis?.capital ?? "", philosophy: target.analysis?.philosophy ?? "",
      products: target.analysis?.products ?? "", business: target.analysis?.business ?? "",
      social: target.analysis?.social ?? "", history: target.analysis?.history ?? "",
      dutiesByDept: target.analysis?.dutiesByDept ?? "", careerPlan: target.analysis?.careerPlan ?? "",
      culture: target.analysis?.culture ?? "", strengthsVsCompetitors: target.analysis?.strengthsVsCompetitors ?? "",
      focusAndVision: target.analysis?.focusAndVision ?? "", managementPlanGrowth: target.analysis?.managementPlanGrowth ?? "",
      hiringCount: target.analysis?.hiringCount ?? "", salary: target.analysis?.salary ?? "",
      benefits: target.analysis?.benefits ?? "", avgTenure: target.analysis?.avgTenure ?? "",
      overtime: target.analysis?.overtime ?? "", cmChecked: target.analysis?.cmChecked ?? "",
    });
    try { setEsText(localStorage.getItem(esKey(target.name)) ?? ""); } catch { setEsText(""); }
  }, [selectedId, companies]);

  const reload = () => setCompanies(listCompanies());

  const addStep = () => { if (!newStep) return; setFlowSteps((p)=>[...p,newStep]); setNewStep(""); };
  const removeStep = (i: number) => setFlowSteps((p)=>p.filter((_,idx)=>idx!==i));
  const moveUp = (i: number) => { if (i<=0) return; setFlowSteps((p)=>{ const cp=[...p]; [cp[i-1],cp[i]]=[cp[i],cp[i-1]]; return cp; }); };
  const moveDown = (i: number) => { setFlowSteps((p)=>{ if(i>=p.length-1) return p; const cp=[...p]; [cp[i+1],cp[i]]=[cp[i],cp[i+1]]; return cp; }); };

  const syncStatusWithFlow = () => {
    if (flowSteps.length===0) { setMessage("フローが未設定です。先にステップを追加してください。"); return; }
    const order = ["エントリー","説明会","書類選考","Webテスト","面談","グループディスカッション","一次面接","二次面接","三次面接","最終面接","内定"];
    const rank = (s:string)=>{ const idx=order.indexOf(s.trim()); return idx<0?0:idx; };
    if (!status.trim()) { setStatus(flowSteps[0]); setNextAction(`${flowSteps[0]} の準備をする`); setMessage("現在の選考状況をフロー先頭に同期しました。"); return; }
    let best=flowSteps[0], bestDiff=Math.abs(rank(flowSteps[0])-rank(status.trim()));
    for (const s of flowSteps.slice(1)) { const diff=Math.abs(rank(s)-rank(status.trim())); if (diff<bestDiff){best=s;bestDiff=diff;} }
    setStatus(best); setNextAction(`${best} の準備をする`); setMessage("現在の選考状況をフローに同期しました。");
  };

  const startNew = () => {
    setSelectedId("NEW");
    setName(""); setIndustry(""); setInterest(3); setHomepageUrl(""); setPortalId(""); setPortalPassword("");
    setStatus(""); setFlowDeadline(""); setLocationHint(""); setNextAction(""); setNotes(""); setTestFormat("");
    setFlowSteps([]); setAdvancePolicy("byDate"); setMessage("新規作成モードです。入力後「保存」で作成します。"); setEsText("");
    setAnalysis({
      revenue:"", employees:"", capital:"", philosophy:"",
      products:"", business:"", social:"",
      history:"", dutiesByDept:"", careerPlan:"", culture:"",
      strengthsVsCompetitors:"", focusAndVision:"", managementPlanGrowth:"",
      hiringCount:"", salary:"", benefits:"", avgTenure:"", overtime:"", cmChecked:"",
    });
  };

  const handleSave = () => {
    if (!name.trim()) { setMessage("企業名は必須です。"); return; }
    const saved = upsertCompany({
      name: name.trim(), industry: industry.trim(), interest,
      homepageUrl: homepageUrl.trim(), portalId: portalId.trim(), portalPassword: portalPassword.trim(),
      status: status.trim(), flowDeadline: flowDeadline.trim(), locationHint: locationHint.trim(),
      nextAction: nextAction.trim(), notes, testFormat: testFormat.trim(),
      interviewFlow: serializeFlow(flowSteps), advancePolicy, analysis: { ...analysis },
    });
    try { localStorage.setItem(esKey(saved.name), esText ?? ""); } catch {}
    setMessage(`保存しました：${saved.name}`); reload();
    setSelectedId((prev)=> (prev==="NEW"? saved.id : prev));
  };

  const handleDelete = () => {
    const target = companies.find((c)=>c.id===selectedId);
    if(!target){ setMessage("削除対象が選択されていません。"); return; }
    if(!window.confirm(`「${target.name}」を削除します。元に戻せません。よろしいですか？`)) return;
    const ok = removeCompany(target.id);
    if(!ok){ setMessage("削除に失敗しました。"); return; }
    const rest = listCompanies(); setCompanies(rest);
    if(rest.length>0){ setSelectedId(rest[0].id); setMessage(`削除しました：${target.name}`); }
    else{
      setSelectedId("NEW");
      setName(""); setIndustry(""); setInterest(3); setHomepageUrl(""); setPortalId(""); setPortalPassword("");
      setStatus(""); setFlowDeadline(""); setLocationHint(""); setNextAction(""); setNotes(""); setTestFormat("");
      setFlowSteps([]); setAdvancePolicy("byDate"); setMessage(`削除しました：${target.name}（登録企業は0件）`); setEsText("");
    }
  };

  // 並び＆リサイズ
  const { cols, centerize, onDragStart, onDragOverPanel, onDrop, pressing, setPressing, dragId } = useColumns();
  const { containerRef, sizes, visible, collapse, expand, startResize } = useResizer();

  // 表示中の順序（visibleに従ってフィルタ）
  const orderedVisible = cols.filter((c) => visible.includes(c));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6aa5d8] via-[#8bb6db] to-[#bcd5ea] pb-16">
      {/* ヘッダ */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 pt-6">
        <h1 className="text-2xl font-bold text-white drop-shadow">企業情報の登録・編集</h1>
        <Link href="/" className="rounded-lg bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-white/60 hover:bg-white">
          ← ダッシュボードへ戻る
        </Link>
      </header>

      {/* 上部操作列 */}
      <section className="mx-auto mt-4 flex max-w-7xl flex-wrap items-center gap-2 px-4">
        <select className="min-w-[260px] rounded border p-2 bg-white/90" value={selectedId} onChange={(e)=>setSelectedId(e.target.value)}>
          {companies.length===0 && <option value="">（企業がありません）</option>}
          {companies.map((c)=>(<option key={c.id} value={c.id}>{c.name}</option>))}
          <option value="NEW">（＋ 新規作成）</option>
        </select>
        <input className="w-[320px] rounded border p-2 bg-white/90" placeholder="企業名（必須）" value={name} onChange={(e)=>setName(e.target.value)} />
        <button onClick={()=>setCompanies(listCompanies())} className="rounded border bg-white/80 px-3 py-2 hover:bg-white">一覧を更新</button>
        <button onClick={startNew} className="rounded border bg-white/80 px-3 py-2 hover:bg-white">＋ 新規作成</button>
        <div className="ml-auto flex gap-2">
          <button onClick={handleSave} className="rounded bg-emerald-600/90 px-4 py-2 text-white font-semibold hover:bg-emerald-600">保存</button>
          {selectedId && selectedId!=="NEW" && (
            <button onClick={handleDelete} className="rounded bg-red-600/90 px-4 py-2 text-white font-semibold hover:bg-red-600" title="この企業を削除します（元に戻せません）">削除</button>
          )}
        </div>
      </section>

      {message && <p className="mx-auto mt-2 max-w-7xl px-4 text-sm font-medium text-white/90 drop-shadow">{message}</p>}

      {/* パネル操作（開く） */}
      <section className="mx-auto mt-3 max-w-7xl px-4">
        <div className="flex flex-wrap gap-2">
          {ALL.filter((id) => !visible.includes(id)).map((id) => (
            <button
              key={id}
              onClick={()=>expand(id)}
              className="rounded-lg bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-white/60 hover:bg-white"
            >
              {labelOf(id)} を開く
            </button>
          ))}
        </div>
      </section>

      {/* 3分割レイアウト本体：リサイズ＆並べ替え */}
      <main className="mx-auto mt-4 max-w-7xl px-4">
        <div ref={containerRef} className="relative flex items-stretch gap-3">
          {/* 左端ハンドル（2枚以上のときのみ） */}
          {orderedVisible.length >= 2 && (
            <div
              onMouseDown={(e) => startResize(orderedVisible[0] as ColId, orderedVisible[1] as ColId, e)}
              role="separator" aria-orientation="vertical"
              className="absolute left-0 top-0 z-[999] h-full w-4 cursor-col-resize select-none bg-white/40 hover:bg-white/70 active:bg-white/90 rounded-sm"
              title="ドラッグで幅調整（左端）"
            />
          )}

          {orderedVisible.map((id, idx) => {
            const width = `${sizes[id]}%`;
            const isDragging = dragId === id;

            return (
              <div key={id} className="relative" style={{ width }}>
                <PanelShell
                  id={id}
                  title={labelOf(id)}
                  onCenter={()=>centerize(id)}
                  onDragStart={()=>onDragStart(id)}
                  onDragOver={onDragOverPanel(id)}
                  onDrop={onDrop}
                  pressing={pressing===id}
                  setPressing={(v)=>setPressing(v)}
                  isDragging={isDragging}
                  onCollapse={()=>collapse(id)}
                >
                  {/* ===== タブ中身 ===== */}
                  {id === "es" && (
                    <div className="space-y-2">
                      <div className="text-xs text-slate-600">ES本文（会社ごとにローカル保存）</div>
                      <textarea
                        className="min-h-[340px] w-full rounded border border-slate-300 bg-white/90 p-2"
                        placeholder="自己PR・志望動機・ガクチカ等の下書き"
                        value={esText}
                        onChange={(e) => setEsText(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { try { localStorage.setItem(esKey(name), esText ?? ""); } catch {} }}
                          className="rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                        >
                          ESを保存
                        </button>
                        <button onClick={() => setEsText("")} className="rounded border px-3 py-1.5 text-xs hover:bg-white">
                          クリア
                        </button>
                      </div>
                    </div>
                  )}

                  {id === "analysis" && (
                    <div className="space-y-4">
                      <details className="rounded border p-3 bg-gray-50" open>
                        <summary className="cursor-pointer font-medium">会社の数字・プロフィール</summary>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Text label="売上" value={analysis.revenue} onChange={(v)=>setAnalysis(a=>({...a,revenue:v}))}/>
                          <Text label="従業員数" value={analysis.employees} onChange={(v)=>setAnalysis(a=>({...a,employees:v}))}/>
                          <Text label="資本金" value={analysis.capital} onChange={(v)=>setAnalysis(a=>({...a,capital:v}))}/>
                          <Text label="会社の経歴" value={analysis.history} onChange={(v)=>setAnalysis(a=>({...a,history:v}))}/>
                        </div>
                      </details>

                      <details className="rounded border p-3 bg-gray-50">
                        <summary className="cursor-pointer font-medium">価値観・戦略</summary>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Textarea label="企業理念" value={analysis.philosophy} onChange={(v)=>setAnalysis(a=>({...a,philosophy:v}))}/>
                          <Textarea label="社風" value={analysis.culture} onChange={(v)=>setAnalysis(a=>({...a,culture:v}))}/>
                          <Textarea label="何に力を入れているか × 自分のビジョン" value={analysis.focusAndVision} onChange={(v)=>setAnalysis(a=>({...a,focusAndVision:v}))}/>
                          <Textarea label="経営計画・成長性" value={analysis.managementPlanGrowth} onChange={(v)=>setAnalysis(a=>({...a,managementPlanGrowth:v}))}/>
                        </div>
                      </details>

                      <details className="rounded border p-3 bg-gray-50">
                        <summary className="cursor-pointer font-medium">事業・プロダクト</summary>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Textarea label="事業内容（業種カテゴリ）" value={analysis.business} onChange={(v)=>setAnalysis(a=>({...a,business:v}))}/>
                          <Textarea label="製品についての理解（顧客先など）" value={analysis.products} onChange={(v)=>setAnalysis(a=>({...a,products:v}))}/>
                          <Textarea label="社会貢献" value={analysis.social} onChange={(v)=>setAnalysis(a=>({...a,social:v}))}/>
                          <Textarea label="競合と比較した強み" value={analysis.strengthsVsCompetitors} onChange={(v)=>setAnalysis(a=>({...a,strengthsVsCompetitors:v}))}/>
                        </div>
                      </details>

                      <details className="rounded border p-3 bg-gray-50">
                        <summary className="cursor-pointer font-medium">働き方・キャリア・待遇</summary>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Textarea label="業務内容（部門ごと）" value={analysis.dutiesByDept} onChange={(v)=>setAnalysis(a=>({...a,dutiesByDept:v}))}/>
                          <Textarea label="キャリアプラン" value={analysis.careerPlan} onChange={(v)=>setAnalysis(a=>({...a,careerPlan:v}))}/>
                          <Text label="採用人数" value={analysis.hiringCount} onChange={(v)=>setAnalysis(a=>({...a,hiringCount:v}))}/>
                          <Text label="年収" value={analysis.salary} onChange={(v)=>setAnalysis(a=>({...a,salary:v}))}/>
                          <Text label="福利厚生" value={analysis.benefits} onChange={(v)=>setAnalysis(a=>({...a,benefits:v}))}/>
                          <Text label="平均勤続年数" value={analysis.avgTenure} onChange={(v)=>setAnalysis(a=>({...a,avgTenure:v}))}/>
                          <Text label="残業時間" value={analysis.overtime} onChange={(v)=>setAnalysis(a=>({...a,overtime:v}))}/>
                          <Text label="CM確認" value={analysis.cmChecked} onChange={(v)=>setAnalysis(a=>({...a,cmChecked:v}))}/>
                        </div>
                      </details>
                    </div>
                  )}

                  {id === "info" && (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Text label="業界" value={industry} onChange={setIndustry} placeholder="例：コンサル / IT / メーカー" />
                        <label className="grid gap-1">
                          <span className="text-sm font-semibold">志望度（1〜5）</span>
                          <input type="range" min={1} max={5} step={1} value={interest} onChange={(e)=>setInterest(Number(e.target.value))}/>
                          <span className="text-xs text-gray-600">現在の値：{interest}</span>
                        </label>
                        <Text label="企業ホームページURL" value={homepageUrl} onChange={setHomepageUrl} placeholder="https://..." />
                        <Text label="マイページID" value={portalId} onChange={setPortalId} />
                        <Text label="マイページパスワード" value={portalPassword} onChange={setPortalPassword} />
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="grid gap-1">
                          <span className="text-sm font-semibold">進行ロジック</span>
                          <select className="rounded border p-2" value={advancePolicy} onChange={(e)=>setAdvancePolicy(e.target.value as AdvancePolicy)}>
                            <option value="byDate">日時優先（新しい日付で1段進める）</option>
                            <option value="byKeyword">キーワード優先（文言をフローにスナップ）</option>
                            <option value="manual">手動（自動では進めない）</option>
                          </select>
                          <span className="text-xs text-gray-500">「日時優先」だと、メールが「面談」と書いてあっても、日付が入ればフローを次段に進めます。</span>
                        </label>

                        <label className="grid gap-1">
                          <span className="text-sm font-semibold">現在の選考状況</span>
                          {flowSteps.length>0 ? (
                            <select className="rounded border p-2" value={status} onChange={(e)=>setStatus(e.target.value)}>
                              <option value="">— フローに合わせて選ぶ —</option>
                              {flowSteps.map((s,i)=>(<option key={`${s}-${i}`} value={s}>{s}</option>))}
                            </select>
                          ) : (
                            <input className="rounded border p-2" value={status} onChange={(e)=>setStatus(e.target.value)} placeholder="例：一次面接（フロー未設定時は自由入力）"/>
                          )}
                          <div className="flex gap-2 pt-1">
                            <button type="button" onClick={syncStatusWithFlow} className="rounded border px-3 py-1 text-sm hover:bg-gray-50" title="フロー先頭や近い段階にステータスを同期します">
                              フローに同期
                            </button>
                          </div>
                        </label>

                        <Text label="次回の選考日" value={flowDeadline} onChange={setFlowDeadline} placeholder="YYYY-MM-DD HH:mm 〜 HH:mm" />
                        <Text label="次のアクション" value={nextAction} onChange={setNextAction} placeholder="例：一次面接 の準備をする" />
                        <Text label="場所/形式" value={locationHint} onChange={setLocationHint} placeholder="例：Teams / 対面" />
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">面接フロー（選択で設定）</h3>
                          <div className="text-xs text-gray-500">保存時「A → B → C」で保存</div>
                        </div>

                        <FlowEditor
                          flowSteps={flowSteps}
                          setFlowSteps={setFlowSteps}
                          newStep={newStep}
                          setNewStep={setNewStep}
                          moveUp={moveUp}
                          moveDown={moveDown}
                          removeStep={removeStep}
                        />

                        <div className="text-sm text-gray-700">
                          <span className="font-semibold">プレビュー：</span>{" "}
                          {flowSteps.length>0 ? <span>{serializeFlow(flowSteps)}</span> : <span className="text-gray-500">（なし）</span>}
                        </div>

                        <div className="grid mt-3">
                          <label className="grid gap-1">
                            <span className="text-sm font-semibold">選考メモ</span>
                            <textarea className="rounded border p-2 min-h-[100px]" value={notes} onChange={(e)=>setNotes(e.target.value)} />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* ===== /タブ中身 ===== */}
                </PanelShell>

                {/* ▼▼ パネル間ハンドル：左＆右の両方を出す（各パネル内） ▼▼ */}

{/* 左境界（自分の左＝ひとつ前との境界） */}
{idx > 0 && (
  <div
    onMouseDown={(e) =>
      startResize(orderedVisible[idx - 1] as ColId, orderedVisible[idx] as ColId, e)
    }
    role="separator"
    aria-orientation="vertical"
    className="absolute left-[-0.375rem] top-0 z-[999] h-full w-3 cursor-col-resize select-none bg-white/40 hover:bg-white/70 active:bg-white/90 rounded-sm"
    title="ドラッグで幅調整（左境界）"
  />
)}

{/* 右境界（自分の右＝ひとつ次との境界） */}
{idx < orderedVisible.length - 1 && (
  <div
    onMouseDown={(e) =>
      startResize(orderedVisible[idx] as ColId, orderedVisible[idx + 1] as ColId, e)
    }
    role="separator"
    aria-orientation="vertical"
    className="absolute right-[-0.375rem] top-0 z-[999] h-full w-3 cursor-col-resize select-none bg-white/40 hover:bg-white/70 active:bg-white/90 rounded-sm"
    title="ドラッグで幅調整（右境界）"
  />
)}

{/* ▲▲ パネル間ハンドルここまで ▲▲ */}


              </div>
            );
          })}

          {/* 右端ハンドル（2枚以上のときのみ） */}
          {orderedVisible.length >= 2 && (
            <div
              onMouseDown={(e) => {
                const n = orderedVisible.length;
                startResize(orderedVisible[n-2] as ColId, orderedVisible[n-1] as ColId, e);
              }}
              role="separator" aria-orientation="vertical"
              className="absolute right-0 top-0 z-[999] h-full w-4 cursor-col-resize select-none bg-white/40 hover:bg-white/70 active:bg-white/90 rounded-sm"
              title="ドラッグで幅調整（右端）"
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* ============ 部品（あなたの既存実装そのまま） ============ */
function Text({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string)=>void; placeholder?: string; }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-semibold">{label}</span>
      <input className="rounded border p-2 bg-white/90" value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder}/>
    </label>
  );
}
function Textarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string)=>void; placeholder?: string; }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-semibold">{label}</span>
      <textarea className="rounded border p-2 min-h-[90px] bg-white/90" value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder}/>
    </label>
  );
}

/* ============ フロー編集（既存UIを小さく関数化） ============ */
const STEP_OPTIONS = [
  "エントリー","説明会","書類選考","Webテスト","面談",
  "グループディスカッション","一次面接","二次面接","三次面接","最終面接","内定",
];

function FlowEditor({
  flowSteps, setFlowSteps, newStep, setNewStep, moveUp, moveDown, removeStep,
}: {
  flowSteps: string[];
  setFlowSteps: (v: string[]) => void;
  newStep: string;
  setNewStep: (v: string) => void;
  moveUp: (i: number) => void;
  moveDown: (i: number) => void;
  removeStep: (i: number) => void;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <select className="rounded border p-2" value={newStep} onChange={(e)=>setNewStep(e.target.value)}>
          <option value="">— ステップを選択 —</option>
          {STEP_OPTIONS.map((opt)=>(<option key={opt} value={opt}>{opt}</option>))}
        </select>
        <button onClick={()=>{ if(newStep){ setFlowSteps([...flowSteps, newStep]); setNewStep(""); }}} disabled={!newStep} className="rounded border px-3 py-2 hover:bg-gray-50 disabled:opacity-50">＋ 追加</button>
        <button onClick={()=>setFlowSteps([])} className="rounded border px-3 py-2 hover:bg-gray-50">全クリア</button>
      </div>

      {flowSteps.length===0 ? (
        <p className="text-sm text-gray-500">まだステップがありません。上の選択から追加してください。</p>
      ) : (
        <ul className="space-y-2">
          {flowSteps.map((s,i)=>(
            <li key={`${s}-${i}`} className="flex items-center justify-between rounded border p-2 bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded bg-white px-2 py-1 text-sm border">{i+1}</span>
                <span className="font-medium">{s}</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded border px-2 py-1 hover:bg-white" onClick={()=>moveUp(i)} title="上へ">↑</button>
                <button className="rounded border px-2 py-1 hover:bg-white" onClick={()=>moveDown(i)} title="下へ">↓</button>
                <button className="rounded border px-2 py-1 hover:bg-white" onClick={()=>removeStep(i)} title="削除">削除</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ============ 細かいユーティリティ ============ */
function deserializeFlow(flow?: string): string[] {
  if (!flow) return [];
  return flow
    .split(/(?:->|→|＞|>|、|,|\r?\n)/)
    .map((s) => s.trim())
    .filter(Boolean);
}
function serializeFlow(steps: string[]): string {
  return steps.join(" -> ");
}
function labelOf(id: ColId) {
  switch (id) {
    case "es": return "ES（エントリーシート）";
    case "analysis": return "企業分析";
    case "info": return "企業情報 / 選考情報";
  }
}
