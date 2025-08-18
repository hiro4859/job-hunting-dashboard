// app/utils/templateEngine.ts

// any を使わず、JSON 互換の型で文脈（コンテキスト）を表現
type Primitive = string | number | boolean | null | undefined;
type JSONValue = Primitive | JSONObject | JSONArray;
interface JSONObject {
  [key: string]: JSONValue;
}
interface JSONArray extends Array<JSONValue> {}

/** 深いパス (a.b.c) をたどって値を取得 */
function getPath(obj: JSONObject | undefined, path: string): JSONValue {
  if (!obj) return undefined;
  return path.split(".").reduce<JSONValue>((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined;
    // acc が配列の可能性もあるが、key は string なので as any を避けるためにチェック
    if (Array.isArray(acc)) {
      // 配列にドットでアクセスするケースは想定外（必要になれば拡張）
      return undefined;
    }
    return (acc as JSONObject)[key];
  }, obj);
}

/** テンプレ式を評価（join / a || b / 通常の変数参照） */
function evalExpr(expr: string, ctx: JSONObject): JSONValue {
  // join users.names "、"
  const join = expr.match(/^join\s+([a-zA-Z0-9_.]+)\s+"([^"]*)"$/);
  if (join) {
    const arr = getPath(ctx, join[1]);
    const sep = join[2];
    if (Array.isArray(arr)) {
      // 文字列/数値は join、それ以外は文字列化
      return arr.map((v) => (v == null ? "" : String(v))).join(sep);
    }
    return "";
  }

  // a || b || "fallback"
  const orParts = expr.split("||").map((s) => s.trim());
  if (orParts.length > 1) {
    for (const p of orParts) {
      // クォートを外してリテラル判定
      const unquoted =
        p.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
      // 先頭が英字なら変数参照とみなす / それ以外は文字列リテラル
      const v: JSONValue = /^[a-zA-Z_]/.test(unquoted)
        ? getPath(ctx, unquoted)
        : unquoted;

      if (v != null && String(v).trim() !== "") return v;
    }
    return "";
  }

  // 通常の変数参照
  return getPath(ctx, expr);
}

/** メイン：{{var}} / {{#if cond}} ... {{/if}} を置換 */
export function renderTemplate(src: string, ctx: JSONObject): string {
  // if ブロック
  src = src.replace(
    /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_m, cond: string, inner: string) =>
      evalTruthy(evalExpr(cond.trim(), ctx)) ? inner : ""
  );

  // 単純置換
  src = src.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_m, expr: string) => {
    const v = evalExpr(expr.trim(), ctx);
    return v == null ? "" : String(v);
  });

  // 行末の余分な空白を整理
  return src.replace(/[ \t]+\n/g, "\n").trim();
}

/** if 判定用の truthy 判定（空文字/空配列/空オブジェクトは false 扱い） */
function evalTruthy(v: JSONValue): boolean {
  if (!v) return false; // undefined/null/false/0/""
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v as JSONObject).length > 0;
  return Boolean(v);
}

/** 例：2025-08-18 14:30 -> 2025/08/18（月）14:30 */
export function formatDateJP(src?: string): string {
  if (!src) return "";
  const m = src.match(
    /(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s+(\d{1,2}):(\d{2})/
  );
  if (!m) return src;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const hh = Number(m[4]);
  const mm = Number(m[5]);
  const date = new Date(y, mo - 1, d, hh, mm);
  const w = "日月火水木金土"[date.getDay()];
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${y}/${pad(mo)}/${pad(d)}（${w}）${pad(hh)}:${m[5]}`;
}
