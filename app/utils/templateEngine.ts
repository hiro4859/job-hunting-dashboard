// app/utils/templateEngine.ts

// JSON セーフな型
type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONValue[];
export type JSONObject = { [key: string]: JSONValue };

// パス "a.b.c" で掘る
function getPath(obj: JSONObject, path: string): JSONValue | undefined {
  return path.split(".").reduce<JSONValue | undefined>((acc, k) => {
    if (acc == null || typeof acc !== "object" || Array.isArray(acc)) return undefined;
    return (acc as JSONObject)[k];
  }, obj);
}

// 式の評価: join / 論理和 (a || "fallback") / 変数参照
function evalExpr(expr: string, ctx: JSONObject): JSONValue | undefined {
  // join users ", "
  const join = expr.match(/^join\s+([a-zA-Z0-9_.]+)\s+"([^"]*)"$/);
  if (join) {
    const arr = getPath(ctx, join[1]);
    const sep = join[2];
    if (Array.isArray(arr)) {
      return arr.map(v => (v == null ? "" : String(v))).join(sep);
    }
    return "";
  }

  // a || b || "text"
  const parts = expr.split("||").map(s => s.trim());
  if (parts.length > 1) {
    for (const p of parts) {
      const quoted = p.match(/^"(.*)"$|^'(.*)'$/);
      const v: JSONValue | undefined = quoted ? (quoted[1] ?? quoted[2] ?? "") : getPath(ctx, p);
      if (v != null && String(v).trim() !== "") return v;
    }
    return "";
  }

  // 変数参照
  return getPath(ctx, expr);
}

// テンプレ本体
export function renderTemplate(src: string, ctx: JSONObject): string {
  // {{#if condition}} ... {{/if}}
  src = src.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, cond: string, inner: string) =>
    evalExpr(cond.trim(), ctx) ? inner : ""
  );

  // {{ expr }}
  src = src.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, raw: string) => {
    const v = evalExpr(raw.trim(), ctx);
    return v == null ? "" : String(v);
  });

  // 末尾の空白整理
  return src.replace(/[ \t]+\n/g, "\n").trim();
}

// 日付フォーマット（YYYY/MM/DD（曜）HH:mm）
export function formatDateJP(src?: string) {
  if (!src) return "";
  const m = src.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s+(\d{1,2}):(\d{2})/);
  if (!m) return src;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  const w = "日月火水木金土"[d.getDay()];
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${m[1]}/${pad(Number(m[2]))}/${pad(Number(m[3]))}（${w}）${pad(Number(m[4]))}:${m[5]}`;
}
