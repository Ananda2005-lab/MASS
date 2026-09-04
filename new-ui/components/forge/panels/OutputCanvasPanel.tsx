"use client";

// Panel C — Output Canvas (empty state, awaiting backend connection).
import { PanelEmptyState } from "@/components/forge/PanelEmptyState";
import { Monitor } from "lucide-react";

export function OutputCanvasPanel() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 items-center justify-center p-3">
        <PanelEmptyState
          icon={<Monitor size={18} />}
          title="No output yet"
          hint="Terminal logs, code diffs, artifacts, data tables, and the whiteboard canvas all go live when the agent produces results."
        />
      </div>
    </div>
  );
}