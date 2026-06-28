// assets.js
// Central image loader for Phase 4 art. Each image loads by id from
// assets/<id>.png (filename matches id, lowercase — itch is case-sensitive).
// A consumer asks for an image and only gets it back once it has actually
// decoded; until then — or if the file is missing — it gets null and draws its
// placeholder instead. Nothing here throws on a missing asset: a failed load
// just stays "not ready" forever, so the game degrades to placeholders, never
// crashes. (Add more lines to load() as track/menu art arrives.)

const images = new Map();   // id -> { img, ready }

function loadImage(id) {
  const entry = { img: new Image(), ready: false };
  entry.img.onload = () => { entry.ready = true; };
  entry.img.onerror = () => { /* missing/failed: stay not-ready, fall back to placeholder */ };
  entry.img.src = `assets/${id}.png`;
  images.set(id, entry);
}

export const Assets = {
  // Kick off loading. Call once at startup.
  load() {
    loadImage('car');
  },

  // The decoded image for id, or null if it isn't ready (missing, failed, or
  // still loading) — callers draw their placeholder when this returns null.
  image(id) {
    const e = images.get(id);
    return e && e.ready ? e.img : null;
  },
};
