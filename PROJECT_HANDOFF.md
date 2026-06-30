# Junkyard Grand Prix — PROJECT_HANDOFF

> Source of truth for this project. Read this (and the code) before any work.
> Kept in the repo root but OUT of any folder pushed to itch.

## 1. Project
- Game 4 of Daniel's 20 Games Challenge, studio Cocolito Collective.
- Junkyard Grand Prix: a tiny top-down arcade racer set in a junkyard, an homage
  to the 1977 Atari 2600 **Indy 500** (varied track shapes, multiple game modes).
  Drive a beat-up scrap car around a compact circuit. Not a clone.
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
- GitHub: https://github.com/Cupcakechan/JunkyardGrandPrix.git (push to `main`).
- itch slug (working, confirmed at ship): junkyard-grand-prix
- Deploy: butler (installed, on PATH). No deploy script yet — add an
  `update-JunkyardGrandPrix.bat` (butler push to
  `mrcanela/junkyard-grand-prix:html5`) at first ship. Source files ARE the
  deliverable; ship the folder holding `index.html` (index.html, css/, js/,
  assets/) and keep this handoff out of it.

## 4. Current status — Phases 1–6 complete; Phase 7 is next
All committed and pushed to `main`.

Phase 1 — shell + driving feel: fixed-timestep loop (1/60 s), keyboard input,
arcade driving model (accel, brake/reverse, coast, speed-scaled steering).

Phase 2 — track + boundaries: forced-slow off-track (Atari-style); the on/off-
track test is now distance-to-centerline (see Phase 5).

Phase 3 — race loop (`js/race.js`): start-on-throttle clock, far-side checkpoint
that arms each lap, 3-lap win, restart.

Phase 4 — art + audio:
- **Asset loader** (`js/assets.js`) — loads by id from `assets/<id>.png`; missing/
  failed assets degrade to a placeholder, never crash.
- **Car sprite** — `assets/car.png` (32×32, nose-up); rect fallback.
- **Track art** — `assets/scenery.png` (800×600 base) + `assets/asphalt.png`
  (64×64 seamless tile) via `createPattern`. Edge stripes + start/finish code-drawn.
- **Menu framework** — a screen router in `js/main.js`; menu screens in `js/menu.js`.
  Main Menu is data-driven (5 buttons), keyboard + mouse, over a `background.png`
  backdrop with a `title.png` logo. Baked PixelLab button sprites.
- **Audio** (`js/audio.js`, `Sound`) — **music** = HTML5 5-track shuffle-bag jukebox;
  **engine + tire loops** = Web Audio (seamless), modulated by speed/surface; **M** mutes.

Phase 5 — track system (Route 1):
- Tracks are **data** — a centerline polyline + width, with per-track spawn, finish
  line, and checkpoint line. On-track = distance-to-centerline ≤ width/2; the road
  is that centerline stroked with the asphalt pattern; laps via **directional line-
  crossing** of the finish/checkpoint segments (`js/race.js`).
