"use client";

// Forge — Premium Chatbox. Session-linked: messages store per session,
// send with conversation_id, real LLM response from Groq gpt-oss-120b.

import { useEffect, useRef, useState } from "react";
import { Send, Paperclip, Mic, Sparkles, Loader2, XCircle, Bot, User } from "lucide-react";
import { useTaskStore } from "@/lib/store/task";
import { useSessionStore } from "@/lib/store/session";

export function Chatbox() {
  const submit = useTaskStore((s) => s.submit);
  const busy = useTaskStore((s) => s.busy);
  const finalResult = useTaskStore((s) => s.finalResult);
  const error = useTaskStore((s) => s.error);
  const lastInstruction = useTaskStore((s) => s.lastInstruction);
  const steps = useTaskStore((s) => s.steps);
  const phase = useTaskStore((s) => s.phase);

  const folders = useSessionStore((s) => s.folders);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const appendUserMessage = useSessionStore((s) => s.appendUserMessage);
  const appendAssistantMessage = useSessionStore((s) => s.appendAssistantMessage);
  const startNewChat = useSessionStore((s) => s.startNewChat);

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeSession = folders
    .flatMap((f) => f.sessions)
    .find((s) => s.id === activeSessionId);

  // auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, busy, finalResult]);

  // auto-resize textarea
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  async function send() {
    const cmd = input.trim();
    if (!cmd || busy) return;
    let sessionId = activeSessionId;
    // auto-create session if none active
    if (!sessionId) {
      sessionId = startNewChat();
    }
    setInput("");
    setTyping(true);
    appendUserMessage(sessionId, cmd);
    const result = await submit(cmd);
    setTyping(false);
    if (result) {
      appendAssistantMessage(sessionId, result, "done");
    } else {
      const err = useTaskStore.getState().error || "Kuch galat ho gaya";
      appendAssistantMessage(sessionId, err, "error");
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const messages = activeSession?.messages ?? [];

  return (
    <div className="flex h-full flex-col items-center">
      {/* chat area */}
      <div className="w-full max-w-2xl flex-1 overflow-y-auto px-4 py-6">
        {!activeSessionId ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-accent-indigo/20 text-accent-cyan">
              <Sparkles size={24} />
            </span>
            <p className="text-lg font-semibold text-slate2-primary">Kya karna hai?</p>
            <p className="max-w-sm text-xs2 leading-relaxed text-slate2-muted">
              Pehle folder add karo → session banao → phir neeche likho. Agent real LLM (Groq gpt-oss-120b) se jawab dega.
            </p>
          </div>
        ) : messages.length === 0 && !busy ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-accent-indigo/20 text-accent-cyan">
              <Sparkles size={24} />
            </span>
            <p className="text-sm font-semibold text-slate2-primary">Active session</p>
            <p className="text-2xs text-slate2-muted">{activeSession?.title}</p>
            <p className="text-xs2 text-slate2-secondary">Neeche likho — real LLM response yahan dikhega</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-cyan/60 to-accent-indigo/60">
                    <Bot size={14} className="text-bg-void" />
                  </span>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs2 leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-sm bg-gradient-to-r from-accent-cyan to-accent-indigo text-bg-void"
                      : "rounded-bl-sm border border-white/[0.08] bg-white/[0.04] text-slate2-primary"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className={`mt-1 text-[9px] ${m.role === "user" ? "text-bg-void/60" : "text-slate2-muted"}`}>{m.time}</p>
                </div>
                {m.role === "user" && (
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-violet to-accent-indigo">
                    <User size={14} className="text-slate2-primary" />
                  </span>
                )}
              </div>
            ))}

            {/* thinking indicator */}
            {busy && (
              <div className="flex justify-start gap-3">
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-cyan/60 to-accent-indigo/60">
                  <Bot size={14} className="text-bg-void" />
                </span>
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.04] px-4 py-3">
                  <Loader2 size={14} className="animate-spin text-accent-cyan" />
                  <span className="text-xs2 text-slate2-secondary">Agent soch raha hai…</span>
                </div>
              </div>
            )}

            {/* steps */}
            {steps.length > 0 && busy && (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                <p className="mb-2 text-[10px] uppercase tracking-widest text-slate2-muted">Agent steps</p>
                <div className="space-y-1">
                  {steps.map((s, i) => (
                    <div key={s.id ?? i} className="flex items-center gap-2 text-2xs">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.status === "done" ? "bg-semantic-success" : s.status === "processing" ? "animate-pulse-soft bg-accent-cyan" : "bg-white/20"}`} />
                      <span className={s.status === "done" ? "text-slate2-secondary" : "text-slate2-muted"}>{s.label}</span>
                      {s.agent && <span className="ml-auto rounded-full border border-white/10 px-1.5 py-0.5 text-[9px] text-slate2-muted">{s.agent}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* chatbox input */}
      <div className="w-full max-w-2xl px-4 pb-6">
        <div
          className={`group flex items-end gap-2 rounded-2xl border bg-white/[0.04] p-2.5 shadow-lg2 backdrop-blur-2xl transition-all duration-base ${
            typing || busy
              ? "border-accent-cyan/50 shadow-[0_0_30px_rgba(56,189,248,0.15)]"
              : "border-white/10 focus-within:border-accent-cyan/50 focus-within:shadow-[0_0_24px_rgba(56,189,248,0.12)]"
          }`}
        >
          <div className="flex shrink-0 items-center gap-0.5 pb-1">
            <button type="button" title="Attach file" className="rounded-lg p-2 text-slate2-muted transition hover:bg-white/10 hover:text-slate2-primary">
              <Paperclip size={16} />
            </button>
            <button type="button" title="Voice input" className="rounded-lg p-2 text-slate2-muted transition hover:bg-white/10 hover:text-slate2-primary">
              <Mic size={16} />
            </button>
          </div>

          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder="Command the agent…"
            className="max-h-[120px] flex-1 resize-none bg-transparent py-2 text-xs2 text-slate2-primary outline-none placeholder:text-slate2-muted"
          />

          <button
            type="button"
            onClick={send}
            disabled={busy || !input.trim()}
            title="Send (Enter)"
            className={`flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-indigo px-4 py-2.5 text-xs2 font-semibold text-bg-void transition-all duration-base ${
              busy || !input.trim()
                ? "opacity-40"
                : "hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] active:scale-[0.97]"
            }`}
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>

        <p className="mt-2 text-center text-[10px] text-slate2-muted">
          Enter to send · Shift+Enter nayi line · Model: Groq gpt-oss-120b · 5 keys rotation
        </p>
      </div>
    </div>
  );
}