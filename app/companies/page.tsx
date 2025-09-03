"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  listCompanies,
  type Company,
  setCompanyImage,
} from "@/app/utils/companyStore";

import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/components/ui/utils";
import { buttonVariants } from "@/components/ui/button";
import { toast } from "sonner";


/* 並び順 */
type SortKey = "random" | "name_asc" | "updated_desc";

/* 乱数固定用：ソート切替のたびにシャッフル */
function shuffle<T>(arr: T[], seed: number) {
  const a = [...arr];
  let x = seed || 1234567;
  const rnd = () => ((x = (1103515245 * x + 12345) % 2147483647) / 2147483647);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* DataURL 化 */
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result ?? ""));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

/* カード */
function CompanyCard({
  c,
  onImageChanged,
}: {
  c: Company;
  onImageChanged: (name: string, dataUrl: string | null) => void;
}) {
  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    e.stopPropagation();
    const f = e.target.files?.[0];
    if (!f) return;
    const dataUrl = await fileToDataURL(f);
    onImageChanged(c.name, dataUrl);
    e.currentTarget.value = "";
  }

  function clearImage(ev?: React.MouseEvent) {
    ev?.preventDefault();
    ev?.stopPropagation();
    if (!confirm(`「${c.name}」の画像を削除しますか？`)) return;
    onImageChanged(c.name, null);
  }

  return (
    <Link href={`/company?name=${encodeURIComponent(c.name)}`} className="block group" title={`${c.name} を編集`}>
      <article className="overflow-hidden rounded-2xl border bg-card shadow-sm ring-1 ring-border transition hover:shadow-md">
        {/* 画像 4:3 */}
        <div className="relative w-full pt-[75%] bg-muted">
          {c.imageUrl ? (
            <img src={c.imageUrl} alt={`${c.name} image`} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <span className="text-xs">（画像未設定）</span>
            </div>
          )}

          {/* 画像操作ボタン */}
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-2 opacity-0 transition group-hover:opacity-100">
            <label className="pointer-events-auto cursor-pointer rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground ring-1 ring-border hover:bg-background">
              画像変更
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickFile}
                onClick={(e) => e.stopPropagation()}
              />
            </label>
            {c.imageUrl && (
              <Button variant="outline" size="sm" className="pointer-events-auto rounded-full px-3 py-1 text-xs" onClick={clearImage}>
                画像削除
              </Button>
            )}
          </div>
        </div>

        {/* 本文 */}
        <div className="p-3">
          <div className="truncate text-sm font-semibold">{c.name}</div>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{c.industry || "— 業界未設定 —"}</span>
            <span className="rounded bg-muted px-2 py-0.5 ring-1 ring-border">
              志望度 {c.interest ?? 3}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("random");
  const [seed, setSeed] = useState<number>(() => Date.now() % 2147483647);

  useEffect(() => {
    setCompanies(listCompanies());
  }, []);

  const industries = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => c.industry && set.add(c.industry));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b, "ja"))];
  }, [companies]);

  const filtered = useMemo(() => {
    let arr = companies.filter((c) => {
      const okIndustry = industry === "all" || c.industry === industry;
      const okQ =
        !q.trim() ||
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        (c.industry ?? "").toLowerCase().includes(q.toLowerCase());
      return okIndustry && okQ;
    });

    if (sortKey === "name_asc") {
      arr = [...arr].sort((a, b) => a.name.localeCompare(b.name, "ja"));
    } else if (sortKey === "updated_desc") {
      arr = [...arr].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } else {
      arr = shuffle(arr, seed);
    }
    return arr;
  }, [companies, industry, q, sortKey, seed]);

  function onImageChanged(name: string, dataUrl: string | null) {
    const updated = setCompanyImage(name, dataUrl);
    if (!updated) return;
    setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (dataUrl) {
    toast.success(`「${name}」の画像を更新しました`);
  } else {
    toast(`「${name}」の画像を削除しました`);
  }
  }

  function refresh() {
    setCompanies(listCompanies());
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto max-w-7xl p-4">
        {/* ヘッダー */}
        <header className="mb-4 flex items-center justify-between rounded-2xl bg-card px-4 py-3 shadow-sm ring-1 ring-border">
          <h1 className="text-lg font-bold text-primary">企業カード一覧</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/"
               className={cn(buttonVariants({ variant: "outline", size: "default" }))}
                >
               ← ダッシュボードへ
            </Link>

            <Button variant="outline" onClick={refresh}>一覧を更新</Button>
          </div>
        </header>

        {/* 検索バー */}
<div className="mb-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
  <div className="flex flex-wrap items-center gap-2">
    <Input
      value={q}
      onChange={(e) => setQ(e.target.value)}
      placeholder="企業名・業界で検索…"
      className="h-10 flex-1 min-w-[200px]"
    />

    <Select value={industry} onValueChange={(v) => setIndustry(v)}>
      <SelectTrigger className="w-[180px] h-10">
        <SelectValue placeholder="業界を選ぶ" />
      </SelectTrigger>
      <SelectContent>
        {industries.map((it) => (
          <SelectItem key={it} value={it}>
            {it === "all" ? "すべての業界" : it}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    <Select
      value={sortKey}
      onValueChange={(next) => {
        const n = next as SortKey;
        setSortKey(n);
        if (n === "random")
          setSeed((s) => (s * 1664525 + 1013904223) % 2147483647);
      }}
    >
      <SelectTrigger className="w-[200px] h-10">
        <SelectValue placeholder="並び替え" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="random">ランダム</SelectItem>
        <SelectItem value="name_asc">名前順</SelectItem>
        <SelectItem value="updated_desc">更新日時（新しい順）</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>


        {/* グリッド */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground">
              条件に合う企業がありません。
            </div>
          ) : (
            filtered.map((c) => (
              <CompanyCard key={c.id} c={c} onImageChanged={onImageChanged} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
