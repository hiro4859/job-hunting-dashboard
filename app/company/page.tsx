"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Company, AdvancePolicy } from "../utils/companyStore";
import { listCompanies, upsertCompany, removeCompany } from "../utils/companyStore";

/* ユーティリティ（見た目用） */
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

/* ステップ候補（選択で追加） */
const STEP_OPTIONS = [
  "エントリー",
  "説明会",
  "書類選考",
  "Webテスト",
  "面談",
  "グループディスカッション",
  "一次面接",
  "二次面接",
  "三次面接",
  "最終面接",
  "内定",
];

export default function CompanyPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  // フォーム state
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [interest, setInterest] = useState(3);
  const [homepageUrl, setHomepageUrl] = useState("");
  const [portalId, setPortalId] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [status, setStatus] = useState("");
  const [flowDeadline, setFlowDeadline] = useState("");
  const [locationHint, setLocationHint] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [notes, setNotes] = useState("");
  const [testFormat, setTestFormat] = useState("");
  const [advancePolicy, setAdvancePolicy] = useState<AdvancePolicy>("byDate");

  // 企業分析（テンプレ）
  const [analysis, setAnalysis] = useState({
    revenue: "", employees: "", capital: "", philosophy: "",
    products: "", business: "", social: "", history: "",
    dutiesByDept: "", careerPlan: "", culture: "", strengthsVsCompetitors: "",
    focusAndVision: "", managementPlanGrowth: "",
    hiringCount: "", salary: "", benefits: "", avgTenure: "", overtime: "",
    cmChecked: "",
  });

  // フロー編集用
  const [flowSteps, setFlowSteps] = useState<string[]>([]);
  const [newStep, setNewStep] = useState<string>("");

  const [message, setMessage] = useState("");

  /* 初回読み込み */
  useEffect(() => {
    const all = listCompanies();
    setCompanies(all);
    if (all.length > 0) setSelectedId(all[0].id);
  }, []);

  /* 選択企業の読込 → フォームへ反映 */
  useEffect(() => {
    const target = companies.find((c) => c.id === selectedId);
    if (!target) {
      // 新規 or 未選択
      setName("");
      setIndustry("");
      setInterest(3);
      setHomepageUrl("");
      setPortalId("");
      setPortalPassword("");
      setStatus("");
      setFlowDeadline("");
      setLocationHint("");
      setNextAction("");
      setNotes("");
      setTestFormat("");
      setFlowSteps([]);
      setAdvancePolicy("byDate");
      setAnalysis({
        revenue:"", employees:"", capital:"", philosophy:"",
        products:"", business:"", social:"", history:"",
        dutiesByDept:"", careerPlan:"", culture:"", strengthsVsCompetitors:"",
        focusAndVision:"", managementPlanGrowth:"",
        hiringCount:"", salary:"", benefits:"", avgTenure:"", overtime:"",
        cmChecked:"",
      });
      return;
    }
    setName(target.name ?? "");
    setIndustry(target.industry ?? "");
    setInterest(target.interest ?? 3);
    setHomepageUrl(target.homepageUrl ?? "");
    setPortalId(target.portalId ?? "");
    setPortalPassword(target.portalPassword ?? "");
    setStatus(target.status ?? "");
    setFlowDeadline(target.flowDeadline ?? "");
    setLocationHint(target.locationHint ?? "");
    setNextAction(target.nextAction ?? "");
    setNotes(target.notes ?? "");
    setTestFormat(target.testFormat ?? "");
    setFlowSteps(deserializeFlow(target.interviewFlow));
    setAdvancePolicy((target.advancePolicy as AdvancePolicy) ?? "byDate");
    setAnalysis({
      revenue: target.analysis?.revenue ?? "",
      employees: target.analysis?.employees ?? "",
      capital: target.analysis?.capital ?? "",
      philosophy: target.analysis?.philosophy ?? "",
      products: target.analysis?.products ?? "",
      business: target.analysis?.business ?? "",
      social: target.analysis?.social ?? "",
      history: target.analysis?.history ?? "",
      dutiesByDept: target.analysis?.dutiesByDept ?? "",
      careerPlan: target.analysis?.careerPlan ?? "",
      culture: target.analysis?.culture ?? "",
      strengthsVsCompetitors: target.analysis?.strengthsVsCompetitors ?? "",
      focusAndVision: target.analysis?.focusAndVision ?? "",
      managementPlanGrowth: target.analysis?.managementPlanGrowth ?? "",
      hiringCount: target.analysis?.hiringCount ?? "",
      salary: target.analysis?.salary ?? "",
      benefits: target.analysis?.benefits ?? "",
      avgTenure: target.analysis?.avgTenure ?? "",
      overtime: target.analysis?.overtime ?? "",
      cmChecked: target.analysis?.cmChecked ?? "",
    });
  }, [selectedId, companies]);

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedId),
    [companies, selectedId]
  );

  const reload = () => setCompanies(listCompanies());

  /* フロー操作 */
  const addStep = () => {
    if (!newStep) return;
    setFlowSteps((prev) => [...prev, newStep]);
    setNewStep("");
  };
  const removeStep = (idx: number) => {
    setFlowSteps((prev) => prev.filter((_, i) => i !== idx));
  };
  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    setFlowSteps((prev) => {
      const cp = [...prev];
      [cp[idx - 1], cp[idx]] = [cp[idx], cp[idx - 1]];
      return cp;
    });
  };
  const moveDown = (idx: number) => {
    setFlowSteps((prev) => {
      if (idx >= prev.length - 1) return prev;
      const cp = [...prev];
      [cp[idx + 1], cp[idx]] = [cp[idx], cp[idx + 1]];
      return cp;
    });
  };

  /* ステータスをフローに同期 */
  const syncStatusWithFlow = () => {
    if (flowSteps.length === 0) {
      setMessage("フローが未設定です。先にステップを追加してください。");
      return;
    }
    const order = [
      "エントリー","説明会","書類選考","Webテスト","面談",
      "グループディスカッション","一次面接","二次面接","三次面接","最終面接","内定",
    ];
    const rank = (s: string) => {
      const idx = order.indexOf(s.trim());
      return idx < 0 ? 0 : idx;
    };
    if (!status.trim()) {
      setStatus(flowSteps[0]);
      setNextAction(`${flowSteps[0]} の準備をする`);
      setMessage("現在の選考状況をフロー先頭に同期しました。");
      return;
    }
    let best = flowSteps[0], bestDiff = Math.abs(rank(flowSteps[0]) - rank(status.trim()));
    for (const s of flowSteps.slice(1)) {
      const diff = Math.abs(rank(s) - rank(status.trim()));
      if (diff < bestDiff) { best = s; bestDiff = diff; }
    }
    setStatus(best);
    setNextAction(`${best} の準備をする`);
    setMessage("現在の選考状況をフローに同期しました。");
  };

  const startNew = () => {
    setSelectedId("NEW");
    setName("");
    setIndustry("");
    setInterest(3);
    setHomepageUrl("");
    setPortalId("");
    setPortalPassword("");
    setStatus("");
    setFlowDeadline("");
    setLocationHint("");
    setNextAction("");
    setNotes("");
    setTestFormat("");
    setFlowSteps([]);
    setAdvancePolicy("byDate");
    setAnalysis({
      revenue:"", employees:"", capital:"", philosophy:"",
      products:"", business:"", social:"", history:"",
      dutiesByDept:"", careerPlan:"", culture:"", strengthsVsCompetitors:"",
      focusAndVision:"", managementPlanGrowth:"",
      hiringCount:"", salary:"", benefits:"", avgTenure:"", overtime:"",
      cmChecked:"",
    });
    setMessage("新規作成モードです。入力後「保存」で作成します。");
  };

  const handleSave = () => {
    if (!name.trim()) {
      setMessage("企業名は必須です。");
      return;
    }
    const saved = upsertCompany({
      name: name.trim(),
      industry: industry.trim(),
      interest,
      homepageUrl: homepageUrl.trim(),
      portalId: portalId.trim(),
      portalPassword: portalPassword.trim(),
      status: status.trim(),
      flowDeadline: flowDeadline.trim(),
      locationHint: locationHint.trim(),
      nextAction: nextAction.trim(),
      notes,
      testFormat: testFormat.trim(),
      interviewFlow: serializeFlow(flowSteps),
      advancePolicy,
      analysis: { ...analysis },
    });
    setMessage(`保存しました：${saved.name}`);
    reload();
    setSelectedId((prev) => (prev === "NEW" ? saved.id : prev));
  };

  const handleDelete = () => {
  const target = companies.find((c) => c.id === selectedId);
  if (!target) {
    setMessage("削除対象が選択されていません。");
    return;
  }
  if (!window.confirm(`「${target.name}」を削除します。元に戻せません。よろしいですか？`)) {
    return;
  }
  const ok = removeCompany(target.id);
  if (!ok) {
    setMessage("削除に失敗しました。");
    return;
  }
  const rest = listCompanies();
  setCompanies(rest);
  if (rest.length > 0) {
    setSelectedId(rest[0].id);
    setMessage(`削除しました：${target.name}`);
  } else {
    // 何もなくなったら新規モード
    setSelectedId("NEW");
    setName(""); setIndustry(""); setInterest(3);
    setHomepageUrl(""); setPortalId(""); setPortalPassword("");
    setStatus(""); setFlowDeadline(""); setLocationHint("");
    setNextAction(""); setNotes(""); setTestFormat("");
    setFlowSteps([]); setAdvancePolicy("byDate");
    setMessage(`削除しました：${target.name}（登録企業は0件）`);
  }
};


  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">企業情報の登録・編集</h1>
        <Link
          href="/"
          className="rounded bg-gray-800 px-4 py-2 text-white font-semibold hover:bg-gray-700"
        >
          ← ダッシュボードへ戻る
        </Link>
      </header>

      {/* 上段：一覧/選択 */}
      <section className="rounded border p-4 space-y-3 bg-white">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="min-w-[260px] rounded border p-2"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {companies.length === 0 && (
              <option value="">（企業がありません）</option>
            )}
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="NEW">（＋ 新規作成）</option>
          </select>

          <button
            onClick={reload}
            className="rounded border px-3 py-2 hover:bg-gray-50"
          >
            一覧を更新
          </button>
          <button
            onClick={startNew}
            className="rounded border px-3 py-2 hover:bg-gray-50"
          >
            ＋ 新規作成
          </button>
        </div>
        {message && <p className="text-sm text-gray-700">{message}</p>}
      </section>

      {/* 下段：編集フォーム */}
      <section className="rounded border p-4 space-y-6 bg-white">
        {/* 基本情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Text label="企業名（必須）" value={name} onChange={setName} placeholder="例：ABC株式会社" />
          <Text label="業界" value={industry} onChange={setIndustry} placeholder="例：コンサル / IT / メーカー" />

          <label className="grid gap-1">
            <span className="text-sm font-semibold">志望度（1〜5）</span>
            <input
              type="range" min={1} max={5} step={1}
              value={interest} onChange={(e) => setInterest(Number(e.target.value))}
            />
            <span className="text-xs text-gray-600">現在の値：{interest}</span>
          </label>

          <Text label="企業ホームページURL" value={homepageUrl} onChange={setHomepageUrl} placeholder="https://..." />
          <Text label="マイページID" value={portalId} onChange={setPortalId} />
          <Text label="マイページパスワード" value={portalPassword} onChange={setPortalPassword} />
        </div>

        {/* 進行ロジック */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-semibold">進行ロジック</span>
            <select
              className="rounded border p-2"
              value={advancePolicy}
              onChange={(e) => setAdvancePolicy(e.target.value as AdvancePolicy)}
            >
              <option value="byDate">日時優先（新しい日付で1段進める）</option>
              <option value="byKeyword">キーワード優先（文言をフローにスナップ）</option>
              <option value="manual">手動（自動では進めない）</option>
            </select>
            <span className="text-xs text-gray-500">
              「日時優先」だと、メールが「面談」と書いてあっても、日付が入ればフローを次段に進めます。
            </span>
          </label>
        </div>

        {/* ステータス・日付・場所 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-semibold">現在の選考状況</span>
            {flowSteps.length > 0 ? (
              <select
                className="rounded border p-2"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">— フローに合わせて選ぶ —</option>
                {flowSteps.map((s, i) => (
                  <option key={`${s}-${i}`} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <input
                className="rounded border p-2"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="例：一次面接（フロー未設定時は自由入力）"
              />
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={syncStatusWithFlow}
                className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                title="フロー先頭や近い段階にステータスを同期します"
              >
                フローに同期
              </button>
            </div>
          </label>

          <Text label="次回の選考日" value={flowDeadline} onChange={setFlowDeadline} placeholder="YYYY-MM-DD HH:mm 〜 HH:mm" />
          <Text label="次のアクション" value={nextAction} onChange={setNextAction} placeholder="例：一次面接 の準備をする" />
          <Text label="場所/形式" value={locationHint} onChange={setLocationHint} placeholder="例：Teams / 対面" />
        </div>

        {/* 面接フロー（選択で構築） */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">面接フロー（選択で設定）</h3>
            <div className="text-xs text-gray-500">保存時「A → B → C」で保存</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded border p-2"
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
            >
              <option value="">— ステップを選択 —</option>
              {STEP_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <button onClick={addStep} disabled={!newStep} className="rounded border px-3 py-2 hover:bg-gray-50 disabled:opacity-50">＋ 追加</button>
            <button onClick={() => setFlowSteps([])} className="rounded border px-3 py-2 hover:bg-gray-50">全クリア</button>
          </div>

          {flowSteps.length === 0 ? (
            <p className="text-sm text-gray-500">まだステップがありません。上の選択から追加してください。</p>
          ) : (
            <ul className="space-y-2">
              {flowSteps.map((s, i) => (
                <li key={`${s}-${i}`} className="flex items-center justify-between rounded border p-2 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded bg-white px-2 py-1 text-sm border">{i + 1}</span>
                    <span className="font-medium">{s}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rounded border px-2 py-1 hover:bg-white" onClick={() => moveUp(i)} title="上へ">↑</button>
                    <button className="rounded border px-2 py-1 hover:bg-white" onClick={() => moveDown(i)} title="下へ">↓</button>
                    <button className="rounded border px-2 py-1 hover:bg-white" onClick={() => removeStep(i)} title="削除">削除</button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="text-sm text-gray-700">
            <span className="font-semibold">プレビュー：</span>{" "}
            {flowSteps.length > 0 ? <span>{serializeFlow(flowSteps)}</span> : <span className="text-gray-500">（なし）</span>}
          </div>
        </div>

        {/* 備考 */}
        <div className="grid">
          <label className="grid gap-1">
            <span className="text-sm font-semibold">選考メモ</span>
            <textarea className="rounded border p-2 min-h-[100px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </div>
      </section>

      {/* ───────── 企業分析（テンプレ） ───────── */}
      <section className="rounded border p-4 space-y-4 bg-white">
        <h3 className="text-lg font-semibold">企業分析</h3>

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

        <div className="pt-2 flex gap-2">
        <button
          onClick={handleSave}
          className="rounded bg-emerald-600 px-4 py-2 text-white font-semibold hover:bg-emerald-700"
          >
          保存
          </button>

           {selectedId && selectedId !== "NEW" && (
            <button
             onClick={handleDelete}
             className="rounded bg-red-600 px-4 py-2 text-white font-semibold hover:bg-red-700"
              title="この企業を削除します（元に戻せません）"
    >
               削除
              </button>
              )}
           </div>

      </section>
    </main>
  );
}

/* 共通フォーム部品 */
function Text({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string)=>void; placeholder?: string; }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-semibold">{label}</span>
      <input className="rounded border p-2" value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder}/>
    </label>
  );
}
function Textarea({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string)=>void; placeholder?: string; }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-semibold">{label}</span>
      <textarea className="rounded border p-2 min-h-[90px]" value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder}/>
    </label>
  );
}
