// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner"; // エイリアスでOK

export const metadata: Metadata = {
  title: "就活タスク管理",
  description: "メール貼り付けで選考管理を自動化",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // next-themes が html の class/color-scheme を変えるので差分警告を抑制
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}

          {/* 追加部分: sonner のトースト表示 */}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
