// config.js
// Single source of truth for every tunable value in Junkyard Grand Prix.
// Driving FEEL lives here — change a number, reload, re-test. No logic in this file.
// Units: distances in pixels, speeds in px/sec, accelerations in px/sec^2,
// angles in radians, angular speed in rad/sec.

export const CONFIG = {
  CANVAS: {
    WIDTH: 800,            // internal render resolution (whole playfield fits onscreen)
    HEIGHT: 600,
    BG: '#15130f',         // dirt-dark junkyard floor
  },

  CAR: {
    SIZE: 32,              // car is 32x32 px (visual + collision share this for now)

    // --- look (placeholder rectangle; swapped for a sprite in Phase 4) ---
    COLOR_BODY: '#b5462e',    // rusty red-orange
    COLOR_NOSE: '#ffd27f',    // bright front strip so you can read which way it faces
    COLOR_OUTLINE: '#2a1a12',

    // --- driving feel (THE knobs to tune) ---
    MAX_SPEED: 300,           // forward top speed
    MAX_REVERSE_SPEED: 140,   // reverse top speed (slower than forward, on purpose)
    ACCEL: 260,               // throttle force (higher = quicker to reach top speed)
    BRAKE_ACCEL: 420,         // brake/reverse force (higher = sharper stops)
    COAST_DECEL: 180,         // rolling friction when you're NOT on gas or brake
                              //   higher = stops sooner / less momentum; lower = floatier

    // steering authority scales with speed so the car can't pivot in place
    TURN_RATE: 3.0,           // max turn speed (rad/s) once at full authority
    STEER_FULL_SPEED: 140,    // speed at/above which steering is fully responsive;
                              //   below this, turning eases off down to zero at a standstill
  },

  HUD: {
    TEXT: '#e9e2d0',
    DIM: '#8a8270',
    ACCENT: '#ffd27f',
    FONT: 'monospace',
  },

  // Ship-blocking flags live here so they're easy to find and reset before release.
  // (See html-game reference: don't let a debug toggle ship by accident.)
  DEBUG: {
    SHOW_SPEED: true,         // live speed readout in the HUD — turn OFF before shipping
  },
};