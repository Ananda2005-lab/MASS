"use client";

// Panel header — drag handle (6-dot grip), icon, title, minimize/maximize/close.
// Right-click → split context menu (Split Right / Split Down).

import { useState } from "react";
import { GripHorizontal, Minus, Maximize2, Minimize2, X, Columns2, Rows2 } from "lucide-react";

interface PanelHeaderProps {
  icon: React.ReactNode;
  title: string;
  onClose?: () => void;
  onMaximize?: () => void;
  onSplit?: (dir: "right" | "down") => void;
}

export function PanelHeader({ icon, title, onClose, onMaximize, onSplit }: PanelHeaderProps) {
  const [maximized, setMaximized] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  function onCtx(e: React.MouseEvent) {
    e.preventDefault();
    if (!onSplit) return;
    setMenu({ x: e.clientX, y: e.clientY });
  }

  return (
    <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <span className="cursor-grab text-slate2-muted" title="Drag to move">
        <GripHorizontal size={14} />
      </span>
      <span className="text-slate2-muted">{icon}</span>
      <span className="flex-1 truncate text-xs2 font-medium text-slate2-primary" onContextMenu={onCtx}>
        {title}
      </span>
      <div className="flex items-center gap-0.5">
        {onMaximize && (
          <button
            type="button"
            onClick={() => { setMaximized((v) => !v); onMaximize(); }}
            className="rounded p-1 text-slate2-muted transition hover:bg-white/10 hover:text-slate2-primary"
            title={maximized ? "Minimize" : "Maximize"}
          >
            {maximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate2-muted transition hover:bg-semantic-error/20 hover:text-semantic-error"
            title="Close"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* split context menu */}
      {menu && (
        <div
          className="fixed z-[90] w-44 overflow-hidden rounded-lg border border-white/10 bg-bg-surface/95 p-1 shadow-lg2 backdrop-blur-2xl"
          style={{ left: Math.min(menu.x, window.innerWidth - 190), top: Math.min(menu.y, window.innerHeight - 110) }}
        >
          <p className="px-2.5 py-1 text-2xs uppercase tracking-widest text-slate2-muted">Split Panel</p>
          <button
            type="button"
            onClick={() => { onSplit?.("right"); setMenu(null); }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs2 text-slate2-secondary transition hover:bg-white/8 hover:text-slate2-primary"
          >
            <Columns2 size={13} /> Split Right
          </button>
          <button
            type="button"
            onClick={() => { onSplit?.("down"); setMenu(null); }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs2 text-slate2-secondary transition hover:bg-white/8 hover:text-slate2-primary"
          >
            <Rows2 size={13} /> Split Down
          </button>
        </div>
      )}
      {menu && (
        <div className="fixed inset-0 z-[85]" onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null); }} />
      )}
    </div>
  );
}