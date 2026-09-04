"use client";

// Main Workspace — draggable/resizable panel grid (react-grid-layout v2) per FORGE spec Phase 3.
// 3 default panels: Execution Dashboard, Research & Context, Output Canvas.
// Drag from headers, resize from corners, maximize, persist layout in localStorage.

import { useEffect, useMemo, useState } from "react";
import GridLayout, {
  Layout,
  LayoutItem,
  useContainerWidth,
} from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { LayoutDashboard, Search, Monitor } from "lucide-react";
import { PanelHeader } from "./PanelHeader";
import { ExecutionDashboard } from "./panels/ExecutionDashboard";
import { ResearchPanel } from "./panels/ResearchPanel";
import { OutputCanvasPanel } from "./panels/OutputCanvasPanel";
import { useForgeStore } from "@/lib/store/forge";

const GRID_CONFIG = {
  cols: 12,
  rowHeight: 44,
  margin: [12, 12] as [number, number],
  containerPadding: [12, 12] as [number, number],
  maxRows: Infinity,
};

const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: "execution", x: 0, y: 0, w: 7, h: 8, minW: 4, minH: 4 },
  { i: "research", x: 7, y: 0, w: 5, h: 8, minW: 4, minH: 4 },
  { i: "output", x: 0, y: 8, w: 12, h: 5, minW: 6, minH: 3 },
];

const STORAGE_KEY = "forge-panel-layout-v3";

// Ensure every default panel exists in the layout (fixes old saved layouts
// where a panel was removed by the previous close behavior).
function normalizeLayout(saved: LayoutItem[] | null): LayoutItem[] {
  if (!saved || !Array.isArray(saved)) return DEFAULT_LAYOUT;
  const byId = new Map(saved.map((l) => [l.i, l]));
  for (const d of DEFAULT_LAYOUT) {
    if (!byId.has(d.i)) {
      const idx = saved.length;
      saved.push({ ...d, x: (idx * 4) % 12, y: 0 });
    }
  }
  return saved;
}

const PANEL_META: Record<string, { title: string; icon: React.ReactNode }> = {
  execution: { title: "Execution Dashboard", icon: <LayoutDashboard size={14} /> },
  research: { title: "Research & Context", icon: <Search size={14} /> },
  output: { title: "Output Canvas", icon: <Monitor size={14} /> },
};

const MAX_PANELS = 4;

function baseId(id: string) {
  return id.includes("#") ? id.split("#")[0] : id;
}

export function PanelGrid() {
  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: true,
  });
  const [layout, setLayout] = useState<LayoutItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return normalizeLayout(saved ? (JSON.parse(saved) as LayoutItem[]) : null);
    } catch {}
    return DEFAULT_LAYOUT;
  });
  const [splitCounter, setSplitCounter] = useState(1);
  const panelVisibility = useForgeStore((s) => s.panelVisibility);
  const maximized = useForgeStore((s) => s.maximizedPanel);
  const setMaximizedPanel = useForgeStore((s) => s.setMaximizedPanel);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {}
  }, [layout]);

  function closePanel(id: string) {
    const base = baseId(id);
    // remove the panel (and its split copies) from layout + hide it
    setLayout((prev) => prev.filter((l) => !(l.i === id || baseId(l.i) === base)));
    if (maximized === id) setMaximizedPanel(null);
  }

  function splitPanel(id: string, dir: "right" | "down") {
    const base = baseId(id);
    if (layout.length >= MAX_PANELS) return;
    const source = layout.find((l) => l.i === id);
    if (!source) return;
    const newId = `${base}#${splitCounter}`;
    const gap = 1;
    let x = source.x + source.w + gap;
    let y = source.y;
    let w = Math.max(4, Math.floor(source.w / 2));
    let h = Math.max(3, Math.floor(source.h / 2));
    if (dir === "down") {
      x = source.x;
      y = source.y + source.h + gap;
      w = source.w;
      h = Math.max(3, source.h);
    }
    if (x + w > 12) x = Math.max(0, 12 - w);
    setLayout((prev) => [...prev, { i: newId, x, y, w, h, minW: 4, minH: 3 }]);
    setSplitCounter((c) => c + 1);
  }

  // single maximized panel => full-screen overlay within workspace
  const maxPanel = maximized ? PANEL_META[baseId(maximized)] : null;
  const content = useMemo(
    () => ({
      execution: <ExecutionDashboard />,
      research: <ResearchPanel />,
      output: <OutputCanvasPanel />,
    }),
    []
  );

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {maxPanel ? (
        <div className="glass absolute inset-0 z-30 flex flex-col overflow-hidden">
          <PanelHeader
            icon={maxPanel.icon}
            title={maxPanel.title}
            onMaximize={() => setMaximizedPanel(null)}
          />
          <div className="flex-1 overflow-y-auto">{maximized ? content[baseId(maximized) as keyof typeof content] : null}</div>
        </div>
      ) : !mounted ? (
        <div className="glass flex h-full items-center justify-center">
          <p className="text-2xs text-slate2-muted">Loading workspace…</p>
        </div>
      ) : (
        <GridLayout
          width={width}
          layout={layout}
          gridConfig={GRID_CONFIG}
          dragConfig={{ enabled: true, handle: ".cursor-grab", threshold: 3 }}
          resizeConfig={{ enabled: true, handles: ["se", "sw", "e", "w", "n", "s"] }}
          onLayoutChange={(l: Layout) => setLayout([...l])}
        >
          {layout.map((l) => {
            const base = baseId(l.i);
            const meta = PANEL_META[base];
            const isHidden = !(panelVisibility[base] ?? true);
            if (!meta) return null;
            return (
              <div
                key={l.i}
                className={`glass overflow-hidden ${isHidden ? "!hidden" : ""}`}
              >
                <PanelHeader
                  icon={meta.icon}
                  title={meta.title}
                  onClose={() => closePanel(l.i)}
                  onMaximize={() => setMaximizedPanel(l.i)}
                  onSplit={(dir) => splitPanel(l.i, dir)}
                />
                <div className="h-[calc(100%-36px)] overflow-y-auto">{content[base as keyof typeof content]}</div>
              </div>
            );
          })}
        </GridLayout>
      )}
    </div>
  );
}