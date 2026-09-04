"use client";

// Toast notification system — per FORGE spec Phase 10 §3.
// Top-right stack, max 5, types (success/error/warning/info), auto-dismiss 5s
// with progress bar, pause on hover, slide-in from right.

import { create } from "zustand";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  time: string;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id" | "time">) => void;
  dismiss: (id: number) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) =>
    set((s) => ({
      toasts: [
        ...s.toasts.slice(-4),
        { ...t, id: Date.now() + Math.floor(Math.random() * 999), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ],
    })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

const TYPE_META: Record<ToastType, { icon: React.ReactNode; border: string; bar: string }> = {
  success: { icon: <CheckCircle2 size={16} className="text-semantic-success" />, border: "border-semantic-success/30", bar: "bg-semantic-success" },
  error: { icon: <XCircle size={16} className="text-semantic-error" />, border: "border-semantic-error/30", bar: "bg-semantic-error" },
  warning: { icon: <AlertTriangle size={16} className="text-semantic-warning" />, border: "border-semantic-warning/30", bar: "bg-semantic-warning" },
  info: { icon: <Info size={16} className="text-accent-cyan" />, border: "border-accent-cyan/30", bar: "bg-accent-cyan" },
};

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: (id: number) => void }) {
  const meta = TYPE_META[t.type];
  return (
    <div
      className="group relative animate-slide-in w-80 overflow-hidden rounded-lg border bg-bg-surface/95 shadow-lg2 backdrop-blur-2xl"
      style={{ borderColor: undefined, borderWidth: 1 }}
      onMouseEnter={(e) => {
        const bar = e.currentTarget.querySelector<HTMLElement>("[data-bar]");
        if (bar) bar.style.animationPlayState = "paused";
      }}
      onMouseLeave={(e) => {
        const bar = e.currentTarget.querySelector<HTMLElement>("[data-bar]");
        if (bar) bar.style.animationPlayState = "running";
      }}
    >
      <div className={`pointer-events-none absolute inset-0 rounded-lg border ${meta.border}`} />
      <div className="relative flex gap-2.5 p-3">
        <span className="mt-0.5 shrink-0">{meta.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs2 font-medium text-slate2-primary">{t.title}</p>
            <span className="shrink-0 text-2xs text-slate2-muted">{t.time}</span>
          </div>
          <p className="mt-0.5 text-2xs text-slate2-secondary">{t.message}</p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(t.id)}
          className="shrink-0 self-start rounded p-0.5 text-slate2-muted opacity-0 transition group-hover:opacity-100 hover:text-slate2-primary"
        >
          <X size={13} />
        </button>
      </div>
      {/* auto-dismiss progress */}
      <div className="relative h-0.5 w-full bg-white/5">
        <div
          data-bar
          className={`h-full ${meta.bar}`}
          style={{ animation: "toastBar 5s linear forwards", transformOrigin: "left" }}
        />
      </div>
      <style>{`@keyframes toastBar { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}</style>
    </div>
  );
}

export function Toasts() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[80] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem t={t} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}