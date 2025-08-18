"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MAIL_TEMPLATES } from "@/app/templates/mailTemplates";
import { renderTemplate, formatDateJP } from "@/app/utils/templateEngine";

// ---- 型定義（mailTemplates.ts に型が無ければここで使う用）----
type FieldDef = {
  key: string;
  label: string;
  placeholder?: string;
};

type MailTemplate = {
  id: string;
  title: string;
  category?: string;
  subject?: string;
  body: string;
  fields: FieldDef[];
};

// ---- ヘルパー ----
// 置き換え前の buildContext を削除して↓に差し替え
type FormValues = Record<string, string>;

function buildContext(values: FormValues): Record<string, string> {
  // すべて文字列化して JSON 互換に
  const ctx: Record<string, string> = {};
  for (const [k, v] of Object.entries(values)) {
    ctx[k] = v ?? "";
  }
  // 例: 日付の日本語整形版を別名で追加（テンプレ側は {{ dateJP }} を使う）
  if (values.date) {
    ctx.dateJP = formatDateJP(values.date);
  }
  return ctx;
}


export default function MailTemplatesPage() {
  // テンプレ一覧（型を明示）
  const templates = MAIL_TEMPLATES as MailTemplate[];

  const [selectedId, setSelectedId] = useState<string>(
    templates.length > 0 ? templates[0].id : ""
  );
  const [values, setValues] = useState<FormValues>({});

  // 選択中テンプレ
  const tpl = useMemo(
    () => templates.find((t) => t.id === selectedId),
    [templates, selectedId]
  );

  // プレビュー
  const subjectPreview = useMemo(() => {
    if (!tpl?.subject) return "";
    return renderTemplate(tpl.subject, buildContext(values));
  }, [tpl?.subject, values]);

  const bodyPreview = useMemo(() => {
    if (!tpl?.body) return "";
    return renderTemplate(tpl.body, buildContext(values));
  }, [tpl?.body, values]);

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

      <div className="grid gap-4 md:grid-cols-2">
        {/* 左：入力 */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              テンプレート
            </label>
            <select
              className="w-full rounded border p-2 text-sm"
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setValues({}); // テンプレ切替時は入力リセット（好みで）
              }}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {tpl && (
            <div className="grid gap-3">
              {tpl.fields.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    {f.label}
                  </label>
                  <input
                    className="w-full rounded border p-2 text-sm"
                    placeholder={f.placeholder ?? ""}
                    value={values[f.key] ?? ""}
                    onChange={(e) => onChangeField(f.key, e.target.value)}
                  />
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
              <div className="whitespace-pre-wrap">{subjectPreview || "（件名なし）"}</div>
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 p-2">
              <div className="text-xs text-slate-500">本文</div>
              <div className="whitespace-pre-wrap">{bodyPreview || "（本文）"}</div>
            </div>
          </div>

          {/* クリップボードへコピー（任意） */}
          <div className="mt-3 flex gap-2">
            <button
              className="rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
              onClick={() => navigator.clipboard.writeText(subjectPreview)}
              disabled={!subjectPreview}
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
