"use client";
import { DraggableTabInterface } from "@/components/draggable-tab-interface";

export default function CompanyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
      <div className="mx-auto max-w-6xl p-6 space-y-4">
        <h1 className="text-3xl font-bold text-gray-800">Draggable Tab Interface</h1>
        <DraggableTabInterface />
      </div>
    </div>
  );
}
