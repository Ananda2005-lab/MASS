"use client";

// Forge chat area — scrollable thread above the chatbox.
// User bubbles right (gradient), agent bubbles left (glass + avatar),
// live ProcessCard, typing dots, copy/retry, jump-to-bottom pill.

import { useEffect, useRef, useState } from "react";
import { ArrowDown, Check, Copy, RotateCw } from "lucide-react";
import { useChat, ChatMsg } from "@/lib/store/chat";
import { useForgeUI } from "@/lib/store/forge-ui";
import { BrandMark } from "@/components/forge/BrandMark";
import { ProcessCard } from "./ProcessCard";
import { ApprovalBanner } from "./ApprovalBanner";

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 px-1 py-1.5">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-cyan" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-indigo [animation-delay:0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-purple [animation-delay:0.3s]" />
      <span className="ml-2 font-mono text-[9px] tracking-[0.25em] text-slate2-muted">FORGE IS THINKING</span>
    </span>
  );
}

function UserBubble({ m }: { m: ChatMsg }) {
  return (
    <div className="msg-in flex justify-end">
      <div className="max-w-[78%] md:max-w-[65%]">
        {m.image && (
          <img
            src={m.image}
            alt="attached"
            className="mb-2 ml-auto h-24 w-24 rounded-xl object-cover ring-1 ring-white/30"
          />
        )}
        <div className="rounded-2xl rounded-br-md bg-gradient-to-br from-accent-cyan/90 to-accent-indigo/90 px-4 py-2.5 text-[13px] font-medium leading-relaxed text-white shadow-[0_8px_30px_rgba(56,189,248,0.25)]">
          {m.text}
        </div>
        <p className="mt-1 text-right font-mono text-[9px] tracking-widest text-slate2-muted">
          {fmtTime(m.ts)}
        </p>
      </div>
    </div>
  );
}

function AgentBubble({ m }: { m: ChatMsg }) {
  const retry = useChat((s) => s.retry);
  const [copied, setCopied] = useState<null | "ok" | "fail">(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(m.text);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
    setTimeout(() => setCopied(null), 1400);
  }

  const live = m.status === "thinking" || m.status === "running";

  return (
    <div className="msg-in flex items-start gap-2.5">
      <div className="mt-1 shrink-0">
        <BrandMark size={26} />
      </div>
      <div className="min-w-0 max-w-[85%] md:max-w-[70%]">
        <div className="group/bubble rounded-2xl rounded-bl-md border border-white/10 bg-slate-950/60 px-4 py-3 backdrop-blur-xl">
          {/* live process */}
          {live && (m.steps?.length ? <ProcessCard steps={m.steps!} status={m.status!} /> : null)}
          {/* live token stream — typing into the bubble */}
          {live && m.text ? (
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-slate2-primary">
              {m.text}
              <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-accent-cyan align-middle" />
            </p>
          ) : null}
          {m.status === "thinking" && <TypingDots />}

          {/* final answer */}
          {m.status === "done" && (
            <>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-slate2-primary">
                {m.text}
              </p>
              {m.steps && m.steps.length > 0 && <ProcessCard steps={m.steps} status="done" />}
            </>
          )}

          {/* error + retry */}
          {m.status === "error" && (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[12px] text-accent-red">{m.error ?? "Something went wrong."}</p>
              <button
                type="button"
                onClick={() => retry(m.id)}
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 font-mono text-[9px] tracking-widest text-slate2-secondary transition hover:border-accent-cyan/40 hover:text-accent-cyan"
              >
                <RotateCw size={10} /> RETRY
              </button>
            </div>
          )}
        </div>

        <div className="mt-1 flex items-center gap-2">
          <p className="font-mono text-[9px] tracking-widest text-slate2-muted">{fmtTime(m.ts)}</p>
          {m.status === "done" && (
            <button
              type="button"
              onClick={copy}
              title="Copy reply"
              className="text-slate2-muted opacity-0 transition hover:text-accent-cyan group-hover/bubble:opacity-100"
            >
              {copied === "ok" ? <Check size={11} /> : copied === "fail" ? <span className="text-[9px]">✕</span> : <Copy size={11} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatArea() {
  const activeSid = useForgeUI((s) => s.activeSessionId);
  const threads = useChat((s) => s.threads);
  const messages = (activeSid && threads[activeSid]) || [];
  const hydrated = useChat((s) => s.hydrated);
  const hydrate = useChat((s) => s.hydrate);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const [showJump, setShowJump] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && nearBottom.current) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const d = el.scrollHeight - el.scrollTop - el.clientHeight;
    nearBottom.current = d < 160;
    setShowJump(d > 240);
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={scrollRef} onScroll={onScroll} className="h-full overflow-y-auto px-4 pb-4 pt-6 md:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {/* approval requests live IN the message flow — never cover messages */}
          <ApprovalBanner />
          {hydrated && messages.length === 0 && (
            <div className="flex flex-col items-center gap-5 px-4 pt-[12vh] text-center">
              {/* logo with breathing halo */}
              <div className="animate-fade-up relative">
                <span
                  aria-hidden="true"
                  className="absolute -inset-4 animate-breathe rounded-full bg-gradient-to-r from-accent-cyan/30 via-accent-indigo/25 to-accent-purple/30 blur-xl"
                />
                <div className="animate-float relative">
                  <BrandMark size={56} />
                </div>
              </div>

              {/* big colorful animated headline */}
              <h2
                className="brand-gradient animate-shimmer animate-fade-up bg-[length:200%_auto] text-3xl font-bold leading-tight drop-shadow-[0_2px_14px_rgba(2,6,23,0.7)] md:text-[40px]"
                style={{ animationDelay: "120ms" }}
              >
                What will we build today?
              </h2>

              <p
                className="animate-fade-up max-w-md text-[15px] leading-relaxed text-slate2-primary/80 [text-shadow:0_1px_10px_rgba(2,6,23,0.9)]"
                style={{ animationDelay: "220ms" }}
              >
                Send an instruction — Forge plans it, runs the agents, uses the tools,
                and verifies every result before you see it.
              </p>

              {/* suggestion chips — click = send */}
              <div
                className="animate-fade-up mt-1 flex flex-wrap items-center justify-center gap-2"
                style={{ animationDelay: "320ms" }}
              >
                {[
                  "Design a landing page hero",
                  "Research and summarize a topic",
                  "Write and test a function",
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => useChat.getState().send(sug)}
                    className="hover-glow rounded-full border border-white/15 bg-slate-950/50 px-4 py-2 text-[13px] text-slate2-primary/90 backdrop-blur-md transition-all duration-fast [text-shadow:0_1px_8px_rgba(2,6,23,0.9)] hover:border-accent-cyan/40 hover:text-accent-cyan hover:shadow-[0_0_18px_rgba(56,189,248,0.25)]"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) =>
            m.role === "user" ? <UserBubble key={m.id} m={m} /> : <AgentBubble key={m.id} m={m} />,
          )}
        </div>
      </div>

      {/* jump to latest */}
      {showJump && (
        <button
          type="button"
          onClick={() => {
            const el = scrollRef.current;
            if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
          }}
          className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-accent-cyan/30 bg-slate-950/80 px-3 py-1.5 font-mono text-[9px] tracking-widest text-accent-cyan shadow-[0_0_20px_rgba(56,189,248,0.3)] backdrop-blur transition hover:bg-slate-900/90"
        >
          <ArrowDown size={11} className="animate-bounce" /> NEW MESSAGE
        </button>
      )}
    </div>
  );
}
