// Premium custom SVG icons — no emojis, gradient-accented line art.

export function NovaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="novaGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a78bfa" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      {/* main 4-point star */}
      <path
        d="M16 3 C17.1 9.6 22.4 14.9 29 16 C22.4 17.1 17.1 22.4 16 29 C14.9 22.4 9.6 17.1 3 16 C9.6 14.9 14.9 9.6 16 3 Z"
        fill="url(#novaGrad)"
      />
      {/* companion spark */}
      <path
        d="M25.5 4.5 C25.9 6.6 27.4 8.1 29.5 8.5 C27.4 8.9 25.9 10.4 25.5 12.5 C25.1 10.4 23.6 8.9 21.5 8.5 C23.6 8.1 25.1 6.6 25.5 4.5 Z"
        fill="url(#novaGrad)"
        opacity="0.85"
      />
    </svg>
  );
}

export function ForgeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="forgeGrad" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#4ade80" />
        </linearGradient>
      </defs>
      {/* top diamond — solid */}
      <path
        d="M16 3.5 L27 9.5 L16 15.5 L5 9.5 Z"
        fill="url(#forgeGrad)"
        opacity="0.9"
      />
      {/* middle layer */}
      <path
        d="M5 15.5 L16 21.5 L27 15.5"
        stroke="url(#forgeGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      {/* bottom layer */}
      <path
        d="M5 21 L16 27 L27 21"
        stroke="url(#forgeGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
      />
    </svg>
  );
}
