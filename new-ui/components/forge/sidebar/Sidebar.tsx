"use client";

// FORGE Sidebar — Codex-style behavior, premium skin.
// • Desktop: 264px sidebar, collapse button se 64px icon-rail (smooth width animation)
// • Mobile (<768px): icon-rail docked; icon click → full drawer overlay;
//   khaali jagah (scrim) click → drawer band
// • Sections view-switch hote hain (back button ke saath)

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronRight, ArrowLeft, PanelLeftClose, X } from "lucide-react";
import { useForgeUI, PanelId } from "@/lib/store/forge-ui";
import { API } from "@/lib/api/client";
import { BrandMark } from "@/components/forge/BrandMark";
import {
  SessionsIcon, FilesIcon, AgentsIcon, ToolsIcon, SourcesIcon, IntegrationsIcon, SettingsGearIcon,
} from "@/components/forge/sidebar/icons";
import { SessionsPanel } from "./panels/SessionsPanel";
import { FilesPanel } from "./panels/FilesPanel";
import { AgentsPanel } from "./panels/AgentsPanel";
import { ToolsPanel } from "./panels/ToolsPanel";
import { SourcesPanel } from "./panels/SourcesPanel";
import { IntegrationsPanel } from "./panels/IntegrationsPanel";
import { SettingsPanel } from "./panels/SettingsPanel";

interface SectionDef {
  id: PanelId;
  label: string;
  icon: React.ReactNode;
  tint: string; // colored soft tile
  el: React.ReactNode;
}

const SECTIONS: SectionDef[] = [
  { id: "sessions", label: "Sessions", icon: <SessionsIcon size={18} />, tint: "bg-accent-cyan/15 text-accent-cyan", el: <SessionsPanel /> },
  { id: "files", label: "Files", icon: <FilesIcon size={18} />, tint: "bg-accent-amber/15 text-accent-amber", el: <FilesPanel /> },
  { id: "agents", label: "Agents", icon: <AgentsIcon size={18} />, tint: "bg-accent-violet/15 text-accent-violet", el: <AgentsPanel /> },
  { id: "tools", label: "Tools", icon: <ToolsIcon size={18} />, tint: "bg-accent-indigo/15 text-accent-indigo", el: <ToolsPanel /> },
  { id: "sources", label: "Sources", icon: <SourcesIcon size={18} />, tint: "bg-accent-green/15 text-accent-green", el: <SourcesPanel /> },
  { id: "integrations", label: "Integrations", icon: <IntegrationsIcon size={18} />, tint: "bg-accent-purple/15 text-accent-purple", el: <IntegrationsPanel /> },
];

const EASE = [0.4, 0, 0.2, 1] as const;

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}

function useBackend() {
  const [backend, setBackend] = useState<"checking" | "live" | "off">("checking");
  useEffect(() => {
    API.health().then((ok) => setBackend(ok ? "live" : "off"));
  }, []);
  return backend;
}

function Tooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2.5 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-accent-cyan/30 bg-slate-900/95 px-2 py-1 text-[10px] font-medium text-slate2-primary shadow-[0_0_18px_rgba(56,189,248,0.3)] backdrop-blur-md group-hover:block">
      {label}
    </span>
  );
}

function Avatar() {
  return (
    <span className="f-hue-clean shrink-0 rounded-full bg-gradient-to-br from-accent-cyan via-accent-indigo to-accent-violet p-[2px]">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 font-display text-2xs font-bold text-slate2-primary">
        G
      </span>
    </span>
  );
}

