"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MAIL_TEMPLATES, type MailTemplate as TMail, type Field } from "@/app/templates/mailTemplates";
import { renderTemplate, type JSONObject } from "@/app/utils/templateEngine";

/* ---------------- プロフィール ---------------- */
type Profile = {
  name: string;
  university: string;
  faculty: string;
  department: string;
  tel: string;
  email: string;
};
const DEFAULT_PROFILE: Profile = {
  name: "",
  university: "",
  faculty: "",
  department: "",
  tel: "",
  email: "",
};
const LS_PROFILE = "jp.jobhunt.profile.v1";

/* ---------------- 入力値 ---------------- */
type FormValues = Record<string, string>;

/* ---------------- ユーティリティ ---------------- */
function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function parseToParts(src?: string) {
  // 期待フォーマット: "YYYY-MM-DD HH:mm" or "YYYY/MM/DD HH:mm" or "YYYY.M.D H:mm" など緩め対応
  if (!src?.trim()) return null;
  const m = src.match(
    /(\d{4})[\/\-.年]\s*(\d{1,2})[\/\-.月]\s*(\d{1,2})\s*日?\s*(\d{1,2}):(\d{2})/
  );
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const hh = Number(m[4]);
  const mi = Number(m[5]);
  const dt = new Date(y, mo - 1, d, hh, mi);
  const wd = "日月火水木金土"[dt.getDay()];
  return {
    yyyy: String(y),
    mm: pad(mo),
    dd: pad(d),
    hh: pad(hh),
    mi: pad(mi),
    weekday: wd,
  };
}

/** datetime-local 入力値をテンプレ互換の文字列へ（"YYYY-MM-DD HH:mm"） */
function fromDatetimeLocal(v: string) {
  // v: "2025-07-03T13:30"
  if (!v) return "";
  return v.replace("T", " ");
}

