// track.js
// The junkyard oval: two centred rounded-rectangles whose difference (outer
// minus inner hole) is the drivable asphalt band. Owns the on/off-track test
// the car asks each frame, and draws the whole gameplay backdrop.
//
// The inner rounded-rect is DERIVED from the outer one inset by TRACK.WIDTH, so
// "track width" stays a single feel knob (config) instead of two rects to keep
// in sync. Band width is constant because inner.R = outer.R - WIDTH.

import { CONFIG } from './config.js';
import { Assets } from './assets.js';

const T = CONFIG.TRACK;
const OUTER = T.OUTER;
const INNER = {
  X: OUTER.X + T.WIDTH,
  Y: OUTER.Y + T.WIDTH,
  W: OUTER.W - 2 * T.WIDTH,
  H: OUTER.H - 2 * T.WIDTH,
  R: Math.max(0, OUTER.R - T.WIDTH),
};

// Add a rounded-rect as a subpath (no beginPath/fill of its own), so several can
// share one path for an even-odd ring fill.
function addRoundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

// Is a point inside a rounded-rect? Clamp it to the rect's straight "core"
// (the rect shrunk by r on every side); the rounded corners are then governed
// by distance from the point to that clamped point.
function insideRoundedRect(px, py, x, y, w, h, r) {
  const cx = Math.max(x + r, Math.min(px, x + w - r));
  const cy = Math.max(y + r, Math.min(py, y + h - r));
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

// Asphalt fill: a seamless tile (assets/asphalt.png) repeated across the ring,
// built once and cached. Returns null until the tile is loaded, so the caller
// falls back to the flat asphalt colour.
let asphaltPattern = null;
function asphaltFill(ctx) {
  if (!asphaltPattern) {
    const img = Assets.image('asphalt');
    if (img) {
      const p = ctx.createPattern(img, 'repeat');
      if (p) asphaltPattern = p;
    }
  }
  return asphaltPattern;
}

export const Track = {
  // On the asphalt = inside the outer ring AND outside the inner hole.
  isOnTrack(px, py) {
    return insideRoundedRect(px, py, OUTER.X, OUTER.Y, OUTER.W, OUTER.H, OUTER.R)
       && !insideRoundedRect(px, py, INNER.X, INNER.Y, INNER.W, INNER.H, INNER.R);
  },

  draw(ctx, W, H) {
    // ground layer: the stitched junkyard scenery if present, else flat dirt
    const scenery = Assets.image('scenery');
    if (scenery) {
      ctx.drawImage(scenery, 0, 0, W, H);
    } else {
      ctx.fillStyle = T.DIRT;
      ctx.fillRect(0, 0, W, H);
    }

    // asphalt ring (outer minus inner) in one even-odd fill — a seamless tile if
    // loaded, else the flat asphalt colour. Reusing the collision path as the
    // fill region keeps the art aligned to the on/off-track test for free.
    ctx.beginPath();
    addRoundRect(ctx, OUTER.X, OUTER.Y, OUTER.W, OUTER.H, OUTER.R);
    addRoundRect(ctx, INNER.X, INNER.Y, INNER.W, INNER.H, INNER.R);
    ctx.fillStyle = asphaltFill(ctx) || T.ASPHALT;
    ctx.fill('evenodd');

    // edge stripes along both rims so the track reads clearly
    ctx.lineWidth = T.EDGE_WIDTH;
    ctx.strokeStyle = T.EDGE;
    ctx.beginPath(); addRoundRect(ctx, OUTER.X, OUTER.Y, OUTER.W, OUTER.H, OUTER.R); ctx.stroke();
    ctx.beginPath(); addRoundRect(ctx, INNER.X, INNER.Y, INNER.W, INNER.H, INNER.R); ctx.stroke();

    this._drawFinish(ctx);
  },

  // Checkered start/finish strip across the bottom straight.
  _drawFinish(ctx) {
    const F = T.FINISH;
    const top = INNER.Y + INNER.H;      // inner bottom edge = inner rim of the band
    const bottom = OUTER.Y + OUTER.H;    // outer bottom edge = outer rim of the band
    const x0 = F.X - F.WIDTH / 2;
    const cols = Math.round(F.WIDTH / F.SQUARE);
    let row = 0;
    for (let y = top; y < bottom; y += F.SQUARE, row++) {
      const cellH = Math.min(F.SQUARE, bottom - y);   // clip the last partial row to the asphalt
      for (let col = 0; col < cols; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? F.LIGHT : F.DARK;
        ctx.fillRect(x0 + col * F.SQUARE, y, F.SQUARE, cellH);
      }
    }
  },
};