"use client";

// Forge UI store — sidebar state: rail/panels, projects→sessions, tools, sources, integrations.
// LIVE-backed: sidebar data backend /system + task events se aata hai (no mock data).

import { create } from "zustand";

export interface ToolMock {
  id: string;
  cat: string;
  name: string;
  desc: string;
  enabled: boolean;
  perm: "auto" | "ask";
  inUse: boolean;
}

export interface SourceMock {
  id: string;
  type: "url" | "pdf" | "text";
  name: string;
  status: "syncing" | "synced";
  pinned: boolean;
}

export interface IntegrationMock {
  id: string;
  name: string;
  desc: string;
  connected: boolean;
}

export interface AgentMock {
  id: string;
  role: string;
  name: string;
  status: "idle" | "working" | "done";
  action: string;
  enabled: boolean;
}

export type PanelId =
  | "sessions"
  | "files"
  | "agents"
  | "tools"
  | "sources"
  | "integrations"
  | "settings";

export type SessionStatus = "idle" | "running" | "done" | "error";

export interface Session {
  id: string;
  title: string;
  status: SessionStatus;
  time: string;
  pinned?: boolean;
}

export interface Project {
  id: string;
  name: string;
  folder?: string;
  isDefault?: boolean;
  sessions: Session[];
}

let uid = 0;
const nid = (p: string) => `${p}${++uid}_${Date.now().toString(36)}`;

function defaultProjects(): Project[] {
  return [
    {
      id: "p-default",
      name: "Quick Workspace",
      isDefault: true,
      sessions: [
        { id: "s-1", title: "Ultron voice layer research", status: "done", time: "2h ago", pinned: true },
        { id: "s-2", title: "Landing copy draft", status: "running", time: "now" },
      ],
    },
    {
      id: "p-web",
      name: "website-redesign",
      folder: "~/projects/website-redesign",
      sessions: [{ id: "s-3", title: "Fix hero animation", status: "idle", time: "yesterday" }],
    },
  ];
}

interface ForgeUIState {
  hydrated: boolean;
  activePanel: PanelId | null;
  lastPanel: PanelId;
  collapsed: boolean;
  mobileOpen: boolean;
  rightRail: boolean;
  projects: Project[];
  activeProjectId: string;
  activeSessionId: string | null;
  expandedProjectId: string | null;
  tools: ToolMock[];
  agents: AgentMock[];
  sources: SourceMock[];
  integrations: IntegrationMock[];
  safetyMode: "auto" | "ask";

  hydrate: () => void;
  togglePanel: (p: PanelId) => void;
  closePanel: () => void;
  openSection: (p: PanelId) => void;
  backHome: () => void;
  toggleCollapsed: () => void;
  openMobile: () => void;
  closeMobile: () => void;
  toggleRightRail: () => void;
  newSession: (projectId?: string) => string;
  addProject: (name: string, folder?: string) => void;
  deleteProject: (id: string) => void;
  selectSession: (projectId: string, sessionId: string) => void;
  renameSession: (projectId: string, sessionId: string, title: string) => void;
  deleteSession: (projectId: string, sessionId: string) => void;
  togglePin: (projectId: string, sessionId: string) => void;
  toggleExpand: (projectId: string) => void;
  toggleTool: (id: string) => void;
  setSafety: (m: "auto" | "ask") => void;
  toggleAgent: (id: string) => void;
  addSource: (type: "url" | "pdf" | "text", name: string) => void;
  toggleIntegration: (id: string) => void;
  resetLayout: () => void;
  // chat ↔ sidebar bridge — live task wiring
  setSessionStatus: (status: SessionStatus) => void;
  setSessionStatusById: (sessionId: string, status: SessionStatus) => void;
  setAgentLive: (roleQuery: string, status: "idle" | "working" | "done", action: string) => void;
  setRoles: (roles: string[]) => void;
}

const LS_KEY = "forge-ui-v2";

