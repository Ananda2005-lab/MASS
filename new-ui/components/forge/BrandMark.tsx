"use client";

// FORGE brand mark — CLEAN hexagon:
// F sharp/crisp (upar) + soft glow copy (peeche) — dono ka color dheere-dheere cycle hota hai.
// Hexagon bg pe polish sweep. Charo taraf kuch nahi.

export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" width={size} height={size} className="relative">
        <defs>
          <linearGradient id="bm-hud" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7dd3fc" />
            <stop offset="1" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="bm-f" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#38bdf8" />
            <stop offset="0.5" stopColor="#818cf8" />
            <stop offset="1" stopColor="#f472b6" />
          </linearGradient>
          <linearGradient id="bm-polish" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <clipPath id="bm-hexclip">
            <path d="M24 3.5 L41.5 13.75 L41.5 34.25 L24 44.5 L6.5 34.25 L6.5 13.75 Z" />
          </clipPath>
        </defs>

        {/* hex shell — clean, no inner clutter */}
        <path
          d="M24 3.5 L41.5 13.75 L41.5 34.25 L24 44.5 L6.5 34.25 L6.5 13.75 Z"
          fill="rgba(56,189,248,0.07)"
          stroke="url(#bm-hud)"
          strokeWidth="1.4"
        />

        {/* polish sweep — F ke PEECHE se guzarta hai, F clean rehta hai */}
        <g clipPath="url(#bm-hexclip)">
          <rect className="hex-polish" x="-20" y="-4" width="15" height="56" fill="url(#bm-polish)" />
        </g>

        {/* F — sirf ek SHARP copy, koi blur/shadow nahi. Color dheere-dheere cycle. */}
        <path
          className="f-hue-clean"
          d="M18.6 14.6 H31 V18.7 H23.5 V22.4 H29.7 V26.5 H23.5 V34 H18.6 Z"
          fill="url(#bm-f)"
        />
      </svg>
    </span>
  );
}
