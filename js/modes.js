// modes.js
// Game modes (Phase 6). Each mode is a self-contained object the play screen
// delegates to — it owns the per-frame rules, the in-race HUD, the end condition,
// and the result overlay. The Game Mode menu lists this registry, so adding a mode
// here auto-flows to the UI.
//
// Standard Race wraps the lap engine in race.js (laps + checkpoint + clock + win).
// Crash & Score is a stub (Coming soon) until its own pass.

import { Race } from './race.js';
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

// Grab pickups before the timer runs out. Stubbed until its own pass.
const CrashScore = {
  id: 'crash',
  label: 'CRASH & SCORE',
  available: false,

  start() {},
  update() {},
  get done() { return false; },
  drawWorld() {},
  drawHud() {},
  drawResult() {},
};

export const MODES = [StandardRace, CrashScore];

export function modeById(id) {
  return MODES.find((m) => m.id === id) || StandardRace;
}
