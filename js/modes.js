// modes.js
// Game modes (Phase 6). Each mode is a self-contained object the play screen
// delegates to — per-frame rules, in-race HUD, end condition, result overlay.
// The Game Mode menu lists this registry, so adding a mode here auto-flows to the UI.
//
// Standard Race wraps the lap engine in race.js. Crash & Score is its own
// pickup/score/timer loop (no laps).

import { Race } from './race.js';
import { Track } from './track.js';
import { CONFIG } from './config.js';
import { UI } from './ui.js';

const StandardRace = {
  id: 'race',
  label: 'STANDARD RACE',
  available: true,

  start(car) { Race.reset(car); },
  update(dt, car) { Race.update(dt, car); },
  get done() { return Race.finished; },

  drawWorld() {},                                          // no world entities
  drawHud(ctx, W, H, car, onTrack) { UI.drawHud(ctx, W, H, car, onTrack, Race); },
  drawResult(ctx, W, H) { UI.drawWin(ctx, W, H, Race); },
};

// Crash & Score (Option A): one pickup at a time on the asphalt; grab it for a
// point and the next appears elsewhere. Countdown timer (start-on-throttle); when
// it hits 0 the mode ends with your score. No laps — free-roam on the loaded track.
const CrashScore = {
  id: 'crash',
  label: 'CRASH & SCORE',
  available: true,

  score: 0,
  timeLeft: 0,
  started: false,
  pickup: null,
  _done: false,

  start(car) {
    this.score = 0;
    this.timeLeft = CONFIG.CRASH.DURATION;
    this.started = false;
    this._done = false;
    this.pickup = spawnPickup(car);
  },

  update(dt, car) {
    if (this._done) return;
    if (!this.started && car.speed !== 0) this.started = true;   // start-on-throttle
    if (!this.started) return;

    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.timeLeft = 0; this._done = true; return; }

    const reach = CONFIG.CAR.SIZE / 2 + CONFIG.CRASH.PICKUP / 2 + 4;
    if (this.pickup && Math.hypot(car.x - this.pickup.x, car.y - this.pickup.y) < reach) {
      this.score++;
      this.pickup = spawnPickup(car);
    }
  },

  get done() { return this._done; },

  drawWorld(ctx) {
    if (!this.pickup) return;
    const s = CONFIG.CRASH.PICKUP;
    ctx.fillStyle = CONFIG.CRASH.PICKUP_COLOR;
    ctx.fillRect(this.pickup.x - s / 2, this.pickup.y - s / 2, s, s);
    ctx.lineWidth = 2;
    ctx.strokeStyle = CONFIG.CRASH.PICKUP_EDGE;
    ctx.strokeRect(this.pickup.x - s / 2, this.pickup.y - s / 2, s, s);
  },

  drawHud(ctx, W, H) { UI.drawCrashHud(ctx, W, H, this.score, this.timeLeft); },
  drawResult(ctx, W, H) { UI.drawCrashResult(ctx, W, H, this.score); },
};

// A random point on the asphalt: a centerline node + a lateral offset within the
// band, kept clear of the car so it isn't grabbed the instant it spawns.
function spawnPickup(car) {
  const t = Track.current;
  const cl = t.centerline, n = cl.length;
  const span = t.width / 2 - CONFIG.CRASH.PICKUP / 2 - 4;
  for (let tries = 0; tries < 20; tries++) {
    const i = Math.floor(Math.random() * n);
    const p = cl[i], a = cl[(i - 1 + n) % n], b = cl[(i + 1) % n];
    let dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const off = (Math.random() * 2 - 1) * span;
    const x = p.x - dy * off, y = p.y + dx * off;     // offset along the normal
    if (Math.hypot(x - car.x, y - car.y) > 90) return { x, y };
  }
  const p = cl[Math.floor(Math.random() * n)];        // fallback: a centerline node
  return { x: p.x, y: p.y };
}

export const MODES = [StandardRace, CrashScore];

export function modeById(id) {
  return MODES.find((m) => m.id === id) || StandardRace;
}
