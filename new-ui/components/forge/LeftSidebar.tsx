"use client";

// Forge — Left Sidebar: Folder(Project) → Sessions(Conversations) hierarchy.
// Uses shared session store — Chatbox se linked.

import { useState } from "react";
import {
  Plus, Search, ChevronLeft, ChevronRight, ChevronDown,
  Sparkles, MessageSquare, Folder, FolderOpen, FolderPlus,
  MessageSquarePlus, X, Settings, Trash2, Pencil,
} from "lucide-react";
import { useSessionStore } from "@/lib/store/session";

function SectionHeader({
  icon, label, active, onClick, count,
}: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void; count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs2 transition-all duration-base ${
        active ? "border-l-2 border-accent-cyan bg-white/5 text-slate2-primary" : "text-slate2-secondary hover:bg-white/5 hover:text-slate2-primary"
      }`}
    >
      <span className={active ? "text-accent-cyan" : ""}>{icon}</span>
      <span className="flex-1 text-left font-medium">{label}</span>
      {count !== undefined && (
        <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-slate2-secondary">{count}</span>
      )}
      <ChevronDown size={14} className={`transition-transform duration-base ${active ? "rotate-180" : ""}`} />
    </button>
  );
}

export function LeftSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const [activeSection, setActiveSection] = useState<string | null>("folders");
  const [query, setQuery] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const folders = useSessionStore((s) => s.folders);
  const activeFolderId = useSessionStore((s) => s.activeFolderId);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const expandedFolderId = useSessionStore((s) => s.expandedFolderId);
  const addFolder = useSessionStore((s) => s.addFolder);
  const addSession = useSessionStore((s) => s.addSession);
  const startNewChat = useSessionStore((s) => s.startNewChat);
  const renameSession = useSessionStore((s) => s.renameSession);
  const deleteFolder = useSessionStore((s) => s.deleteFolder);
  const deleteSession = useSessionStore((s) => s.deleteSession);
  const toggleFolder = useSessionStore((s) => s.toggleFolder);
  const selectSession = useSessionStore((s) => s.selectSession);

  function handleAddFolder() {
    const name = prompt("Folder ka naam (project):")?.trim();
    if (name) addFolder(name);
  }

  async function handlePickFolder() {
    // File System Access API — pick a REAL folder from the user's system
    const w = window as any;
    if (w.showDirectoryPicker) {
      try {
        const handle = await w.showDirectoryPicker();
        addFolder(handle.name);
      } catch (e: any) {
        if (e?.name === "AbortError") return; // user cancelled
        alert("Folder picker support nahi mila — naam se add karo");
      }
    } else {
      alert("Is browser me folder picker support nahi hai — Chrome/Edge use karo ya naam se add karo");
    }
  }

  function handleAddSession(folderId: string) {
    const name = prompt("Session ka naam:")?.trim();
    addSession(folderId, name || undefined);
  }

  function commitRename(folderId: string, sessionId: string) {
    if (draft.trim()) renameSession(folderId, sessionId, draft.trim());
    setRenaming(null);
  }

  if (collapsed) {
    return (
      <aside className="flex w-14 shrink-0 flex-col border-r border-white/[0.08] bg-slate-950/60 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-center border-b border-white/[0.06]">
          <button type="button" onClick={onToggle} title="Expand" className="rounded-md p-2 text-slate2-muted transition hover:bg-white/10 hover:text-slate2-primary">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center gap-2 py-3">
          <button type="button" title="New conversation" className="rounded-lg bg-gradient-to-br from-accent-cyan to-accent-indigo p-2.5 text-bg-void transition hover:scale-105">
            <Plus size={16} />
          </button>
          <button type="button" title="Folders" className="rounded-md p-2 text-slate2-muted transition hover:bg-white/10 hover:text-slate2-primary">
            <Folder size={15} />
          </button>
        </div>
        <div className="flex justify-center border-t border-white/[0.06] py-3">
          <button type="button" title="Settings" className="rounded-md p-2 text-slate2-muted transition hover:bg-white/10 hover:text-slate2-primary">
            <Settings size={15} />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-white/[0.08] bg-slate-950/60 backdrop-blur-xl">
      {/* header */}
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent-cyan" />
          <span className="text-sm font-semibold tracking-wide text-slate2-primary">Forge</span>
        </div>
        <button type="button" onClick={onToggle} title="Collapse" className="rounded-md p-1.5 text-slate2-muted transition hover:bg-white/10 hover:text-slate2-primary">
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* new chat — always works: no folder → auto "Chats" folder + session */}
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={() => startNewChat()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-accent-cyan to-accent-indigo py-2 text-xs2 font-semibold text-bg-void transition-all duration-base hover:shadow-glow-cyan hover:scale-[1.01] active:scale-[0.99]"
        >
          <Plus size={15} /> New conversation
        </button>
      </div>

      {/* sections */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {/* ── Folders (projects) ── */}
        <div className="mb-1">
          <SectionHeader
            icon={<Folder size={15} />}
            label="Folders"
            active={activeSection === "folders"}
            onClick={() => setActiveSection(activeSection === "folders" ? null : "folders")}
            count={folders.length}
          />
          {activeSection === "folders" && (
            <div className="animate-fade-in mt-1 space-y-0.5 px-1">
              {folders.length === 0 ? (
                <div className="flex flex-col items-center gap-1.5 py-6 text-center">
                  <span className="text-slate2-muted opacity-50"><FolderPlus size={20} /></span>
                  <p className="text-2xs text-slate2-secondary">No folders yet</p>
                  <p className="text-2xs text-slate2-muted">Project folder add karo — usme sessions banenge</p>
                </div>
              ) : (
                folders.map((f) => {
                  const open = expandedFolderId === f.id;
                  return (
                    <div key={f.id} className="rounded-md">
                      <div className="group flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleFolder(f.id)}
                          className={`flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left transition ${
                            activeFolderId === f.id ? "bg-white/5 text-slate2-primary" : "text-slate2-secondary hover:bg-white/5"
                          }`}
                        >
                          {open ? <FolderOpen size={14} className="shrink-0 text-accent-cyan" /> : <Folder size={14} className="shrink-0 text-slate2-muted" />}
                          <span className="flex-1 truncate text-xs2 font-medium">{f.name}</span>
                          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-slate2-muted">{f.sessions.length}</span>
                          <ChevronDown size={13} className={`shrink-0 text-slate2-muted transition-transform duration-base ${open ? "rotate-180" : ""}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteFolder(f.id)}
                          title="Delete folder"
                          className="rounded p-1 text-slate2-muted opacity-0 transition hover:text-semantic-error group-hover:opacity-100"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>

                      {open && (
                        <div className="animate-fade-in ml-4 space-y-0.5 border-l border-white/10 pl-2 pb-1 pt-1">
                          {f.sessions.length === 0 && (
                            <p className="px-2 py-1 text-2xs text-slate2-muted">No sessions — + add karo</p>
                          )}
                          {f.sessions.map((s) => (
                            <div key={s.id} className="group flex items-center gap-1">
                              {renaming === s.id ? (
                                <input
                                  autoFocus
                                  value={draft}
                                  onChange={(e) => setDraft(e.target.value)}
                                  onBlur={() => commitRename(f.id, s.id)}
                                  onKeyDown={(e) => e.key === "Enter" && commitRename(f.id, s.id)}
                                  className="w-full rounded border border-accent-cyan/50 bg-white/5 px-1.5 py-1 text-2xs text-slate2-primary outline-none"
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => selectSession(f.id, s.id)}
                                  className={`flex flex-1 items-center gap-1.5 rounded px-2 py-1 text-left transition ${
                                    activeSessionId === s.id ? "border-l-2 border-accent-cyan bg-accent-cyan/[0.06] text-slate2-primary" : "text-slate2-secondary hover:bg-white/5"
                                  }`}
                                >
                                  <MessageSquare size={12} className={activeSessionId === s.id ? "shrink-0 text-accent-cyan" : "shrink-0 text-slate2-muted"} />
                                  <span className="flex-1 truncate text-2xs">{s.title}</span>
                                  <span className="text-[9px] text-slate2-muted">{s.time}</span>
                                </button>
                              )}
                              {renaming !== s.id && (
                                <span className="flex gap-0.5 opacity-0 transition group-hover:opacity-100">
                                  <button type="button" title="Rename" onClick={() => { setRenaming(s.id); setDraft(s.title); }} className="rounded p-0.5 text-slate2-muted hover:text-slate2-primary">
                                    <Pencil size={10} />
                                  </button>
                                  <button type="button" title="Delete" onClick={() => deleteSession(f.id, s.id)} className="rounded p-0.5 text-slate2-muted hover:text-semantic-error">
                                    <Trash2 size={10} />
                                  </button>
                                </span>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleAddSession(f.id)}
                            className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-2xs text-slate2-muted transition hover:bg-white/5 hover:text-slate2-primary"
                          >
                            <MessageSquarePlus size={12} /> New session
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              <div className="mt-2 flex gap-1.5">
                <button
                  type="button"
                  onClick={handleAddFolder}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-dashed border-white/15 py-2 text-2xs text-slate2-secondary transition hover:border-accent-cyan/40 hover:text-slate2-primary"
                >
                  <FolderPlus size={13} /> Add folder
                </button>
                <button
                  type="button"
                  onClick={handlePickFolder}
                  title="Pick folder from system"
                  className="flex items-center justify-center rounded-md border border-dashed border-white/15 px-3 py-2 text-2xs text-slate2-secondary transition hover:border-accent-cyan/40 hover:text-slate2-primary"
                >
                  📁
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Conversations (all sessions) ── */}
        <div className="mb-1">
          <SectionHeader
            icon={<MessageSquare size={15} />}
            label="Conversations"
            active={activeSection === "conversations"}
            onClick={() => setActiveSection(activeSection === "conversations" ? null : "conversations")}
            count={folders.reduce((n, f) => n + f.sessions.length, 0)}
          />
          {activeSection === "conversations" && (
            <div className="animate-fade-in mt-1 space-y-2 px-1">
              <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 transition-all duration-base focus-within:border-accent-cyan/50">
                <Search size={12} className="shrink-0 text-slate2-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search conversations…"
                  className="w-full bg-transparent text-2xs text-slate2-primary outline-none placeholder:text-slate2-muted"
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} className="shrink-0 text-slate2-muted hover:text-slate2-primary">
                    <X size={11} />
                  </button>
                )}
              </div>
              {folders.length === 0 ? (
                <div className="flex flex-col items-center gap-1.5 py-6 text-center">
                  <span className="text-slate2-muted opacity-50"><MessageSquare size={20} /></span>
                  <p className="text-2xs text-slate2-secondary">No conversations yet</p>
                  <p className="text-2xs text-slate2-muted">Pehle folder add karo, phir usme session banao</p>
                </div>
              ) : (
                folders.map((f) => {
                  const sessions = f.sessions.filter((s) => s.title.toLowerCase().includes(query.toLowerCase()));
                  if (sessions.length === 0) return null;
                  return (
                    <div key={f.id}>
                      <p className="px-2 pb-1 text-[10px] uppercase tracking-widest text-slate2-muted">{f.name}</p>
                      <div className="space-y-0.5">
                        {sessions.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => selectSession(f.id, s.id)}
                            className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition ${
                              activeSessionId === s.id ? "bg-accent-cyan/[0.06] text-slate2-primary" : "text-slate2-secondary hover:bg-white/5"
                            }`}
                          >
                            <MessageSquare size={12} className={activeSessionId === s.id ? "text-accent-cyan" : "text-slate2-muted"} />
                            <span className="flex-1 truncate text-2xs">{s.title}</span>
                            <span className="text-[9px] text-slate2-muted">{s.time}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* footer */}
      <div className="flex items-center gap-2.5 border-t border-white/[0.06] px-3 py-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-violet to-accent-indigo text-xs2 font-semibold text-slate2-primary">A</span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-xs2 font-medium text-slate2-primary">Profile</p>
          <p className="text-[10px] text-slate2-muted">Settings · Account</p>
        </div>
        <button type="button" title="Settings" className="rounded-md p-1.5 text-slate2-muted transition hover:bg-white/10 hover:text-slate2-primary">
          <Settings size={15} />
        </button>
      </div>
    </aside>
  );
}