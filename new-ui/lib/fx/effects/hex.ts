// Option 36 · Hex Pulse — cyberpunk honeycomb grid; light ripples cells ko jagati hain.
// Subtle texture jo workspace panels ke neeche sahi baithti hai.
import { FxState } from "../core";

const TAU = Math.PI * 2;

interface Cell {
  x: number;
  y: number;
}

interface Pulse {
  x: number;
  y: number;
  t0: number;
  max: number;
}

interface Lit {
  v: number;
  hue: number;
}

let cells: Cell[] = [];
let HW = 26;
let lastW = 0;
let lastH = 0;
const pulses: Pulse[] = [];
const lit = new Map<string, Lit>();

function rnd2(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function rebuild(w: number, h: number) {
  HW = Math.max(16, Math.min(w, h) / 26);
  const cols = Math.ceil(w / (HW * 1.5)) + 2;
  const rows = Math.ceil(h / (HW * Math.sqrt(3))) + 2;
  cells = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      cells.push({ x: HW * (1.5 * c + (r % 2 ? 0.75 : 0)), y: HW * Math.sqrt(3) * (r + 0.5) });
    }
  pulses.length = 0;
  lit.clear();
  lastW = w;
  lastH = h;
}

export function fxHex(st: FxState) {
  const { ctx, w, h, t } = st;
  if (w !== lastW || h !== lastH) rebuild(w, h);

  ctx.fillStyle = "#020509";
  ctx.fillRect(0, 0, w, h);

  // base glow wash so grid is visible
  const bgGlow = ctx.createRadialGradient(w / 2, h * 0.55, 0, w / 2, h * 0.55, Math.max(w, h));
  bgGlow.addColorStop(0, "rgba(30,70,90,.10)");
  bgGlow.addColorStop(1, "rgba(30,70,90,0)");
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, w, h);

  // spawn pulses
  if (Math.random() < 0.05 && pulses.length < 6) {
    const c = cells[(Math.random() * cells.length) | 0];
    if (c) pulses.push({ x: c.x, y: c.y, t0: t, max: 2.6 + Math.random() * 1.4 });
  }

  // hex path helper
  const hexPath = (x: number, y: number, r: number) => {
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU + Math.PI / 6;
      const px = x + Math.cos(a) * r * 0.94;
      const py = y + Math.sin(a) * r * 0.94;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };

  // update lit map from pulses
  for (const p of pulses) {
    const age = t - p.t0;
    if (age > p.max) continue;
    const rad = (age / p.max) * Math.min(w, h) * 0.9;
    const band = HW * 1.15;
    for (const c of cells) {
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (Math.abs(d - rad) < band) {
        const key = ((c.x * 7 + c.y) | 0) + ":" + ((p.x * 13 + p.y) | 0);
        const v = 1 - Math.abs(d - rad) / band;
        const cur = lit.get(key);
        if (!cur || v > cur.v) lit.set(key, { v: v * (1 - age / p.max), hue: 185 + rnd2(p.x) * 110 });
      }
    }
  }

  // purge dead pulses
  for (let i = pulses.length - 1; i >= 0; i--) if (t - pulses[i].t0 > pulses[i].max) pulses.splice(i, 1);

  // draw cells
  ctx.globalCompositeOperation = "lighter";
  for (const c of cells) {
    const key = ((c.x * 7 + c.y) | 0) + ":";
    // base faint stroke
    hexPath(c.x, c.y, HW);
    ctx.strokeStyle = "rgba(90,150,190,.26)";
    ctx.lineWidth = 1.1;
    ctx.stroke();
    // flicker — kuch cells random roshni
    const flk = 0.5 + 0.5 * Math.sin(c.x * 0.02 + c.y * 0.03 + t * 1.3 + Math.sin(c.x) * 2);
    if (flk > 0.93) {
      hexPath(c.x, c.y, HW * 0.8);
      ctx.fillStyle = `rgba(120,230,255,${((flk - 0.93) * 1.3).toFixed(3)})`;
      ctx.fill();
    }
    // lit by pulses
    let best: Lit | null = null;
    for (const [k, v] of lit) {
      if (k.startsWith(key)) {
        if (!best || v.v > best.v) best = v;
      }
    }
    if (best && best.v > 0.01) {
      hexPath(c.x, c.y, HW * 0.86);
      ctx.fillStyle = `hsla(${best.hue},95%,68%,${(best.v * 1.15).toFixed(3)})`;
      ctx.fill();
      hexPath(c.x, c.y, HW);
      ctx.strokeStyle = `hsla(${best.hue},95%,82%,${(best.v * 1.2).toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
  }

  // cleanup stale lit entries
  if (lit.size > 4000) lit.clear();
  ctx.globalCompositeOperation = "source-over";
}
