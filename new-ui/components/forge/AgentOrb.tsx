"use client";

// Floating Agent Orb — per FORGE spec Phase 10 §2.
// Bottom-right, draggable, rotating rings reflect agent status (idle/processing/active),
// click opens quick menu. Live reads agent status from store.

import { useRef, useState } from "react";
import { Bot, Pause, Play, X, RefreshCw } from "lucide-react";
import { useForgeStore } from "@/lib/store/forge";

const STATUS_META: Record<string, { label: string; ring: string; glow: string; speed: string }> = {
  idle: { label: "Idle", ring: "border-accent-indigo/50", glow: "shadow-glow-indigo", speed: "rotate-[30s_linear_infinite]" },
  processing: { label: "Processing", ring: "border-accent-cyan/70", glow: "shadow-glow-cyan", speed: "rotate-[6s_linear_infinite]" },
  active: { label: "Active", ring: "border-semantic-success/60", glow: "shadow-[0_0_30px_rgba(74,222,128,0.25)]", speed: "rotate-[12s_linear_infinite]" },
};

export function AgentOrb() {
  const status = useForgeStore((s) => s.agentStatus);
  const setStatus = useForgeStore((s) => s.setAgentStatus);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null); // null = default
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number; dragging: boolean }>({
    startX: 0, startY: 0, ox: 0, oy: 0, dragging: false,
  });

  const meta = STATUS_META[status];

  function onDown(e: React.PointerEvent) {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      ox: pos?.x ?? window.innerWidth - 80,
      oy: pos?.y ?? window.innerHeight - 90,
      dragging: false,
    };
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      if (!dragRef.current.dragging && Math.hypot(dx, dy) > 6) {
        dragRef.current.dragging = true;
        setOpen(false);
      }
      if (dragRef.current.dragging) {
        setPos({
          x: Math.max(16, Math.min(window.innerWidth - 80, dragRef.current.ox + dx)),
          y: Math.max(16, Math.min(window.innerHeight - 90, dragRef.current.oy + dy)),
        });
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const style: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y }
    : { right: 20, bottom: 74 };

  return (
    <div className="fixed z-[60]" style={style}>
      {/* quick menu */}
      {open && (
        <div className="animate-scale-pop absolute bottom-16 right-0 w-48 overflow-hidden rounded-lg border border-white/10 bg-bg-surface/95 p-1.5 shadow-lg2 backdrop-blur-2xl">
          <p className="px-2 py-1.5 text-2xs uppercase tracking-widest text-slate2-muted">Agent Control</p>
          {[
            { icon: <Bot size={13} />, label: `Status: ${meta.label}`, action: () => setStatus(status === "idle" ? "processing" : "idle") },
            { icon: status === "processing" ? <Pause size={13} /> : <Play size={13} />, label: status === "processing" ? "Pause agent" : "Resume agent", action: () => setStatus(status === "processing" ? "active" : "processing") },
            { icon: <RefreshCw size={13} />, label: "Retry last action", action: () => {} },
            { icon: <X size={13} />, label: "Close menu", action: () => setOpen(false) },
          ].map((it, i) => (
            <button
              key={i}
              type="button"
              onClick={it.action}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs2 text-slate2-secondary transition hover:bg-white/8 hover:text-slate2-primary"
            >
              <span className="text-slate2-muted">{it.icon}</span>
              {it.label}
            </button>
          ))}
        </div>
      )}

      {/* orb */}
      <button
        type="button"
        onPointerDown={onDown}
        onClick={() => { if (!dragRef.current.dragging) setOpen((v) => !v); }}
        className={`relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full transition-shadow duration-base ${meta.glow}`}
        title={`Agent: ${meta.label}`}
      >
        {/* 3 rotating concentric rings */}
        <span className={`absolute inset-0 rounded-full border-2 border-dashed ${meta.ring} ${meta.speed}`} />
        <span className={`absolute inset-[-5px] rounded-full border ${meta.ring} opacity-40 ${meta.speed}`} style={{ animationDirection: "reverse" }} />
        <span className={`absolute inset-[-10px] rounded-full border ${meta.ring} opacity-20 ${meta.speed}`} />
        {/* avatar */}
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-cyan/70 to-accent-indigo/70 text-slate2-primary">
          <Bot size={20} />
        </span>
      </button>
    </div>
  );
}