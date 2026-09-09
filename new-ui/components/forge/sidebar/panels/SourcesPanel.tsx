"use client";

// Sources — LIVE research evidence: search.query results ride on TOOL_RESULT events.
// Personal-doc RAG still not wired (honest note below).

import { useEffect, useMemo, useState } from "react";
import { Link2 } from "lucide-react";
import { API } from "@/lib/api/client";
import { useChat } from "@/lib/store/chat";
import { useForgeUI } from "@/lib/store/forge-ui";
import { PanelTitle, Empty } from "../ui";

interface Src { url: string; title: string; }

export function SourcesPanel() {
  const threads = useChat((s) => s.threads);
  const activeSid = useForgeUI((s) => s.activeSessionId);
  const [sources, setSources] = useState<Src[]>([]);

  const taskId = useMemo(() => {
    const msgs = threads[activeSid ?? ""] ?? [];
    return [...msgs].reverse().find((m) => m.role === "agent" && m.taskId)?.taskId ?? null;
  }, [threads, activeSid]);

  useEffect(() => {
    if (!taskId) {
      setSources([]);
      return;
    }
    let on = true;
    const load = async () => {
      try {
        const ev = await API.getEvents(taskId, 0);
        const seen = new Set<string>();
        const list: Src[] = [];
        for (const e of ev.events ?? []) {
          if (e.type !== "tool_result" && e.type !== "sub_agent_result") continue;
          for (const s of (e.payload?.sources ?? []) as Src[]) {
            const key = s.url || s.title;
            if (key && !seen.has(key)) {
              seen.add(key);
              list.push(s);
            }
          }
        }
        if (on) setSources(list);
      } catch {
        /* offline */
      }
    };
    load();
    const t = setInterval(load, 5000);
    return () => { on = false; clearInterval(t); };
  }, [taskId]);

  return (
    <div className="panel-stagger">
      <PanelTitle>Research evidence · this session</PanelTitle>
      {sources.length === 0 ? (
        <Empty
          icon={<Link2 size={18} />}
          text="No research yet — run a research task and the sources it used appear here live."
        />
      ) : (
        <div className="space-y-1 px-2">
          {sources.map((s, i) => (
            <div key={i} className="rounded-md px-2 py-1.5 transition hover:bg-white/5 hover-glow">
              <p className="truncate text-2xs text-slate2-primary">{s.title || s.url}</p>
              {s.url && <p className="truncate font-mono text-[9px] text-accent-cyan/70">{s.url}</p>}
            </div>
          ))}
        </div>
      )}
      <p className="px-3 pt-2 text-[10px] leading-relaxed text-slate2-muted">
        Personal documents (URL/PDF/text RAG) are a planned feature — not wired yet, nothing faked.
      </p>
    </div>
  );
}
