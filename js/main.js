// main.js
// Entry point: sets up the canvas, the fixed-timestep loop, the tiny state
// machine (MENU <-> PLAYING), wires input, and owns the car.

import { CONFIG } from './config.js';
import { Input } from './input.js';
import { Car } from './car.js';
import { UI } from './ui.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// canvas backing-store size comes from CONFIG (single source of truth)
canvas.width = CONFIG.CANVAS.WIDTH;
canvas.height = CONFIG.CANVAS.HEIGHT;
const W = canvas.width;
const H = canvas.height;

let state = 'MENU';                 // 'MENU' | 'PLAYING'
const car = new Car();

function startRace() {
  car.reset(W / 2, H / 2);          // spawn centre, facing up
  state = 'PLAYING';
}

// --- fixed timestep so the driving feel is identical on any refresh rate ---
const STEP = 1 / 60;                // physics advances in 1/60 s chunks
let accumulator = 0;
let last = performance.now();

function update(dt) {
  if (state === 'MENU') {
    if (Input.consume('start')) startRace();
    return;
  }
  // PLAYING
  if (Input.consume('menu'))    { state = 'MENU'; return; }
  if (Input.consume('restart')) { startRace(); return; }
  car.update(dt, Input, { w: W, h: H });
}

function render() {
  ctx.fillStyle = CONFIG.CANVAS.BG;
  ctx.fillRect(0, 0, W, H);

  if (state === 'MENU') {
    UI.drawMenu(ctx, W, H);
    return;
  }
  UI.drawFloor(ctx, W, H);          // placeholder floor (Phase 1)
  car.draw(ctx);
  UI.drawHud(ctx, W, H, car);
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