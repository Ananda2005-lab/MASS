"use client";

// FORGE ChatBox — bottom-floating transparent pill (sirf input box).
// Rainbow rotating border + breathing halo + animated gradient placeholder
// (vertical-center, 14px) + premium circular send button: 44px, 39px core,
// 18px white arrow optically centered, hover pe arrow-slide loop, click burst,
// empty-click nudge. UI text: English only.

import { useRef, useState } from "react";
import { useChat } from "@/lib/store/chat";

// Balanced up-arrow (rounded caps, 2.4 stroke) — circle ke andar optically centered
function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
}

export function ChatBox() {
  const [text, setText] = useState("");
  const [burst, setBurst] = useState(false); // send flash
  const [nudge, setNudge] = useState(false); // empty-click feedback
  const [image, setImage] = useState<string | null>(null); // vision attach
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function pickImage(f: File | undefined) {
    if (!f) return;
    if (f.size > 4.5 * 1024 * 1024) {
      setNudge(true);
      setTimeout(() => setNudge(false), 500);
      return;
    }
    const rd = new FileReader();
    rd.onload = () => setImage(typeof rd.result === "string" ? rd.result : null);
    rd.readAsDataURL(f);
  }

  function autoGrow() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }

  function send() {
    const body = text.trim();
    if (!body && !image) {
      // khali box pe click = nudge shake + placeholder flash (dead button nahi)
      setNudge(true);
      setTimeout(() => setNudge(false), 500);
      taRef.current?.focus();
      return;
    }
    // real backend task — store handles polling + process + final reply
    useChat.getState().send(body, image);
    setText("");
    setImage(null);
    if (fileRef.current) fileRef.current.value = "";
    if (taRef.current) taRef.current.style.height = "auto";
    setBurst(true);
    setTimeout(() => setBurst(false), 650);
  }

  const has = text.trim().length > 0;

  return (
    <div className="relative z-10 flex items-end justify-center px-3 pb-4 md:px-8 md:pb-5">
      <div className="group relative w-full max-w-2xl">
        {/* vision preview chip */}
        {image && (
          <div className="mb-2 flex items-center justify-center gap-2.5 rounded-2xl bg-slate-950/60 px-3 py-2 ring-1 ring-white/10 backdrop-blur-xl">
            <img src={image} alt="attached preview" className="h-9 w-9 rounded-lg object-cover ring-1 ring-accent-cyan/40" />
            <span className="text-[13px] font-medium text-slate2-primary/90" style={{ textShadow: "0 1px 4px rgba(2,6,23,.6)" }}>
              Image attached — Forge will see it
            </span>
            <button
              type="button"
              title="Remove image"
              onClick={() => setImage(null)}
              className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[13px] text-slate2-primary hover:bg-white/20"
            >
              ✕
            </button>
          </div>
        )}
        {/* breathing halo behind whole box */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute -inset-3 rounded-[36px] bg-gradient-to-r from-accent-cyan/30 via-accent-indigo/25 to-accent-purple/30 blur-xl transition-opacity duration-base ${
            burst ? "opacity-90" : "opacity-35 group-focus-within:opacity-75"
          }`}
        />

        {/* rotating rainbow border */}
        <div className={`chat-ring relative rounded-[30px] p-[1.5px] ${burst ? "chat-ring-fast" : ""}`}>
          {/* transparent glass interior — items-center = input line aur button ek axis pe */}
          <div className="flex items-center gap-3 rounded-[28px] bg-slate-950/35 py-2.5 pl-5 pr-2.5 backdrop-blur-2xl transition-shadow duration-base group-focus-within:shadow-[inset_0_0_30px_rgba(56,189,248,0.08)]">
            {/* input + animated gradient placeholder (vertical center) */}
            <div className="relative min-w-0 flex-1">
              <textarea
                ref={taRef}
                rows={1}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  autoGrow();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder=" "
                aria-label="Instruction for Forge"
                className="block max-h-[140px] w-full resize-none bg-transparent py-1.5 text-[14px] font-medium leading-relaxed text-slate2-primary caret-accent-cyan outline-none"
              />
              {!has && (
                <div
                  aria-hidden="true"
                  className={`placeholder-shimmer pointer-events-none absolute inset-0 flex items-center text-[14px] font-medium leading-relaxed ${
                    nudge ? "ph-flash" : ""
                  }`}
                >
                  Ask Forge to build anything…
                </div>
              )}
            </div>

            {/* ── ATTACH IMAGE (vision) ── */}
            <button
              type="button"
              title="Attach image"
              onClick={() => fileRef.current?.click()}
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate2-secondary transition-all duration-fast hover:scale-110 hover:text-accent-cyan ${image ? "text-accent-cyan" : ""}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickImage(e.target.files?.[0])}
            />

            {/* ── SEND — 44px premium circle: ring + halo + depth core + arrow loop ── */}
            <button
              type="button"
              title="Send"
              onClick={send}
              className={`group/send relative h-11 w-11 shrink-0 transition-transform duration-fast hover:scale-110 active:scale-90 ${
                nudge ? "nudge-shake" : ""
              }`}
            >
              {/* rotating ring — soft when empty, fast on send */}
              <span
                aria-hidden="true"
                className={`send-ring absolute inset-0 rounded-full ${
                  has ? (burst ? "send-ring-fast" : "") : "send-ring-dim"
                }`}
              />
              {/* breathing halo */}
              <span
                aria-hidden="true"
                className={`absolute -inset-1.5 animate-breathe rounded-full bg-accent-cyan blur-md transition-opacity duration-base ${
                  burst ? "opacity-90" : has ? "opacity-50" : "opacity-20"
                }`}
              />
              {/* gradient core with inner light + depth */}
              <span className="cta-live absolute inset-[2.5px] overflow-hidden rounded-full bg-gradient-to-br from-accent-cyan via-accent-indigo to-accent-cyan bg-[length:200%_auto] shadow-[inset_0_1px_5px_rgba(255,255,255,0.4),inset_0_-3px_8px_rgba(2,6,23,0.45)]">
                {/* arrow pair — hover pe upar slide, neeche wala center mein aata hai */}
                <span className="relative block h-full w-full text-white transition-transform duration-200 ease-out group-hover/send:-translate-y-full">
                  <ArrowUpIcon className="absolute inset-0 m-auto h-[18px] w-[18px] drop-shadow-[0_1px_2px_rgba(2,6,23,0.4)]" />
                  <ArrowUpIcon className="absolute left-1/2 top-full h-[18px] w-[18px] -translate-x-1/2 drop-shadow-[0_1px_2px_rgba(2,6,23,0.4)]" />
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* hint — English */}
        <p className="mt-2 text-center font-mono text-[9px] tracking-[0.25em] text-slate2-secondary/80">
          ENTER TO SEND · SHIFT+ENTER FOR NEW LINE
        </p>
      </div>
    </div>
  );
}