- A **track registry** (`js/track.js`) holds the oval + a **figure-8**; dev key
  **`T`** cycles them (placeholder until Phase 6's track-select).

Phase 6 — game modes:
- A **mode registry** (`js/modes.js`): each mode is self-contained (start / update /
  done / drawWorld / drawHud / drawResult); the play screen delegates to the active
  mode and the Game Mode menu lists the registry. **Standard Race** wraps the lap
  engine; **Crash & Score** is its own loop — one pickup at a time on the asphalt,
  grab it for a point, 60 s countdown (start-on-throttle), score at the end.
- Menu flow: Start → **Game Mode** select → race. Mode buttons are `btn_race` /
  `btn_crash` (drop-in, flat fallback).

## 5. File structure
```
JunkyardGrandPrix/
├── index.html
├── css/style.css
├── js/
│   ├── main.js     — loop + screen router + wiring (owns car/track; runs the active mode)
│   ├── config.js   — tunable constants (driving feel, track geometry, race + crash rules, HUD, debug)
│   ├── input.js    — keyboard (held + one-shot) + mouse (canvas-mapped pos + click)
│   ├── car.js      — player car + driving model + forced-slow; sprite-or-rect draw
│   ├── track.js    — track registry (oval + figure-8) as centerline data; distance
│   │                 collision + centerline-stroke rendering; per-track finish/spawn
│   ├── race.js     — laps via finish/checkpoint line-crossing, start-on-throttle timer, win
│   ├── modes.js    — game-mode registry: Standard Race (wraps race.js) + Crash & Score
│   ├── assets.js   — image loader (id → assets/<id>.png), graceful fallback
│   ├── audio.js    — Sound: HTML5 music jukebox + Web Audio engine/tire SFX + mute
│   ├── menu.js     — Main Menu, Game Mode select, How To Play, Coming Soon
│   └── ui.js       — in-race HUD + win screen; Crash & Score HUD + result
├── assets/
│   ├── car.png · scenery.png (800×600) · asphalt.png (64×64) · background.png · title.png
│   ├── btn_<start|howtoplay|highscores|shop|settings|race|crash>.png  (+ _hover each)
│   ├── music/  — 5 mp3s (web-safe names; listed in audio.js MUSIC)
│   └── sfx/    — engine.mp3, tires.mp3
├── .gitignore
└── PROJECT_HANDOFF.md   (this file — not shipped)
```

## 6. Key decisions
- Modular files; tunables centralized in `config.js` (audio manifest + levels live
  at the top of `audio.js` since they belong to the sound system).
- Track system: **Route 1 (sampled-polyline centerline + width)**. Tracks are data
  in a registry; on-track = distance-to-centerline ≤ width/2; the road is that
  centerline stroked with the asphalt pattern; laps via directional line-crossing of
  per-track finish/checkpoint segments. Polyline chosen over arc-segments — any shape
  is just points. `TRACK.WIDTH` is the feel knob.
- Game modes live in a **registry** (`modes.js`); each mode owns its rules + HUD +
  result, so the play screen and Game Mode menu stay mode-agnostic. Standard Race
  reuses the `race.js` lap engine; Crash & Score is a separate score/timer loop.
- Heading: 0 = up, +CW; forward = (sin h, -cos h). Lap runs CCW. Clocks are
  start-on-throttle.
- Art: data-driven loader + **graceful fallback everywhere**. Stroking/filling the
  collision path with the texture keeps art aligned to collision for free.
- Menu: a lightweight string-state **screen router**. Both keyboard and mouse
  navigate (hover or arrow to select).
- Buttons are baked PixelLab **element** sprites (label + icon baked in), drawn at
  native aspect, **not** runtime 9-sliced (would distort the baked text). Hover
  sprite drawn at the same scale/center so its glow blooms; missing art → fallback.
- Audio split by job: **music = HTML5 `<audio>`**, **SFX loops = Web Audio** (mp3 in
  an HTML5 `loop` clicks at the seam; decoded buffers loop sample-accurately).
- Asset filenames are web-safe (lowercase, no spaces) — itch is case-sensitive.

## 7. Known rough edges
- `DEBUG.SHOW_SPEED` is ON — turn OFF before shipping (`config.js > DEBUG`).
- Dev key **`T`** (cycle track shape) is a placeholder — remove/replace when a real
  track-select lands.
- Per-track scenery isn't a thing yet: the figure-8 borrows the oval's
  `scenery.png` ground (fine for now; revisit with real track variety).
- Window scaling is minimal (CSS max- only). itch fullscreen runs but won't FILL
  a large screen until we add a scale-up pass — a pre-ship polish item.
- No deploy script yet.

## 8. Tuning quick-reference
config.js > CAR: MAX_SPEED 300 · MAX_REVERSE_SPEED 140 · ACCEL 260 ·
BRAKE_ACCEL 420 · COAST_DECEL 180 · TURN_RATE 3.0 · STEER_FULL_SPEED 140 ·
OFFTRACK_MAX_SPEED 90 · OFFTRACK_DECEL 700.
config.js > TRACK: OUTER {X60,Y60,W680,H480,R160} · WIDTH 120 · START {400,480,
right} · FINISH x=400 (the oval sources its track data from these).
config.js > RACE: LAPS 3.  ·  CRASH: DURATION 60, PICKUP 20.  ·  HUD: HINT = dark hint text.
track.js: TRACKS registry (oval + figure-8); figure-8 = Gerono lemniscate, a=260.
audio.js (top): MUSIC list (5 songs) · MUSIC_VOL 0.5 · ENGINE_MAX 0.7 · TIRE_MAX 0.6.
Quick guide: TRACK.WIDTH = room (main feel knob). OFFTRACK_DECEL = dirt
punishment. COAST_DECEL = momentum. TURN_RATE = steering tightness.

## 9. Roadmap — next phases
Indy 500 homage: varied tracks, multiple modes, ice maps, a difficulty meter, and
buyable cosmetic cars. Sequenced by dependency:

**Phase 5 — Track system (Route 1) — DONE.** Tracks are data (polyline centerline +
width) in a registry; distance collision + centerline-stroke rendering; laps via
line-crossing of per-track finish/checkpoint segments. Oval reproduced exactly +
a figure-8; dev key `T` cycles them.

**Phase 6 — Game modes — DONE.** A mode registry (`modes.js`); the Game Mode screen
lists it. **Standard Race** (complete N laps; `RACE.LAPS`, default 3 — bump toward
~25 for ship) and **Crash & Score** (one pickup at a time, 60 s, score) both play.
Opponent still deferred (the "Later" item); a timed "most laps in a time limit"
Standard variant and a real track-select UI are easy follow-ons when wanted.

**Phase 7 — Surface + difficulty — NEXT.** **Ice** tracks (slippery handling) as a
per-track surface property; **difficulty meter** (harder = faster) as a speed
multiplier. Feeds the Settings screen.

**Phase 8 — Cars & cosmetics (meta, last).** Car registry (cosmetic sprites),
currency earned from races, garage/shop UI, `localStorage`. Feeds the Shop +
Choose-Vehicle screens.

**Later — Opponent AI.** Deferred; slots into Standard Race when wanted.

Menu screens still stubbed ("Coming soon") light up as their phase lands: Settings
→ P7, Shop + Choose Vehicle → P8, Highscores → modes + save. (Game Mode is now live.)

**Backlog / ideas (unscheduled):**
- **Wayfinding indicator** — a glowing directional cue (next-checkpoint arrow or a
  racing-line guide) so the way forward is obvious; especially wanted on the
  figure-8 and future twisty tracks, where direction can get confusing.

## 10. Working-method reminders
- Options before code; one system per pass; test, then git checkpoint, then
  "ready for the next?". (No per-feature DevLog entries for this project.)
- `node --check` each changed JS before delivery.
- Confirm repo (`git remote -v`) before any push. Push to `main`.
- Verify new art/audio assets (dimensions/format/filename case) before committing.
- Update this handoff at session boundaries so the next session is self-contained.
