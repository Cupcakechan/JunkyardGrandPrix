// audio.js
// Sound for Junkyard Grand Prix — HTML5 audio (Option A). Graceful: a missing or
// unplayable file is silent, never a crash. Music is a shuffle-bag jukebox (random
// order, no repeat until the list is exhausted, auto-advances when a song ends).
// The engine + tire loops are speed/surface-driven hooks that stay silent until
// their clips exist in assets/sfx/. Browsers block audio until a user gesture, so
// sound begins on the first click/keypress (init() installs a one-shot unlock).
//
// Exported as `Sound` (NOT `Audio`) so it doesn't shadow the global Audio constructor.

// --- playlist: add songs here; names must match the files in assets/music/ exactly ---
const MUSIC_DIR = 'assets/music/';
const MUSIC = [
  'cloud-dimension.mp3',
  'etherwave.mp3',
  'neon-core.mp3',
  'travelling-down-the-hyperlane.mp3',
  'vector-speedrunner.mp3',
];

// --- SFX clips (looped; modulated while driving) ---
const SFX_ENGINE = 'assets/sfx/engine.mp3';
const SFX_TIRE   = 'assets/sfx/tires.mp3';

// --- mix levels (0..1) ---
const MUSIC_VOL  = 0.5;
const ENGINE_MAX = 0.7;   // engine gain at top speed (idle hum is a fraction of this)
const TIRE_MAX   = 0.6;

let muted = false;
let unlocked = false;
let tireVol = 0;          // smoothed tire gain (avoids pops)

// --- music jukebox ---
const musicEl = new Audio();
musicEl.volume = MUSIC_VOL;
musicEl.addEventListener('ended', playNextSong);

let bag = [];             // remaining shuffled track indices for this cycle
function playNextSong() {
  if (MUSIC.length === 0) return;
  if (bag.length === 0) {                          // refill + shuffle when exhausted
    bag = MUSIC.map((_, i) => i);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  musicEl.src = MUSIC_DIR + encodeURIComponent(MUSIC[bag.pop()]);
  if (unlocked) musicEl.play().catch(() => {});    // autoplay rejection is harmless
}

// --- engine + tire loops (inert until their files exist) ---
const engineEl = new Audio(SFX_ENGINE);
engineEl.loop = true;
engineEl.volume = 0;
const tireEl = new Audio(SFX_TIRE);
tireEl.loop = true;
tireEl.volume = 0;

function applyMute() {
  musicEl.muted = muted;
  engineEl.muted = muted;
  tireEl.muted = muted;
}

function unlock() {
  if (unlocked) return;
  unlocked = true;
  applyMute();
  playNextSong();                    // start the jukebox
  engineEl.play().catch(() => {});   // start the loops (silent); modulated while driving
  tireEl.play().catch(() => {});
}

export const Sound = {
  // install the one-shot gesture listener that unlocks audio (autoplay policy)
  init() {
    const onGesture = () => {
      unlock();
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
    window.addEventListener('pointerdown', onGesture);
    window.addEventListener('keydown', onGesture);
  },

  // call each play-frame with speed as a 0..1 fraction: louder + higher-pitched with speed
  engineLevel(frac) {
    engineEl.playbackRate = 1 + 0.9 * frac;
    engineEl.volume = Math.min(1, 0.12 + 0.6 * frac) * ENGINE_MAX;
  },
  engineOff() { engineEl.volume = 0; },

  // call each frame: fades a tire/dirt loop in while active (e.g. bogging on dirt)
  tire(active) {
    tireVol += ((active ? TIRE_MAX : 0) - tireVol) * 0.2;
    tireEl.volume = tireVol;
  },

  toggleMute() { muted = !muted; applyMute(); },
  get muted() { return muted; },
};
