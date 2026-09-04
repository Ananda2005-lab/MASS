// Option 21 · JARVIS Core — holographic AI core: sphere, orbital rings, neural web, HUD
import { FxState, glowDot, hexToRgb } from "../core";

const CY = "#7fd4ff"; // cyan
const VI = "#a78bfa"; // violet
const AM = "#38bdf8"; // blue

interface Node3 {
  // point on unit sphere (theta, phi) + pulse phase
  th: number;
  ph: number;
  pulse: number;
  ring: number; // which ring of nodes
}

const nodes: Node3[] = [];
for (let ring = 0; ring < 4; ring++) {
  const count = 8 + ring * 6;
  for (let i = 0; i < count; i++) {
    nodes.push({
      th: (i / count) * Math.PI * 2 + ring * 0.35,
      ph: Math.acos(1 - (2 * (i + 0.5)) / count) * (0.25 + ring * 0.22),
      pulse: (i * 1.7 + ring * 0.9) % (Math.PI * 2),
      ring,
    });
  }
}

function rot3(x: number, y: number, z: number, a: number, b: number): [number, number, number] {
  // rotate around Y (a) then X (b)
  const x1 = x * Math.cos(a) + z * Math.sin(a);
  const z1 = -x * Math.sin(a) + z * Math.cos(a);
  const y1 = y * Math.cos(b) - z1 * Math.sin(b);
  const z2 = y * Math.sin(b) + z1 * Math.cos(b);
  return [x1, y1, z2];
}

