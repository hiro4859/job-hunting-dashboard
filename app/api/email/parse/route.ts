import { NextResponse } from "next/server";

/* ───────── utils ───────── */
const pad = (n: number) => n.toString().padStart(2, "0");
const ymdhm = (y: number, m: number, d: number, hh: number, mm: number) =>
  `${y}-${pad(m)}-${pad(d)} ${pad(hh)}:${pad(mm)}`;
const toFourDigitYear = (y: number) => (y < 100 ? 2000 + y : y);

// 翌年補正（本文に年が無いとき用）
function inferYearFor(month: number, day: number) {
  const now = new Date();
  const y = now.getFullYear();
  const candidate = new Date(y, month - 1, day, 0, 0, 0);
  // きのう以前の日付が本文に現れたら翌年とみなす（+1日バッファ）
  return candidate.getTime() + 24 * 60 * 60 * 1000 < now.getTime() ? y + 1 : y;
}

// 午前/午後 or AM/PM → 24h 変換
function to24h(h: number, ampm?: string) {
  if (!ampm) return h;
  const s = ampm.toLowerCase();
  if (/(pm|午後)/.test(s)) return h === 12 ? 12 : h + 12;
  if (/(am|午前)/.test(s)) return h === 12 ? 0 : h;
  return h;
}

/* ───────── DateTime parsers ───────── */
// 例: 7月3日（木） 13時30分〜15時 / 午後1時〜2時
function parseJapaneseDateTimeRange(src: string): string | null {
  const r =
    /(\d{1,2})月(\d{1,2})日(?:（[^）]*）|\([^)]*\))?\s*(午前|午後)?\s*(\d{1,2})\s*時(?:\s*(\d{1,2})\s*分?)?\s*[〜～\-~ー—–]*\s*(?:(午前|午後)?\s*(\d{1,2})\s*時(?:\s*(\d{1,2})\s*分?)?)?/;
  const m = src.match(r);
  if (!m) return null;
  const month = parseInt(m[1], 10);
  const day = parseInt(m[2], 10);
  const sh = to24h(parseInt(m[4], 10), m[3] ?? undefined);
  const sm = m[5] ? parseInt(m[5], 10) : 0;
  const eh = m[7] ? to24h(parseInt(m[7], 10), m[6] ?? undefined) : null;
  const em = m[8] ? parseInt(m[8], 10) : 0;
  const year = inferYearFor(month, day);
  const startStr = ymdhm(year, month, day, sh, sm);
  const endStr = eh !== null ? ymdhm(year, month, day, eh, em) : null;
  return endStr ? `${startStr} 〜 ${endStr}` : startStr;
}

// 例: 2025/07/03 13:30 - 15:00 / 7-3 13:30〜15:00 / 7.3 9:00
function parseSlashDateTimeRange(src: string): string | null {
  const r =
    /(?:(\d{2,4})[\/\-\.年]\s*)?(\d{1,2})[\/\-\.月]\s*(\d{1,2})\s*日?\s*(?:（[^）]*）|\([^)]*\))?\s*(AM|PM|午前|午後)?\s*(\d{1,2}):(\d{2})\s*(?:[〜～\-~ー—–]\s*(AM|PM|午前|午後)?\s*(\d{1,2}):(\d{2}))?/i;
  const m = src.match(r);
  if (!m) return null;
  const yRaw = m[1] ? parseInt(m[1], 10) : null;
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  const sh = to24h(parseInt(m[5], 10), m[4] ?? undefined);
  const sm = parseInt(m[6], 10);
  const eh = m[8] ? to24h(parseInt(m[8], 10), m[7] ?? undefined) : null;
  const em = m[9] ? parseInt(m[9], 10) : 0;

  const year = yRaw ? toFourDigitYear(yRaw) : inferYearFor(month, day);
  const startStr = ymdhm(year, month, day, sh, sm);
  const endStr = eh !== null ? ymdhm(year, month, day, eh, em) : null;
  return endStr ? `${startStr} 〜 ${endStr}` : startStr;
}

/* ───────── Feature extractors ───────── */
function extractLocation(text: string): string {
  if (/Teams/i.test(text)) return "Teams";
  if (/Zoom/i.test(text)) return "Zoom";
  if (/Google\s*Meet/i.test(text)) return "Google Meet";
  if (/対面|会場|本社|支社|オフィス|会議室/.test(text)) return "対面";
  if (/オンライン|Web\s*面接/.test(text)) return "オンライン";
  return ""; // 見つからなければ空
}
function extractEventType(text: string): string {
  const t = text.normalize("NFKC");

  if (/最終面接/.test(t)) return "最終面接";
  if (/(一次|1次).{0,5}面接|面接.{0,5}(一次|1次)/.test(t)) return "一次面接";
  if (/(二次|2次).{0,5}面接|面接.{0,5}(二次|2次)/.test(t)) return "二次面接";
  if (/(三次|3次).{0,5}面接|面接.{0,5}(三次|3次)/.test(t)) return "三次面接";
  if (/面接/.test(t)) return "面接";

  if (/面談|カジュアル/.test(t)) return "面談";
  if (/説明会/.test(t)) return "説明会";
  if (/グループ.?ディスカッション|GD/i.test(t)) return "グループディスカッション";

  if (/web.?テスト|webtest|適性|spi|玉手箱|筆記|学力テスト/i.test(t)) return "Webテスト";

  return ""; // 既知カテゴリが無ければ空
}

/* ───────── API ───────── */
export async function POST(req: Request) {
  const { emailText } = await req.json();
  if (!emailText || typeof emailText !== "string") {
    return NextResponse.json({ error: "emailText が無効です" }, { status: 400 });
  }

  const src = emailText.normalize("NFKC");
  // 検出できなければ空文字（←副作用防止）
  const date = parseSlashDateTimeRange(src) ?? parseJapaneseDateTimeRange(src) ?? "";
  const location = extractLocation(src) ?? "";
  const event = extractEventType(src) ?? "";

  return NextResponse.json({ event, date, location });
}
