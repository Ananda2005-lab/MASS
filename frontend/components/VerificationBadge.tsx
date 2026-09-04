"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { StepStatus } from "@/lib/types";

export interface VerificationBadgeProps {
  status: StepStatus;
  className?: string;
}

const LABEL: Record<StepStatus, string> = {
  pending: "Pending",
  running: "Running",
  succeeded: "Verified",
  failed: "Failed",
  verifying: "Verifying",
  awaiting_permission: "Awaiting",
};

const COLOR: Record<StepStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  running: "bg-blue-100 text-blue-700",
  succeeded: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  verifying: "bg-amber-100 text-amber-700",
  awaiting_permission: "bg-purple-100 text-purple-700",
};

/** Per-step verification/status badge (Mode A). */
export function VerificationBadge({ status, className }: VerificationBadgeProps) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium",
        COLOR[status],
        className
      )}
    >
      {LABEL[status]}
    </span>
  );
}
