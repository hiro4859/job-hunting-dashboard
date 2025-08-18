"use client";

import { useState } from "react";
import {
  upsertFromParsedEmail,
  listCompanies,
  type Company,
} from "./utils/companyStore";

type Parsed = {
  company?: string;
  event?: string;
  date?: string;
  location?: string;
};

export default function DashboardPage() {
  const [emailText, setEmailText] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>(() => listCompanies());

  const handleParse = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/email/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText }),
      });
      const data: Parsed = await res.json();
      setParsed(data);

      // 解析結果を企業マスタへ反映（自動更新）
      upsertFromParsedEmail(data);
      // 一覧を更新
      setCompanies(listCompanies());
    } catch (e) {
      console.error(e);
      alert("解析に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">就活タスク管理ダッシュボード</h1>

      <section className="rounded border p-4 space-y-3">
        <textarea
          className="w-full min-h-[160px] rounded border p-3"
          placeholder="企業から届いたメール本文を貼り付け"
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
        />

        <button
          onClick={handleParse}
          disabled={loading || !emailText.trim()}
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "解析中..." : "解析する"}
        </button>

        {parsed && (
          <div className="mt-3 rounded border bg-white p-4">
            <p>
              <b>企業名：</b>
              {parsed.company ?? "-"}
            </p>
            <p>
              <b>イベント：</b>
              {parsed.event ?? "-"}
            </p>
            <p>
              <b>日時：</b>
              {parsed.date ?? "-"}
            </p>
            <p>
              <b>場所：</b>
              {parsed.location ?? "-"}
            </p>
          </div>
        )}
      </section>

      <section className="rounded border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">登録済み企業</h2>
          <a href="/company" className="text-blue-700 underline">
            企業情報の登録・編集 →
          </a>
        </div>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          {companies.length === 0 && <li>（まだありません）</li>}
          {companies.map((c: Company) => (
            <li key={c.id}>
              <span className="font-medium">{c.name}</span>
              {c.status ? ` / 状況: ${c.status}` : ""}
              {c.flowDeadline ? ` / 締切: ${c.flowDeadline}` : ""}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
