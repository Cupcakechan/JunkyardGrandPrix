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

## 4. Current status — Phases 1–4 complete; Phase 5 is next
All committed and pushed to `main`.

Phase 1 — shell + driving feel: fixed-timestep loop (1/60 s), keyboard input,
arcade driving model (accel, brake/reverse, coast, speed-scaled steering).

Phase 2 — track + boundaries: analytic oval (outer rounded-rect minus inner =
asphalt band), `isOnTrack` test, Atari-style forced-slow off-track.

Phase 3 — race loop (`js/race.js`): finish line = a directional left-to-right
crossing on the bottom straight; far-side checkpoint (top straight) arms each lap;
lap counter, **start-on-throttle** clock, 3-lap win, restart.

Phase 4 — art + audio:
- **Asset loader** (`js/assets.js`) — loads by id from `assets/<id>.png`; missing/
  failed assets degrade to a placeholder, never crash.
- **Car sprite** — `assets/car.png` (32×32, nose-up); rect fallback.
- **Track art** — `assets/scenery.png` (800×600 base) + `assets/asphalt.png`
  (64×64 seamless tile) poured into the analytic ring via `createPattern`. Edge
  stripes + start/finish stay code-drawn. Collision unchanged.
- **Menu framework** — a screen router (`mainMenu | howToPlay | comingSoon |
  play | win`) in `js/main.js`; the menu screens live in `js/menu.js`. Main Menu
  is data-driven (5 buttons), navigable by **keyboard and mouse**. Buttons are
  baked PixelLab element sprites (`assets/btn_<id>.png` + `_hover`); How To Play
  is real; Highscores/Shop/Settings are "Coming soon" stubs until their phases.
- **Audio** (`js/audio.js`, exported as `Sound`) — HTML5 audio (Option A),
  graceful-silent fallback, first-gesture unlock. A 5-track **shuffle-bag
  jukebox** (`assets/music/`), an **engine** loop (pitch/volume rise with speed)
  and a **tire** loop (fades in while bogging off-track) from `assets/sfx/`, and
  **M** to mute.

Remaining Phase 4 polish (optional, not blocking): a menu `assets/background.png`
(800×600; the menu draws a dark fill until it exists), more scenery props.

## 5. File structure
```
JunkyardGrandPrix/
├── index.html
├── css/style.css
├── js/
│   ├── main.js     — loop + screen router + wiring (owns car/track/race; inits input/sound/assets)
│   ├── config.js   — tunable constants (driving feel, track geometry, race rules, debug)
│   ├── input.js    — keyboard (held + one-shot) + mouse (canvas-mapped pos + click)
│   ├── car.js      — player car + driving model + forced-slow; sprite-or-rect draw
│   ├── track.js    — oval geometry, on/off-track test, scenery + asphalt-pattern rendering
│   ├── race.js     — laps, far-side checkpoint, start-on-throttle timer, 3-lap win
│   ├── assets.js   — image loader (id → assets/<id>.png), graceful fallback
│   ├── audio.js    — Sound: music jukebox + engine/tire SFX + mute (HTML5 audio)
│   ├── menu.js     — Main Menu (kbd+mouse buttons), How To Play, Coming Soon
│   └── ui.js       — in-race HUD + win screen
├── assets/
│   ├── car.png · scenery.png (800×600) · asphalt.png (64×64 seamless)
│   ├── btn_<start|howtoplay|highscores|shop|settings>.png  (+ _hover each)
│   ├── music/  — 5 mp3s (web-safe names; listed in audio.js MUSIC)
│   └── sfx/    — engine.mp3, tires.mp3
├── .gitignore
└── PROJECT_HANDOFF.md   (this file — not shipped)
```

## 6. Key decisions
- Modular files; tunables centralized in `config.js` (audio manifest + levels live
  at the top of `audio.js` since they belong to the sound system).
- Track shape: analytic oval now; **Route 1 (centerline + width) chosen** for the
  future track system — see §9 Phase 5. `TRACK.WIDTH` is the single feel knob.
- Heading: 0 = up, +CW; forward = (sin h, -cos h). Lap runs CCW. Race timer is
  start-on-throttle.
- Art: data-driven loader + **graceful fallback everywhere**. The pattern-fill
  trick (texture poured into the analytic path) keeps art aligned to analytic
  collision and carries over to Route 1 tracks.
