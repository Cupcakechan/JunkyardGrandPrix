# Junkyard Grand Prix — PROJECT_HANDOFF

> Source of truth for this project. Read this (and the code) before any work.
> Kept in the repo root but OUT of any folder pushed to itch.

## 1. Project
- Game 4 of Daniel's 20 Games Challenge, studio Cocolito Collective.
- Junkyard Grand Prix: a tiny top-down arcade racer set in a junkyard. Drive a
  beat-up scrap car around a compact circuit. Inspired by the challenge's
  "Indy 500" direction; not a clone.
- Tone: playful, retro, readable, small-scope, arcade. Driving feel comes
  first; content second.

## 2. Platform & stack
- HTML5 Canvas + plain JavaScript, native ES modules. No framework, no
  bundler, no build step.
- Run locally with the VS Code "Live Server" extension (right-click
  `index.html` -> Open with Live Server). Must be served over http — ES modules
  will NOT load from `file://`.
- Target: itch.io HTML5 embed, account `mrcanela`. Not yet shipped to itch
  (no published release exists yet).

## 3. Repo & deploy
- GitHub: https://github.com/Cupcakechan/JunkyardGrandPrix.git
- itch slug (working, confirmed at ship): junkyard-grand-prix
- Deploy: butler (installed, on PATH). No deploy script yet — add an
  `update-JunkyardGrandPrix.bat` (butler push to
  `mrcanela/junkyard-grand-prix:html5`) at first ship. Source files ARE the
  deliverable; ship the folder holding `index.html` (index.html, css/, js/,
  assets/) and keep this handoff out of it.

## 4. Current status — Phases 1 & 2 complete (committed and pushed)
Phase 1 — shell + driving feel:
- Fixed-timestep game loop (1/60 s) — refresh-rate independent.
- Keyboard input (Arrows + WASD; Enter / R / Esc), focus-loss safe.
- State machine: MENU <-> PLAYING (Enter starts, Esc -> menu, R restarts).
- Player car (32x32 placeholder rect with a front marker) + arcade driving
  model: accelerate, brake/reverse on one key, rolling-friction coast,
  speed-scaled steering (no pivot at a standstill).

Phase 2 — track + boundaries:
- Analytic oval track: two centred rounded-rectangles, outer minus inner hole =
  the drivable asphalt band. Drawn with dirt backdrop, asphalt ring, edge
  stripes, and a checkered start/finish line on the bottom straight.
- On/off-track test (`Track.isOnTrack`) the car queries each frame.
- Forced-slow off-track (Atari-style): on dirt you bog down to a crawl cap and
  cannot exceed it; lifting off in the dirt rolls you to a stop. Cutting across
  the infield never pays. The car can still steer back onto the asphalt.
- Car spawns ON the start/finish line, facing along the track (the lap runs
  counterclockwise → facing right at the start).
- HUD shows a debug speed readout + an on/off-track surface indicator.

Not yet built: laps, timer, win (Phase 3 — the finish line is drawn but does
nothing yet); junkyard art and audio (Phase 4).

## 5. File structure
```
JunkyardGrandPrix/
├── index.html
├── css/style.css
├── js/
│   ├── main.js     — loop + state machine + wiring (owns car + track)
│   ├── config.js   — ALL tunable constants (driving feel + track geometry)
│   ├── input.js    — keyboard (held + one-shot)
│   ├── car.js      — player car + driving model + forced-slow
│   ├── track.js    — oval geometry, on/off-track test, track rendering
│   └── ui.js       — menu + HUD
├── .gitignore
└── PROJECT_HANDOFF.md   (this file — not shipped)
```
`race.js` (Phase 3 — lap/checkpoint/timer/win) is not created yet.

## 6. Key decisions
- Modular files over a single `game.js` (matches Daniel's other games).
- Phase 2 approach: Option 1 — analytic oval + forced-slow off-track — chosen
  over Option 2 (solid bounce props) and Option 3 (pixel-mask track). Props /
  hand-drawn shapes remain clean future upgrades from this foundation if wanted.
- `TRACK.WIDTH` is the single feel knob: the inner rounded-rect is DERIVED in
  `track.js` by insetting `OUTER` by `WIDTH` (band width constant because
  inner.R = outer.R - WIDTH). Wider = forgiving, narrower = harder.
- Heading convention: 0 = up (-Y), +heading = clockwise; forward = (sin h, -cos h).
- `insideRoundedRect` test = clamp the point to the rect's straight core, then
  the corners are governed by distance to that clamped point. The track is drawn
  with `arcTo` rounded-rect paths (browser-portable) and an even-odd ring fill.
- Off-track model = extra drag only ABOVE the crawl cap, then crawl. Coasting on
  dirt rolling to a full stop is intended (the cap is the max when flooring it).
- Fixed-timestep loop (provisional — easy to simplify if desired).
- All feel/geometry values centralized in `config.js`; visual size and collision
  size are the same 32px for now (split later if needed).

## 7. Known rough edges
- The checkered start/finish line is PAINT ONLY until Phase 3 — crossing it does
  nothing yet.
- The screen/lot edge is the only hard wall; track edges bog you down, they
  don't stop you.
- `DEBUG.SHOW_SPEED` is ON — must be turned off before shipping.
- Window scaling is minimal (CSS max-width/height; native 800x600 on large
  screens, scales down to fit). Integer/DPR scaling is a later polish item.

## 8. Tuning quick-reference
config.js > CAR (driving feel, unchanged since Phase 1):
MAX_SPEED 300 · MAX_REVERSE_SPEED 140 · ACCEL 260 · BRAKE_ACCEL 420 ·
COAST_DECEL 180 · TURN_RATE 3.0 · STEER_FULL_SPEED 140.
config.js > CAR (off-track): OFFTRACK_MAX_SPEED 90 · OFFTRACK_DECEL 700.
config.js > TRACK (geometry): OUTER {X60,Y60,W680,H480,R160} · WIDTH 120
(→ derived INNER {X180,Y180,W440,H240,R40}) · START {400,480, facing right} ·
FINISH strip at x=400.
Quick guide: TRACK.WIDTH = how much room (main feel knob). OFFTRACK_DECEL = how
punishing the dirt is. COAST_DECEL = momentum. TURN_RATE = steering tightness.

## 9. Next step — Phase 3: the race loop
Make the race actually a race. Scope:
- Make the start/finish line functional (detect the car crossing it).
- A hidden checkpoint on the opposite (top) straight that must be passed before
  a finish-line crossing counts, so laps are honest (no nudging back and forth).
- Lap counter, race timer, 3-lap win condition, and restart back to a clean
  state.
- HUD for lap count + elapsed time, and a win screen.

Per the workflow, options come BEFORE any Phase 3 code — in particular the
finish-crossing detection method (e.g. a line-crossing test vs. an entered-zone
trigger) and exactly how/where the checkpoint arms and resets. Pick up here.

## 10. Working-method reminders
- Options before code; one system per pass; test, then git checkpoint, then
  "ready for the next?".
- `node --check` each changed JS before delivery.
- Confirm repo (`git remote -v`) before any push. Push to `main`.
- Update this handoff at session boundaries so the next session is self-contained.