export function fxJarvis(st: FxState) {
  const { ctx, w, h, t, mouse } = st;

  // deep tech background
  const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
  bg.addColorStop(0, "#071426");
  bg.addColorStop(0.5, "#050d1c");
  bg.addColorStop(1, "#02060e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.22;

  // subtle mouse parallax
  const tilt = mouse.active ? mouse.nx * 0.25 : 0;
  const tiltY = mouse.active ? mouse.ny * 0.15 : 0;

  // breathing
  const breathe = 1 + Math.sin(t * 1.2) * 0.02;

  // ---- HUD ticks (outer ring) ----
  const hudR = R * 2.05 * breathe;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 0.05);
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const long = i % 6 === 0;
    const r1 = hudR;
    const r2 = hudR + (long ? 14 : 7);
    ctx.strokeStyle = `rgba(127,212,255,${long ? 0.4 : 0.18})`;
    ctx.lineWidth = long ? 1.6 : 1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
    ctx.stroke();
  }
  // arc segments
  for (let s = 0; s < 3; s++) {
    const a0 = t * (0.4 + s * 0.17) + s * 2.1;
    ctx.strokeStyle = `rgba(167,139,250,${0.35 - s * 0.08})`;
    ctx.lineWidth = 2.4 - s * 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, hudR - 12 - s * 10, a0, a0 + 1.1 + Math.sin(t + s) * 0.25);
    ctx.stroke();
  }
  ctx.restore();

  // ---- orbital rings (3 ellipses, 3D tilt) ----
  const ringDefs = [
    { tiltX: 0.42, tiltZ: 0.2, speed: 0.55, color: CY },
    { tiltX: -0.3, tiltZ: -0.55, speed: -0.4, color: VI },
    { tiltX: 0.85, tiltZ: 0.1, speed: 0.28, color: AM },
  ];
  for (const rd of ringDefs) {
    const rr = R * 1.45 * breathe;
    const a = t * rd.speed;
    ctx.lineWidth = 1.6;
    // draw ring as many short segments for depth shading
    const segs = 90;
    for (let i = 0; i < segs; i++) {
      const p0 = (i / segs) * Math.PI * 2 + a;
      const p1 = ((i + 1) / segs) * Math.PI * 2 + a;
      const [x0, y0, z0] = rot3(Math.cos(p0) * rr, 0, Math.sin(p0) * rr, rd.tiltZ + tilt, rd.tiltX + tiltY);
      const [x1, y1] = rot3(Math.cos(p1) * rr, 0, Math.sin(p1) * rr, rd.tiltZ + tilt, rd.tiltX + tiltY);
      const depth = (z0 + rr) / (2 * rr); // 0 far, 1 near
      ctx.strokeStyle = hexToRgb(rd.color) ? `rgba(${hexToRgb(rd.color)},${0.12 + depth * 0.4})` : "rgba(0,0,0,0)";
      ctx.beginPath();
      ctx.moveTo(cx + x0, cy + y0);
      ctx.lineTo(cx + x1, cy + y1);
      ctx.stroke();
    }
    // ring spark (satellite)
    const sp = a * 2.4;
    const [sx, sy, sz] = rot3(Math.cos(sp) * rr, 0, Math.sin(sp) * rr, rd.tiltZ + tilt, rd.tiltX + tiltY);
    const d = (sz + rr) / (2 * rr);
    glowDot(ctx, cx + sx, cy + sy, 7, rd.color, 0.35 + d * 0.45);
  }

  // ---- core sphere ----
  const coreR = R * breathe;
  const core = ctx.createRadialGradient(cx - coreR * 0.3, cy - coreR * 0.3, coreR * 0.1, cx, cy, coreR);
  core.addColorStop(0, "rgba(210,240,255,0.95)");
  core.addColorStop(0.35, "rgba(110,190,255,0.55)");
  core.addColorStop(0.8, "rgba(60,110,220,0.28)");
  core.addColorStop(1, "rgba(20,40,110,0.05)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();

  // core rim
  ctx.strokeStyle = `rgba(${hexToRgb(CY)},0.75)`;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.stroke();

  // inner scan sweep
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.clip();
  const sweepA = (t * 1.1) % (Math.PI * 2);
  const grad = ctx.createLinearGradient(
    cx + Math.cos(sweepA) * coreR,
    cy + Math.sin(sweepA) * coreR,
    cx - Math.cos(sweepA) * coreR,
    cy - Math.sin(sweepA) * coreR
  );
  grad.addColorStop(0, "rgba(180,235,255,0.28)");
  grad.addColorStop(0.5, "rgba(180,235,255,0.02)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(cx - coreR, cy - coreR, coreR * 2, coreR * 2);

  // latitude lines on sphere
  for (let lat = 1; lat < 5; lat++) {
    const ly = -coreR + (2 * coreR * lat) / 5;
    const lr = Math.sqrt(Math.max(0, coreR * coreR - ly * ly));
    ctx.strokeStyle = `rgba(140,200,255,0.14)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy + ly, lr, lr * 0.22, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // ---- neural web nodes on sphere surface ----
  type Proj = { x: number; y: number; z: number; n: Node3 };
  const proj: Proj[] = [];
  for (const n of nodes) {
    const rr = coreR * (1.02 + n.ring * 0.075);
    const x0 = Math.sin(n.ph) * Math.cos(n.th + t * 0.12);
    const y0 = Math.cos(n.ph) * 0.9;
    const z0 = Math.sin(n.ph) * Math.sin(n.th + t * 0.12);
    const [x1, y1, z1] = rot3(x0 * rr, y0 * rr, z0 * rr, tilt, tiltY);
    proj.push({ x: cx + x1, y: cy + y1, z: z1, n });
  }
  // connections (near nodes)
  ctx.lineWidth = 0.8;
  for (let i = 0; i < proj.length; i++) {
    for (let j = i + 1; j < proj.length; j++) {
      const a = proj[i];
      const b = proj[j];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < coreR * 0.42 && a.z > -coreR * 0.3 && b.z > -coreR * 0.3) {
        const alpha = (1 - dist / (coreR * 0.42)) * 0.22;
        ctx.strokeStyle = `rgba(${hexToRgb("#8fd0ff")},${alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
  // node dots + pulses
  for (const p of proj) {
    const front = p.z > 0;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + p.n.pulse);
    const alpha = (front ? 0.75 : 0.22) * (0.5 + pulse * 0.5);
    glowDot(ctx, p.x, p.y, front ? 3.4 : 2.2, front ? CY : "#5a7fbf", alpha * 0.5);
    ctx.fillStyle = `rgba(${hexToRgb("#d5f0ff")},${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, front ? 1.5 : 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // center bright heart
  const heartPulse = 0.75 + 0.25 * Math.sin(t * 2.6);
  glowDot(ctx, cx, cy, coreR * 0.55, "#bfe6ff", 0.28 * heartPulse);
  glowDot(ctx, cx, cy, coreR * 0.2, "#ffffff", 0.5 * heartPulse);

  // corner HUD brackets
  const m = Math.min(w, h) * 0.045;
  const L = Math.min(w, h) * 0.05;
  ctx.strokeStyle = `rgba(${hexToRgb(CY)},0.35)`;
  ctx.lineWidth = 1.4;
  const corners: [number, number, number, number][] = [
    [m, m, 1, 1],
    [w - m, m, -1, 1],
    [m, h - m, 1, -1],
    [w - m, h - m, -1, -1],
  ];
  for (const [x, y, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x + L * sx, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + L * sy);
    ctx.stroke();
  }

  // vignette
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.72);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,10,0.55)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}
