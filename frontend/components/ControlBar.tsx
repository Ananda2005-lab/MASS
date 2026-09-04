"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export interface ControlBarProps {
  status: string | null;
  taskId: string | null;
  onInterrupt: () => void;
  onResume: () => void;
  onApprove?: (ticket: string) => void;
  pendingTicket?: string | null;
}

/** Shared control bar: interrupt / resume / approve (security §17.2). */
export function ControlBar({
  status,
  taskId,
  onInterrupt,
  onResume,
  onApprove,
  pendingTicket,
}: ControlBarProps) {
  const [ticket, setTicket] = React.useState("");

  if (!taskId) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3">
      <span className="text-xs text-muted-foreground">Status: {status ?? "—"}</span>

      {status === "paused" || status === "awaiting_permission" ? (
        <Button size="sm" onClick={onResume}>
          Resume
        </Button>
      ) : (
        <Button size="sm" variant="outline" onClick={onInterrupt}>
          Interrupt
        </Button>
      )}

      {onApprove && (pendingTicket || ticket) && (
        <div className="flex items-center gap-2">
          <input
            className="h-8 rounded-md border border-border bg-background px-2 text-xs"
            placeholder="permission ticket"
            value={pendingTicket ?? ticket}
            onChange={(e) => setTicket(e.target.value)}
            disabled={Boolean(pendingTicket)}
          />
          <Button
            size="sm"
            variant="default"
            onClick={() => onApprove((pendingTicket ?? ticket) as string)}
          >
            Approve
          </Button>
        </div>
      )}
    </div>
  );
}
