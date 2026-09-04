"use client";

// Mode card — buttery 3D tilt (rAF lerp smoothing) + cursor sheen + accent glow.
// No CSS-transition retargeting: tilt eases via requestAnimationFrame for a premium feel.
import { useEffect, useRef } from "react";
import { NovaIcon, ForgeIcon } from "@/components/icons";

export type ModeId = "nova" | "forge";

interface ModeCardProps {
  mode: ModeId;
  onSelect: (mode: ModeId) => void;
}

const CONFIG = {
  nova: {
    Icon: NovaIcon,
    title: "Nova",
    tag: "INTELLIGENCE",
    desc: "Instruction do — Nova plan banayega, agents aur tools chalayega, har result verify karke complete karega.",
    kicker: "AUTONOMOUS MODE",
    hoverBorder: "hover:border-accent-violet/40",
    hoverShadow: "hover:shadow-[0_28px_70px_rgba(167,139,250,0.22)]",
    hoverIconBg: "group-hover:bg-accent-violet/10",
    glowBg: "bg-accent-violet/15",
    glowHover: "group-hover:bg-accent-violet/25",
    enterColor: "text-accent-violet",
  },
  forge: {
    Icon: ForgeIcon,
    title: "Forge",
    tag: "WORKSPACE",
    desc: "Agent ke saath kaam karo — files, research, tools aur execution sab live panels me tumhare control me.",
    kicker: "INTERACTIVE MODE",
    hoverBorder: "hover:border-accent-blue/40",
    hoverShadow: "hover:shadow-[0_28px_70px_rgba(56,189,248,0.2)]",
    hoverIconBg: "group-hover:bg-accent-blue/10",
    glowBg: "bg-accent-blue/15",
    glowHover: "group-hover:bg-accent-blue/25",
    enterColor: "text-accent-blue",
  },
} as const;

export default function ModeCard({ mode, onSelect }: ModeCardProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const c = CONFIG[mode];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // targets & smoothed values
    const target = { rx: 0, ry: 0, lift: 0 };
    const cur = { rx: 0, ry: 0, lift: 0 };
    let raf = 0;
    let running = false;

    function tick() {
      cur.rx += (target.rx - cur.rx) * 0.12;
      cur.ry += (target.ry - cur.ry) * 0.12;
      cur.lift += (target.lift - cur.lift) * 0.12;
      el!.style.transform = `perspective(950px) rotateX(${cur.rx.toFixed(3)}deg) rotateY(${cur.ry.toFixed(3)}deg) translateY(${cur.lift.toFixed(2)}px)`;
      const settled =
        Math.abs(target.rx - cur.rx) < 0.02 &&
        Math.abs(target.ry - cur.ry) < 0.02 &&
        Math.abs(target.lift - cur.lift) < 0.05;
      if (settled && target.lift === 0 && target.rx === 0 && target.ry === 0) {
        running = false;
        el!.style.transform = "";
        return;
      }
      raf = requestAnimationFrame(tick);
    }
    function ensureLoop() {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    }

    function onEnter() {
      target.lift = -7;
      ensureLoop();
    }
    function onMove(e: PointerEvent) {
      const r = el!.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      target.rx = -py * 4.5;
      target.ry = px * 5.5;
      // sheen position follows cursor
      el!.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(1)}%`);
      el!.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(1)}%`);
      ensureLoop();
    }
    function onLeave() {
      target.rx = 0;
      target.ry = 0;
      target.lift = 0;
      ensureLoop();
    }

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const Icon = c.Icon;

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onSelect(mode)}
      className={`glass group relative flex w-[320px] flex-col gap-3 overflow-hidden p-7 text-left transition-[border-color,box-shadow] duration-500 ease-out will-change-transform ${c.hoverBorder} ${c.hoverShadow}`}
    >
      {/* corner glow */}
      <div className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full ${c.glowBg} blur-3xl transition-opacity duration-500 ${c.glowHover}`} />

      {/* cursor sheen — soft light follows the pointer */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(360px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.08), transparent 55%)",
        }}
      />

      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-transform duration-500 ease-out group-hover:scale-105 ${c.hoverIconBg}`}>
        <Icon className="h-7 w-7" />
      </div>

      <div className="flex items-baseline gap-2.5 pt-1">
        <span className="text-xl font-semibold tracking-wide">{c.title}</span>
        <span className="text-[10px] tracking-[0.24em] text-ink-low">{c.tag}</span>
      </div>

      <p className="text-sm leading-relaxed text-ink-mid">{c.desc}</p>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-xs tracking-[0.18em] text-ink-low">{c.kicker}</span>
        <span className={`flex items-center gap-1.5 ${c.enterColor} opacity-70 transition-all duration-500 ease-out group-hover:translate-x-1.5 group-hover:opacity-100`}>
          Enter <span aria-hidden>→</span>
        </span>
      </div>
    </button>
  );
}
