"use client";

// FORGE icons v3 — COMPLETELY NEW shapes (v2 se alag):
// Sessions=overlapping bubbles, Files=folded doc, Agents=AI chip,
// Tools=live sliders, Sources=database stack, Integrations=puzzle plug.
// Gradient fills + glass highlights + living animations + neon hover glow.

type P = { size?: number };

const S = (size = 18) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  "aria-hidden": true,
});

export function SessionsIcon({ size = 18 }: P) {
  return (
    <svg {...S(size)} className="ico-glow-cyan">
      <defs>
        <linearGradient id="fg-sessions" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      {/* back bubble */}
      <rect x="8" y="2.6" width="13.2" height="9.6" rx="3" fill="#0ea5e9" opacity="0.4" />
      {/* front bubble with tail */}
      <path
        d="M16.6 8.6v5a3 3 0 0 1-3 3H7.4L4 19.6l1-3.3a3.2 3.2 0 0 1-1.2-2.5v-5.2a3 3 0 0 1 3-3h6.8a3 3 0 0 1 3 3z"
        fill="url(#fg-sessions)"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="0.8"
      />
      <path
        d="M16.6 8.6v2.6h-12.8V8.6a3 3 0 0 1 3-3h6.8a3 3 0 0 1 3 3z"
        fill="#ffffff"
        opacity="0.28"
      />
      <circle cx="7.4" cy="11.2" r="1" fill="#ffffff" className="ico-dot" />
      <circle cx="10.3" cy="11.2" r="1" fill="#ffffff" className="ico-dot ico-d2" />
      <circle cx="13.2" cy="11.2" r="1" fill="#ffffff" className="ico-dot ico-d3" />
    </svg>
  );
}

export function FilesIcon({ size = 18 }: P) {
  return (
    <svg {...S(size)} className="ico-glow-amber">
      <defs>
        <linearGradient id="fg-files" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      {/* doc body */}
      <path
        d="M6.5 2.8h7.2L19 8.1v12.1a1.6 1.6 0 0 1-1.6 1.6H6.5a1.6 1.6 0 0 1-1.6-1.6V4.4a1.6 1.6 0 0 1 1.6-1.6z"
        fill="url(#fg-files)"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="0.8"
      />
      {/* folded corner */}
      <path d="M13.7 2.8l5.3 5.3h-4.3a1 1 0 0 1-1-1z" fill="#ffffff" opacity="0.55" />
      {/* glass top */}
      <path d="M6.5 2.8h7.2v4.3a1 1 0 0 1-1 1H4.9V4.4a1.6 1.6 0 0 1 1.6-1.6z" fill="#ffffff" opacity="0.22" />
      {/* code lines */}
      <path d="M8 12.6h5.5M8 15.4h8M8 18.2h4.5" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" opacity="0.85" />
      <path d="M19.8 2.6l.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5z" fill="#ffffff" className="ico-spark" />
    </svg>
  );
}

export function AgentsIcon({ size = 18 }: P) {
  return (
    <svg {...S(size)} className="ico-glow-violet">
      <defs>
        <linearGradient id="fg-agents" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      {/* pins */}
      <path
        d="M9 2.6v2.2M12 2.6v2.2M15 2.6v2.2M9 19.2v2.2M12 19.2v2.2M15 19.2v2.2M2.6 9h2.2M2.6 12h2.2M2.6 15h2.2M19.2 9h2.2M19.2 12h2.2M19.2 15h2.2"
        stroke="url(#fg-agents)"
        strokeWidth="1.4"
        strokeLinecap="round"
        className="ico-dim"
      />
      {/* chip body */}
      <rect x="4.9" y="4.9" width="14.2" height="14.2" rx="3.6" fill="url(#fg-agents)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
      <path d="M4.9 8.5a3.6 3.6 0 0 1 3.6-3.6h7a3.6 3.6 0 0 1 3.6 3.6v1.4H4.9z" fill="#ffffff" opacity="0.25" />
      {/* core */}
      <rect x="9.1" y="9.1" width="5.8" height="5.8" rx="1.8" fill="#1e1b4b" opacity="0.65" />
      <circle cx="12" cy="12" r="1.7" fill="#ede9fe" className="ico-pulse" />
    </svg>
  );
}

