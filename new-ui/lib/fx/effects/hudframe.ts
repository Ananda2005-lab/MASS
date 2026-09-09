// Option 30 · HUD Frame — command-center furniture: corner brackets, edge rulers,
// left dial, right mini-radar, data columns, drifting crosshairs.
// Center jaan-boojh ke clear chhoda gaya hai (vignette) — workspace panels ke liye.
import { FxState } from "../core";

const TAU = Math.PI * 2;

interface Drift {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const drift: Drift[] = [];
{
  let seed = 19;
  const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
  for (let i = 0; i < 7; i++)
    drift.push({ x: rnd(), y: rnd(), vx: (rnd() - 0.5) * 0.01, vy: (rnd() - 0.5) * 0.01 });
}

export function fxHudFrame(st: FxState) {
  const { ctx, w, h, t } = st;

  ctx.fillStyle = "#02060f";
  ctx.fillRect(0, 0, w, h);

  // faint grid
  ctx.strokeStyle = "rgba(40,140,220,.05)";
  ctx.lineWidth = 1;
  const gs = Math.min(w, h) / 14;
  ctx.beginPath();
  for (let x = 0; x <= w; x += gs) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = 0; y <= h; y += gs) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  const cyan = (al: number) => `rgba(0,195,255,${al})`;

  // corner brackets (double-line)
  const B = Math.min(w, h) * 0.1;
  const m = Math.min(w, h) * 0.045;
  ctx.lineWidth = 1.6;
  const corners: [number, number, number, number][] = [
    [m, m, 1, 1],
    [w - m, m, -1, 1],
    [m, h - m, 1, -1],
    [w - m, h - m, -1, -1],
  ];
  for (const [bx, by, dx, dy] of corners) {
    ctx.strokeStyle = cyan(0.6);
    ctx.beginPath();
    ctx.moveTo(bx + dx * B, by);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx, by + dy * B);
    ctx.stroke();
    ctx.strokeStyle = cyan(0.25);
    ctx.beginPath();
    ctx.moveTo(bx + dx * B * 0.72, by + dy * 10);
    ctx.lineTo(bx + dx * 10, by + dy * 10);
    ctx.lineTo(bx + dx * 10, by + dy * B * 0.72);
    ctx.stroke();
  }

  // edge rulers — ticks along top & bottom
  for (let i = 0; i <= 40; i++) {
    const x = m + ((w - 2 * m) * i) / 40;
    const big = i % 5 === 0;
    ctx.strokeStyle = cyan(big ? 0.35 : 0.15);
    ctx.beginPath();
    ctx.moveTo(x, m);
    ctx.lineTo(x, m + (big ? 10 : 5));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, h - m);
    ctx.lineTo(x, h - m - (big ? 10 : 5));
    ctx.stroke();
  }

  // left dial — rotating arc segments
  const dx1 = m + B * 1.4;
  const dy1 = h * 0.5;
  const dr = Math.min(w, h) * 0.085;
  for (let sg = 0; sg < 4; sg++) {
    const a0 = (sg / 4) * TAU + t * 0.4;
    ctx.strokeStyle = cyan(0.4);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(dx1, dy1, dr, a0, a0 + (TAU / 4) * 0.55);
    ctx.stroke();
  }
  ctx.strokeStyle = cyan(0.2);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(dx1, dy1, dr * 0.6, 0, TAU);
  ctx.stroke();
  // needle
  ctx.strokeStyle = cyan(0.6);
  ctx.beginPath();
  ctx.moveTo(dx1, dy1);
  ctx.lineTo(dx1 + Math.cos(t * 0.4) * dr * 0.85, dy1 + Math.sin(t * 0.4) * dr * 0.85);
  ctx.stroke();

  // right mini radar
  const rx2 = w - m - B * 1.4;
  const ry2 = h * 0.3;
  const rr2 = Math.min(w, h) * 0.065;
  ctx.strokeStyle = cyan(0.35);
  ctx.beginPath();
  ctx.arc(rx2, ry2, rr2, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(rx2, ry2, rr2 * 0.5, 0, TAU);
  ctx.stroke();
  const ra = t * 1.4;
  ctx.strokeStyle = cyan(0.55);
  ctx.beginPath();
  ctx.moveTo(rx2, ry2);
  ctx.lineTo(rx2 + Math.cos(ra) * rr2, ry2 + Math.sin(ra) * rr2);
  ctx.stroke();

  // right data columns — chhoti dashes
  for (let cix = 0; cix < 3; cix++) {
    const cx3 = rx2 - rr2 - 30 + cix * 14;
    for (let k = 0; k < 10; k++) {
      const on = Math.sin(t * 1.2 + cix * 2 + k * 1.7) > 0.1;
      ctx.fillStyle = cyan(on ? 0.3 : 0.1);
      ctx.fillRect(cx3, ry2 + rr2 + 14 + k * 9, 8, 3);
    }
  }

  // bottom-left readout bars
  for (let k = 0; k < 5; k++) {
    const bw = 20 + 40 * Math.abs(Math.sin(t * 0.7 + k * 1.3));
    ctx.fillStyle = cyan(0.22);
    ctx.fillRect(m + B * 0.4, h * 0.5 + k * 10, bw, 3);
  }

  // drifting crosshairs
  for (const d of drift) {
    d.x += d.vx / 60;
    d.y += d.vy / 60;
    if (d.x < 0) d.x = 1;
    if (d.x > 1) d.x = 0;
    if (d.y < 0) d.y = 1;
    if (d.y > 1) d.y = 0;
    const chx = d.x * w;
    const chy = d.y * h;
    ctx.strokeStyle = cyan(0.28);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(chx, chy, 9, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(chx - 14, chy);
    ctx.lineTo(chx + 14, chy);
    ctx.moveTo(chx, chy - 14);
    ctx.lineTo(chx, chy + 14);
    ctx.stroke();
  }

  // center soft vignette — content ke liye space
  const vg = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.22,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.72
  );
  vg.addColorStop(0, "rgba(2,6,15,.55)");
  vg.addColorStop(1, "rgba(2,6,15,0)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}
