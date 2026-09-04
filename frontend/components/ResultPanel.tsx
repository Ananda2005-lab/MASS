"use client";

import * as React from "react";
import { Panel } from "@/components/Panel";
import type { Result } from "@/lib/types";

export interface ResultPanelProps {
  result: Result | null;
  status: string | null;
}

/** Mode A: final result panel with artifacts. */
export function ResultPanel({ result, status }: ResultPanelProps) {
  return (
    <Panel title="Result">
      {!result && (
        <p className="text-sm text-muted-foreground">
          {status ? `Status: ${status}` : "No result yet."}
        </p>
      )}
      {result && (
        <div className="flex flex-col gap-2 text-sm">
          <div className="font-semibold">Status: {result.status}</div>
          {result.summary && <p>{result.summary}</p>}
          {result.artifacts.length > 0 && (
            <ul className="ml-4 list-disc text-xs text-muted-foreground">
              {result.artifacts.map((a) => (
                <li key={a.id}>
                  {a.name} ({a.type})
                </li>
              ))}
            </ul>
          )}
          {result.error && (
            <p className="text-red-600">
              Error {result.error.code}: {result.error.message}
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}