- Menu: a lightweight string-state **screen router** (not a heavier scene system).
  Both keyboard and mouse navigate (they cooperate — hover or arrow to select).
- Buttons are baked PixelLab **element** sprites (label + icon baked in), drawn at
  native aspect (uniform width), **not** runtime 9-sliced (that would distort the
  baked text). Hover sprite is drawn at the same scale/center so its glow blooms
  around the same body; missing art → flat labelled fallback.
- Audio is split by job: **music = HTML5 `<audio>`** (shuffle-bag jukebox; needs
  the `ended` hook + streaming), **SFX loops (engine, tire) = Web Audio API** (an
  mp3 in an HTML5 `loop` clicks at the seam, so the decoded buffers loop sample-
  accurately instead). Pitch via `playbackRate`; a shared mute-gain gates the SFX.
- Asset filenames are web-safe (lowercase, no spaces) — itch is case-sensitive.

## 7. Known rough edges
- `DEBUG.SHOW_SPEED` is ON — turn OFF before shipping (`config.js > DEBUG`).
- Window scaling is minimal (CSS max- only). itch fullscreen runs but won't FILL
  a large screen until we add a scale-up pass — a pre-ship polish item.
- No deploy script yet.

## 8. Tuning quick-reference
config.js > CAR: MAX_SPEED 300 · MAX_REVERSE_SPEED 140 · ACCEL 260 ·
BRAKE_ACCEL 420 · COAST_DECEL 180 · TURN_RATE 3.0 · STEER_FULL_SPEED 140 ·
OFFTRACK_MAX_SPEED 90 · OFFTRACK_DECEL 700.
config.js > TRACK: OUTER {X60,Y60,W680,H480,R160} · WIDTH 120 (→ INNER
{X180,Y180,W440,H240,R40}) · START {400,480, right} · FINISH x=400.
config.js > RACE: LAPS 3.
audio.js (top): MUSIC list (5 songs) · MUSIC_VOL 0.5 · ENGINE_MAX 0.7 · TIRE_MAX 0.6.
Quick guide: TRACK.WIDTH = room (main feel knob). OFFTRACK_DECEL = dirt
punishment. COAST_DECEL = momentum. TURN_RATE = steering tightness.

## 9. Roadmap — next phases
Indy 500 homage: varied tracks, multiple modes, ice maps, a difficulty meter, and
buyable cosmetic cars. Sequenced by dependency:

**Phase 5 — Track system (Route 1) — NEXT, the backbone.**
Tracks become DATA: a centerline path + width. Stroke the centerline with the
asphalt pattern to render any shape; on-track = distance-to-centerline ≤ width/2
(matches what's drawn); lap progress measured ALONG the centerline (makes figure-8
honest-laps work). Reproduces the current oval EXACTLY (centerline rounded-rect
R100 stroked at width 120 → outer R160 / inner R40). Vertical slice: (1) track-as-
data + distance collision, first track = the current oval (no regression); (2)
move start/finish + checkpoint + spawn into per-track data; (3) add a second shape
(e.g. figure-8) + minimal track switch. Open decision at kickoff: centerline as
**segments+arcs** (exact curves) vs **sampled polyline** (simpler, approximate).

**Phase 6 — Game modes.** A mode abstraction over the race. Single-player
(opponent deferred): **Standard Race** (configurable lap target ≈25, plus a "most
laps before a timer" variant) and **Crash & Score** (grab square pickups before a
timer). Generalizes today's hard-coded 3-lap race. Unlocks the Game Mode select
screen (menu stub already in place).

**Phase 7 — Surface + difficulty.** **Ice** tracks (slippery handling) as a
per-track surface property; **difficulty meter** (harder = faster) as a speed
multiplier. Feeds the Settings screen.

**Phase 8 — Cars & cosmetics (meta, last).** Car registry (cosmetic sprites),
currency earned from races, garage/shop UI, `localStorage`. Feeds the Shop +
Choose-Vehicle screens.

**Later — Opponent AI.** Deferred; slots into Standard Race when wanted.

Menu screens still stubbed ("Coming soon") light up as their phase lands: Game
Mode → P6, Settings → P7, Shop + Choose Vehicle → P8, Highscores → modes + save.

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
