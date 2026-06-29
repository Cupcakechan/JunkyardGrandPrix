// audio.js
// Sound for Junkyard Grand Prix. Graceful: a missing or unplayable file is silent,
// never a crash. Browsers block audio until a user gesture, so sound begins on the
// first click/keypress (init() installs a one-shot unlock).
//
// Two audio paths, by job:
//   - MUSIC  -> HTML5 <audio>. A shuffle-bag jukebox (random order, no repeat until
//     the list is exhausted, auto-advances on 'ended'). HTML5 is the right tool: it
//     streams long files and gives us the 'ended' hook for sequencing.
//   - SFX LOOPS (engine, tire) -> Web Audio API. These are short clips that loop the
//     whole time you drive, and mp3 has encoder padding at the head/tail, so an HTML5
//     `loop` leaves an audible gap/click at the seam (reads as a choppy engine). Web
//     Audio loops an AudioBuffer sample-accurately, so the loop is seamless. Each loop
//     is one AudioBufferSourceNode -> its own GainNode (volume) -> a shared mute Gain
//     -> destination; pitch via playbackRate. (See PROJECT_HANDOFF §6/§7.)
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

// --- SFX clips (Web Audio loops; modulated while driving) ---
const SFX_ENGINE = 'assets/sfx/engine.mp3';
const SFX_TIRE   = 'assets/sfx/tires.mp3';

// --- mix levels (0..1) ---
const MUSIC_VOL  = 0.5;
const ENGINE_MAX = 0.7;   // engine gain at top speed (idle hum is a fraction of this)
const TIRE_MAX   = 0.6;

let muted = false;
let unlocked = false;
let tireVol = 0;          // smoothed tire gain (avoids pops)

// --- music jukebox (HTML5 audio) ---
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

// --- engine + tire loops (Web Audio; seamless) -----------------------------------
// One AudioContext drives both loops. muteGain is a shared 0/1 gate so mute cuts all
// SFX at once (like the music element's .muted). All of this stays null/no-op when
// Web Audio is unsupported or a clip is missing -> the game just runs silent.
let ctx = null;           // AudioContext (lazy; null if unsupported/blocked)
let muteGain = null;      // shared mute gate: source -> loopGain -> muteGain -> out

// A loop carries its own nodes plus the last-requested level/rate, so a value set
// before the source exists is honored the moment it starts.
function createLoop(url) {
  return { url, buffer: null, source: null, gain: null, started: false, rate: 1, level: 0 };
}
const engineLoop = createLoop(SFX_ENGINE);
const tireLoop   = createLoop(SFX_TIRE);

// fetch + decode the clip into an AudioBuffer once (front-loads decode at init).
function loadLoop(loop) {
  if (!ctx) return;
  fetch(loop.url)
    .then(r => (r.ok ? r.arrayBuffer() : Promise.reject()))
    .then(data => ctx.decodeAudioData(data))
    .then(buf => { loop.buffer = buf; if (unlocked) startLoop(loop); })
    .catch(() => {});      // missing / undecodable clip -> stays silent
}

// build the node graph and start looping (idempotent; needs ctx + a decoded buffer).
function startLoop(loop) {
  if (!ctx || !loop.buffer || loop.started) return;
  loop.gain = ctx.createGain();
  loop.gain.gain.value = loop.level;       // honor any level set before start
  loop.gain.connect(muteGain);
  const src = ctx.createBufferSource();
  src.buffer = loop.buffer;
  src.loop = true;                         // sample-accurate -> no seam/click
  src.playbackRate.value = loop.rate;
  src.connect(loop.gain);
  src.start();
  loop.source = src;
  loop.started = true;
}

function setLoopGain(loop, v) {
  loop.level = v;                          // remembered even if not started yet
  if (loop.gain) loop.gain.gain.value = v;
}
function setLoopRate(loop, r) {
  loop.rate = r;
  if (loop.source) loop.source.playbackRate.value = r;
}

function applyMute() {
  musicEl.muted = muted;
  if (muteGain) muteGain.gain.value = muted ? 0 : 1;   // gates engine + tire at once
}

function unlock() {
  if (unlocked) return;
  unlocked = true;
  applyMute();
  playNextSong();                          // start the HTML5 music jukebox
  if (ctx) ctx.resume().catch(() => {});   // Web Audio contexts start suspended
  startLoop(engineLoop);                   // start the SFX loops (silent; modulated while driving)
  startLoop(tireLoop);
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

    // Spin up Web Audio for the seam-free SFX loops; decode now so the buffers are
    // ready by the time the first gesture fires. Any failure -> silent SFX, no crash.
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        ctx = new AC();
        muteGain = ctx.createGain();
        muteGain.gain.value = muted ? 0 : 1;
        muteGain.connect(ctx.destination);
        loadLoop(engineLoop);
        loadLoop(tireLoop);
      }
    } catch { ctx = null; }                // context creation blocked -> SFX silent
  },

  // call each play-frame with speed as a 0..1 fraction: louder + higher-pitched with speed
  engineLevel(frac) {
    setLoopRate(engineLoop, 1 + 0.9 * frac);
    setLoopGain(engineLoop, Math.min(1, 0.12 + 0.6 * frac) * ENGINE_MAX);
  },
  engineOff() { setLoopGain(engineLoop, 0); },

  // call each frame: fades a tire/dirt loop in while active (e.g. bogging on dirt)
  tire(active) {
    tireVol += ((active ? TIRE_MAX : 0) - tireVol) * 0.2;
    setLoopGain(tireLoop, tireVol);
  },

  toggleMute() { muted = !muted; applyMute(); },
  get muted() { return muted; },
};
