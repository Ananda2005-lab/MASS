// Option 8 · Nebula + Shooting Stars — deep-space calm with occasional shooting star
import { FxState, glowDot } from "../core";

interface Star {
  x: number; y: number; // fractions
  size: number;
  tw: number; // twinkle speed
  ph: number;
}

interface Cloud {
  x: number; y: number; // fractions
  r: number; // fraction of min(w,h)
  hue: number;
  alpha: number;
  speed: number;
  ph: number;
}

interface Shooter {
  active: boolean;
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  maxLife: number;
}

const stars: Star[] = [];
for (let i = 0; i < 150; i++) {
  stars.push({
    x: (i * 61.8) % 100 / 100,
    y: (i * 37.7) % 100 / 100,
    size: 0.6 + ((i * 13) % 18) / 10,
    tw: 0.5 + ((i * 7) % 14) / 8,
    ph: (i * 2.399) % (Math.PI * 2),
  });
}

const clouds: Cloud[] = [
  { x: 0.22, y: 0.3, r: 0.55, hue: 265, alpha: 0.16, speed: 0.06, ph: 0 },
  { x: 0.75, y: 0.22, r: 0.45, hue: 210, alpha: 0.14, speed: 0.045, ph: 2.1 },
  { x: 0.55, y: 0.68, r: 0.6, hue: 285, alpha: 0.12, speed: 0.035, ph: 4.2 },
  { x: 0.1, y: 0.75, r: 0.4, hue: 195, alpha: 0.1, speed: 0.05, ph: 1.2 },
  { x: 0.9, y: 0.6, r: 0.38, hue: 250, alpha: 0.09, speed: 0.04, ph: 5.0 },
  { x: 0.42, y: 0.45, r: 0.3, hue: 225, alpha: 0.08, speed: 0.06, ph: 3.3 },
];

// one shooting star at a time, spawn randomly
const shooter: Shooter = { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1 };
let nextSpawn = 3;

export function fxNebula(st: FxState) {
  const { ctx, w, h, t, dt } = st;

  // deep space base
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#030512");
  bg.addColorStop(0.5, "#050816");
  bg.addColorStop(1, "#04061a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const minDim = Math.min(w, h);

  // nebula clouds — soft radial blobs, breathing
  for (const c of clouds) {
    const breath = 1 + Math.sin(t * c.speed * 3 + c.ph) * 0.08;
    const drift = Math.sin(t * c.speed + c.ph) * 0.02;
    const x = (c.x + drift) * w;
    const y = (c.y + Math.cos(t * c.speed * 0.8 + c.ph) * 0.015) * h;
    const r = c.r * minDim * breath;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `hsla(${c.hue}, 70%, 55%, ${c.alpha})`);
    g.addColorStop(0.4, `hsla(${c.hue + 15}, 65%, 40%, ${c.alpha * 0.5})`);
    g.addColorStop(1, "hsla(0,0%,0%,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // stars — with mouse parallax (spec: particles move slightly opposite to mouse)
  const parX = st.mouse.active ? st.mouse.nx * -6 : 0;
  const parY = st.mouse.active ? st.mouse.ny * -6 : 0;
  const depthTier = (s: Star) => 0.3 + s.size / 3; // bigger stars = nearer = more parallax
  for (const s of stars) {
    const tw = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.tw + s.ph));
    const depth = depthTier(s);
    const x = s.x * w + parX * depth;
    const y = s.y * h + parY * depth;
    const size = s.size * (0.7 + tw * 0.5);
    ctx.fillStyle = `rgba(225,235,255,${0.25 + tw * 0.55})`;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.55, 0, Math.PI * 2);
    ctx.fill();
    // cross sparkle for bigger stars
    if (s.size > 1.6) {
      ctx.strokeStyle = `rgba(225,235,255,${tw * 0.3})`;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x - size * 2.2, y);
      ctx.lineTo(x + size * 2.2, y);
      ctx.moveTo(x, y - size * 2.2);
      ctx.lineTo(x, y + size * 2.2);
      ctx.stroke();
    }
  }

  // shooting star logic
  nextSpawn -= dt;
  if (!shooter.active && nextSpawn <= 0) {
    shooter.active = true;
    shooter.x = w * (0.15 + Math.random() * 0.7);
    shooter.y = h * (0.05 + Math.random() * 0.25);
    const ang = Math.PI * (0.7 + Math.random() * 0.25); // down-left-ish
    const speed = minDim * (0.9 + Math.random() * 0.5);
    shooter.vx = Math.cos(ang) * speed;
    shooter.vy = Math.sin(ang) * speed;
    shooter.life = 0;
    shooter.maxLife = 0.7 + Math.random() * 0.5;
    nextSpawn = 4 + Math.random() * 6;
  }
  if (shooter.active) {
    shooter.life += dt;
    shooter.x += shooter.vx * dt;
    shooter.y += shooter.vy * dt;
    const p = shooter.life / shooter.maxLife;
    if (p >= 1 || shooter.x < -50 || shooter.x > w + 50 || shooter.y > h + 50) {
      shooter.active = false;
    } else {
      const fade = Math.sin(p * Math.PI);
      const tail = 90 + fade * 60;
      const nx = shooter.vx;
      const ny = shooter.vy;
      const len = Math.hypot(nx, ny) || 1;
      const tx = (nx / len) * tail;
      const ty = (ny / len) * tail;
      const g = ctx.createLinearGradient(shooter.x, shooter.y, shooter.x - tx, shooter.y - ty);
      g.addColorStop(0, `rgba(220,240,255,${0.85 * fade})`);
      g.addColorStop(0.3, `rgba(160,200,255,${0.4 * fade})`);
      g.addColorStop(1, "rgba(160,200,255,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(shooter.x, shooter.y);
      ctx.lineTo(shooter.x - tx, shooter.y - ty);
      ctx.stroke();
      glowDot(ctx, shooter.x, shooter.y, 10, "#cfe8ff", 0.5 * fade);
      ctx.fillStyle = `rgba(255,255,255,${0.9 * fade})`;
      ctx.beginPath();
      ctx.arc(shooter.x, shooter.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // vignette
  const vig = ctx.createRadialGradient(w / 2, h / 2, minDim * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,8,0.5)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}
