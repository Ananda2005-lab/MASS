// Option 49 · Firefly Grove — night jungle, blinking fireflies, trees, grass
import { FxState, glowDot, hexToRgb } from "../core";

interface Firefly {
  ox: number; oy: number; // base position (fraction of screen)
  depth: number; // 0..1 (0 far, 1 near)
  phase: number; // blink phase
  speed: number;
  wanderSeed: number;
  hue: number;
}

interface Tree {
  x: number; // fraction
  height: number; // fraction of screen
  width: number; // fraction
  layer: number; // 0 back, 1 mid, 2 front
  seed: number;
}

interface GrassBlade {
  x: number; // fraction
  height: number; // px
  lean: number;
  seed: number;
}

const trees: Tree[] = [
  { x: -0.02, height: 0.52, width: 0.16, layer: 0, seed: 11 },
  { x: 0.13, height: 0.6, width: 0.15, layer: 0, seed: 23 },
  { x: 0.3, height: 0.46, width: 0.13, layer: 0, seed: 37 },
  { x: 0.47, height: 0.55, width: 0.14, layer: 0, seed: 41 },
  { x: 0.66, height: 0.48, width: 0.13, layer: 0, seed: 53 },
  { x: 0.84, height: 0.58, width: 0.16, layer: 0, seed: 67 },
  { x: 0.99, height: 0.5, width: 0.15, layer: 0, seed: 71 },
  { x: 0.05, height: 0.4, width: 0.14, layer: 1, seed: 83 },
  { x: 0.22, height: 0.34, width: 0.12, layer: 1, seed: 97 },
  { x: 0.4, height: 0.42, width: 0.13, layer: 1, seed: 101 },
  { x: 0.58, height: 0.36, width: 0.12, layer: 1, seed: 103 },
  { x: 0.76, height: 0.44, width: 0.14, layer: 1, seed: 107 },
  { x: 0.93, height: 0.38, width: 0.13, layer: 1, seed: 109 },
  { x: -0.03, height: 0.26, width: 0.12, layer: 2, seed: 127 },
  { x: 0.18, height: 0.2, width: 0.1, layer: 2, seed: 131 },
  { x: 0.82, height: 0.24, width: 0.12, layer: 2, seed: 137 },
  { x: 1.02, height: 0.28, width: 0.11, layer: 2, seed: 139 },
];

const grass: GrassBlade[] = [];
for (let i = 0; i < 130; i++) {
  grass.push({
    x: i / 130 + (i % 3) * 0.002,
    height: 14 + ((i * 37) % 26),
    lean: ((i * 53) % 17) / 17 - 0.5,
    seed: i * 7.31,
  });
}

const fireflies: Firefly[] = [];
for (let i = 0; i < 64; i++) {
  fireflies.push({
    ox: (i * 61.8) % 100 / 100,
    oy: 0.18 + ((i * 37.7) % 60) / 100,
    depth: ((i * 29) % 100) / 100,
    phase: (i * 2.399) % (Math.PI * 2),
    speed: 0.5 + ((i * 13) % 10) / 10,
    wanderSeed: i * 17.17,
    hue: 48 + ((i * 7) % 22),
  });
}

