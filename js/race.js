// race.js
// Phase 3 race loop, generalized for data-driven tracks (Phase 5 step 2). Owns lap
// counting, the honest-lap checkpoint, the start-on-throttle clock, and the win.
// main.js advances this once per fixed step (AFTER the car moves).
//
// Laps come from the ACTIVE TRACK's finish + checkpoint line segments (Track.current):
//  - Each frame we test the car's movement segment (prev -> current position) against
//    the lines. A crossing of the checkpoint line ARMS the lap; a crossing of the
//    finish line in its `forward` direction COUNTS the lap (only while armed), then
//    re-arms. So a counted lap means you went all the way around — works for any
//    track shape, not just the oval.

import { CONFIG } from './config.js';
import { Track } from './track.js';

// orientation of the triplet (a, b, c): >0 ccw, <0 cw, 0 collinear
function ccw(a, b, c) {
  return (c.y - a.y) * (b.x - a.x) - (b.y - a.y) * (c.x - a.x);
}
// do segments p1p2 and p3p4 properly cross? (touching/collinear -> false, which
// conveniently means starting exactly ON the finish line doesn't false-trigger)
function segmentsCross(p1, p2, p3, p4) {
  const d1 = ccw(p3, p4, p1), d2 = ccw(p3, p4, p2);
  const d3 = ccw(p1, p2, p3), d4 = ccw(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
         ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

export const Race = {
  laps: CONFIG.RACE.LAPS,    // laps needed to win
  lap: 1,                    // lap the player is currently ON (1..laps)
  time: 0,                   // elapsed race time, seconds
  finished: false,           // true on the frame the final lap completes

  _started: false,           // has the clock started? (start-on-throttle)
  _prev: { x: 0, y: 0 },     // car position last step, for movement-vs-line tests
  _armed: false,             // has the checkpoint been crossed this lap?

  reset(car) {
    this.laps = CONFIG.RACE.LAPS;
    this.lap = 1;
    this.time = 0;
    this.finished = false;
    this._started = false;
    this._prev.x = car.x;    // start ON the line; a proper crossing needs to pass through
    this._prev.y = car.y;
    this._armed = false;
  },

  // Advance one fixed step. Call AFTER car.update so the crossing tests see the new
  // position. No-op once finished (freezes the clock on the win screen).
  update(dt, car) {
    if (this.finished) return;

    // start-on-throttle: clock holds at 0 until the player first hits the gas
    if (!this._started && car.speed > 0) this._started = true;
    if (this._started) this.time += dt;

    const track = Track.current;
    const prev = this._prev;
    const cur = { x: car.x, y: car.y };

    // checkpoint: any crossing arms the lap
    const cp = track.checkpoint;
    if (segmentsCross(prev, cur, cp.a, cp.b)) this._armed = true;

    // finish: a crossing in the forward direction counts the lap (only while armed)
    const fin = track.finish;
    if (this._armed && segmentsCross(prev, cur, fin.a, fin.b)) {
      const movedForward = (cur.x - prev.x) * fin.forward.x + (cur.y - prev.y) * fin.forward.y > 0;
      if (movedForward) {
        if (this.lap >= this.laps) this.finished = true;   // completed the final lap = win
        else { this.lap++; this._armed = false; }          // banked a lap; must re-arm
      }
    }

    this._prev.x = cur.x;
    this._prev.y = cur.y;
  },
};
