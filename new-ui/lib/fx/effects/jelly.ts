// Option 44 · Deep Jellies — gehri samudri bioluminescent jellyfish:
// pulsing bells, lehrati tentacles, god rays, plankton dust. Calm + premium.
import { FxState } from "../core";

const TAU = Math.PI * 2;

interface Jelly {
  bx: number;
  by: number;
  R: number;
  sp: number;
  driftX: number;
  ph: number;
  hue: number;
}

interface GodRay {
  x: number;
  wd: number;
  sp: number;
  ph: number;
}

let jellies: Jelly[] = [];
let godrays: GodRay[] = [];
let lastW = 0;
let lastH = 0;

function build(w: number, h: number) {
  jellies = [];
  const n = Math.max(4, (w / 340) | 0) + 2;
  for (let i = 0; i < n; i++)
    jellies.push({
      bx: Math.random(),
      by: Math.random(),
      R: Math.min(w, h) * (0.045 + Math.random() * 0.05),
      sp: 0.4 + Math.random() * 0.5,
      driftX: 0.1 + Math.random() * 0.16,
      ph: Math.random() * TAU,
      hue: 175 + Math.random() * 95,
    });
  godrays = [];
  for (let i = 0; i < 7; i++)
    godrays.push({ x: Math.random(), wd: 0.04 + Math.random() * 0.09, sp: 0.1 + Math.random() * 0.15, ph: i });
  lastW = w;
  lastH = h;
}

export function fxJelly(st: FxState) {
  const { ctx, w, h, t } = st;
  if (w !== lastW || h !== lastH) build(w, h);

  // deep ocean gradient
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#02243f");
  bg.addColorStop(0.5, "#01152b");
  bg.addColorStop(1, "#000a16");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // god rays from top
  ctx.globalCompositeOperation = "lighter";
  for (const r of godrays) {
    const gx = r.x * w + Math.sin(t * r.sp + r.ph) * w * 0.09;
    const g = ctx.createLinearGradient(gx, 0, gx - w * 0.13, h * 0.85);
    g.addColorStop(0, "rgba(90,160,220,.10)");
    g.addColorStop(1, "rgba(90,160,220,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(gx - r.wd * w * 0.35, 0);
    ctx.lineTo(gx + r.wd * w * 0.35, 0);
    ctx.lineTo(gx + r.wd * w - 30, h * 0.85);
    ctx.lineTo(gx - r.wd * w + 30, h * 0.85);
    ctx.closePath();
    ctx.fill();
  }

  // floating plankton dust
  for (let i = 0; i < 64; i++) {
    const px = (((i * 89.7 + Math.sin(t * 0.4 + i) * 18) % w) + w) % w;
    const py = (((i * 61.3 - t * (14 + (i % 7) * 4)) % h) + h) % h;
    ctx.fillStyle = `rgba(140,200,230,${(0.08 + 0.1 * Math.abs(Math.sin(t * 1.4 + i))).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(px, py, 1.1, 0, TAU);
    ctx.fill();
  }

  for (const j of jellies) {
    const pulse = Math.sin(t * j.sp * TAU * 0.5 + j.ph);
    const bellSquish = 1 - pulse * 0.16;
    const bellY = h * j.by + Math.sin(t * j.sp + j.ph) * h * 0.055;
    const bellY2 = bellY - pulse * j.R * 0.16;
    const bx = w * j.bx + Math.sin(t * j.driftX + j.ph * 2) * w * 0.06;

    // tentacles pehle (peeche)
    ctx.lineWidth = 1.2;
    for (let tn = 0; tn < 7; tn++) {
      const toff = (tn - 3) / 3;
      ctx.beginPath();
      ctx.moveTo(bx + toff * j.R * 0.5, bellY2 + j.R * 0.72);
      const tendLen = j.R * (1.9 + 0.5 * Math.sin(j.ph * 3 + tn));
      for (let sg = 1; sg <= 4; sg++) {
        const sy = bellY2 + j.R * 0.72 + (tendLen * sg) / 4;
        const swy = bx + toff * j.R * 0.5 + Math.sin(t * 1.3 + j.ph + tn + sg * 1.2) * j.R * 0.2 * (sg / 2);
        ctx.lineTo(swy, sy);
      }
      ctx.strokeStyle = `hsla(${j.hue},85%,72%,.28)`;
      ctx.stroke();
    }

    // inner glow core
    const core = ctx.createRadialGradient(bx, bellY, j.R * 0.05, bx, bellY, j.R * 0.95);
    core.addColorStop(0, `hsla(${j.hue},95%,88%,.85)`);
    core.addColorStop(0.4, `hsla(${j.hue},90%,66%,.45)`);
    core.addColorStop(1, `hsla(${j.hue},90%,56%,0)`);
    ctx.fillStyle = core;
    ctx.save();
    ctx.translate(bx, bellY2);
    ctx.scale(1, bellSquish);
    ctx.beginPath();
    ctx.arc(0, 0, j.R, 0, TAU);
    ctx.fill();
    // bell dome outline
    ctx.strokeStyle = `hsla(${j.hue},95%,82%,.75)`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, j.R * 0.97, Math.PI, TAU);
    ctx.stroke();
    // inner rings pattern
    ctx.strokeStyle = `hsla(${j.hue + 20},90%,85%,.35)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, j.R * 0.62, Math.PI * 1.05, TAU - 0.2);
    ctx.stroke();
    ctx.restore();

    // oral arms — wider ribbons neeche
    for (let an = 0; an < 3; an++) {
      const ax = bx + (an - 1) * j.R * 0.22;
      ctx.beginPath();
      ctx.moveTo(ax, bellY2 + j.R * 0.6);
      const len = j.R * 1.3;
      ctx.bezierCurveTo(
        ax + Math.sin(t * 1.7 + an + j.ph) * j.R * 0.24,
        bellY2 + j.R * 0.6 + len * 0.45,
        ax - Math.sin(t * 1.3 + an) * j.R * 0.2,
        bellY2 + j.R * 0.6 + len * 0.8,
        ax + Math.sin(t * 1.1 + an * 2 + j.ph) * j.R * 0.18,
        bellY2 + j.R * 0.6 + len
      );
      ctx.strokeStyle = `hsla(${j.hue + 14},88%,76%,.42)`;
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = "source-over";

  // surface shimmer band at top
  const sh = ctx.createLinearGradient(0, 0, 0, h * 0.14);
  sh.addColorStop(0, "rgba(120,190,230,.16)");
  sh.addColorStop(1, "rgba(120,190,230,0)");
  ctx.fillStyle = sh;
  ctx.fillRect(0, 0, w, h * 0.14);
}
