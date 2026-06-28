// car.js
// The player car and its arcade driving model. This is the heart of Phase 1.
//
// Heading convention: heading = 0 points UP the screen (-Y), and a POSITIVE
// heading rotates clockwise (to the right) — which matches Canvas's positive
// rotation and matches "press right -> nose turns right". Forward direction is
// therefore (sin heading, -cos heading).

import { CONFIG } from './config.js';

export class Car {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.heading = 0;   // radians; 0 = facing up
    this.speed = 0;     // px/s along heading; + forward, - reverse
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.heading = 0;
    this.speed = 0;
  }

  update(dt, input, bounds) {
    const C = CONFIG.CAR;

    // --- throttle / brake / coast (one key brakes then reverses) ---
    if (input.up) {
      this.speed += C.ACCEL * dt;
    } else if (input.down) {
      this.speed -= C.BRAKE_ACCEL * dt;       // decelerate through 0 into reverse
    } else {
      // no input: rolling friction eases speed toward 0 (this is the "momentum")
      const drop = C.COAST_DECEL * dt;
      if (this.speed > 0) this.speed = Math.max(0, this.speed - drop);
      else if (this.speed < 0) this.speed = Math.min(0, this.speed + drop);
    }

    // clamp to forward / reverse top speeds
    if (this.speed > C.MAX_SPEED) this.speed = C.MAX_SPEED;
    if (this.speed < -C.MAX_REVERSE_SPEED) this.speed = -C.MAX_REVERSE_SPEED;

    // --- steering: only while moving, authority grows with speed ---
    const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (steer !== 0 && this.speed !== 0) {
      const factor = Math.min(1, Math.abs(this.speed) / C.STEER_FULL_SPEED);
      this.heading += steer * C.TURN_RATE * factor * dt;
    }

    // --- integrate position along heading ---
    const fx = Math.sin(this.heading);
    const fy = -Math.cos(this.heading);
    this.x += fx * this.speed * dt;
    this.y += fy * this.speed * dt;

    // TEMPORARY: keep the car on screen during feel-testing. This is a crude
    // edge clamp, NOT the real track collision — that arrives in Phase 2.
    const r = C.SIZE / 2;
    let hitWall = false;
    if (this.x < r)            { this.x = r;            hitWall = true; }
    if (this.x > bounds.w - r) { this.x = bounds.w - r; hitWall = true; }
    if (this.y < r)            { this.y = r;            hitWall = true; }
    if (this.y > bounds.h - r) { this.y = bounds.h - r; hitWall = true; }
    if (hitWall) this.speed = 0; // drop stored speed so we don't fling off the wall
  }

  draw(ctx) {
    const C = CONFIG.CAR;
    const s = C.SIZE;
    const r = s / 2;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading);                 // 0 = up; +heading = clockwise

    ctx.fillStyle = C.COLOR_BODY;
    ctx.fillRect(-r, -r, s, s);

    ctx.lineWidth = 2;
    ctx.strokeStyle = C.COLOR_OUTLINE;
    ctx.strokeRect(-r, -r, s, s);

    // bright strip along the FRONT edge (top in local space) = facing indicator
    ctx.fillStyle = C.COLOR_NOSE;
    ctx.fillRect(-r + 5, -r + 3, s - 10, 7);

    ctx.restore();
  }
}