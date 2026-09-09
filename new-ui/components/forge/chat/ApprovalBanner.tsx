"use client";

// Ask-mode approval banner — polls pending permission requests (GET /approvals)
// and lets the user Allow/Deny each gated tool call. English-only on-screen UI.

import { useEffect, useState } from "react";
import { API } from "@/lib/api/client";

type Pending = { id: string; tool_id: string; args: any; caller: string };

export function ApprovalBanner() {
  const [pending, setPending] = useState<Pending[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const d = await API.listApprovals();
        if (alive) setPending(d.pending ?? []);
      } catch {
        /* backend unreachable — keep previous state */
      }
    };
    load();
    const t = setInterval(load, 2000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (!pending.length) return null;

  const decide = async (id: string, approved: boolean) => {
    setBusy(id);
    try {
      await API.decideApproval(id, approved);
    } catch {
      /* ignore — next poll resyncs */
    }
    setBusy(null);
    setPending((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-2">
      {pending.map((p) => {
        let argStr = "";
        try {
          const s = JSON.stringify(p.args ?? {});
          argStr = s.length > 150 ? s.slice(0, 150) + "…" : s;
        } catch {
          argStr = "";
        }
        return (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-xl border border-amber-400/40 bg-slate-950/80 px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
          >
            <span className="text-lg">🔐</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-slate2-primary">
                Permission request — <span className="font-mono text-accent-cyan">{p.tool_id}</span>
              </p>
              {argStr ? (
                <p className="truncate font-mono text-[11px] text-slate2-muted">{argStr}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => decide(p.id, true)}
                disabled={busy === p.id}
                className="rounded-full border border-emerald-400/50 bg-emerald-500/15 px-3 py-1 text-[12px] font-medium text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-50"
              >
                Allow
              </button>
              <button
                onClick={() => decide(p.id, false)}
                disabled={busy === p.id}
                className="rounded-full border border-red-400/40 bg-red-500/10 px-3 py-1 text-[12px] font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                Deny
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
