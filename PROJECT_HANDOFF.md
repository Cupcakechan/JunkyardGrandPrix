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

## 4. Current status — Phases 1–3 complete; Phase 4 (art) in progress
All of Phases 1–3 and the art so far are committed and pushed to `main`.

Phase 1 — shell + driving feel:
- Fixed-timestep loop (1/60 s), keyboard input (Arrows/WASD; Enter/R/Esc),
  MENU<->PLAYING state machine, arcade driving model (accel, brake/reverse,
  coast friction, speed-scaled steering).

Phase 2 — track + boundaries:
- Analytic oval (outer rounded-rect minus inner = asphalt band), `isOnTrack`
  test, Atari-style forced-slow off-track, car spawns on the start/finish line.

Phase 3 — race loop (`js/race.js`):
- Finish line = a directional **left-to-right** crossing of `FINISH.X` on the
  bottom straight (a reverse nudge crosses the other way and is ignored).
- Far-side **checkpoint** = the top straight; it arms the finish each lap, so a
  counted lap means you went all the way around. (Cutting straight up the
  infield can arm it, but the forced-slow dirt makes that never pay.)
- Lap counter, **start-on-throttle** race clock (holds at 0:00 until first
  forward speed), 3-lap win, `WIN` state, restart to a clean state.
- HUD shows `LAP n/3` + `mm:ss.cs`; win overlay shows final time.

Phase 4 — art + audio (in progress):
- `js/assets.js` — central image loader. Loads by id from `assets/<id>.png`;
  a consumer gets the image only once decoded, else `null` → draws a
  placeholder. Missing/failed assets never crash (graceful fallback).
- **Car sprite** — `assets/car.png` (32×32 RGBA, drawn nose-up). `car.js` draws
  the sprite if loaded, else the placeholder rect. `imageSmoothingEnabled=false`
  for crisp pixels.
- **Track art** — `assets/scenery.png` (800×600 junkyard ground, base layer) +
  `assets/asphalt.png` (64×64 seamless tile). The asphalt tile is poured into
  the analytic ring via `createPattern` + even-odd fill, so the art stays
  aligned to collision for free. Edge stripes + start/finish strip stay
  code-drawn. Collision is unchanged.

Still open in Phase 4: **menu UI** (9-slice screens — see §9) and **audio**.

## 5. File structure
```
JunkyardGrandPrix/
├── index.html
├── css/style.css
├── js/
│   ├── main.js     — loop + state machine + wiring (owns car/track/race; kicks off Assets.load)
│   ├── config.js   — ALL tunable constants (driving feel, track geometry, race rules, debug)
│   ├── input.js    — keyboard (held + one-shot)
│   ├── car.js      — player car + driving model + forced-slow; sprite-or-rect draw
│   ├── track.js    — oval geometry, on/off-track test, scenery + asphalt-pattern rendering
│   ├── race.js     — laps, far-side checkpoint, start-on-throttle timer, 3-lap win
│   ├── assets.js   — image loader (id → assets/<id>.png), graceful fallback
│   └── ui.js       — menu + HUD + win screen
├── assets/
│   ├── car.png      — 32×32 RGBA, nose-up
│   ├── scenery.png  — 800×600 junkyard ground (base layer)
│   └── asphalt.png  — 64×64 seamless asphalt tile
├── .gitignore
└── PROJECT_HANDOFF.md   (this file — not shipped)
```

## 6. Key decisions
- Modular files over a single `game.js`. All feel/geometry/rules centralized in
  `config.js`.
- Track shape: Phase 2's analytic oval (Option 1). For future varied shapes,
  **Route 1 (centerline + width) is chosen** — see §9 Phase 5.
- `TRACK.WIDTH` is the single feel knob (inner rect derived from outer inset by
  WIDTH). Heading: 0 = up, +CW; forward = (sin h, -cos h). Lap runs CCW.
- Off-track = extra drag only above the crawl cap, then crawl (cutting the
  infield never pays). Fixed-timestep loop.
- Race timer is **start-on-throttle** (chosen over start-on-enter).
- Art pipeline: data-driven `Assets` loader + **graceful fallback everywhere**
  (placeholder/colour until the PNG exists; dropping art in needs no code).
  The pattern-fill trick (texture poured into the analytic path) is how art
  stays aligned to analytic collision — it carries over to Route 1 tracks.
