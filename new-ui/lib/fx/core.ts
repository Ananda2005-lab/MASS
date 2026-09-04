// FX Engine core — lightweight canvas animation engine
// Handles: DPR, resize, RAF loop, visibility pause, mouse tracking, cleanup.
// Effects are factories: (state) => void  — they draw each frame using state.

export interface FxState {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  t: number; // seconds since start
  dt: number; // seconds since last frame (clamped)
  mouse: { x: number; y: number; nx: number; ny: number; active: boolean };
  rand: (seed: number) => number; // deterministic pseudo-random helper
  frame: number;
}

export type FxFactory = (state: FxState) => void;

export function makeFx(canvas: HTMLCanvasElement, factory: FxFactory): () => void {
  const ctx0 = canvas.getContext("2d");
  if (!ctx0) return () => {};
  const ctx = ctx0;

  let raf = 0;
  let running = true;
  let visible = true;
  let last = performance.now();
  const start = last;
  let frame = 0;

  const mouse = { x: -9999, y: -9999, nx: 0, ny: 0, active: false };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
    },
    { threshold: 0.01 }
  );
  io.observe(canvas);

  const onMove = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.nx = rect.width > 0 ? (mouse.x / rect.width) * 2 - 1 : 0;
    mouse.ny = rect.height > 0 ? (mouse.y / rect.height) * 2 - 1 : 0;
    mouse.active = true;
  };
  const onLeave = () => {
    mouse.active = false;
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerleave", onLeave);

  // deterministic hash-based random so effects are stable across resizes
  function hash(n: number): number {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  let w = 0;
  let h = 0;
  function readSize() {
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
  }
  readSize();

  function loop(now: number) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!running || !visible) return;
    readSize();
    const rect = canvas.getBoundingClientRect();
    factory({
      ctx,
      w: rect.width,
      h: rect.height,
      t: (now - start) / 1000,
      dt,
      mouse,
      rand: hash,
      frame,
    });
    frame++;
  }

  raf = requestAnimationFrame(loop);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerleave", onLeave);
  };
}

// helpers shared by effects ------------------------------------------------

export function fillBase(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
}

export function glowDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha: number
) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  const c = hexToRgb(color);
  g.addColorStop(0, `rgba(${c},${alpha})`);
  g.addColorStop(0.35, `rgba(${c},${alpha * 0.45})`);
  g.addColorStop(1, `rgba(${c},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}
