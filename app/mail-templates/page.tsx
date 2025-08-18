"use client";

import { useEffect, useMemo, useState } from "react";
import { MAIL_TEMPLATES, type MailTemplate, type Field, CATEGORIES } from "@/app/templates/mailTemplates";
import { renderTemplate, formatDateJP } from "@/app/utils/templateEngine";

type UserProfile = {
  name: string;
  university: string;
  faculty: string;
  department: string;
  email: string;
  tel: string;
};

type FormState = Record<string, string>;

// ここで {{format(xxx)}} を事前置換してからテンプレエンジンに渡す
function preFormat(src: string, ctx: Record<string, any>) {
  return src.replace(/\{\{\s*format\(([^)]+)\)\s*\}\}/g, (_, path) => {
    const key = String(path).trim();
    const v = key.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), ctx);
    return v ? formatDateJP(String(v)) : "";
  });
}

function renderWithCtx(t: MailTemplate, form: FormState, user: UserProfile) {
  // eventDate などから {date:{mm,dd}} を作る（件名で利用）
  const pickDate = form.eventDate || form.meetDate || form.sentDate || "";
  let mm = "", dd = "";
  const m = pickDate.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    mm = String(Number(m[2]));
    dd = String(Number(m[3]));
  }
  const ctx = { ...form, user, date: { mm, dd } };
  const subjectRaw = t.subject;
  const bodyRaw = t.body;

  const subject = renderTemplate(preFormat(subjectRaw, ctx), ctx);
  const body = renderTemplate(preFormat(bodyRaw, ctx), ctx);

  return { subject, body };
}

