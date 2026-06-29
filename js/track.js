// track.js
// The drivable track as DATA (Phase 5, Route 1): a centerline polyline + a width.
// One source drives everything — on-track = distance(car, centerline) <= width/2,
// and the road is drawn by stroking that same centerline with the asphalt pattern,
// so what you see is exactly where you can drive.
//
// The current track is the original oval, reproduced as a finely-sampled rounded-
// rect centerline (the mid-band rect: OUTER inset by WIDTH/2, corner radius 100).
// Stroked at width 120 it yields the same outer R160 / inner R40 band as before,
// and distance <= 60 reproduces the old analytic on/off-track test within ~0.2 px.

import { CONFIG } from './config.js';
import { Assets } from './assets.js';

const T = CONFIG.TRACK;
const OUTER = T.OUTER;

// Build the oval centerline: the rounded-rect down the middle of the band.
// Straights fall out as single segments between corners; each 90° corner is
// sampled into short chords (sub-pixel deviation from a true arc).
function buildOvalCenterline() {
  const X = OUTER.X + T.WIDTH / 2;
  const Y = OUTER.Y + T.WIDTH / 2;
  const W = OUTER.W - T.WIDTH;
  const H = OUTER.H - T.WIDTH;
  const R = OUTER.R - T.WIDTH / 2;
  const SEG = 12;                       // chords per corner
  const corners = [
    { cx: X + W - R, cy: Y + R,     a0: -Math.PI / 2 }, // top-right
    { cx: X + W - R, cy: Y + H - R, a0: 0 },            // bottom-right
    { cx: X + R,     cy: Y + H - R, a0: Math.PI / 2 },  // bottom-left
    { cx: X + R,     cy: Y + R,     a0: Math.PI },      // top-left
  ];
  const pts = [];
  for (const c of corners) {
    for (let i = 0; i <= SEG; i++) {
      const a = c.a0 + (Math.PI / 2) * (i / SEG);
      pts.push({ x: c.cx + R * Math.cos(a), y: c.cy + R * Math.sin(a) });
    }
  }
  return pts;
}

// the active track (just the oval for now; a registry of shapes comes next step)
const current = { centerline: buildOvalCenterline(), width: T.WIDTH };

// --- point-to-polyline distance (centerline is a closed loop) ---
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const ex = px - (ax + t * dx), ey = py - (ay + t * dy);
  return Math.sqrt(ex * ex + ey * ey);
}
function distToCenterline(px, py) {
  const pts = current.centerline, n = pts.length;
  let min = Infinity;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];   // wrap to close the loop
    const d = distToSegment(px, py, a.x, a.y, b.x, b.y);
    if (d < min) min = d;
  }
  return min;
}

// asphalt fill: seamless tile if loaded, else null (caller falls back to a colour)
let asphaltPattern = null;
function asphaltFill(ctx) {
  if (!asphaltPattern) {
    const img = Assets.image('asphalt');
    if (img) { const p = ctx.createPattern(img, 'repeat'); if (p) asphaltPattern = p; }
  }
  return asphaltPattern;
}

export const Track = {
  // on the asphalt = within half the track width of the centerline
  isOnTrack(px, py) {
    return distToCenterline(px, py) <= current.width / 2;
  },

  draw(ctx, W, H) {
    // ground layer: stitched scenery if present, else flat dirt
    const scenery = Assets.image('scenery');
    if (scenery) ctx.drawImage(scenery, 0, 0, W, H);
    else { ctx.fillStyle = T.DIRT; ctx.fillRect(0, 0, W, H); }

    // trace the centerline once; stroke it twice — a wider edge-colour pass leaves
    // an edge stripe along both rims, the asphalt pattern goes on top.
    const pts = current.centerline;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.lineWidth = current.width + 2 * T.EDGE_WIDTH;
    ctx.strokeStyle = T.EDGE;
    ctx.stroke();

    ctx.lineWidth = current.width;
    ctx.strokeStyle = asphaltFill(ctx) || T.ASPHALT;
    ctx.stroke();

    this._drawFinish(ctx);
  },

  // checkered start/finish strip across the bottom straight (still config-driven;
  // moves into per-track data in the next step)
  _drawFinish(ctx) {
    const F = T.FINISH;
    const top = OUTER.Y + OUTER.H - T.WIDTH;   // inner rim of the bottom band
    const bottom = OUTER.Y + OUTER.H;          // outer rim
    const x0 = F.X - F.WIDTH / 2;
    const cols = Math.round(F.WIDTH / F.SQUARE);
    let row = 0;
    for (let y = top; y < bottom; y += F.SQUARE, row++) {
      const cellH = Math.min(F.SQUARE, bottom - y);   // clip the last partial row
      for (let col = 0; col < cols; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? F.LIGHT : F.DARK;
        ctx.fillRect(x0 + col * F.SQUARE, y, F.SQUARE, cellH);
      }
    }
  },
};
