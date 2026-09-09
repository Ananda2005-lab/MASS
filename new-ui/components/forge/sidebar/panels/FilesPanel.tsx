"use client";

// Files — REAL attached project tree (backend /project/tree) + session artifacts.
// No mock explorer, no dead buttons. Attach happens via the TopBar folder modal.

import { useEffect, useMemo, useState } from "react";
import { API } from "@/lib/api/client";
import { ChevronDown, Folder, FolderOpen, FileText, FileCode2 } from "lucide-react";
import { useForgeUI } from "@/lib/store/forge-ui";
import { useChat } from "@/lib/store/chat";
import { PanelTitle, Empty } from "../ui";

function fileIcon(name: string) {
  if (name.endsWith(".tsx") || name.endsWith(".ts") || name.endsWith(".js"))
    return <FileCode2 size={13} className="shrink-0 text-accent-cyan/70" />;
  return <FileText size={13} className="shrink-0 text-slate2-muted" />;
}

// chat tasks ke artifacts — live files list
function Artifacts() {
  const activeSid = useForgeUI((s) => s.activeSessionId);
  const threads = useChat((s) => s.threads);
  const artifacts = useMemo(() => {
    const set = new Set<string>();
    (activeSid ? threads[activeSid] ?? [] : []).forEach((m) => m.artifacts?.forEach((a) => set.add(a)));
    return [...set];
  }, [threads, activeSid]);
  if (!artifacts.length) return null;
  return (
    <div className="mb-2">
      <PanelTitle>Artifacts · this session</PanelTitle>
      <div className="space-y-1 px-2">
        {artifacts.map((a) => (
          <div key={a} className="hover-glow flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-white/5">
            {fileIcon(a)}
            <span className="truncate text-2xs text-slate2-primary">{a}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Real attached project folder — live tree from backend
function ProjectTree() {
  const [data, setData] = useState<{ project_path: string | null; tree: any[] } | null>(null);
  const [open, setOpen] = useState<string[]>([]);
  useEffect(() => {
    let on = true;
    const load = () =>
      API.projectTree()
        .then((d) => on && setData(d))
        .catch(() => on && setData(null));
    load();
    const t = setInterval(load, 10_000);
    return () => {
      on = false;
      clearInterval(t);
    };
  }, []);

  if (!data?.project_path || !data.tree.length) {
    return (
      <Empty
        icon={<Folder size={18} />}
        text="No project attached. Use the folder icon in the top bar to attach a path or upload a folder."
      />
    );
  }
  const name = data.project_path.split(/[\\/]/).filter(Boolean).pop();

  function renderNodes(nodes: any[], prefix: string) {
    return nodes.map((n: any) => {
      const key = `${prefix}/${n.name}`;
      if (n.type === "dir") {
        const isOpen = open.includes(key);
        return (
          <div key={key}>
            <button
              type="button"
              onClick={() => setOpen((f) => (f.includes(key) ? f.filter((x) => x !== key) : [...f, key]))}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-white/5 hover-glow"
            >
              <ChevronDown size={11} className={`text-slate2-muted transition-transform ${isOpen ? "" : "-rotate-90"}`} />
              {isOpen ? <FolderOpen size={13} className="text-accent-cyan/80" /> : <Folder size={13} className="text-slate2-muted" />}
              <span className="text-2xs text-slate2-primary">{n.name}</span>
            </button>
            {isOpen && <div className="ml-5 border-l border-white/[0.06] pl-2">{renderNodes(n.children ?? [], key)}</div>}
          </div>
        );
      }
      return (
        <button
          key={key}
          type="button"
          title={n.name}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left transition hover:bg-white/5 hover-glow"
        >
          <span className="w-[11px]" />
          {fileIcon(n.name)}
          <span className="flex-1 truncate text-2xs text-slate2-secondary">{n.name}</span>
        </button>
      );
    });
  }

  return (
    <div className="mb-2">
      <PanelTitle>Project · {name}</PanelTitle>
      <div className="px-1">{renderNodes(data.tree, "")}</div>
    </div>
  );
}

export function FilesPanel() {
  return (
    <div className="panel-stagger">
      <ProjectTree />
      <Artifacts />
    </div>
  );
}