export default function MailTemplatesPage() {
  // ---- ユーザープロフィール保存（localStorage） ----
  const [user, setUser] = useState<UserProfile>({
    name: "",
    university: "",
    faculty: "",
    department: "",
    email: "",
    tel: "",
  });
  useEffect(() => {
    try {
      const raw = localStorage.getItem("jp.jobhunt.userprofile.v1");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("jp.jobhunt.userprofile.v1", JSON.stringify(user));
    } catch {}
  }, [user]);

  // ---- テンプレ選択 ----
  const [category, setCategory] = useState<string>(CATEGORIES[0] ?? "");
  const filtered = useMemo(() => MAIL_TEMPLATES.filter(t => t.category === category), [category]);
  const [tplId, setTplId] = useState<string>(() => (MAIL_TEMPLATES[0]?.id ?? ""));
  useEffect(() => {
    // カテゴリ変更時、先頭テンプレにスナップ
    if (!filtered.find(t => t.id === tplId)) {
      setTplId(filtered[0]?.id ?? "");
    }
  }, [category]); // eslint-disable-line

  const tpl = useMemo(() => MAIL_TEMPLATES.find(t => t.id === tplId)!, [tplId]);

  // ---- フォーム値 ----
  const initialForm = useMemo<FormState>(() => {
    const f: FormState = {};
    tpl?.fields.forEach(field => { f[field.key] = ""; });
    return f;
  }, [tplId]);
  const [form, setForm] = useState<FormState>(initialForm);
  useEffect(() => setForm(initialForm), [initialForm]);

  // ---- プレビュー ----
  const { subject, body } = useMemo(() => renderWithCtx(tpl, form, user), [tpl, form, user]);

  // ---- UI helpers ----
  const setField = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));
  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("コピーしました");
    } catch {
      alert("コピーに失敗しました");
    }
  };

  return (
    <main className="mx-auto max-w-6xl p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">メール例文ジェネレーター</h1>
        <a href="/" className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"> ダッシュボードへ</a>
      </header>

      {/* ユーザープロフィール */}
      <section className="rounded-2xl border bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">あなたの基本情報（署名に使用）</h2>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <Text label="氏名" value={user.name} onChange={(v)=>setUser(u=>({ ...u, name:v }))} placeholder="山田 太郎" />
          <Text label="大学" value={user.university} onChange={(v)=>setUser(u=>({ ...u, university:v }))} placeholder="〇〇大学" />
          <Text label="学部" value={user.faculty} onChange={(v)=>setUser(u=>({ ...u, faculty:v }))} placeholder="〇〇学部" />
          <Text label="学科" value={user.department} onChange={(v)=>setUser(u=>({ ...u, department:v }))} placeholder="〇〇学科" />
          <Text label="メール" value={user.email} onChange={(v)=>setUser(u=>({ ...u, email:v }))} placeholder="you@example.com" />
          <Text label="電話番号" value={user.tel} onChange={(v)=>setUser(u=>({ ...u, tel:v }))} placeholder="090-xxxx-xxxx" />
        </div>
      </section>

      {/* テンプレ選択 */}
      <section className="rounded-2xl border bg-white p-4">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <label className="grid text-sm gap-1">
            <span className="font-semibold text-slate-700">カテゴリ</span>
            <select className="rounded border p-2" value={category} onChange={(e)=>setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

        <label className="grid text-sm gap-1">
          <span className="font-semibold text-slate-700">テンプレート</span>
          <select
            className="rounded border p-2 min-w-[260px]"
            value={tplId}
            onChange={(e)=>setTplId(e.target.value)}
          >
            {filtered.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </label>

        <div className="text-xs text-slate-500 md:ml-auto">
          {tpl.needReplySubject ? " 件名は変更せず、そのまま返信（Re:）してください" : " 件名はそのまま利用可"}
        </div>
        </div>

        {/* 入力フィールド */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {tpl.fields.map((f) => (
            <FieldInput key={f.key} field={f} value={form[f.key] ?? ""} onChange={(v)=>setField(f.key, v)} />
          ))}
        </div>
      </section>

      {/* プレビュー＆コピー */}
      <section className="rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">プレビュー</h2>
          <div className="flex gap-2">
            <button onClick={()=>copyText(subject)} className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">件名をコピー</button>
            <button onClick={()=>copyText(body)} className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700">本文をコピー</button>
          </div>
        </div>

        <div className="mt-3 grid gap-3 text-sm">
          <div className="rounded border p-3 bg-[#f8fafc]">
            <div className="text-xs text-slate-500 mb-1">件名</div>
            <div className="font-medium break-words">{subject || "（入力に応じて自動生成）"}</div>
          </div>
          <div className="rounded border p-3 bg-[#f8fafc] whitespace-pre-wrap break-words">
            <div className="text-xs text-slate-500 mb-1">本文</div>
            {body || "（入力に応じて自動生成）"}
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------------- 小さなフォーム部品 ---------------- */

function FieldInput({ field, value, onChange }:{
  field: Field; value: string; onChange: (v: string)=>void;
}) {
  const base = (
    <input className="rounded border p-2" value={value} onChange={(e)=>onChange(e.target.value)} />
  );
  if (field.type === "textarea") {
    return (
      <label className="grid text-sm gap-1">
        <span className="font-semibold text-slate-700">
          {field.label}{field.required ? <span className="text-rose-600"> *</span> : null}
        </span>
        <textarea
          className="rounded border p-2 min-h-[90px]"
          placeholder={field.placeholder}
          value={value}
          onChange={(e)=>onChange(e.target.value)}
        />
      </label>
    );
  }
  if (field.type === "datetime") {
    return (
      <label className="grid text-sm gap-1">
        <span className="font-semibold text-slate-700">
          {field.label}{field.required ? <span className="text-rose-600"> *</span> : null}
        </span>
        <input
          className="rounded border p-2"
          placeholder={field.placeholder ?? "YYYY-MM-DD HH:mm"}
          value={value}
          onChange={(e)=>onChange(e.target.value)}
        />
        <span className="text-[11px] text-slate-500">例: 2025-08-20 10:00</span>
      </label>
    );
  }
  if (field.type === "select") {
    // @ts-expect-error options がある型
    const opts: string[] = field.options ?? [];
    return (
      <label className="grid text-sm gap-1">
        <span className="font-semibold text-slate-700">
          {field.label}{field.required ? <span className="text-rose-600"> *</span> : null}
        </span>
        <select className="rounded border p-2" value={value} onChange={(e)=>onChange(e.target.value)}>
          <option value=""> 選択してください </option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
    );
  }
  return (
    <label className="grid text-sm gap-1">
      <span className="font-semibold text-slate-700">
        {field.label}{field.required ? <span className="text-rose-600"> *</span> : null}
      </span>
      <input
        className="rounded border p-2"
        placeholder={field.placeholder}
        value={value}
        onChange={(e)=>onChange(e.target.value)}
      />
    </label>
  );
}

function Text({ label, value, onChange, placeholder }:{
  label: string; value: string; onChange: (v: string)=>void; placeholder?: string;
}) {
  return (
    <label className="grid text-sm gap-1">
      <span className="font-semibold text-slate-700">{label}</span>
      <input
        className="rounded border p-2"
        placeholder={placeholder}
        value={value}
        onChange={(e)=>onChange(e.target.value)}
      />
    </label>
  );
}
