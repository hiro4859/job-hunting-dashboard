"use client";

/** 進行ロジック */
export type AdvancePolicy = "byDate" | "byKeyword" | "manual";

/** ES下書き（新規追加） */
export type ESDraft = {
  selfPR?: string;         // 自己PR
  studentLife?: string;    // ガクチカ
  motivation?: string;     // 志望動機
  strengths?: string;      // 強み
  weaknesses?: string;     // 弱み
  free?: string;           // 自由記述
};

/** 企業分析テンプレ（新規追加） */
export type CompanyAnalysis = {
  revenue?: string;                 // 売上
  employees?: string;               // 従業員数
  capital?: string;                 // 資本金
  philosophy?: string;              // 企業理念
  products?: string;                // 製品/顧客理解（顧客先など）
  business?: string;                // 事業内容/業種カテゴライズ
  social?: string;                  // 社会貢献
  history?: string;                 // 会社の経歴
  dutiesByDept?: string;            // 業務内容（部門ごと）
  careerPlan?: string;              // キャリアプラン
  culture?: string;                 // 社風
  strengthsVsCompetitors?: string;  // 競合と比較した強み
  focusAndVision?: string;          // 何に力を入れているか × 自分のビジョン
  managementPlanGrowth?: string;    // 経営計画・成長性
  hiringCount?: string;             // 採用人数
  salary?: string;                  // 年収
  benefits?: string;                // 福利厚生
  avgTenure?: string;               // 平均勤続年数
  overtime?: string;                // 残業時間
  cmChecked?: string;               // CM確認
};

/** 1イベントの署名（重複防止） */
type EventSignature = string;

/** データ構造 */
export type Company = {
  id: string;
  name: string;
  industry?: string;
  interest?: number;
  status?: string;           // 現在の選考状況（フロー表記で保持）
  flowDeadline?: string;     // 次回の選考日時（文字列）
  homepageUrl?: string;
  portalId?: string;
  portalPassword?: string;
  notes?: string;
  interviewFlow?: string;    // "A -> B -> C"
  testFormat?: string;
  nextAction?: string;
  locationHint?: string;
  updatedAt: string;

  // 追加：進行ロジック＆履歴
  advancePolicy?: AdvancePolicy;     // "byDate" | "byKeyword" | "manual"
  eventHistory?: EventSignature[];   // 反映済みのメール署名（日付＋場所）を保存

  // 追加：企業分析テンプレ
  analysis?: CompanyAnalysis;

  imageUrl?: string; // カード用のユーザーアップロード画像（dataURL）

  /** ES下書き（新規追加） */
  es?: ESDraft;
};

const STORAGE_KEY = "jp.jobhunt.companies";

/* ================== Storage ================== */
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
export function listCompanies(): Company[] {
  return loadAll().sort((a, b) => a.name.localeCompare(b.name));
}
export function findByName(name: string): Company | undefined {
  return loadAll().find((c) => c.name === name);
}