export function ToolsIcon({ size = 18 }: P) {
  return (
    <svg {...S(size)} className="ico-glow-indigo">
      <defs>
        <linearGradient id="fg-tools" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a5b4fc" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      {/* tracks */}
      <rect x="2.8" y="6.1" width="18.4" height="2.8" rx="1.4" fill="#ffffff" opacity="0.14" />
      <rect x="2.8" y="10.6" width="18.4" height="2.8" rx="1.4" fill="#ffffff" opacity="0.14" />
      <rect x="2.8" y="15.1" width="18.4" height="2.8" rx="1.4" fill="#ffffff" opacity="0.14" />
      {/* knobs — gently sliding */}
      <circle cx="7.8" cy="7.5" r="2.5" fill="url(#fg-tools)" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9" className="ico-knob" />
      <circle cx="15.2" cy="12" r="2.5" fill="url(#fg-tools)" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9" className="ico-knob ico-d2" />
      <circle cx="10.4" cy="16.5" r="2.5" fill="url(#fg-tools)" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9" className="ico-knob ico-d3" />
    </svg>
  );
}

export function SourcesIcon({ size = 18 }: P) {
  return (
    <svg {...S(size)} className="ico-glow-green">
      <defs>
        <linearGradient id="fg-sources" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bbf7d0" />
          <stop offset="1" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      {/* bottom disk */}
      <path
        d="M4 13.6v4.1c0 1.7 3.6 3 8 3s8-1.3 8-3v-4.1"
        fill="url(#fg-sources)"
        opacity="0.55"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="0.7"
      />
      {/* middle disk — breathing */}
      <path
        d="M4 8.9v4.1c0 1.7 3.6 3 8 3s8-1.3 8-3V8.9"
        fill="url(#fg-sources)"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="0.7"
        className="ico-dim"
      />
      {/* top disk */}
      <ellipse cx="12" cy="6" rx="8" ry="3.1" fill="url(#fg-sources)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
      <ellipse cx="12" cy="5.4" rx="4.6" ry="1.5" fill="#ffffff" opacity="0.3" />
    </svg>
  );
}

export function IntegrationsIcon({ size = 18 }: P) {  return (
    <svg {...S(size)} className="ico-glow-purple">
      <defs>
        <linearGradient id="fg-integrations" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e9d5ff" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      {/* puzzle plug — wiggling */}
      <path
        d="M12 2.5a2.5 2.5 0 0 1 2.5 2.5c0 .6-.17 1.15-.5 1.55h2.6a1.65 1.65 0 0 1 1.65 1.65v2.6c.4-.33.95-.5 1.55-.5a2.5 2.5 0 0 1 0 5c-.6 0-1.15-.17-1.55-.5v2.6a1.65 1.65 0 0 1-1.65 1.65h-2.6c.33.4.5.95.5 1.55a2.5 2.5 0 0 1-5 0c0-.6.17-1.15.5-1.55H7.4a1.65 1.65 0 0 1-1.65-1.65v-2.6c-.4.33-.95.5-1.55.5a2.5 2.5 0 0 1 0-5c.6 0 1.15.17 1.55.5V8.2A1.65 1.65 0 0 1 7.4 6.55h2.6c-.33-.4-.5-.95-.5-1.55A2.5 2.5 0 0 1 12 2.5z"
        fill="url(#fg-integrations)"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="0.8"
        className="ico-wiggle"
      />
      <circle cx="12" cy="12" r="1.6" fill="#ffffff" opacity="0.85" className="ico-pulse" />
    </svg>
  );
}

export function SettingsGearIcon({ size = 16 }: P) {
  return (
    <svg {...S(size)} className="ico-glow-cyan">
      <defs>
        <linearGradient id="fg-gear" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <g className="gear-spin">
        {/* teeth — 4 rounded bars = 8 teeth */}
        <g fill="url(#fg-gear)">
          <rect x="10.4" y="1.8" width="3.2" height="20.4" rx="1.6" />
          <rect x="10.4" y="1.8" width="3.2" height="20.4" rx="1.6" transform="rotate(45 12 12)" />
          <rect x="10.4" y="1.8" width="3.2" height="20.4" rx="1.6" transform="rotate(90 12 12)" />
          <rect x="10.4" y="1.8" width="3.2" height="20.4" rx="1.6" transform="rotate(135 12 12)" />
        </g>
        {/* gear body + glass top */}
        <circle cx="12" cy="12" r="6.6" fill="url(#fg-gear)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        <path d="M12 5.4a6.6 6.6 0 0 1 6.6 6.6H5.4A6.6 6.6 0 0 1 12 5.4z" fill="#ffffff" opacity="0.22" />
      </g>
      {/* center hub */}
      <circle cx="12" cy="12" r="2.7" fill="#0b1120" />
      <circle cx="12" cy="12" r="1.2" fill="#e0f2fe" className="ico-pulse" />
    </svg>
  );
}
