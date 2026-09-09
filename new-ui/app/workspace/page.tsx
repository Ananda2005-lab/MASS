"use client";

// FORGE — Step 1: Codex-style sidebar (collapse + responsive drawer) over Deep Jellies bg.
//
// Dev-helper: ?bg=<name> query se registered backgrounds live try karo —
// jelly | silk | hex | aurora | nebula | jarvis | firefly | hudframe

import { useEffect, useState } from "react";
import FxBackground from "@/components/FxBackground";
import { BACKGROUNDS } from "@/config/backgrounds";
import { FX_REGISTRY, FxName } from "@/lib/fx/registry";
import { useForgeUI, PanelId } from "@/lib/store/forge-ui";
import { Sidebar } from "@/components/forge/sidebar/Sidebar";
import { ClickRipple } from "@/components/forge/sidebar/ClickRipple";
import { ChatBox } from "@/components/forge/chat/ChatBox";
import { ChatArea } from "@/components/forge/chat/ChatArea";
import { TopBar } from "@/components/forge/TopBar";
import { ProcessPanel } from "@/components/forge/ProcessPanel";
import { FilesExplorer } from "@/components/forge/FilesExplorer";
import { RightRail } from "@/components/forge/RightRail";
import { StatusBar } from "@/components/forge/StatusBar";

const ORDER: PanelId[] = ["sessions", "files", "agents", "tools", "sources", "integrations"];

export default function WorkspacePage() {
  const [tab, setTab] = useState<"chat" | "process" | "files">("chat");
  const [bg] = useState<FxName>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("bg");
      if (p && p in FX_REGISTRY) return p as FxName;
    }
    return BACKGROUNDS.workspace;
  });

  useEffect(() => {
    useForgeUI.getState().hydrate();
  }, []);

  // deep-link: /workspace?panel=settings → seedha settings khulo
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("panel");
    if (p) {
      useForgeUI.getState().openSection(p as PanelId);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // shortcuts: Ctrl+B collapse/expand, Ctrl+1..6 sections, Esc drawer band / back home
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const st = useForgeUI.getState();
      if (e.key === "Escape") {
        if (st.mobileOpen) st.closeMobile();
        else if (st.activePanel) st.backHome();
      }
      if (!e.ctrlKey) return;
      const k = e.key.toLowerCase();
      if (k === "b") {
        e.preventDefault();
        if (window.innerWidth >= 768) st.toggleCollapsed();
      }
      const idx = ["1", "2", "3", "4", "5", "6"].indexOf(e.key);
      if (idx >= 0) {
        e.preventDefault();
        st.openSection(ORDER[idx]);
        if (window.innerWidth < 768) st.openMobile();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="relative z-10 h-screen overflow-hidden">
      {/* ── static deep-ocean fallback (server-rendered, no JS needed) ── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(120,190,230,0.14) 0%, rgba(120,190,230,0) 14%)," +
            "linear-gradient(180deg, #02243f 0%, #01152b 50%, #000a16 100%)",
        }}
      />

      {/* ── animated Deep Jellies (locked) ── */}
      <FxBackground name={bg} />

      {/* ── readability scrim: jellies kinaron pe zinda, text zone calm ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[5]"
        style={{
          background:
            "radial-gradient(ellipse 72% 62% at 50% 46%, rgba(2,6,23,0.55) 0%, rgba(2,6,23,0.30) 45%, rgba(2,6,23,0) 78%)",
        }}
      />

      {/* ── screen border beam + ambient edge glow ── */}
      <div aria-hidden="true" className="screen-glow" />

      {/* ── global click flash ── */}
      <ClickRipple />

      {/* ── top bar: brand + project + pipeline + providers + safety ── */}
      <div className="relative z-20">
        <TopBar />
      </div>

      {/* ── sidebar + center tabs + right rail + bottom status bar ── */}
      <div className="relative z-20 flex h-[calc(100%-3rem)] flex-col">
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            {/* center workspace tabs */}
            <div className="flex items-center gap-1 border-b border-white/5 bg-slate-950/40 px-4 py-1.5 backdrop-blur-xl">
              {(["chat", "process", "files"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-full px-3 py-1 font-mono text-[10px] tracking-[0.18em] transition-colors ${
                    tab === t
                      ? "bg-accent-cyan/15 text-accent-cyan ring-1 ring-accent-cyan/30"
                      : "text-slate2-secondary hover:text-slate2-primary"
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
            {tab === "chat" && (
              <>
                <ChatArea />
                <ChatBox />
              </>
            )}
            {tab === "process" && <ProcessPanel />}
            {tab === "files" && <FilesExplorer />}
          </div>
          <RightRail />
        </div>
        <StatusBar />
      </div>
    </main>
  );
}
