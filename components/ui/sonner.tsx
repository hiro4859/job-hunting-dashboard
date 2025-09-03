"use client";

import { Toaster } from "sonner";
export { Toaster }; // ← これで外から使えるようにする

export function Sonner() {
  return (
    <Toaster
      position="top-right"        // 表示位置
      richColors                  // 成功・エラーなどを色付きにする
      expand={false}              // 複数通知を展開しない
      closeButton                 // 各通知に閉じるボタンを付ける
      toastOptions={{
        duration: 4000,           // 通知の表示時間 (ms)
        style: {
          borderRadius: "0.5rem",
          background: "#fff",
          color: "#333",
          boxShadow:
            "0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)",
        },
      }}
    />
  );
}
