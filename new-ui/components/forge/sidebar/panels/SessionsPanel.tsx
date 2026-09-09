"use client";

// Sessions/Projects — Codex-style: default Quick Workspace + multiple projects,
// har project ke multiple sessions. Clean 1-line rows.

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, ChevronDown, Folder, FolderOpen, FolderPlus, Zap, Pencil, Trash2, Pin, Check,
} from "lucide-react";
import { useForgeUI } from "@/lib/store/forge-ui";
import { useChat } from "@/lib/store/chat";
import { PanelTitle, StatusDot, Empty } from "../ui";

export function SessionsPanel() {
  const projects = useForgeUI((s) => s.projects);
  const activeSessionId = useForgeUI((s) => s.activeSessionId);
  const expandedProjectId = useForgeUI((s) => s.expandedProjectId);
  const { newSession, addProject, deleteProject, selectSession, renameSession, deleteSession, togglePin, toggleExpand } =
    useForgeUI.getState();

  const [query, setQuery] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const total = projects.reduce((n, p) => n + p.sessions.length, 0);
  const q = query.trim().toLowerCase();

  function attachFolder() {
    const w = window as any;
    if (w.showDirectoryPicker) {
      w.showDirectoryPicker()
        .then((h: any) => addProject(h.name, h.name))
        .catch(() => {});
    } else {
      const name = window.prompt("Project ka naam:")?.trim();
      if (name) addProject(name, name);
    }
  }

  return (
    <div className="panel-stagger">
      <div className="flex gap-1.5 p-2 pb-0">
        <button
          type="button"
          onClick={() => newSession()}
          className="relative flex flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-r from-accent-cyan via-accent-indigo to-accent-cyan bg-[length:200%_auto] cta-live py-2 font-display text-2xs font-semibold text-bg-void transition-all duration-fast active:scale-[0.98]"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent bg-[length:200%_100%]"
          />
          <span className="relative flex items-center gap-1.5">
            <Plus size={13} /> New Session
          </span>
        </button>
        <button
          type="button"
          title="Attach folder → naya project"
          onClick={attachFolder}
          className="flex w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate2-secondary transition hover:border-accent-cyan/40 hover:text-slate2-primary"
        >
          <FolderPlus size={14} />
        </button>
      </div>

      {total > 4 && (
        <div className="px-2 pt-2">
          <div className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 transition-shadow focus-within:border-accent-cyan/40 focus-within:shadow-[0_0_14px_rgba(56,189,248,0.25)]">
            <Search size={12} className="text-slate2-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sessions…"
              className="w-full bg-transparent text-2xs text-slate2-primary outline-none placeholder:text-slate2-muted"
            />
          </div>
        </div>
      )}

      <PanelTitle>Projects</PanelTitle>

      {projects.map((p) => {
        const open = expandedProjectId === p.id;
        const sessions = q
          ? p.sessions.filter((s) => s.title.toLowerCase().includes(q))
          : p.sessions;
        if (q && sessions.length === 0) return null;
        return (
          <div key={p.id} className="mb-0.5">
            <div className="group flex items-center gap-1 rounded-md px-1">
              <button
                type="button"
                onClick={() => toggleExpand(p.id)}
                className="flex flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition hover:bg-white/5 hover-glow"
              >
                <ChevronDown size={12} className={`shrink-0 text-slate2-muted transition-transform ${open ? "" : "-rotate-90"}`} />
                {p.isDefault ? (
                  <Zap size={13} className="shrink-0 text-accent-amber" />
                ) : open ? (
                  <FolderOpen size={13} className="shrink-0 text-accent-cyan" />
                ) : (
                  <Folder size={13} className="shrink-0 text-slate2-muted" />
                )}
                <span className="flex-1 truncate text-xs2 font-medium text-slate2-primary">{p.name}</span>
                <span className="rounded-full bg-white/10 px-1.5 text-[10px] leading-4 text-slate2-secondary">
                  {p.sessions.length}
                </span>
              </button>
              {!p.isDefault && (
                <button
                  type="button"
                  title="Delete project"
                  onClick={() => deleteProject(p.id)}
                  className="hidden rounded p-1 text-slate2-muted hover:text-semantic-error group-hover:block"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            {open && (
              <div className="animate-fade-in ml-4 border-l border-white/[0.06] pl-2">
                {sessions.length === 0 ? (
                  <p className="px-2 py-1.5 text-2xs text-slate2-muted">No sessions — press New Session</p>
                ) : (
                  sessions.map((s, i) => {
                    const active = s.id === activeSessionId;
                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.24) }}
                        className="group relative flex items-center gap-2 rounded-md"
                      >
                        {active && <span className="absolute left-0 h-4 w-0.5 rounded-full bg-accent-cyan" />}
                        <button
                          type="button"
                          onClick={() => selectSession(p.id, s.id)}
                          className={`flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left transition ${
                            active ? "bg-white/[0.06] shadow-[inset_0_0_0_1px_rgba(56,189,248,0.3),0_0_12px_rgba(56,189,248,0.15)]" : "hover:bg-white/5 hover-glow"
                          }`}
                        >
                          <StatusDot status={s.status} />
                          {renaming === s.id ? (
                            <input
                              autoFocus
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  if (draft.trim()) renameSession(p.id, s.id, draft.trim());
                                  setRenaming(null);
                                }
                                if (e.key === "Escape") setRenaming(null);
                              }}
                              className="w-full rounded border border-accent-cyan/40 bg-bg-input px-1 py-0.5 text-2xs text-slate2-primary outline-none"
                            />
                          ) : (
                            <>
                              <span className={`flex-1 truncate text-2xs ${active ? "text-slate2-primary" : "text-slate2-secondary"}`}>
                                {s.pinned && <Pin size={9} className="mr-1 inline text-accent-amber" />}
                                {s.title}
                              </span>
                              <span className="text-[10px] text-slate2-muted">{s.time}</span>
                            </>
                          )}
                        </button>
                        <div className="hidden items-center gap-0.5 pr-1 group-hover:flex">
                          <button
                            type="button"
                            title="Rename"
                            onClick={() => { setRenaming(s.id); setDraft(s.title); }}
                            className="rounded p-1 text-slate2-muted hover:text-slate2-primary"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            type="button"
                            title="Pin"
                            onClick={() => togglePin(p.id, s.id)}
                            className="rounded p-1 text-slate2-muted hover:text-accent-amber"
                          >
                            <Pin size={11} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => {
                              deleteSession(p.id, s.id);
                              useChat.getState().dropThread(s.id);
                            }}
                            className="rounded p-1 text-slate2-muted hover:text-semantic-error"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                        {renaming === s.id && (
                          <button
                            type="button"
                            title="Save"
                            onClick={() => { if (draft.trim()) renameSession(p.id, s.id, draft.trim()); setRenaming(null); }}
                            className="rounded p-1 text-accent-cyan"
                          >
                            <Check size={11} />
                          </button>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}

      {total === 0 && (
        <Empty icon={<Zap size={18} />} text="No sessions yet — hit New Session to start one in the default Quick Workspace." />
      )}
    </div>
  );
}