/* ================== 名寄せ（会社名） ================== */
function cleanCompanyName(name: string): string {
  let s = (name || "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(/[\r\n]+/g, " ")
    .trim();
  s = s.replace(/(?:の)?(新卒採用(?:部|課|チーム)?|採用(?:担当|課|チーム)?|人事(?:部)?|御中|各位|様).*$/u, "");
  s = s.replace(/[「」『』【】（）()]/g, "");
  if (s.length > 50) s = s.slice(0, 50);
  return s.trim();
}
function normalize(name: string) {
  return cleanCompanyName(name)
    .replace(/株式会社|（株）|\(株\)/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}
function findByNormalized(name: string): Company | undefined {
  const n = normalize(name);
  return listCompanies().find((c) => normalize(c.name) === n);
}

/* ================== 作成/更新 ================== */
export function upsertCompany(input: Partial<Company> & { name: string }): Company {
  const all = loadAll();
  const now = new Date().toISOString();
  const name = cleanCompanyName(input.name);

  if (!name || /(お世話になっております|ありがとうございます|ご連絡|以下の日程)/.test(name)) {
    return all[0] ?? { id: crypto?.randomUUID?.() ?? String(Date.now()), name: "", updatedAt: now };
  }

  const existing = all.find((c) => c.name === name);
  if (existing) {
    const merged: Company = {
      ...existing,
      ...input,
      name,
      updatedAt: now,
      advancePolicy: input.advancePolicy ?? existing.advancePolicy ?? "byDate",
      eventHistory: input.eventHistory ?? existing.eventHistory ?? [],
      analysis: { ...(existing.analysis ?? {}), ...(input.analysis ?? {}) }, // 部分マージ
      es: { ...(existing.es ?? {}), ...(input.es ?? {}) },                  // 部分マージ
    };
    saveAll(all.map((c) => (c.id === existing.id ? merged : c)));
    return merged;
  }

  const created: Company = {
    id: crypto?.randomUUID?.() ?? String(Date.now()),
    name,
    industry: input.industry ?? "",
    interest: input.interest ?? 3,
    status: input.status ?? "",
    flowDeadline: input.flowDeadline ?? "",
    homepageUrl: input.homepageUrl ?? "",
    portalId: input.portalId ?? "",
    portalPassword: input.portalPassword ?? "",
    notes: input.notes ?? "",
    interviewFlow: input.interviewFlow ?? "",
    testFormat: input.testFormat ?? "",
    nextAction: input.nextAction ?? "",
    locationHint: input.locationHint ?? "",
    updatedAt: now,
    advancePolicy: input.advancePolicy ?? "byDate",
    eventHistory: [],
    analysis: input.analysis ?? {},
    imageUrl: input.imageUrl ?? "",
    es: input.es ?? {},
  };
  saveAll([...all, created]);
  return created;
}

/* ================== フロー & ステージ処理 ================== */
/** ステージの正規化（同義語 → 代表カテゴリ） */
function normalizeStage(raw: string): string {
  const s = raw.trim().normalize("NFKC").replace(/\s+/g, "").toLowerCase();

  if (/(entry|エントリ)/.test(s)) return "エントリー";
  if (/説明会/.test(s)) return "説明会";
  if (/書類/.test(s)) return "書類選考";

  // テスト系（広めに吸収）
  if (/web.?テスト|webtest|適性|spi|玉手箱|筆記|学力/.test(s)) return "Webテスト";

  // 面談・GD
  if (/面談|カジュアル/.test(s)) return "面談";
  if (/グループ.?ディスカッション|gd/.test(s)) return "グループディスカッション";

  // 面接段階
  if (/一次.*面接|面接.*一次|1次.*面接|一次面接/.test(s)) return "一次面接";
  if (/二次.*面接|面接.*二次|2次.*面接|二次面接/.test(s)) return "二次面接";
  if (/三次.*面接|面接.*三次|3次.*面接|三次面接/.test(s)) return "三次面接";
  if (/最終.*面接|面接.*最終|final/.test(s)) return "最終面接";

  if (/内々定|内定/.test(s)) return "内定";

  return raw.trim();
}

/** フロー文字列 → 配列（表記は“フローそのまま”で扱う） */
export function parseFlow(flow?: string): string[] {
  if (!flow) return [];
  return flow
    .split(/(?:->|→|＞|>|、|,|\r?\n)/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** ステージ序列（内部比較用は正規化カテゴリ） */
function stageRank(s: string) {
  const cat = normalizeStage(s);
  const order = [
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
  const i = order.indexOf(cat);
  return i < 0 ? 0 : i;
}

/** 現在statusからフロー上の“次に来る”段階 */
function nextStageFromFlow(company: Company): string {
  const stages = parseFlow(company.interviewFlow);
  if (stages.length === 0) return "";

  const cur = company.status?.trim() ?? "";
  if (!cur) return stages[0];

  const idx = stages.findIndex((s) => normalizeStage(s) === normalizeStage(cur));
  if (idx < 0) {
    const later = stages.find((s) => stageRank(s) > stageRank(cur));
    return later ?? stages[0];
  }
  return stages[idx + 1] ?? stages[idx];
}

/** イベント提案をフローへスナップ */
function snapStatusToFlow(flowSteps: string[], proposal: string): string {
  const targetCat = normalizeStage(proposal);
  if (flowSteps.length === 0) return proposal.trim();
  const catMatches = flowSteps.filter((s) => normalizeStage(s) === targetCat);
  if (catMatches.length > 0) return catMatches[0];

  let best = flowSteps[0];
  let bestDiff = Math.abs(stageRank(flowSteps[0]) - stageRank(targetCat));
  for (const s of flowSteps.slice(1)) {
    const diff = Math.abs(stageRank(s) - stageRank(targetCat));
    if (diff < bestDiff) {
      best = s;
      bestDiff = diff;
    }
  }
  return best;
}

/* ================== 進行判定 ================== */
function makeSignature(date: string, location: string) {
  return `${date.trim()}|${(location || "").trim().toLowerCase()}`;
}

function shouldAdvanceByDate(company: Company, date?: string, location?: string) {
  if (!date || !date.trim()) return false;
  const sig = makeSignature(date, location || "");
  const history = company.eventHistory ?? [];
  return !history.includes(sig);
}

/** 反映後に履歴へ署名を積む */
function appendHistory(company: Company, date?: string, location?: string) {
  if (!date || !date.trim()) return company.eventHistory ?? [];
  const sig = makeSignature(date, location || "");
  const set = new Set([...(company.eventHistory ?? []), sig]);
  return Array.from(set);
}

/** 進捗決定（ポリシー別） */
function decideStatus(company: Company, incomingEvent?: string, incomingDate?: string, incomingLoc?: string) {
  const policy: AdvancePolicy = company.advancePolicy ?? "byDate";
  const stages = parseFlow(company.interviewFlow);
  const hasFlow = stages.length > 0;

  if (policy === "manual") {
    if (incomingDate && hasFlow && shouldAdvanceByDate(company, incomingDate, incomingLoc)) {
      return { status: company.status ?? "", advanced: false };
    }
    return { status: company.status ?? "", advanced: false };
  }

  if (policy === "byDate" && hasFlow) {
    if (shouldAdvanceByDate(company, incomingDate, incomingLoc)) {
      const next = nextStageFromFlow(company);
      return { status: next || (company.status ?? ""), advanced: true };
    }
    if (incomingEvent) {
      return { status: snapStatusToFlow(stages, incomingEvent), advanced: false };
    }
    return { status: company.status ?? "", advanced: false };
  }

  if (incomingEvent && hasFlow) {
    return { status: snapStatusToFlow(stages, incomingEvent), advanced: false };
  }
  if (incomingEvent && !hasFlow) {
    return { status: normalizeStage(incomingEvent), advanced: false };
  }
  if (!incomingEvent && hasFlow) {
    const next = nextStageFromFlow(company);
    return { status: next || (company.status ?? ""), advanced: true };
  }
  return { status: company.status ?? "", advanced: false };
}

/* ================== メール反映（公開API） ================== */
export function upsertFromParsedEmail(parsed: {
  company?: string;
  event?: string;
  date?: string;
  location?: string;
}): {
  action: "skipped_no_company" | "created" | "updated" | "no_change";
  targetName?: string;
  updatedFields?: string[];
} {
  const raw = (parsed?.company ?? "").trim();
  if (!raw) return { action: "skipped_no_company" };

  const existing = findByNormalized(raw);
  const incomingDate = (parsed.date || "").trim();
  const incomingLoc = (parsed.location || "").trim();

  if (!existing) {
    const status = parsed.event ? normalizeStage(parsed.event) : "";
    const created = upsertCompany({
      name: raw,
      status,
      nextAction: status ? `${status} の準備をする` : "",
      flowDeadline: incomingDate,
      locationHint: incomingLoc,
      notes: "",
      eventHistory: incomingDate ? [makeSignature(incomingDate, incomingLoc)] : [],
    });
    const fields = [
      status && "status",
      status && "nextAction",
      incomingDate && "flowDeadline",
      incomingLoc && "locationHint",
    ].filter(Boolean) as string[];
    return { action: "created", targetName: created.name, updatedFields: fields };
  }

  const { status: decidedStatus } = decideStatus(
    existing,
    parsed.event,
    incomingDate,
    incomingLoc
  );

  const updates: Partial<Company> = {};
  const updatedFields: string[] = [];

  if (decidedStatus && decidedStatus !== (existing.status ?? "")) {
    updates.status = decidedStatus;
    updates.nextAction = `${decidedStatus} の準備をする`;
    updatedFields.push("status", "nextAction");
  } else if (incomingDate && decidedStatus) {
    updates.nextAction = `${decidedStatus} の準備をする`;
    updatedFields.push("nextAction");
  }

  if (incomingDate && incomingDate !== (existing.flowDeadline ?? "")) {
    updates.flowDeadline = incomingDate;
    updatedFields.push("flowDeadline");
  }
  if (incomingLoc && incomingLoc !== (existing.locationHint ?? "")) {
    updates.locationHint = incomingLoc;
    updatedFields.push("locationHint");
  }

  if (incomingDate) {
    updates.eventHistory = appendHistory(existing, incomingDate, incomingLoc);
  }

  if (Object.keys(updates).length === 0) {
    return { action: "no_change", targetName: existing.name, updatedFields: [] };
  }

  upsertCompany({ name: existing.name, ...updates });
  return { action: "updated", targetName: existing.name, updatedFields };
}

/* ================== 削除 ================== */
/** IDで1社削除。成功=true / 見つからない=false */
export function removeCompany(id: string): boolean {
  const all = loadAll();
  const next = all.filter((c) => c.id !== id);
  if (next.length === all.length) return false; // 1件も消せていない
  saveAll(next);
  return true;
}

/** （おまけ）社名で削除したいとき用。正規化して一致判定 */
export function removeCompanyByName(name: string): boolean {
  const target = findByNormalized(name);
  if (!target) return false;
  return removeCompany(target.id);
}

/** 会社のカード画像（data URL）を設定／クリア(null) */
export function setCompanyImage(name: string, dataUrl: string | null): Company | undefined {
  const all = loadAll();
  const target = all.find((c) => c.name === name);
  if (!target) return;
  const updated: Company = {
    ...target,
    imageUrl: dataUrl ?? "",
    updatedAt: new Date().toISOString(),
  };
  saveAll(all.map((c) => (c.id === target.id ? updated : c)));
  return updated;
}
