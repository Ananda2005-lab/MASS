"use client";

// FORGE — Left Sidebar (folders/sessions) + center Chatbox + background.

import { useEffect, useState } from "react";
import FxBackground from "@/components/FxBackground";
import { BACKGROUNDS } from "@/config/backgrounds";
import { LeftSidebar } from "@/components/forge/LeftSidebar";
import { Chatbox } from "@/components/forge/Chatbox";
import { useSessionStore } from "@/lib/store/session";
import { Menu } from "lucide-react";

export default function WorkspacePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // hydrate session store from localStorage (client-only, avoids hydration mismatch)
  useEffect(() => { useSessionStore.getState().hydrate(); }, []);

  useEffect(() => {
    function apply() {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      if (w < 768) setSidebarCollapsed(true);
      else if (w < 1024) setSidebarCollapsed(true);
      else setSidebarCollapsed(false);
    }
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  const showSidebar = !isMobile || mobileSidebar;

  return (
    <main className="relative z-10 flex h-screen flex-col overflow-hidden">
      <FxBackground name={BACKGROUNDS.workspace} />

      {/* mobile header with hamburger */}
      {isMobile && (
        <div className="z-30 flex h-12 items-center gap-2 border-b border-white/[0.08] bg-slate-950/60 px-3 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setMobileSidebar((v) => !v)}
            className="rounded-md p-1.5 text-slate2-muted transition hover:bg-white/10 hover:text-slate2-primary"
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>
          <span className="text-sm font-semibold text-slate2-primary">Forge</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* desktop/tablet sidebar */}
        {!isMobile && showSidebar && (
          <LeftSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />
        )}

        {/* mobile drawer */}
        {isMobile && mobileSidebar && (
          <div className="fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileSidebar(false)} />
            <div className="animate-slide-in relative h-full">
              <LeftSidebar collapsed={false} onToggle={() => setMobileSidebar(false)} />
            </div>
          </div>
        )}

        {/* center — chatbox */}
        <div className="flex-1">
          <Chatbox />
        </div>
      </div>
    </main>
  );
}