/* ── icon rail (collapsed desktop / docked mobile) ── */
function RailView({ onIcon, onBrand }: { onIcon: (p: PanelId) => void; onBrand: () => void }) {
  const [guestNote, setGuestNote] = useState(false);
  const activePanel = useForgeUI((s) => s.activePanel);
  const projects = useForgeUI((s) => s.projects);
  const tools = useForgeUI((s) => s.tools);
  const togglePanel = useForgeUI((s) => s.togglePanel);
  const backend = useBackend();

  const counts: Partial<Record<PanelId, number>> = {
    sessions: projects.reduce((n, p) => n + p.sessions.length, 0),
    tools: tools.filter((t) => t.enabled).length,
  };

  return (
    <div className="flex h-full w-16 flex-col items-center py-3">
      <button type="button" onClick={onBrand} className="group relative mb-3 transition-transform duration-fast hover:scale-110" aria-label="Expand sidebar">
        <BrandMark size={30} />
        <Tooltip label="Expand" />
      </button>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {SECTIONS.map((s) => {
          const active = activePanel === s.id;
          const n = counts[s.id] ?? 0;
          return (
            <button
              key={s.id}
              type="button"
              aria-label={s.label}
              onClick={() => onIcon(s.id)}
              className={`group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-fast hover:scale-105 hover:shadow-[0_0_18px_rgba(56,189,248,0.4),inset_0_0_0_1px_rgba(56,189,248,0.35)] ${
                active ? "bg-white/[0.09] shadow-[0_0_14px_rgba(56,189,248,0.25)]" : "hover:bg-white/[0.06]"
              }`}
            >
              <span className={`transition-[filter] duration-fast group-hover:[filter:drop-shadow(0_0_7px_rgba(56,189,248,0.95))] ${active ? "" : "opacity-75 group-hover:opacity-100"}`}>{s.icon}</span>
              {n > 0 && (
                <span className="absolute right-0.5 top-0.5 rounded-full bg-white/[0.12] px-1 text-[9px] font-semibold leading-[13px] text-slate2-secondary">
                  {n}
                </span>
              )}
              <Tooltip label={s.label} />
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-2.5">
        <span className="group relative flex items-center justify-center">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              backend === "live"
                ? "bg-semantic-success shadow-[0_0_8px_rgba(74,222,128,0.7)]"
                : backend === "off"
                  ? "bg-semantic-warning"
                  : "animate-pulse-soft bg-white/25"
            }`}
          />
          <Tooltip label={backend === "live" ? "Backend live" : backend === "off" ? "Backend offline" : "Checking…"} />
        </span>
        <button
          type="button"
          aria-label="Settings"
          onClick={() => onIcon("settings")}
          className={`group relative flex h-9 w-9 items-center justify-center rounded-lg transition ${
            activePanel === "settings" ? "bg-white/[0.09] text-slate2-primary" : "text-slate2-muted hover:bg-white/[0.06] hover:text-slate2-primary"
          }`}
        >
          <SettingsGearIcon size={16} />
          <Tooltip label="Settings" />
        </button>
        <button
          type="button"
          aria-label="Guest user"
          onClick={() => {
            setGuestNote(true);
            setTimeout(() => setGuestNote(false), 1800);
          }}
          className="group relative rounded-full transition-all duration-fast hover:scale-110 hover:shadow-[0_0_20px_rgba(56,189,248,0.6)]"
        >
          <Avatar />
          <Tooltip label="Guest — sign in coming soon" />
        </button>
        {guestNote && (
          <span className="msg-in fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-accent-cyan/30 bg-slate-950/90 px-4 py-1.5 font-mono text-[10px] tracking-[0.2em] text-accent-cyan shadow-[0_0_24px_rgba(56,189,248,0.35)] backdrop-blur">
            SIGN-IN COMING SOON
          </span>
        )}
      </div>
    </div>
  );
}

/* ── full sidebar content (docked expanded / mobile drawer) ── */
function SidebarContent({ variant }: { variant: "docked" | "drawer" }) {
  const activePanel = useForgeUI((s) => s.activePanel);
  const backHome = useForgeUI((s) => s.backHome);
  const openSection = useForgeUI((s) => s.openSection);
  const toggleCollapsed = useForgeUI((s) => s.toggleCollapsed);
  const closeMobile = useForgeUI((s) => s.closeMobile);
  const newSession = useForgeUI((s) => s.newSession);
  const projects = useForgeUI((s) => s.projects);
  const tools = useForgeUI((s) => s.tools);
  const backend = useBackend();

  const sec = SECTIONS.find((s) => s.id === activePanel);
  const counts: Partial<Record<PanelId, number>> = {
    sessions: projects.reduce((n, p) => n + p.sessions.length, 0),
    tools: tools.filter((t) => t.enabled).length,
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* header */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/[0.06] px-3">
        <span className="group relative flex items-center justify-center">
          <BrandMark size={26} />
        </span>
        <span className="text-flow f-hue-clean flex-1 bg-gradient-to-r from-slate-300 via-accent-cyan to-slate-300 bg-clip-text font-display text-xs2 font-bold tracking-[0.3em] text-transparent">FORGE</span>
        {variant === "docked" ? (
          <button
            type="button"
            title="Collapse sidebar (Ctrl+B)"
            onClick={toggleCollapsed}
            className="shine-btn group"
          >
            <span className="p-1.5 text-slate2-secondary transition group-hover:text-accent-cyan">
              <PanelLeftClose size={16} />
            </span>
          </button>
        ) : (
          <button
            type="button"
            title="Close (Esc)"
            onClick={closeMobile}
            className="shine-btn group"
          >
            <span className="p-1.5 text-slate2-secondary transition group-hover:text-accent-cyan">
              <X size={15} />
            </span>
          </button>
        )}
      </header>

      {/* body */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <AnimatePresence mode="wait" initial={false}>
        {!sec ? (
          /* home: CTA + section nav */
          <motion.div key="home" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18, ease: EASE }}>
            <div className="relative">
              {/* colorful breathing halo */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-1 animate-breathe rounded-xl bg-gradient-to-r from-accent-cyan/40 via-accent-indigo/35 to-accent-violet/40 blur-md"
              />
              <button
                type="button"
                onClick={() => { newSession(); openSection("sessions"); }}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-accent-cyan via-accent-indigo to-accent-cyan bg-[length:200%_auto] cta-live py-2 font-display text-2xs font-semibold text-bg-void transition-all duration-fast active:scale-[0.99]"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent bg-[length:200%_100%]"
                />
                <span className="relative flex items-center gap-1.5">
                  <Plus size={14} className="transition-transform duration-fast group-hover:rotate-90" /> New Session
                </span>
              </button>
            </div>

            <motion.nav
              className="mt-3 flex flex-col gap-0.5"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.045 } } }}
            >
              {SECTIONS.map((s) => (
                <motion.button
                  key={s.id}
                  variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                  transition={{ duration: 0.22, ease: EASE }}
                  type="button"
                  onClick={() => openSection(s.id)}
                className="group relative flex w-full items-center gap-2.5 overflow-hidden rounded-lg px-2 py-2 transition-all duration-fast hover:translate-x-0.5 hover:bg-white/[0.05] hover:shadow-[0_0_22px_rgba(56,189,248,0.3),inset_0_0_0_1px_rgba(56,189,248,0.35)]"
              >
                <span aria-hidden="true" className="sweep-arm" />
                {activePanel === s.id && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent-cyan/30 via-accent-indigo/30 to-accent-violet/30 bg-[length:200%_auto] pill-live"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-[transform,filter] duration-fast group-hover:scale-110 group-hover:[filter:drop-shadow(0_0_7px_rgba(56,189,248,0.9))] ${s.tint}`}>{s.icon}</span>
                  <span className="relative flex-1 text-left font-display text-xs2 font-medium tracking-wide text-slate2-primary">{s.label}</span>
                  {(counts[s.id] ?? 0) > 0 && (
                    <span className="relative rounded-full bg-white/[0.08] px-1.5 text-[10px] leading-4 text-slate2-secondary">
                      {counts[s.id]}
                    </span>
                  )}
                  <ChevronRight size={13} className="relative text-slate2-muted opacity-0 transition-all duration-fast group-hover:translate-x-0.5 group-hover:opacity-100" />
                </motion.button>
              ))}
            </motion.nav>
          </motion.div>
        ) : (
          /* section view */
          <motion.div
            key={sec.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18, ease: EASE }}
          >
            <div className="flex items-center gap-1.5 pb-1.5">
              <button
                type="button"
                title="Back"
                onClick={backHome}
                className="rounded-md p-1.5 text-slate2-muted transition-all duration-fast hover:-translate-x-0.5 hover:bg-white/[0.07] hover:text-slate2-primary"
              >
                <ArrowLeft size={15} />
              </button>
              <span className={`flex h-6 w-6 animate-float items-center justify-center rounded-md ${sec.tint}`}>{sec.icon}</span>
              <span className="font-display text-[15px] font-bold tracking-wide text-slate2-primary">{sec.label}</span>
            </div>
            {sec.el}
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* bottom: settings + identity */}
      <div className="shrink-0 border-t border-white/[0.06] px-2 py-2">
        <button
          type="button"
          onClick={() => openSection("settings")}
          className={`group relative flex w-full items-center gap-2.5 overflow-hidden rounded-lg px-2 py-2 transition-all duration-fast hover:translate-x-0.5 hover:bg-white/[0.05] hover:shadow-[0_0_22px_rgba(56,189,248,0.3),inset_0_0_0_1px_rgba(56,189,248,0.35)] ${
            activePanel === "settings" ? "bg-white/[0.06]" : ""
          }`}
        >
          <span aria-hidden="true" className="sweep-arm" />
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[0.07] transition-transform duration-fast group-hover:scale-110">
            <SettingsGearIcon size={15} />
          </span>
          <span className="flex-1 text-left font-display text-xs2 font-medium tracking-wide text-slate2-primary">Settings</span>
        </button>
        {/* GUEST account row — hover pe poora row chamakta hai + sweep + avatar pop */}
        <button
          type="button"
          className="group relative flex w-full items-center gap-2.5 overflow-hidden rounded-lg px-2 py-1.5 transition-all duration-fast hover:translate-x-0.5 hover:bg-white/[0.05] hover:shadow-[0_0_22px_rgba(56,189,248,0.3),inset_0_0_0_1px_rgba(56,189,248,0.35)]"
        >
          <span aria-hidden="true" className="sweep-arm" />
          <span className="relative transition-transform duration-fast group-hover:scale-110">
            <Avatar />
          </span>
          <div className="relative min-w-0 flex-1 text-left">
            <p className="truncate font-display text-2xs font-semibold tracking-wide text-slate2-primary transition-colors duration-fast group-hover:text-accent-cyan">Guest</p>
            <p className="flex items-center gap-1 text-[10px] text-slate2-muted">
              <span className="relative flex h-1.5 w-1.5 items-center justify-center">
                {backend === "live" && (
                  <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-semantic-success/70" />
                )}
                <span
                  className={`relative h-1 w-1 rounded-full ${
                    backend === "live" ? "bg-semantic-success" : backend === "off" ? "bg-semantic-warning" : "bg-white/25"
                  }`}
                />
              </span>
              {backend === "live" ? "System online" : backend === "off" ? "Backend offline" : "Connecting…"}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

