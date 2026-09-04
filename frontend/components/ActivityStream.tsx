"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Event, EventType } from "@/lib/types";

export interface ActivityStreamProps {
  events: Event[];
  taskId?: string | null;
}

/** Mode A/B: live activity stream rendered from events. */
export function ActivityStream({ events, taskId }: ActivityStreamProps) {
  return (
    <div className="flex flex-col gap-1">
      {events.length === 0 && (
        <p className="text-sm text-muted-foreground">Waiting for activity…</p>
      )}
      {events.map((e) => (
        <div
          key={e.id}
          className="flex items-start gap-2 rounded-md border border-border px-2 py-1 text-xs"
        >
          <span className="mt-0.5 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase">
            {e.type}
          </span>
          <span className="flex-1 text-muted-foreground">
            {summarize(e)}
          </span>
          {e.step_id && (
            <span className="font-mono text-[10px] text-muted-foreground">
              {e.step_id.slice(0, 6)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function summarize(e: Event): string {
  const p = e.payload as Record<string, unknown>;
  switch (e.type as EventType) {
    case "sub_agent_selected":
      return `Sub-agent selected: ${String(p.role ?? "")}`;
    case "tool_invoked":
      return `Tool invoked: ${String(p.tool_id ?? "")}`;
    case "tool_result":
      return `Tool result: ${String(p.status ?? "")}`;
    case "step_started":
      return `Step started`;
    case "step_completed":
      return `Step completed`;
    case "verification_result":
      return `Verification: ${p.ok ? "passed" : "failed"}`;
    default:
      return e.actor ? `actor=${e.actor}` : "";
  }
}
