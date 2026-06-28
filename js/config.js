// config.js
// Single source of truth for every tunable value in Junkyard Grand Prix.
// Driving FEEL lives here — change a number, reload, re-test. No logic in this file.
// Units: distances in pixels, speeds in px/sec, accelerations in px/sec^2,
// angles in radians, angular speed in rad/sec.

export const CONFIG = {
  CANVAS: {
    WIDTH: 800,            // internal render resolution (whole playfield fits onscreen)
    HEIGHT: 600,
    BG: '#15130f',         // menu backdrop (gameplay backdrop is the dirt below)
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

    // off-track (dirt): forced-slow, like the 1977 original
    OFFTRACK_MAX_SPEED: 90,   // crawl speed once off the asphalt
    OFFTRACK_DECEL: 700,      // how hard you bog down when you stray off (px/s^2)
  },

  TRACK: {
    DIRT: '#2b211a',        // off-track ground (rough) — the forced-slow zone
    ASPHALT: '#45434a',     // drivable surface
    EDGE: '#6f6c75',        // lane edge stripe
    EDGE_WIDTH: 3,

    // The drivable band is OUTER minus an inner hole. The inner rounded-rect is
    // DERIVED in track.js by insetting OUTER by WIDTH, so WIDTH is the single
    // feel knob: wider = forgiving, narrower = harder. Both rects are centred
    // in the 800x600 canvas. R is the corner radius (gives the oval its curves).
    OUTER: { X: 60, Y: 60, W: 680, H: 480, R: 160 },
    WIDTH: 120,             // asphalt band width in px

    // where the car starts: on the bottom straight, on the line, facing along
    // the track. Counterclockwise lap -> facing right. HEADING: 0 = up, +CW.
    START: { X: 400, Y: 480, HEADING: Math.PI / 2 },

    // start/finish line: checkered strip across the bottom straight at this x
    FINISH: { X: 400, WIDTH: 30, SQUARE: 15, LIGHT: '#e8e2d2', DARK: '#1c1a16' },
  },

  // Race rules (Phase 3). The finish line + checkpoint geometry is DERIVED from
  // TRACK inside race.js (WIDTH stays the single feel knob), so the only race
  // value worth tuning lives here.
  RACE: {
    LAPS: 3,                // laps to win
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
    SHOW_SPEED: true,         // live speed + on/off-track readout — turn OFF before shipping
  },
};