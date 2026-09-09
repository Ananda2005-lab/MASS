"use client";

// FORGE TopBar — h-12 dark glass strip.
// Left: brand + attached project chip. Center: live pipeline pill.
// Right: provider dots + Auto/Ask safety switch + folder attach + live dot.
// English-only UI strings.

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { API } from "@/lib/api/client";
import { useChat } from "@/lib/store/chat";
import { useForgeUI } from "@/lib/store/forge-ui";
import { BrandMark } from "./BrandMark";

interface SystemInfo {
  safety_mode: string;
  sandbox_scope: string;
  providers: string[];
  project_path: string | null;
  mcp_tools: string[];
}

export function TopBar() {
  const [sys, setSys] = useState<SystemInfo | null>(null);
  const [showAttach, setShowAttach] = useState(false);
  const [path, setPath] = useState("");
  const [attachMsg, setAttachMsg] = useState<string | null>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const threads = useChat((s) => s.threads);
  const activeSessionId = useForgeUI((s) => s.activeSessionId);

  useEffect(() => {
    let on = true;
    const load = () =>
      API.system()
        .then((d) => on && setSys(d))
        .catch(() => on && setSys(null));
    load();
    const t = setInterval(load, 10_000);
    return () => {
      on = false;
      clearInterval(t);
    };
  }, []);

  // Escape closes the attach dialog
  useEffect(() => {
    if (!showAttach) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowAttach(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAttach]);

  // live pipeline state from the active thread's latest agent message
  const pipeline = useMemo(() => {
    const msgs = threads[activeSessionId ?? ""] ?? [];
    const last = [...msgs].reverse().find((m) => m.role === "agent");
    if (!last) return { label: "IDLE", tone: "idle" as const };
    if (last.status === "thinking") return { label: "PLANNING…", tone: "run" as const };
    if (last.status === "running") {
      const done = (last.steps ?? []).filter((s) => s.status === "succeeded").length;
      const total = (last.steps ?? []).length;
      return { label: total ? `RUNNING ${done}/${total}` : "RUNNING…", tone: "run" as const };
    }
    if (last.status === "error") return { label: "FAILED", tone: "err" as const };
    return { label: "DONE", tone: "ok" as const };
  }, [threads, activeSessionId]);

  async function attach() {
    const p = path.trim();
    if (!p) return;
    try {
      const r = await API.attachProject(p);
      setAttachMsg(r.ok ? `Attached · ${r.tools} tools` : "Attach failed (server unavailable)");
      if (r.ok) {
        setPath("");
        setShowAttach(false);
        const d = await API.system();
        setSys(d);
      }
    } catch {
      setAttachMsg("Attach failed");
    }
    setTimeout(() => setAttachMsg(null), 4000);
  }

  async function uploadFolder(list: FileList | null) {
    if (!list || list.length === 0) return;
    setUploading(true);
    setAttachMsg("Reading folder…");
    try {
      const SKIP = new Set(["node_modules", ".git", "dist", "build", ".next", "coverage", "__pycache__", ".venv"]);
      const files: { path: string; b64: string }[] = [];
      let skipped = 0;
      for (const f of Array.from(list).slice(0, 400)) {
        const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath ?? "";
        const parts = rel.split("/");
        if (parts.length < 2 || parts.some((p) => SKIP.has(p)) || f.size > 2 * 1024 * 1024) {
          skipped++;
          continue;
        }
        const b64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
          r.onerror = () => reject(new Error("read failed"));
          r.readAsDataURL(f);
        });
        files.push({ path: parts.slice(1).join("/"), b64 });
      }
      const name =
        (Array.from(list)[0] as File & { webkitRelativePath?: string }).webkitRelativePath?.split("/")[0] ||
        "project";
      const r = await API.uploadProject(name, files);
      setAttachMsg(r.ok ? `Uploaded ${r.written} files · ${r.tools} tools` : `Upload failed (${skipped} skipped)`);
      if (r.ok) {
        setShowAttach(false);
        const d = await API.system();
        setSys(d);
      }
    } catch {
      setAttachMsg("Upload failed");
    }
    setUploading(false);
    setTimeout(() => setAttachMsg(null), 5000);
  }

  async function setSafety(mode: string) {
    // single round-trip: POST returns the new mode — no refetch (low latency)
    try {
      const r = await API.setSafety(mode);
      setSys((s) => (s ? { ...s, safety_mode: r.safety_mode ?? mode } : s));
    } catch {
      /* backend offline */
    }
  }

  const projectName = sys?.project_path ? sys.project_path.split(/[\\/]/).filter(Boolean).pop() : null;

  return (
    <div className="relative z-20 flex h-12 items-center gap-3 border-b border-white/5 bg-slate-950/70 px-4 backdrop-blur-xl">
      {/* left: brand + project */}
      <div className="flex min-w-0 items-center gap-2.5">
        <BrandMark size={22} />
        <span className="hidden text-[13px] font-semibold tracking-wide text-slate2-primary sm:block">FORGE</span>
        <span className="h-4 w-px bg-white/10" />
        <span
          title={sys?.project_path ?? "No project attached"}
          className="max-w-[220px] truncate rounded-full bg-white/5 px-2.5 py-1 text-[13px] font-medium text-slate2-secondary ring-1 ring-white/10"
        >
          {projectName ? `📁 ${projectName}` : "No project"}
        </span>
      </div>

      {/* center: pipeline pill */}
      <div className="flex flex-1 justify-center">
        <span
          className={`flex items-center gap-2 rounded-full px-3.5 py-1 font-mono text-[11px] tracking-[0.18em] ring-1 ${
            pipeline.tone === "run"
              ? "bg-accent-cyan/10 text-accent-cyan ring-accent-cyan/30"
              : pipeline.tone === "ok"
                ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30"
                : pipeline.tone === "err"
                  ? "bg-rose-400/10 text-rose-300 ring-rose-400/30"
                  : "bg-white/5 text-slate2-secondary ring-white/10"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              pipeline.tone === "run"
                ? "animate-pulse bg-accent-cyan"
                : pipeline.tone === "ok"
                  ? "bg-emerald-300"
                  : pipeline.tone === "err"
                    ? "bg-rose-300"
                    : "bg-slate2-secondary/60"
            }`}
          />
          {pipeline.label}
        </span>
      </div>

      {/* right: providers + safety + attach + live */}
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-1.5 md:flex" title={`Providers: ${sys?.providers.join(", ") ?? "offline"}`}>
          {(sys?.providers ?? []).map((p) => (
            <span
              key={p}
              title={p}
              className={`h-2 w-2 rounded-full ${p === "fake" ? "bg-slate2-secondary/50" : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"}`}
            />
          ))}
          {!sys && <span className="h-2 w-2 rounded-full bg-rose-400" />}
        </div>

        {/* Auto / Ask */}
        <div className="flex items-center rounded-full bg-white/5 p-0.5 ring-1 ring-white/10" title="Safety mode: Auto = autonomous, Ask = approvals">
          {(["auto", "ask"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSafety(m)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                sys?.safety_mode === m ? "bg-accent-indigo/80 text-white" : "text-slate2-secondary hover:text-slate2-primary"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* folder attach */}
        <div className="relative">
          <button
            type="button"
            title="Attach project folder"
            onClick={() => setShowAttach((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate2-secondary ring-1 ring-white/10 transition-colors hover:text-accent-cyan"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
            </svg>
          </button>
          {/* portals to <body>: TopBar's backdrop-blur would otherwise trap fixed children */}
          {showAttach &&
            createPortal(
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={() => setShowAttach(false)}
              >
              <div
                className="w-[360px] rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.65)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-slate2-primary">Attach project folder</p>
                  <button
                    type="button"
                    title="Close"
                    onClick={() => setShowAttach(false)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate2-secondary transition-colors hover:bg-white/10 hover:text-slate2-primary"
                  >
                    ✕
                  </button>
                </div>
                <p className="mb-1.5 text-[12px] text-slate2-secondary">Backend machine path</p>
                <input
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && attach()}
                  placeholder="C:\Users\you\project"
                  className="w-full rounded-lg bg-white/5 px-3 py-2 text-[13px] text-slate2-primary outline-none ring-1 ring-white/10 placeholder:text-slate2-secondary/50 focus:ring-accent-cyan/50"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={attach}
                    className="rounded-lg bg-accent-indigo/80 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-accent-indigo"
                  >
                    Attach
                  </button>
                </div>

                {/* real folder picker — uploads the folder like the image picker */}
                <div className="mt-3 border-t border-white/10 pt-2.5">
                  <p className="mb-1.5 text-[12px] text-slate2-secondary">or upload a folder from this computer</p>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => folderRef.current?.click()}
                    className="w-full rounded-lg bg-white/5 px-3 py-2 text-[12px] font-semibold text-slate2-primary ring-1 ring-white/10 transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    {uploading ? "Uploading…" : "📂 Choose folder"}
                  </button>
                  <input
                    ref={folderRef}
                    type="file"
                    multiple
                    className="hidden"
                    {...({ webkitdirectory: "" } as Record<string, string>)}
                    onChange={(e) => {
                      void uploadFolder(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
              </div>,
              document.body,
            )}

          {/* transient toast — visible even after the modal closes, never in flow */}
          {attachMsg &&
            createPortal(
              <div className="fixed left-1/2 top-14 z-50 -translate-x-1/2 rounded-full border border-accent-cyan/30 bg-slate-950/90 px-4 py-1.5 text-[12px] font-medium text-slate2-primary shadow-[0_0_24px_rgba(56,189,248,0.35)] backdrop-blur">
                {attachMsg}
              </div>,
              document.body,
            )}
        </div>

        {/* live dot */}
        <span
          title={sys ? "Backend connected" : "Backend offline"}
          className={`h-2 w-2 rounded-full ${sys ? "animate-pulse bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" : "bg-rose-400"}`}
        />
      </div>
    </div>
  );
}
