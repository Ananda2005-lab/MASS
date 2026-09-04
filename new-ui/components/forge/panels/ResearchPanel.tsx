"use client";

// Panel B — Research & Context (empty state, awaiting backend connection).
import { PanelEmptyState } from "@/components/forge/PanelEmptyState";
import { Search } from "lucide-react";

export function ResearchPanel() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 items-center justify-center p-3">
        <PanelEmptyState
          icon={<Search size={18} />}
          title="No research data yet"
          hint="Search results, RAG chunks, and pinned context will appear here once the agent starts processing your instruction."
        />
      </div>
    </div>
  );
}