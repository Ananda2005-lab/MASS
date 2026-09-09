// Option 2 · Aurora Flow — deep ocean ke upar breathing aurora blobs.
// Sabse premium/classy, eyes pe halka — workspace ke liye calm ambient.
import { FxState } from "../core";

const TAU = Math.PI * 2;

interface Blob {
  c: string;
  r: number;
  spx: number;
  spy: number;
  px: number;
  py: number;
}

const blobs: Blob[] = [
  { c: "124,58,237", r: 0.52, spx: 0.13, spy: 0.09, px: 0, py: 1.2 },
  { c: "37,99,235", r: 0.58, spx: 0.11, spy: 0.07, px: 2.1, py: 0.4 },
  { c: "219,39,115", r: 0.4, spx: 0.08, spy: 0.12, px: 4.0, py: 2.2 },
  { c: "20,184,166", r: 0.36, spx: 0.1, spy: 0.06, px: 1.3, py: 4.1 },
  { c: "79,70,229", r: 0.5, spx: 0.07, spy: 0.1, px: 5.2, py: 3.3 },
  { c: "168,85,247", r: 0.44, spx: 0.12, spy: 0.08, px: 3.4, py: 5.0 },
];

export function fxAurora(st: FxState) {
  const { ctx, w, h, t } = st;

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#04050d";
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = "lighter";
  for (const b of blobs) {
    const bx = w * (0.5 + 0.42 * Math.sin(t * b.spx + b.px));
    const by = h * (0.5 + 0.38 * Math.cos(t * b.spy + b.py));
    const rad = Math.max(w, h) * b.r * (0.9 + 0.12 * Math.sin(t * 0.5 + b.px));
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, rad);
    g.addColorStop(0, `rgba(${b.c},.55)`);
    g.addColorStop(1, `rgba(${b.c},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(bx, by, rad, 0, TAU);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
}
