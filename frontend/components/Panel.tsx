import * as React from "react";
import { cn } from "@/lib/utils";

export interface PanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

/** Shared wrapper for a titled content region (used by both modes). */
export function Panel({ title, children, className, actions }: PanelProps) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-lg border border-border bg-background",
        className
      )}
    >
      <header className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {actions}
      </header>
      <div className="flex-1 overflow-auto p-3">{children}</div>
    </section>
  );
}
