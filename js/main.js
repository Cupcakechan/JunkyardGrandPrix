// main.js
// Entry point: canvas + fixed-timestep loop + the screen router. Screens are
// 'mainMenu' | 'gameMode' | 'howToPlay' | 'comingSoon' | 'play' | 'win'. The menu
// screens live in menu.js; the race is run by the active GAME MODE (modes.js),
// which the play/win screens delegate to.

import { CONFIG } from './config.js';
import { Input } from './input.js';
import { Car } from './car.js';
import { Track } from './track.js';
import { Assets } from './assets.js';
import { Sound } from './audio.js';
import { MainMenu, HowToPlay, ComingSoon, GameMode } from './menu.js';
import { MODES, modeById } from './modes.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// canvas backing-store size comes from CONFIG (single source of truth)
canvas.width = CONFIG.CANVAS.WIDTH;
canvas.height = CONFIG.CANVAS.HEIGHT;
ctx.imageSmoothingEnabled = false;  // keep pixel art crisp (resizing the canvas resets this, so set it after)
const W = canvas.width;
const H = canvas.height;

Input.init(canvas);                 // mouse → canvas-space coords + click one-shot
Sound.init();                       // installs the first-gesture audio unlock
Assets.load();                      // begin loading sprites; draws use placeholders until ready

const car = new Car();
let mode = MODES[0];                // active game mode (default Standard Race)
let screen = 'mainMenu';            // see header for the set

function startRace() {
  const s = Track.current.spawn;    // per-track spawn (on the start line, facing along)
  car.reset(s.x, s.y, s.heading);
  mode.start(car);                  // mode resets its own state (laps/clock, etc.)
  screen = 'play';
}

// Single place that changes screen, so pending one-shots never leak across.
function goTo(name, arg) {
  Input.clearOneShots();
  if (name === 'comingSoon') ComingSoon.enter(arg);
  if (name === 'play') { startRace(); return; }
  screen = name;
}

function handleMenuAction(item) {
  if (item.target === 'gameMode')        goTo('gameMode');
  else if (item.target === 'howToPlay')  goTo('howToPlay');
  else if (item.target === 'comingSoon') goTo('comingSoon', item.label);
}

// --- fixed timestep so the driving feel is identical on any refresh rate ---
const STEP = 1 / 60;
let accumulator = 0;
let last = performance.now();

function update(dt) {
  if (Input.consume('mute')) Sound.toggleMute();
  if (Input.consume('devTrack')) { Track.cycle(); startRace(); }  // dev: cycle track shape

  switch (screen) {
    case 'mainMenu': {
      const item = MainMenu.update(Input);
      if (item) handleMenuAction(item);
      break;
    }
    case 'gameMode': {
      if (Input.consume('back')) { goTo('mainMenu'); break; }
      const item = GameMode.update(Input);
      if (item && item.available) { mode = modeById(item.id); goTo('play'); }
      break;
    }
    case 'howToPlay':
      if (HowToPlay.update(Input)) goTo('mainMenu');
      break;
    case 'comingSoon':
      if (ComingSoon.update(Input)) goTo('mainMenu');
      break;
    case 'play': {
      if (Input.consume('menu'))    { goTo('mainMenu'); break; }
      if (Input.consume('restart')) { startRace(); break; }
      const onTrack = Track.isOnTrack(car.x, car.y);
      car.update(dt, Input, { w: W, h: H }, onTrack);
      mode.update(dt, car);         // mode rules (laps / score / timer)
      const frac = Math.min(1, Math.abs(car.speed) / CONFIG.CAR.MAX_SPEED);
      Sound.engineLevel(frac);      // engine revs with speed
      Sound.tire(!onTrack && Math.abs(car.speed) > 20);  // tire/dirt while bogging off-track
      if (mode.done) screen = 'win';
      break;
    }
    case 'win': {
      const again = Input.consume('restart');
      const start = Input.consume('start');
      if (again || start)           { startRace(); break; }
      if (Input.consume('menu'))    { goTo('mainMenu'); break; }
      break;
    }
  }

  if (screen !== 'play') { Sound.engineOff(); Sound.tire(false); }  // engine/tire quiet off the track
}

function render() {
  ctx.fillStyle = CONFIG.CANVAS.BG;
  ctx.fillRect(0, 0, W, H);

  switch (screen) {
    case 'mainMenu':   MainMenu.draw(ctx);  break;
    case 'gameMode':   GameMode.draw(ctx);  break;
    case 'howToPlay':  HowToPlay.draw(ctx); break;
    case 'comingSoon': ComingSoon.draw(ctx); break;
    case 'play':
    case 'win': {
      const onTrack = Track.isOnTrack(car.x, car.y);
      Track.draw(ctx, W, H);
      mode.drawWorld(ctx);          // mode world entities (e.g. pickups); no-op for a race
      car.draw(ctx);
      mode.drawHud(ctx, W, H, car, onTrack);
      if (screen === 'win') mode.drawResult(ctx, W, H);
      break;
    }
  }
}

function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.25) dt = 0.25;         // tab was backgrounded: clamp the gap

  accumulator += dt;
  let guard = 0;
  while (accumulator >= STEP && guard++ < 5) {
    update(STEP);
    accumulator -= STEP;
  }
  if (guard >= 5) accumulator = 0;  // fell behind badly: drop backlog, don't spiral

  render();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