function drawTree(ctx: CanvasRenderingContext2D, tr: Tree, w: number, h: number, t: number) {
  const sway = Math.sin(t * 0.5 + tr.seed) * 0.008;
  const baseY = h;
  const topY = baseY - tr.height * h;
  const cx = tr.x * w + sway * w;
  const halfW = (tr.width * w) / 2;

  const shade =
    tr.layer === 0 ? "rgba(4,10,10,0.92)" : tr.layer === 1 ? "rgba(2,7,7,0.97)" : "rgba(1,5,5,1)";
  ctx.fillStyle = shade;

  // trunk
  ctx.beginPath();
  ctx.moveTo(cx - halfW * 0.08, baseY);
  ctx.quadraticCurveTo(cx - halfW * 0.04, topY + (baseY - topY) * 0.4, cx, topY + (baseY - topY) * 0.22);
  ctx.quadraticCurveTo(cx + halfW * 0.04, topY + (baseY - topY) * 0.4, cx + halfW * 0.08, baseY);
  ctx.closePath();
  ctx.fill();

  // canopy — layered blobs
  const blobs = 7;
  for (let b = 0; b < blobs; b++) {
    const ba = (b / blobs) * Math.PI * 2 + tr.seed;
    const br = halfW * (0.55 + 0.3 * Math.abs(Math.sin(tr.seed + b * 2.7)));
    const bx = cx + Math.cos(ba) * halfW * 0.55;
    const by = topY + (baseY - topY) * 0.16 + Math.sin(ba) * (baseY - topY) * 0.07;
    ctx.beginPath();
    ctx.ellipse(bx, by, br, br * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // crown cap
  ctx.beginPath();
  ctx.ellipse(cx, topY + (baseY - topY) * 0.14, halfW * 0.9, (baseY - topY) * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function fxFirefly(st: FxState) {
  const { ctx, w, h, t, mouse } = st;

  // night sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#020609");
  sky.addColorStop(0.55, "#04121a");
  sky.addColorStop(0.85, "#06181f");
  sky.addColorStop(1, "#03131a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // moon glow
  const mx = w * 0.78 + Math.sin(t * 0.05) * 4;
  const my = h * 0.16;
  glowDot(ctx, mx, my, Math.min(w, h) * 0.22, "#9fd8c8", 0.1);
  glowDot(ctx, mx, my, Math.min(w, h) * 0.06, "#e8fff4", 0.5);

  // faint stars
  for (let i = 0; i < 60; i++) {
    const sx = st.rand(i * 3.1) * w;
    const sy = st.rand(i * 7.7) * h * 0.5;
    const tw = 0.25 + 0.5 * Math.abs(Math.sin(t * (0.6 + st.rand(i) * 1.2) + i));
    ctx.fillStyle = `rgba(210,235,230,${tw * 0.35})`;
    ctx.fillRect(sx, sy, 1.4, 1.4);
  }

  // mist band
  const mist = ctx.createLinearGradient(0, h * 0.55, 0, h);
  mist.addColorStop(0, "rgba(90,160,150,0)");
  mist.addColorStop(0.7, "rgba(70,140,130,0.05)");
  mist.addColorStop(1, "rgba(50,120,110,0.09)");
  ctx.fillStyle = mist;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);

  // trees back → front
  for (let l = 0; l < 3; l++) {
    for (const tr of trees) if (tr.layer === l) drawTree(ctx, tr, w, h, t);
  }

  // grass
  const groundY = h - 6;
  ctx.lineWidth = 1.6;
  for (const g of grass) {
    const gx = g.x * w;
    const sway = Math.sin(t * 1.1 + g.seed) * 3 + Math.sin(t * 0.4 + g.seed * 2) * 2;
    ctx.strokeStyle = "rgba(2,10,9,0.9)";
    ctx.beginPath();
    ctx.moveTo(gx, groundY);
    ctx.quadraticCurveTo(gx + g.lean * 6, groundY - g.height * 0.6, gx + g.lean * 10 + sway, groundY - g.height);
    ctx.stroke();
  }

  // ground shadow
  const ground = ctx.createLinearGradient(0, h * 0.9, 0, h);
  ground.addColorStop(0, "rgba(1,6,6,0)");
  ground.addColorStop(1, "rgba(1,5,5,0.85)");
  ctx.fillStyle = ground;
  ctx.fillRect(0, h * 0.9, w, h * 0.1);

  // fireflies
  for (const f of fireflies) {
    const wx = Math.sin(t * 0.3 * f.speed + f.wanderSeed) * 0.035;
    const wy = Math.cos(t * 0.23 * f.speed + f.wanderSeed * 1.7) * 0.028;
    const dx = f.ox + wx;
    const dy = f.oy + wy;

    // slight mouse attraction
    let px = dx * w;
    let py = dy * h;
    if (mouse.active) {
      const ax = mouse.x - px;
      const ay = mouse.y - py;
      const dist = Math.hypot(ax, ay);
      const pull = Math.max(0, 1 - dist / 260) * 26 * f.depth;
      px += (ax / (dist || 1)) * pull;
      py += (ay / (dist || 1)) * pull;
    }

    // blink: slow breathing glow, mostly on
    const blink = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * f.speed * 1.6 + f.phase));
    const r = (2 + f.depth * 5) * (0.6 + blink * 0.6);
    const color = `hsl(${f.hue}, 95%, 62%)`;
    glowDot(ctx, px, py, r * 4.2, color, 0.05 + blink * 0.1 * f.depth);
    glowDot(ctx, px, py, r, color, (0.35 + blink * 0.5) * (0.4 + f.depth * 0.6));

    // bright core
    const c = hexToRgb("#fff8d6");
    ctx.fillStyle = `rgba(${c},${blink * 0.85})`;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(0.8, r * 0.32), 0, Math.PI * 2);
    ctx.fill();
  }

  // vignette
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}
