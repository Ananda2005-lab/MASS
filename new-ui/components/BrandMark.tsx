// RAG-V2 brand mark — spark inside a ring, gradient accent.
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bmGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a78bfa" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      {/* outer ring */}
      <circle cx="16" cy="16" r="12.5" stroke="url(#bmGrad)" strokeWidth="1.6" opacity="0.55" />
      {/* arc accent */}
      <path d="M16 3.5 A12.5 12.5 0 0 1 28.5 16" stroke="url(#bmGrad)" strokeWidth="2.4" strokeLinecap="round" />
      {/* inner spark */}
      <path
        d="M16 8.5 C16.6 12.1 19.9 15.4 23.5 16 C19.9 16.6 16.6 19.9 16 23.5 C15.4 19.9 12.1 16.6 8.5 16 C12.1 15.4 15.4 12.1 16 8.5 Z"
        fill="url(#bmGrad)"
      />
    </svg>
  );
}