export const useForgeUI = create<ForgeUIState>((set, get) => ({
  hydrated: false,
  activePanel: null,
  lastPanel: "sessions",
  collapsed: false,
  mobileOpen: false,
  rightRail: false,
  projects: defaultProjects(),
  activeProjectId: "p-default",
  activeSessionId: "s-2",
  expandedProjectId: "p-default",
  tools: [],
  agents: [],
  sources: [],
  integrations: [],
  safetyMode: "auto",

  hydrate: () => {
    if (get().hydrated) return;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (Array.isArray(d.projects) && d.projects.length) {
          set({
            projects: d.projects,
            activeProjectId: d.activeProjectId ?? d.projects[0].id,
            activeSessionId: d.activeSessionId ?? null,
            expandedProjectId: d.expandedProjectId ?? d.projects[0].id,
          });
        }
        if (typeof d.collapsed === "boolean") set({ collapsed: d.collapsed });
      }
    } catch {
      /* corrupt state — defaults */
    }
    set({ hydrated: true });
  },

  togglePanel: (p) =>
    set((s) => ({ activePanel: s.activePanel === p ? null : p, lastPanel: p })),
  closePanel: () => set({ activePanel: null }),
  openSection: (p) => set({ activePanel: p, lastPanel: p }),
  backHome: () => set({ activePanel: null }),
  toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
  openMobile: () => set({ mobileOpen: true }),
  closeMobile: () => set({ mobileOpen: false }),
  toggleRightRail: () => set((s) => ({ rightRail: !s.rightRail })),

  newSession: (projectId) => {
    const pid = projectId ?? get().activeProjectId;
    const sess: Session = { id: nid("sess"), title: "New session", status: "idle", time: "now" };
    set((s) => ({
      projects: s.projects.map((p) => (p.id === pid ? { ...p, sessions: [sess, ...p.sessions] } : p)),
      activeProjectId: pid,
      activeSessionId: sess.id,
      expandedProjectId: pid,
    }));
    return sess.id;
  },

  addProject: (name, folder) =>
    set((s) => {
      const proj: Project = { id: nid("proj"), name, folder, sessions: [] };
      return { projects: [...s.projects, proj], expandedProjectId: proj.id, activeProjectId: proj.id };
    }),

  deleteProject: (id) =>
    set((s) => {
      const projects = s.projects.filter((p) => p.id !== id || p.isDefault);
      const activeProjectId = projects.some((p) => p.id === s.activeProjectId)
        ? s.activeProjectId
        : projects[0].id;
      return { projects, activeProjectId };
    }),

  selectSession: (projectId, sessionId) =>
    set({ activeProjectId: projectId, activeSessionId: sessionId }),

  renameSession: (projectId, sessionId, title) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, sessions: p.sessions.map((x) => (x.id === sessionId ? { ...x, title } : x)) }
          : p
      ),
    })),

  deleteSession: (projectId, sessionId) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, sessions: p.sessions.filter((x) => x.id !== sessionId) } : p
      ),
      activeSessionId: s.activeSessionId === sessionId ? null : s.activeSessionId,
    })),

  togglePin: (projectId, sessionId) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, sessions: p.sessions.map((x) => (x.id === sessionId ? { ...x, pinned: !x.pinned } : x)) }
          : p
      ),
    })),

  toggleExpand: (projectId) =>
    set((s) => ({ expandedProjectId: s.expandedProjectId === projectId ? null : projectId })),

  toggleTool: (id) =>
    set((s) => ({ tools: s.tools.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)) })),

  setSafety: (m) => set({ safetyMode: m }),

  toggleAgent: (id) =>
    set((s) => ({ agents: s.agents.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)) })),

  addSource: (type, name) =>
    set((s) => ({ sources: [{ id: nid("src"), type, name, status: "syncing", pinned: false }, ...s.sources] })),

  toggleIntegration: (id) =>
    set((s) => ({
      integrations: s.integrations.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i)),
    })),

  resetLayout: () => {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {}
    set({ projects: defaultProjects(), activeProjectId: "p-default", activeSessionId: "s-2", expandedProjectId: "p-default", activePanel: null });
  },

  setSessionStatus: (status) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === s.activeProjectId
          ? {
              ...p,
              sessions: p.sessions.map((ss) =>
                ss.id === s.activeSessionId ? { ...ss, status, time: "now" } : ss,
              ),
            }
          : p,
      ),
    })),

  setSessionStatusById: (sessionId, status) =>
    set((s) => ({
      projects: s.projects.map((p) => ({
        ...p,
        sessions: p.sessions.map((ss) => (ss.id === sessionId ? { ...ss, status, time: "now" } : ss)),
      })),
    })),

  setAgentLive: (roleQuery, status, action) => {
    // backend role values ("writing", "research", …) se exact match; upsert if new
    const q = (roleQuery ?? "").toLowerCase();
    if (!q) return;
    set((s) => {
      const exists = s.agents.some((a) => a.role.toLowerCase() === q);
      const agents = exists
        ? s.agents.map((a) => (a.role.toLowerCase() === q ? { ...a, status, action } : a))
        : [...s.agents, { id: q, role: q, name: q, status, action, enabled: true }];
      return { agents };
    });
  },

  setRoles: (roles) =>
    set((s) => ({
      agents: (roles ?? []).map((r) => {
        const live = s.agents.find((a) => a.role.toLowerCase() === r.toLowerCase());
        return live ?? { id: r, role: r, name: r, status: "idle" as const, action: "", enabled: true };
      }),
    })),
}));

// persist (projects/rail state) — 300ms debounce
let saveT: ReturnType<typeof setTimeout> | null = null;
useForgeUI.subscribe((s) => {
  if (!s.hydrated) return;
  if (saveT) clearTimeout(saveT);
  saveT = setTimeout(() => {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          projects: s.projects,
          activeProjectId: s.activeProjectId,
          activeSessionId: s.activeSessionId,
          expandedProjectId: s.expandedProjectId,
          collapsed: s.collapsed,
        })
      );
    } catch {}
  }, 300);
});