/** フィールド型に応じた入力 */
function FieldInput({
  f,
  value,
  onChange,
}: {
  f: Field;
  value: string;
  onChange: (v: string) => void;
}) {
  if (f.type === "textarea") {
    return (
      <textarea
        className="w-full rounded border p-2 text-sm min-h-[90px]"
        placeholder={f.placeholder ?? ""}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (f.type === "select") {
    return (
      <select
        className="w-full rounded border p-2 text-sm"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— 選択 —</option>
        {f.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  if (f.type === "datetime") {
    // 内部は "YYYY-MM-DD HH:mm" に寄せる
    return (
      <input
        type="datetime-local"
        className="w-full rounded border p-2 text-sm"
        placeholder={f.placeholder ?? ""}
        // 表示用に "YYYY-MM-DDTHH:mm" に変換（簡易）
        value={(value ?? "").replace(" ", "T")}
        onChange={(e) => onChange(fromDatetimeLocal(e.target.value))}
      />
    );
  }
  // text
  return (
    <input
      className="w-full rounded border p-2 text-sm"
      placeholder={f.placeholder ?? ""}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** テンプレに渡す文脈を構築（user / date.* / 各フィールド） */
function buildContext(values: FormValues, profile: Profile) {

  const ctx: JSONObject = { ...values, user: { ...profile } };

  if (values.eventDate) {
    const p = parseToParts(values.eventDate);
    if (p) ctx.date = p as unknown as JSONObject; // 文字列だけの素直なオブジェクトなので問題なし
  }

  return ctx;
}


export default function MailTemplatesPage() {
  const templates = MAIL_TEMPLATES as TMail[];

  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id ?? "");
  const [values, setValues] = useState<FormValues>({});
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);

  // プロフィールの永続化
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_PROFILE);
      if (raw) setProfile({ ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Profile) });
    } catch {
      /* noop */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(LS_PROFILE, JSON.stringify(profile));
    } catch {
      /* noop */
    }
  }, [profile]);

  const tpl = useMemo(
    () => templates.find((t) => t.id === selectedId),
    [templates, selectedId]
  );

  const ctx = useMemo(() => buildContext(values, profile), [values, profile]);

  const subjectPreview = useMemo(() => {
    if (!tpl?.subject) return "";
    return tpl.needReplySubject ? "（返信：件名は変更しない）" : renderTemplate(tpl.subject, ctx);
  }, [tpl?.subject, tpl?.needReplySubject, ctx]);

  const bodyPreview = useMemo(() => {
    if (!tpl?.body) return "";
    return renderTemplate(tpl.body, ctx);
  }, [tpl?.body, ctx]);

  function onChangeField(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  return (
    <div className="mx-auto max-w-5xl p-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">メール例文ジェネレーター</h1>
        <Link
          href="/"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          ← ダッシュボードへ戻る
        </Link>
      </header>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        {/* 左：テンプレ＆入力 */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
          {/* テンプレ選択 */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">テンプレート</label>
            <select
              className="w-full rounded border p-2 text-sm"
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setValues({});
              }}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            {tpl?.category && (
              <div className="mt-1 text-xs text-slate-500">カテゴリ：{tpl.category}</div>
            )}
          </div>

          {/* プロフィール（user.* を満たす） */}
          <details open className="rounded border p-3 bg-slate-50">
            <summary className="cursor-pointer text-sm font-semibold">プロフィール（宛名署名に使用）</summary>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Text label="氏名" value={profile.name} onChange={(v)=>setProfile(p=>({...p,name:v}))}/>
              <Text label="大学" value={profile.university} onChange={(v)=>setProfile(p=>({...p,university:v}))}/>
              <Text label="学部" value={profile.faculty} onChange={(v)=>setProfile(p=>({...p,faculty:v}))}/>
              <Text label="学科" value={profile.department} onChange={(v)=>setProfile(p=>({...p,department:v}))}/>
              <Text label="電話" value={profile.tel} onChange={(v)=>setProfile(p=>({...p,tel:v}))}/>
              <Text label="メール" value={profile.email} onChange={(v)=>setProfile(p=>({...p,email:v}))}/>
              <p className="col-span-2 text-xs text-slate-500">
                入力は自動保存され、次回以降も使われます（ローカル保存）。
              </p>
            </div>
          </details>

          {/* テンプレ固有フィールド */}
          {tpl && (
            <div className="grid gap-3">
              {tpl.fields.map((f: Field) => (
                <div key={f.key}>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    {f.label}{f.required ? <span className="ml-1 text-rose-500">*</span> : null}
                  </label>
                  <FieldInput f={f} value={values[f.key] ?? ""} onChange={(v)=>onChangeField(f.key, v)} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 右：プレビュー */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-2 text-sm font-semibold text-slate-700">プレビュー</div>
          <div className="grid gap-2 text-sm">
            <div className="rounded border border-slate-200 bg-slate-50 p-2">
              <div className="text-xs text-slate-500">件名</div>
              <div className="whitespace-pre-wrap">
                {subjectPreview || (tpl?.needReplySubject ? "（返信：件名は変更しない）" : "（件名なし）")}
              </div>
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 p-2">
              <div className="text-xs text-slate-500">本文</div>
              <div className="whitespace-pre-wrap">{bodyPreview || "（本文）"}</div>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              className="rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
              onClick={() => navigator.clipboard.writeText(subjectPreview)}
              disabled={!subjectPreview || !!tpl?.needReplySubject}
              title={tpl?.needReplySubject ? "返信メールは件名を変更しません" : "件名をコピー"}
            >
              件名をコピー
            </button>
            <button
              className="rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
              onClick={() => navigator.clipboard.writeText(bodyPreview)}
              disabled={!bodyPreview}
            >
              本文をコピー
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ------ 小物 ------ */
function Text({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string)=>void; placeholder?: string; }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-semibold">{label}</span>
      <input className="rounded border p-2 text-sm" value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder}/>
    </label>
  );
}
