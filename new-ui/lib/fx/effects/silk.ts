// Option 10 · Silk Waves — flowing silk ribbons; sabse smooth aur premium,
// Apple-wallpaper jaisa feel. Zero flicker — eyes pe halka.
import { FxState } from "../core";

interface Band {
  y: number;
  a: number;
  amp: number;
  fr: number;
  sp: number;
  c1: string;
  c2: string;
}

const bands: Band[] = [
  { y: 0.28, a: 0.1, amp: 46, fr: 1.6, sp: 0.55, c1: "124,58,237", c2: "76,29,149" },
  { y: 0.4, a: 0.1, amp: 60, fr: 1.2, sp: -0.42, c1: "37,99,235", c2: "30,58,138" },
  { y: 0.53, a: 0.11, amp: 52, fr: 2.0, sp: 0.72, c1: "14,165,233", c2: "12,74,110" },
  { y: 0.66, a: 0.1, amp: 66, fr: 1.4, sp: -0.62, c1: "217,70,160", c2: "112,26,117" },
  { y: 0.79, a: 0.12, amp: 58, fr: 1.8, sp: 0.5, c1: "99,102,241", c2: "49,46,129" },
];

export function fxSilk(st: FxState) {
  const { ctx, w, h, t } = st;

  ctx.fillStyle = "#04050e";
  ctx.fillRect(0, 0, w, h);

  for (const b of bands) {
    const baseY = h * b.y + Math.sin(t * 0.4 + b.y * 7) * 13;
    const pts: [number, number][] = [];
    for (let x = -20; x <= w + 20; x += 14) {
      const y =
        baseY +
        Math.sin(x * 0.006 * b.fr + t * b.sp) * b.amp +
        Math.sin(x * 0.0021 * b.fr - t * b.sp * 0.6) * b.amp * 0.6;
      pts.push([x, y]);
    }

    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts) ctx.lineTo(x, y);
    ctx.lineTo(w + 20, h + 20);
    ctx.lineTo(-20, h + 20);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, baseY - b.amp, 0, h);
    g.addColorStop(0, `rgba(${b.c1},${b.a})`);
    g.addColorStop(0.5, `rgba(${b.c2},${(b.a * 0.55).toFixed(3)})`);
    g.addColorStop(1, "rgba(4,5,14,0)");
    ctx.fillStyle = g;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts) ctx.lineTo(x, y);
    ctx.strokeStyle = `rgba(${b.c1},${(b.a * 1.9).toFixed(2)})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}
