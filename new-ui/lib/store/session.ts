"use client";

// Forge session store — folders(projects) → sessions(conversations) → messages.
// Shared by LeftSidebar and Chatbox. Messages persist per session (localStorage).

import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
  status?: "done" | "error" | "pending";
}

export interface SessionItem {
  id: string;
  title: string;
  time: string;
  messages: ChatMessage[];
}

export interface FolderItem {
  id: string;
  name: string;
  sessions: SessionItem[];
}

interface SessionState {
  folders: FolderItem[];
  activeFolderId: string | null;
  activeSessionId: string | null;
  expandedFolderId: string | null;
  hydrate: () => void;
  startNewChat: () => string;
  addFolder: (name: string) => string;
  addSession: (folderId: string, title?: string) => string;
  renameSession: (folderId: string, sessionId: string, title: string) => void;
  deleteFolder: (folderId: string) => void;
  deleteSession: (folderId: string, sessionId: string) => void;
  selectFolder: (folderId: string) => void;
  toggleFolder: (folderId: string) => void;
  selectSession: (folderId: string, sessionId: string) => void;
  appendUserMessage: (sessionId: string, content: string) => void;
  appendAssistantMessage: (sessionId: string, content: string, status?: "done" | "error") => void;
  setActiveSession: (id: string | null) => void;
}

const STORAGE_KEY = "forge-sessions-v2";

function loadFolders(): FolderItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

let uid = 1000;
function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${uid++}`;
}
function nowTime() { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

function persist(folders: FolderItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
  } catch {}
}

export const useSessionStore = create<SessionState>((set, get) => ({
  folders: [],
  activeFolderId: null,
  activeSessionId: null,
  expandedFolderId: null,

  hydrate: () => {
    const folders = loadFolders();
    set({ folders });
  },

  startNewChat: () => {
    const s = get();
    let folderId = s.activeFolderId;
    let folders = s.folders;
    // no folder yet? create a default one
    if (!folderId || !folders.some((f) => f.id === folderId)) {
      const fid = newId();
      folders = [...folders, { id: fid, name: "Chats", sessions: [] }];
      folderId = fid;
    }
    const sessionId = newId();
    folders = folders.map((f) =>
      f.id === folderId
        ? { ...f, sessions: [...f.sessions, { id: sessionId, title: `Session ${f.sessions.length + 1}`, time: nowTime(), messages: [] }] }
        : f
    );
    persist(folders);
    set({ folders, activeFolderId: folderId, expandedFolderId: folderId, activeSessionId: sessionId });
    return sessionId;
  },

  addFolder: (name) => {
    const id = newId();
    set((s) => {
      const folders = [...s.folders, { id, name, sessions: [] }];
      persist(folders);
      return { folders, activeFolderId: id, expandedFolderId: id, activeSessionId: null };
    });
    return id;
  },

  addSession: (folderId, title) => {
    const id = newId();
    set((s) => {
      const folders = s.folders.map((f) =>
        f.id === folderId
          ? { ...f, sessions: [...f.sessions, { id, title: title || `Session ${f.sessions.length + 1}`, time: nowTime(), messages: [] }] }
          : f
      );
      persist(folders);
      return { folders, activeFolderId: folderId, expandedFolderId: folderId, activeSessionId: id };
    });
    return id;
  },

  renameSession: (folderId, sessionId, title) =>
    set((s) => {
      const folders = s.folders.map((f) =>
        f.id === folderId
          ? { ...f, sessions: f.sessions.map((x) => (x.id === sessionId ? { ...x, title } : x)) }
          : f
      );
      persist(folders);
      return { folders };
    }),

  deleteFolder: (folderId) =>
    set((s) => {
      const folders = s.folders.filter((f) => f.id !== folderId);
      persist(folders);
      return {
        folders,
        activeFolderId: s.activeFolderId === folderId ? null : s.activeFolderId,
        activeSessionId: s.activeSessionId && folders.some((f) => f.sessions.some((x) => x.id === s.activeSessionId)) ? s.activeSessionId : null,
      };
    }),

  deleteSession: (folderId, sessionId) =>
    set((s) => {
      const folders = s.folders.map((f) =>
        f.id === folderId ? { ...f, sessions: f.sessions.filter((x) => x.id !== sessionId) } : f
      );
      persist(folders);
      return { folders, activeSessionId: s.activeSessionId === sessionId ? null : s.activeSessionId };
    }),

  selectFolder: (folderId) => set({ activeFolderId: folderId, activeSessionId: null }),
  toggleFolder: (folderId) =>
    set((s) => ({ expandedFolderId: s.expandedFolderId === folderId ? null : folderId, activeFolderId: folderId })),
  selectSession: (folderId, sessionId) => set({ activeFolderId: folderId, activeSessionId: sessionId, expandedFolderId: folderId }),

  appendUserMessage: (sessionId, content) =>
    set((s) => {
      const folders = s.folders.map((f) => ({
        ...f,
        sessions: f.sessions.map((x) =>
          x.id === sessionId
            ? { ...x, messages: [...x.messages, { id: newId(), role: "user" as const, content, time: nowTime(), status: "done" as const }] }
            : x
        ),
      }));
      persist(folders);
      return { folders };
    }),

  appendAssistantMessage: (sessionId, content, status = "done") =>
    set((s) => {
      const folders = s.folders.map((f) => ({
        ...f,
        sessions: f.sessions.map((x) =>
          x.id === sessionId
            ? { ...x, messages: [...x.messages, { id: newId(), role: "assistant" as const, content, time: nowTime(), status }] }
            : x
        ),
      }));
      persist(folders);
      return { folders };
    }),

  setActiveSession: (id) => set({ activeSessionId: id }),
}));