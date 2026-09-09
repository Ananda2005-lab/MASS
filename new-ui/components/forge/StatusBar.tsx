"use client";

// BOTTOM — h-8 status bar: connection/safety/scope · live event ticker · counts.
// Polls /system (+ active task's last event for the ticker). English-only UI.

import { useEffect, useMemo, useState } from "react";
import { API } from "@/lib/api/client";
import { useChat } from "@/lib/store/chat";
import { useForgeUI } from "@/lib/store/forge-ui";

export function StatusBar() {
  const [sys, setSys] = useState<any>(null);
  const [ticker, setTicker] = useState<string>("");
  const threads = useChat((s) => s.threads);
  const activeSid = useForgeUI((s) => s.activeSessionId);

  const taskId = useMemo(() => {
    const msgs = threads[activeSid ?? ""] ?? [];
    return [...msgs].reverse().find((m) => m.role === "agent" && m.taskId)?.taskId ?? null;
  }, [threads, activeSid]);

  useEffect(() => {
    let on = true;
    const load = async () => {
      try {
        const s = await API.system();
        if (on) setSys(s);
      } catch {
        if (on) setSys(null);
      }
      if (!taskId) return;
      try {
        const ev = await API.getEvents(taskId, 0);
        const last = [...(ev.events ?? [])].reverse().find((e: any) => e.type !== "token");
        if (on && last) {
          setTicker(
            `${String(last.type).toUpperCase()}${last.payload?.tool_id ? " · " + last.payload.tool_id : ""}`,
          );
        }
      } catch {
        /* offline */
      }
    };
    load();
    const t = setInterval(load, 4000);
    return () => {
      on = false;
      clearInterval(t);
    };
  }, [taskId]);

  const healthTotal = Object.values(sys?.provider_health ?? {}).reduce(
    (acc: number, h: any) => acc + (h.calls ?? 0),
    0,
  );

  return (
    <footer className="flex h-8 shrink-0 items-center gap-4 border-t border-white/5 bg-slate-950/70 px-4 font-mono text-[10px] tracking-wider text-slate2-muted backdrop-blur-xl">
      <span className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${sys ? "bg-emerald-400" : "bg-rose-400"}`} />
        {sys ? "CONNECTED" : "OFFLINE"}
      </span>
      <span className="uppercase">safety: {sys?.safety_mode ?? "—"}</span>
      <span className="uppercase hidden sm:inline">scope: {sys?.sandbox_scope ?? "—"}</span>

      <span className="min-w-0 flex-1 truncate text-center text-accent-cyan/80">{ticker}</span>

      <span className="hidden md:inline">{(sys?.providers ?? []).length} providers · {healthTotal} llm calls</span>
      <span>{(sys?.mcp_tools ?? []).length} mcp tools</span>
    </footer>
  );
}
