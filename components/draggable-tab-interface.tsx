"use client";

import type React from "react";
import { useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

/** Inline SVG icons to avoid extra deps */
function IconChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M9 6l6 6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconMaximize(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M3 16v3a2 2 0 002 2h3M21 16v3a2 2 0 01-2 2h-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconMinimize(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M8 3v3a2 2 0 01-2 2H3M21 8h-3a2 2 0 01-2-2V3M3 16h3a2 2 0 012 2v3M16 21v-3a2 2 0 012-2h3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface Tab {
  id: string;
  title: string;
  content: string;
  color: string;
}

const tabs: Tab[] = [
  { id: "tab1", title: "Dashboard", content: "Dashboard content with charts and analytics", color: "bg-blue-500" },
  { id: "tab2", title: "Projects", content: "Project management and task tracking", color: "bg-green-500" },
  { id: "tab3", title: "Settings", content: "Application settings and preferences", color: "bg-purple-500" },
];

export function DraggableTabInterface() {
  const [activeTab, setActiveTab] = useState(1); // 0, 1, 2 for left, center, right
  const [selectedTabs, setSelectedTabs] = useState<string[]>(["tab2"]); // Default to center tab
  const [viewMode, setViewMode] = useState<"carousel" | "fullscreen">("carousel");
  const [splitRatio, setSplitRatio] = useState(50); // For two-tab split view
  const [threeScreenRatios, setThreeScreenRatios] = useState([33.33, 33.33, 33.34]); // For three-tab split view
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTabSelect = (tabId: string, checked: boolean) => {
    if (checked) {
      setSelectedTabs((prev) => [...prev, tabId]);
    } else {
      setSelectedTabs((prev) => prev.filter((id) => id !== tabId));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartX.current;
    const threshold = 100;

    if (deltaX > threshold && activeTab > 0) {
      setActiveTab(activeTab - 1);
      dragStartX.current = e.clientX;
    } else if (deltaX < -threshold && activeTab < 2) {
      setActiveTab(activeTab + 1);
      dragStartX.current = e.clientX;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getTabTransform = (index: number) => {
    const offset = (index - activeTab) * 300;
    const scale = index === activeTab ? 1 : 0.85;
    const zIndex = index === activeTab ? 10 : 5;

    return {
      transform: `translateX(${offset}px) scale(${scale})`,
      zIndex,
      opacity: Math.abs(index - activeTab) > 1 ? 0.3 : 1,
    };
  };

  const handleSplitResize = (e: React.MouseEvent<HTMLDivElement>) => {
  const startX = e.clientX;
  const startRatio = splitRatio;
  


    const onMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.offsetWidth;
      const deltaX = e.clientX - startX;
      const deltaRatio = (deltaX / containerWidth) * 100;
      const newRatio = Math.max(20, Math.min(80, startRatio + deltaRatio));
      setSplitRatio(newRatio);
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const handleThreeScreenResize = (dividerIndex: number, e: React.MouseEvent) => {
    const startX = e.clientX;
    const startRatios = [...threeScreenRatios];

    const onMove = (e2: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.offsetWidth;
      const deltaX = e2.clientX - startX;
      const deltaRatio = (deltaX / containerWidth) * 100;

      const newRatios = [...startRatios];

      if (dividerIndex === 0) {
        const newFirst = Math.max(15, Math.min(70, startRatios[0] + deltaRatio));
        const newSecond = Math.max(15, Math.min(70, startRatios[1] - deltaRatio));
        newRatios[0] = newFirst;
        newRatios[1] = newSecond;
      } else {
        const newSecond = Math.max(15, Math.min(70, startRatios[1] + deltaRatio));
        const newThird = Math.max(15, Math.min(70, startRatios[2] - deltaRatio));
        newRatios[1] = newSecond;
        newRatios[2] = newThird;
      }

      setThreeScreenRatios(newRatios);
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const navigateLeft = () => {
    if (activeTab > 0) setActiveTab(activeTab - 1);
  };

  const navigateRight = () => {
    if (activeTab < 2) setActiveTab(activeTab + 1);
  };

  const renderCarouselView = () => (
    <div className="relative h-[500px] overflow-hidden">
      <div
        className="flex items-center justify-center h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className="absolute w-80 h-80 transition-all duration-300 ease-out cursor-pointer"
            style={getTabTransform(index)}
            onClick={() => setActiveTab(index)}
          >
            <div className="h-full rounded-lg bg-white/20 backdrop-blur-md border border-white/30 shadow-xl text-white p-6 flex flex-col justify-center items-center">
              <h3 className="text-2xl font-bold mb-4 text-shadow">{tab.title}</h3>
              <p className="text-center opacity-90 text-shadow">{tab.content}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all inline-flex items-center justify-center rounded-md border px-2.5 py-2 text-sm text-gray-800"
        onClick={navigateLeft}
        disabled={activeTab === 0}
        aria-label="Previous"
      >
        <IconChevronLeft className="w-4 h-4" />
      </button>

      <button
        type="button"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all inline-flex items-center justify-center rounded-md border px-2.5 py-2 text-sm text-gray-800"
        onClick={navigateRight}
        disabled={activeTab === 2}
        aria-label="Next"
      >
        <IconChevronRight className="w-4 h-4" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {tabs.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`w-3 h-3 rounded-full transition-colors ${index === activeTab ? "bg-white" : "bg-white/50"}`}
            onClick={() => setActiveTab(index)}
            aria-label={`Go to ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );

  const renderFullscreenView = () => {
    const selectedTabData = tabs.filter((tab) => selectedTabs.includes(tab.id));

    if (selectedTabData.length === 1) {
      const tab = selectedTabData[0];
      return (
        <div className="fixed inset-0 z-50">
          <div
            className="h-full bg-white/20 backdrop-blur-md border border-white/30 text-white p-8 flex flex-col justify-center items-center"
            style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}
          >
            <h2 className="text-6xl font-bold mb-8" style={{ textShadow: "3px 3px 6px rgba(0,0,0,0.9)" }}>
              {tab.title}
            </h2>
            <p className="text-2xl text-center opacity-90" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}>
              {tab.content}
            </p>
          </div>
        </div>
      );
    }

    if (selectedTabData.length === 2) {
      return (
        <div ref={containerRef} className="fixed inset-0 z-50 flex">
          <div className="h-full transition-all duration-200" style={{ width: `${splitRatio}%` }}>
            <div
              className="h-full bg-white/20 backdrop-blur-md border border-white/30 text-white p-8 flex flex-col justify-center items-center"
              style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}
            >
              <h3 className="text-4xl font-bold mb-6" style={{ textShadow: "3px 3px 6px rgba(0,0,0,0.9)" }}>
                {selectedTabData[0].title}
              </h3>
              <p className="text-xl text-center opacity-90" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}>
                {selectedTabData[0].content}
              </p>
            </div>
          </div>

          <div
            className="w-2 bg-white/30 cursor-col-resize hover:bg-white/50 transition-colors"
            onMouseDown={handleSplitResize}
          />

          <div className="h-full transition-all duration-200" style={{ width: `${100 - splitRatio}%` }}>
            <div
              className="h-full bg-white/20 backdrop-blur-md border border-white/30 text-white p-8 flex flex-col justify-center items-center"
              style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}
            >
              <h3 className="text-4xl font-bold mb-6" style={{ textShadow: "3px 3px 6px rgba(0,0,0,0.9)" }}>
                {selectedTabData[1].title}
              </h3>
              <p className="text-xl text-center opacity-90" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}>
                {selectedTabData[1].content}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (selectedTabData.length === 3) {
      return (
        <div ref={containerRef} className="fixed inset-0 z-50 flex">
          <div className="h-full transition-all duration-200" style={{ width: `${threeScreenRatios[0]}%` }}>
            <div
              className="h-full bg-white/20 backdrop-blur-md border border-white/30 text-white p-6 flex flex-col justify-center items-center"
              style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}
            >
              <h3 className="text-3xl font-bold mb-4" style={{ textShadow: "3px 3px 6px rgba(0,0,0,0.9)" }}>
                {selectedTabData[0].title}
              </h3>
              <p className="text-lg text-center opacity-90" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}>
                {selectedTabData[0].content}
              </p>
            </div>
          </div>

          <div
            className="w-2 bg-white/30 cursor-col-resize hover:bg-white/50 transition-colors"
            onMouseDown={(e) => handleThreeScreenResize(0, e)}
          />

          <div className="h-full transition-all duration-200" style={{ width: `${threeScreenRatios[1]}%` }}>
            <div
              className="h-full bg-white/20 backdrop-blur-md border border-white/30 text-white p-6 flex flex-col justify-center items-center"
              style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}
            >
              <h3 className="text-3xl font-bold mb-4" style={{ textShadow: "3px 3px 6px rgba(0,0,0,0.9)" }}>
                {selectedTabData[1].title}
              </h3>
              <p className="text-lg text-center opacity-90" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}>
                {selectedTabData[1].content}
              </p>
            </div>
          </div>

          <div
            className="w-2 bg-white/30 cursor-col-resize hover:bg-white/50 transition-colors"
            onMouseDown={(e) => handleThreeScreenResize(1, e)}
          />

          <div className="h-full transition-all duration-200" style={{ width: `${threeScreenRatios[2]}%` }}>
            <div
              className="h-full bg-white/20 backdrop-blur-md border border-white/30 text-white p-6 flex flex-col justify-center items-center"
              style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}
            >
              <h3 className="text-3xl font-bold mb-4" style={{ textShadow: "3px 3px 6px rgba(0,0,0,0.9)" }}>
                {selectedTabData[2].title}
              </h3>
              <p className="text-lg text-center opacity-90" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}>
                {selectedTabData[2].content}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-96 flex items-center justify-center">
        <p className="text-gray-500">Select at least one tab to view</p>
      </div>
    );
  };

  if (viewMode === "fullscreen" && selectedTabs.length > 0) {
    return (
      <>
        {renderFullscreenView()}
        <button
          type="button"
          className="fixed top-4 right-4 z-[60] bg-white/80 backdrop-blur-sm hover:bg-white/90 inline-flex items-center justify-center rounded-md border px-2.5 py-2 text-sm text-gray-800"
          onClick={() => setViewMode("carousel")}
          aria-label="Exit fullscreen"
        >
          <IconMinimize className="w-4 h-4" />
        </button>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Draggable Tab Interface</h1>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setViewMode("carousel")}
              className={`flex items-center space-x-2 bg-white/80 backdrop-blur-sm hover:bg-white/90 rounded-md border px-3 py-2 text-sm ${
                viewMode === "carousel" ? "ring-1 ring-gray-300" : ""
              }`}
              aria-pressed={viewMode === "carousel"}
            >
              <IconMinimize className="w-4 h-4" />
              <span>Carousel</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("fullscreen")}
              className={`flex items-center space-x-2 bg-white/80 backdrop-blur-sm hover:bg-white/90 rounded-md border px-3 py-2 text-sm ${
                viewMode === "fullscreen" ? "ring-1 ring-gray-300" : ""
              }`}
              aria-pressed={viewMode === "fullscreen"}
            >
              <IconMaximize className="w-4 h-4" />
              <span>Fullscreen</span>
            </button>
          </div>
        </div>

        {/* Tab Selection - only show in carousel mode */}
        <div className="p-2">
          <h3 className="text-sm font-semibold mb-2 text-gray-800">Select Tabs to Display</h3>
          <div className="flex space-x-6">
            {tabs.map((tab) => (
              <div key={tab.id} className="flex items-center space-x-2">
                <Checkbox
                  id={tab.id}
                  checked={selectedTabs.includes(tab.id)}
                  onCheckedChange={(checked: boolean) => handleTabSelect(tab.id, checked)}
                />
                <label htmlFor={tab.id} className="text-xs font-medium cursor-pointer text-gray-700">
                  {tab.title}
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Selected: {selectedTabs.length} tab(s) -
            {selectedTabs.length === 1 && " Single view"}
            {selectedTabs.length === 2 && " Split view (resizable)"}
            {selectedTabs.length === 3 && " Triple view (resizable)"}
          </p>
        </div>

        {/* Main Content */}
        <div className="p-6">{renderCarouselView()}</div>

        {/* Instructions */}
        <div className="p-4">
          <h4 className="font-semibold mb-2 text-gray-800">How to use:</h4>
          <ul className="text-sm space-y-1 text-gray-700">
            <li>
              • <strong>Carousel mode:</strong> Click and drag to slide between tabs, use arrow buttons, or click the
              dots
            </li>
            <li>
              • <strong>Fullscreen mode:</strong> Select 1-3 tabs above to view them in different layouts
            </li>
            <li>
              • <strong>Split view:</strong> When 2 tabs are selected, drag the divider to resize panels
            </li>
            <li>
              • <strong>Triple view:</strong> All 3 tabs displayed in a resizable grid layout with draggable dividers
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
