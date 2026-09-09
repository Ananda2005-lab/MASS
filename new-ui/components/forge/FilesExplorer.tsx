"use client";

// CENTER tab 3 — attached project browser: real tree + file content preview.
// Data: GET /project/tree + GET /project/file (guarded on backend). English-only UI.

import { useEffect, useState } from "react";
import { API } from "@/lib/api/client";

type Node = { name: string; type: "file" | "dir"; children?: Node[] };

export function FilesExplorer() {
  const [tree, setTree] = useState<{ project_path: string | null; tree: Node[] } | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [sel, setSel] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    const load = () =>
      API.projectTree()
        .then((d) => on && setTree(d))
        .catch(() => {});
    load();
    const t = setInterval(load, 10_000);
    return () => {
      on = false;
      clearInterval(t);
    };
  }, []);

  const openFile = async (path: string) => {
    setSel(path);
    setContent(null);
    setErr(null);
    try {
      const d = await API.projectFile(path);
      if (d.ok) setContent(d.content ?? "");
      else setErr(d.error ?? "read failed");
    } catch {
      setErr("backend unreachable");
    }
  };

  if (tree && !tree.project_path) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="max-w-sm text-center font-mono text-[11px] leading-relaxed tracking-[0.2em] text-slate2-muted">
          NO PROJECT ATTACHED — USE THE FOLDER ICON IN THE TOP BAR
        </p>
      </div>
    );
  }

  const renderNodes = (nodes: Node[], prefix: string, depth: number) => (
    <ul className={depth === 0 ? "space-y-0.5" : "space-y-0.5 pl-4"}>
      {nodes.map((n) => {
        const path = prefix ? `${prefix}/${n.name}` : n.name;
        if (n.type === "dir") {
          const isOpen = open[path] ?? depth === 0;
          return (
            <li key={path}>
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [path]: !isOpen }))}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[12px] text-slate2-secondary transition-colors hover:bg-white/5 hover:text-slate2-primary"
              >
                <span className="font-mono text-[10px] text-accent-cyan">{isOpen ? "▾" : "▸"}</span>
                <span>📁</span>
                <span className="truncate">{n.name}</span>
              </button>
              {isOpen && n.children && renderNodes(n.children, path, depth + 1)}
            </li>
          );
        }
        return (
          <li key={path}>
            <button
              type="button"
              onClick={() => void openFile(path)}
              className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[12px] transition-colors ${
                sel === path
                  ? "bg-accent-cyan/10 text-accent-cyan"
                  : "text-slate2-secondary hover:bg-white/5 hover:text-slate2-primary"
              }`}
            >
              <span className="w-[14px]" />
              <span>📄</span>
              <span className="truncate">{n.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="flex h-full min-h-0">
      {/* tree */}
      <div className="w-64 shrink-0 overflow-y-auto border-r border-white/5 bg-slate-950/40 p-3 backdrop-blur-xl">
        <p className="mb-2 truncate px-1 font-mono text-[10px] tracking-widest text-slate2-muted" title={tree?.project_path ?? ""}>
          {tree?.project_path?.split(/[\\/]/).filter(Boolean).pop()?.toUpperCase() ?? "PROJECT"}
        </p>
        {tree ? renderNodes(tree.tree, "", 0) : <p className="px-2 text-[12px] text-slate2-muted">Loading…</p>}
      </div>
      {/* preview */}
      <div className="min-w-0 flex-1 overflow-auto p-4">
        {!sel && (
          <p className="pt-[10vh] text-center font-mono text-[11px] tracking-[0.25em] text-slate2-muted">
            SELECT A FILE TO PREVIEW
          </p>
        )}
        {sel && err && <p className="text-[12px] text-accent-red">{err}</p>}
        {sel && content !== null && (
          <>
            <p className="mb-2 font-mono text-[11px] tracking-wider text-accent-cyan">{sel}</p>
            <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-slate-950/70 p-4 font-mono text-[12px] leading-relaxed text-slate2-primary">
              {content || "(empty file)"}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}
