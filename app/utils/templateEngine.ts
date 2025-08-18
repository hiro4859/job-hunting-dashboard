type Dict = Record<string, any>;

function getPath(obj: Dict, path: string) {
  return path.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

function evalExpr(expr: string, ctx: Dict) {
  const join = expr.match(/^join\s+([a-zA-Z0-9_.]+)\s+"([^"]*)"$/);
  if (join) {
    const arr = getPath(ctx, join[1]);
    const sep = join[2];
    return Array.isArray(arr) ? arr.join(sep) : "";
  }
  const orParts = expr.split("||").map((s) => s.trim());
  if (orParts.length > 1) {
    for (const p of orParts) {
      const lit = p.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
      const v = /^[a-zA-Z_]/.test(lit) ? getPath(ctx, lit) : lit;
      if (v != null && `${v}`.trim() !== "") return v;
    }
    return "";
  }
  return getPath(ctx, expr);
}

export function renderTemplate(src: string, ctx: Dict): string {
  src = src.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, cond, inner) =>
    evalExpr(cond.trim(), ctx) ? inner : ""
  );
  src = src.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, expr) => {
    const v = evalExpr(expr.trim(), ctx);
    return v == null ? "" : String(v);
  });
  return src.replace(/[ \t]+\n/g, "\n").trim();
}

export function formatDateJP(src?: string) {
  if (!src) return "";
  const m = src.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s+(\d{1,2}):(\d{2})/);
  if (!m) return src;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  const w = "日月火水木金土"[d.getDay()];
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${m[1]}/${pad(Number(m[2]))}/${pad(Number(m[3]))}（${w}）${pad(Number(m[4]))}:${m[5]}`;
}
