// race.js
// Phase 3 — the race loop. Owns lap counting, the honest-lap checkpoint, the
// race clock, and the win condition. main.js advances this once per fixed step
// (AFTER the car moves) and reads back lap/time/finished for the HUD + win screen.
//
// Honest laps — chosen design A + 1 (directional finish line + single far-side
// checkpoint):
//  - Finish line = the checkered strip at FINISH.X on the BOTTOM straight. A lap
//    only registers on a LEFT-TO-RIGHT crossing there. The car laps with the nose
//    pointing +X past the line, so a reverse nudge crosses the other way and is
//    ignored — you can't bank laps by wiggling back and forth on the line.
//  - Checkpoint = the far (TOP) straight. You must visit it to "arm" the finish;
//    a crossing only counts while armed, and it re-arms each lap. So a counted lap
//    means you went all the way around. (Cutting straight up the infield to arm it
//    is technically possible but never pays — the dirt forces you to a crawl, per
//    the Phase 2 forced-slow design.)

import { CONFIG } from './config.js';

const T = CONFIG.TRACK;
const F = T.FINISH;
const OUTER = T.OUTER;

// The two straights' asphalt bands, DERIVED from the outer rect inset by WIDTH
// (same single-knob philosophy as track.js — no duplicated magic numbers). The
// car's centre y tells us which straight it's on.
const TOP_BAND    = { yMin: OUTER.Y,                     yMax: OUTER.Y + T.WIDTH };  // far side → checkpoint
const BOTTOM_BAND = { yMin: OUTER.Y + OUTER.H - T.WIDTH, yMax: OUTER.Y + OUTER.H };  // start/finish straight

export const Race = {
  laps: CONFIG.RACE.LAPS,   // laps needed to win
  lap: 1,                   // lap the player is currently ON (1..laps)
  time: 0,                  // elapsed race time, seconds
  finished: false,          // true on the frame the final lap completes

  _started: false,          // has the clock started? (start-on-throttle)
  _prevX: 0,                // car x last step, for the line-crossing test
  _armed: false,            // has the far-side checkpoint been passed this lap?

  reset(car) {
    this.laps = CONFIG.RACE.LAPS;
    this.lap = 1;
    this.time = 0;
    this.finished = false;
    this._started = false;  // clock waits for the first throttle press
    this._prevX = car.x;    // start ON the line: prevX === FINISH.X won't false-trigger
    this._armed = false;
  },

  // Advance one fixed step. Call AFTER car.update so the crossing test sees the
  // car's new position. No-op once finished, which freezes the clock on the win screen.
  update(dt, car) {
    if (this.finished) return;

    // Start-on-throttle: the clock holds at 0:00 until the player first hits the
    // gas, then runs until the win lap freezes it. The car only gains forward
    // speed from the throttle, so speed > 0 means "they've gone".
    if (!this._started && car.speed > 0) this._started = true;
    if (this._started) this.time += dt;

    // Arm the checkpoint whenever the car is on the far (top) straight band.
    if (car.y >= TOP_BAND.yMin && car.y <= TOP_BAND.yMax) this._armed = true;

    // Finish line: a left-to-right crossing of FINISH.X, on the bottom band.
    const onBottom = car.y >= BOTTOM_BAND.yMin && car.y <= BOTTOM_BAND.yMax;
    const crossedForward = this._prevX < F.X && car.x >= F.X;
    if (onBottom && crossedForward && this._armed) {
      if (this.lap >= this.laps) {
        this.finished = true;   // the crossing that completes the final lap = win
      } else {
        this.lap++;             // banked a lap; must re-visit the checkpoint for the next
        this._armed = false;
      }
    }

    this._prevX = car.x;
  },
};