- Sprites authored in PixelLab.ai → Aseprite. PixelLab can't do 800×600, so
  large art (scenery) is stitched from smaller pieces; textures (asphalt) are
  small seamless tiles. Filenames lowercase (itch is case-sensitive).

## 7. Known rough edges
- `DEBUG.SHOW_SPEED` is ON — must be turned OFF before shipping (it's in
  `config.js > DEBUG`).
- The screen/lot edge is the only hard wall; track edges bog you down.
- Window scaling is minimal (CSS max- only; native 800×600, scales DOWN to fit,
  not up). itch fullscreen runs fine but won't FILL a large screen until we add
  a scale-up pass — a pre-ship polish item.
- No audio yet; no deploy script yet.

## 8. Tuning quick-reference
config.js > CAR (driving feel): MAX_SPEED 300 · MAX_REVERSE_SPEED 140 ·
ACCEL 260 · BRAKE_ACCEL 420 · COAST_DECEL 180 · TURN_RATE 3.0 ·
STEER_FULL_SPEED 140. Off-track: OFFTRACK_MAX_SPEED 90 · OFFTRACK_DECEL 700.
config.js > TRACK: OUTER {X60,Y60,W680,H480,R160} · WIDTH 120 (→ derived
INNER {X180,Y180,W440,H240,R40}) · START {400,480, facing right} · FINISH x=400.
config.js > RACE: LAPS 3.
Quick guide: TRACK.WIDTH = room (main feel knob). OFFTRACK_DECEL = dirt
punishment. COAST_DECEL = momentum. TURN_RATE = steering tightness.

## 9. Roadmap — next phases
Vision: Indy 500 homage with varied tracks, multiple modes, ice maps, a
difficulty meter, and buyable cosmetic cars. Sequenced by dependency:

**Phase 5 — Track system (Route 1) — NEXT, the backbone.**
Tracks become DATA: a centerline path + width. A widened centerline unifies
everything — stroke it with the asphalt pattern to render any shape; on-track =
distance-to-centerline ≤ width/2 (matches what's drawn); lap progress measured
ALONG the centerline (makes figure-8 honest-laps work). Reproduces the current
oval EXACTLY (centerline rounded-rect R100, stroked at width 120 → outer R160 /
inner R40). Vertical slice: (1) track-as-data + distance collision, first track =
the current oval (no regression); (2) move start/finish + checkpoint + spawn into
per-track data; (3) add a second shape (e.g. figure-8) + minimal track switch.
Open decision when we start: centerline as **segments+arcs** (exact curves) vs
**sampled polyline** (simpler, approximate).

**Phase 6 — Game modes.** A mode abstraction over the race. Modes (single-player;
opponent deferred): **Standard Race** (configurable lap target ≈25, plus a
"most laps before a timer" variant) and **Crash & Score** (grab square pickups
before the timer runs out). Generalizes today's hard-coded 3-lap race.

**Phase 7 — Surface + difficulty.** **Ice** tracks (slippery handling) as a
per-track surface property; **difficulty meter** (harder = faster) as a speed
multiplier. Small modifiers that ride on Phases 5–6.

**Phase 8 — Cars & cosmetics (meta, last).** Car registry (multiple cosmetic
sprites), currency earned from races, garage/shop UI, `localStorage` persistence.
Cosmetic only.

**Later — Opponent AI.** Deferred; slots into Standard Race when wanted.

**Menu / navigation (finishing Phase 4 UI).** Daniel is authoring 9-slice panel
art. Planned screen tree: **Main menu** (Start, How To Play, Highscore, Shop,
Settings) → **Start** → Game Mode → Choose Vehicle → race; **How To Play**
explains mechanics + modes. Several screens depend on later phases (Game Mode →
P6; Choose Vehicle + Shop → P8; Highscore → modes + persistence; Settings/
difficulty → P7), so the plan is: build the reusable **menu framework + 9-slice
button widget + Main Menu + How To Play** now (with flat fallbacks until the
panel art lands), and stub/defer the system-dependent screens until their phases.
Open decision: keyboard-selector nav vs mouse-click vs both.

## 10. Working-method reminders
- Options before code; one system per pass; test, then git checkpoint, then
  "ready for the next?". (No per-feature DevLog entries for this project.)
- `node --check` each changed JS before delivery.
- Confirm repo (`git remote -v`) before any push. Push to `main`.
- Verify new art assets (dimensions/format/filename case) before committing.
- Update this handoff at session boundaries so the next session is self-contained.
