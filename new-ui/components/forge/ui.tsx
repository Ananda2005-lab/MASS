// FORGE UI base components — Glassmorphism design system (per spec).
// GlassPanel, GlassCard, GlassInput, GlassButton, Badge, Tooltip.

import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// GlassPanel — reusable translucent panel
// ---------------------------------------------------------------------------
export function GlassPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`backdrop-blur-xl bg-[rgba(15,23,42,0.6)] border border-white/[0.08] rounded-lg ${className}`}
    >
      {children}
    </div>
  );
}

// GlassCard — smaller variant for inner content
export function GlassCard({
  children,
  className = "",
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`backdrop-blur-xl bg-white/[0.05] border border-white/[0.10] rounded-md ${
        hover ? "transition-all duration-base hover:shadow-hover-card hover:bg-white/[0.08]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// GlassInput — input field with focus glow
// ---------------------------------------------------------------------------
export function GlassInput({
  value,
  onChange,
  placeholder,
  className = "",
  type = "text",
  onKeyDown,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={`bg-white/5 border border-white/10 text-slate2-primary placeholder:text-slate2-muted rounded-sm px-3 py-1.5 text-sm outline-none transition-all duration-fast focus:border-accent-cyan/[0.5] focus:shadow-focus-input ${className}`}
    />
  );
}

// ---------------------------------------------------------------------------
// GlassButton — variants: primary (cyan glow), secondary, ghost
// ---------------------------------------------------------------------------
export function GlassButton({
  children,
  onClick,
  variant = "secondary",
  className = "",
  size = "md",
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  size?: "sm" | "md" | "lg";
  title?: string;
}) {
  const sizeCls =
    size === "sm" ? "px-2.5 py-1 text-2xs" : size === "lg" ? "px-5 py-2.5 text-sm" : "px-3.5 py-1.5 text-xs2";
  const variantCls =
    variant === "primary"
      ? "bg-gradient-to-r from-accent-cyan to-accent-indigo text-bg-void font-semibold hover:shadow-glow-cyan hover:scale-[1.02]"
      : variant === "ghost"
      ? "bg-transparent border-transparent text-slate2-secondary hover:text-slate2-primary hover:bg-white/5"
      : "bg-white/5 border border-white/10 text-slate2-secondary hover:text-slate2-primary hover:border-white/20 hover:bg-white/8";
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-sm transition-all duration-base ${sizeCls} ${variantCls} active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Badge — status badges with colors
// ---------------------------------------------------------------------------
const BADGE_COLORS: Record<string, string> = {
  success: "bg-semantic-success/15 text-semantic-success border-semantic-success/30",
  warning: "bg-semantic-warning/15 text-semantic-warning border-semantic-warning/30",
  error: "bg-semantic-error/15 text-semantic-error border-semantic-error/30",
  info: "bg-semantic-info/15 text-semantic-info border-semantic-info/30",
  neutral: "bg-white/8 text-slate2-secondary border-white/15",
  cyan: "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30",
  indigo: "bg-accent-indigo/15 text-accent-indigo border-accent-indigo/30",
};

export function Badge({
  children,
  color = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  color?: keyof typeof BADGE_COLORS;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 border rounded-full px-2 py-0.5 text-2xs font-medium ${BADGE_COLORS[color]} ${className}`}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Tooltip — context-aware (hover after 400ms, glass pill)
// ---------------------------------------------------------------------------
export function Tooltip({
  label,
  children,
  shortcut,
}: {
  label: string;
  children: React.ReactNode;
  shortcut?: string;
}) {
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function onEnter() {
    timer.current = setTimeout(() => setShow(true), 400);
  }
  function onLeave() {
    if (timer.current) clearTimeout(timer.current);
    setShow(false);
  }

  return (
    <span className="relative inline-flex" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {children}
      {show && (
        <span className="animate-fade-in pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-bg-surface/95 border border-white/10 px-2 py-1 text-2xs text-slate2-secondary backdrop-blur-xl shadow-md2">
          {label}
          {shortcut && (
            <span className="ml-1.5 text-slate2-muted">[{shortcut}]</span>
          )}
        </span>
      )}
    </span>
  );
}
