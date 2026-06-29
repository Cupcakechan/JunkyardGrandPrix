// track.js
// The drivable track as DATA (Phase 5, Route 1): a centerline polyline + width,
// plus the per-track spawn, finish line, and checkpoint line. One source drives
// everything — on-track = distance(car, centerline) <= width/2, the road is the
// same centerline stroked with the asphalt pattern, and laps come from crossing
// the finish/checkpoint line segments (see race.js).
//
// The current track is the original oval, reproduced as a finely-sampled rounded-
// rect centerline (mid-band rect: OUTER inset by WIDTH/2, radius 100). Its spawn /
// finish / checkpoint are sourced from CONFIG.TRACK so config stays the tunable
// source; future shapes define their own.

import { CONFIG } from './config.js';
import { Assets } from './assets.js';

const T = CONFIG.TRACK;
const OUTER = T.OUTER;

// Oval centerline: the rounded-rect down the middle of the band. Straights fall
// out as single segments; each 90° corner is sampled into short chords.
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

// Package the oval as a track: centerline + width + spawn + finish/checkpoint
// lines. Finish is a segment across the bottom band crossed moving +X (lap dir);
// checkpoint is a segment across the top band that arms the lap.
function buildOvalTrack() {
  const S = CONFIG.TRACK.START;
  const fx = CONFIG.TRACK.FINISH.X;
  const bandBottomInner = OUTER.Y + OUTER.H - T.WIDTH;  // 420
  const bandBottomOuter = OUTER.Y + OUTER.H;            // 540
  const bandTopOuter = OUTER.Y;                         // 60
  const bandTopInner = OUTER.Y + T.WIDTH;               // 180
  return {
    name: 'oval',
    centerline: buildOvalCenterline(),
    width: T.WIDTH,
    spawn: { x: S.X, y: S.Y, heading: S.HEADING },
    finish: {
      a: { x: fx, y: bandBottomInner },
      b: { x: fx, y: bandBottomOuter },
      forward: { x: 1, y: 0 },          // a valid lap crosses moving +X
    },
    checkpoint: {
      a: { x: fx, y: bandTopOuter },
      b: { x: fx, y: bandTopInner },
    },
  };
}

// Derive a finish/checkpoint line + spawn from a centerline index: a segment
// perpendicular to the local direction, spanning a bit past the track rims.
function lineAt(centerline, i, width) {
  const n = centerline.length;
  const P = centerline[i];
  const prev = centerline[(i - 1 + n) % n], next = centerline[(i + 1) % n];
  let dx = next.x - prev.x, dy = next.y - prev.y;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;                     // unit tangent (the lap direction here)
  const nx = -dy, ny = dx;                  // unit normal (across the track)
  const h = width / 2 + 2;
  return {
    point: P,
    dir: { x: dx, y: dy },
    a: { x: P.x - nx * h, y: P.y - ny * h },
    b: { x: P.x + nx * h, y: P.y + ny * h },
  };
}

// A Gerono lemniscate figure-8, centered, crossing itself in the middle. Gentle
// tips (radius = a) and a ~perpendicular center crossing, so width 120 fits.
function buildFigure8Centerline() {
  const cx = 400, cy = 300, a = 260, N = 120;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const t = (i / N) * 2 * Math.PI;
    pts.push({ x: cx + a * Math.cos(t), y: cy + (a / 2) * Math.sin(2 * t) });
  }
  return pts;
}

function buildFigure8Track() {
  const centerline = buildFigure8Centerline();
  const width = T.WIDTH;
  const n = centerline.length;
  const fin = lineAt(centerline, 15, width);              // a clear strand on one loop
  const cp = lineAt(centerline, (15 + n / 2) % n, width); // halfway round = the far loop
  return {
    name: 'figure8',
    centerline,
    width,
    spawn: { x: fin.point.x, y: fin.point.y, heading: Math.atan2(fin.dir.x, -fin.dir.y) },
    finish: { a: fin.a, b: fin.b, forward: fin.dir },
    checkpoint: { a: cp.a, b: cp.b },
  };
}

// track registry — the dev key cycles these; a real selector arrives in Phase 6
const TRACKS = [buildOvalTrack(), buildFigure8Track()];
let trackIndex = 0;
let current = TRACKS[trackIndex];

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
  get current() { return current; },   // active track data (read by race.js / main.js)

  // dev: cycle to the next track shape (Phase 6 replaces this with a real selector)
  cycle() {
    trackIndex = (trackIndex + 1) % TRACKS.length;
    current = TRACKS[trackIndex];
    return current;
  },

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

  // checkered start/finish strip, drawn along the track's finish-line segment
  // (centered on the line, F.WIDTH thick) — works for any orientation.
  _drawFinish(ctx) {
    const F = T.FINISH;
    const { a, b } = current.finish;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const sq = F.SQUARE;
    const rows = Math.round(len / sq);
    const cols = Math.max(1, Math.round(F.WIDTH / sq));
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(ang);
    for (let r = 0; r < rows; r++) {
      const cellW = Math.min(sq, len - r * sq);
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? F.LIGHT : F.DARK;
        ctx.fillRect(r * sq, -F.WIDTH / 2 + c * sq, cellW, sq);
      }
    }
    ctx.restore();
  },
};