/* ── root ── */
export function Sidebar() {
  const isMobile = useIsMobile();
  const collapsed = useForgeUI((s) => s.collapsed);
  const mobileOpen = useForgeUI((s) => s.mobileOpen);

  // mobile par breakpoint change pe drawer band
  useEffect(() => {
    if (!isMobile) useForgeUI.getState().closeMobile();
  }, [isMobile]);

  function railIcon(p: PanelId) {
    const s = useForgeUI.getState();
    if (isMobile) {
      s.openSection(p);
      s.openMobile();
    } else {
      s.openSection(p);
      if (s.collapsed) s.toggleCollapsed();
    }
  }

  return (
    <>
      {/* desktop docked */}
      {!isMobile && (
        <motion.aside
          animate={{ width: collapsed ? 64 : 264 }}
          transition={{ duration: 0.24, ease: EASE }}
          className="relative z-30 h-full shrink-0 overflow-hidden border-r border-white/[0.08] bg-gradient-to-b from-slate-950/45 via-slate-950/28 to-slate-950/50 backdrop-blur-2xl"
        >
          {/* glowing edge beam */}
          <span aria-hidden="true" className="edge-beam" />
          <div className={`absolute inset-y-0 left-0 w-16 transition-opacity duration-200 ${collapsed ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <RailView onIcon={railIcon} onBrand={() => useForgeUI.getState().toggleCollapsed()} />
          </div>
          <motion.div
            animate={{ opacity: collapsed ? 0 : 1, x: collapsed ? -10 : 0 }}
            transition={{ duration: 0.18, ease: EASE }}
            className={`absolute inset-y-0 left-0 w-[264px] ${collapsed ? "pointer-events-none" : ""}`}
          >
            <SidebarContent variant="docked" />
          </motion.div>
        </motion.aside>
      )}

      {/* mobile docked icon rail */}
      {isMobile && (
        <aside className="relative z-30 h-full w-16 shrink-0 border-r border-white/[0.08] bg-gradient-to-b from-slate-950/45 via-slate-950/28 to-slate-950/50 backdrop-blur-2xl">
          <RailView onIcon={railIcon} onBrand={() => { useForgeUI.getState().openSection("sessions"); useForgeUI.getState().openMobile(); }} />
        </aside>
      )}

      {/* mobile drawer + scrim (outside click = close) */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => useForgeUI.getState().closeMobile()}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.aside
              key="drawer"
              initial={{ x: -290 }}
              animate={{ x: 0 }}
              exit={{ x: -290 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-white/[0.1] bg-slate-950/80 shadow-[0_0_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
            >
              <span aria-hidden="true" className="edge-beam" />
              <SidebarContent variant="drawer" />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
