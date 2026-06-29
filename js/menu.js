// menu.js
// The menu-side screens: Main Menu (the five buttons) plus the simple How To
// Play and Coming Soon screens. Each exposes update(input) and draw(ctx); the
// router in main.js owns transitions. Pure UI — no game state lives here.
//
// Buttons are data-driven: each item names a sprite id (assets/btn_<id>.png, with
// an optional _hover). If a sprite isn't loaded yet it falls back to a flat
// labelled rectangle, so the menu is fully usable before the art lands.

import { CONFIG } from './config.js';
import { Assets } from './assets.js';
import { MODES } from './modes.js';

const W = CONFIG.CANVAS.WIDTH;
const H = CONFIG.CANVAS.HEIGHT;

const BTN_W = 260;          // uniform on-screen button width; height follows each sprite's aspect
const BTN_H_FALLBACK = 60;  // height used until a sprite is loaded
const GAP = 18;             // vertical space between buttons
const TOP = 150;            // y where the button stack begins (below the title)

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// One menu button. Sprite if loaded; when selected the hover sprite is drawn at
// the SAME scale and center as the normal one, so its glow blooms around the same
// body instead of jumping size. No sprite → a flat labelled rect (accent when
// selected); sprite but no hover art → the normal sprite with an accent outline.
function drawButton(ctx, r, id, label, selected) {
  const normal = Assets.image('btn_' + id);
  const hover = Assets.image('btn_' + id + '_hover');
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;

  if (normal) {
    const scale = r.w / normal.width;          // lock width, keep aspect
    if (selected && hover) {
      const hw = hover.width * scale, hh = hover.height * scale;
      ctx.drawImage(hover, cx - hw / 2, cy - hh / 2, hw, hh);
    } else {
      const nw = normal.width * scale, nh = normal.height * scale;
      ctx.drawImage(normal, cx - nw / 2, cy - nh / 2, nw, nh);
      if (selected) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = CONFIG.HUD.ACCENT;
        ctx.strokeRect(cx - nw / 2 - 2, cy - nh / 2 - 2, nw + 4, nh + 4);
      }
    }
  } else {
    ctx.fillStyle = selected ? '#3a352c' : '#241f19';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.lineWidth = 2;
    ctx.strokeStyle = selected ? CONFIG.HUD.ACCENT : CONFIG.HUD.DIM;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = CONFIG.HUD.TEXT;
    ctx.font = `bold 22px ${CONFIG.HUD.FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy);
  }
}

function drawBackground(ctx) {
  const bg = Assets.image('background');
  if (bg) ctx.drawImage(bg, 0, 0, W, H);   // else the dark fill from main.js shows through
}

// title card if present (scaled to fit a top band so it never crowds the buttons),
// else the text title as a fallback
function drawTitle(ctx) {
  const img = Assets.image('title');
  if (img) {
    const scale = Math.min(620 / img.width, 120 / img.height, 1);
    const w = img.width * scale, h = img.height * scale;
    ctx.drawImage(img, (W - w) / 2, 78 - h / 2, w, h);
  } else {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = CONFIG.HUD.ACCENT;
    ctx.font = `bold 40px ${CONFIG.HUD.FONT}`;
    ctx.fillText('JUNKYARD GRAND PRIX', W / 2, 78);
  }
}

export const MainMenu = {
  items: [
    { id: 'start',      label: 'START',       target: 'gameMode' },
    { id: 'howtoplay',  label: 'HOW TO PLAY', target: 'howToPlay' },
    { id: 'highscores', label: 'HIGHSCORES',  target: 'comingSoon' },
    { id: 'shop',       label: 'SHOP',        target: 'comingSoon' },
    { id: 'settings',   label: 'SETTINGS',    target: 'comingSoon' },
  ],
  index: 0,
  _lastMX: -1,
  _lastMY: -1,

  // per-frame button rects, derived from each sprite's aspect (fallback height
  // until it loads). Centered horizontally, stacked from TOP.
  layout() {
    const rects = [];
    let y = TOP;
    for (const it of this.items) {
      const img = Assets.image('btn_' + it.id);
      const h = img ? Math.round(BTN_W * img.height / img.width) : BTN_H_FALLBACK;
      rects.push({ x: Math.round((W - BTN_W) / 2), y, w: BTN_W, h });
      y += h + GAP;
    }
    return rects;
  },

  // returns the activated item, or null
  update(input) {
    const rects = this.layout();
    const n = this.items.length;

    // mouse moved over a button selects it (so hover + keyboard agree)
    const moved = input.mouseX !== this._lastMX || input.mouseY !== this._lastMY;
    this._lastMX = input.mouseX;
    this._lastMY = input.mouseY;
    if (moved) {
      for (let i = 0; i < n; i++) if (inRect(input.mouseX, input.mouseY, rects[i])) this.index = i;
    }

    if (input.consume('navUp'))   this.index = (this.index - 1 + n) % n;
    if (input.consume('navDown')) this.index = (this.index + 1) % n;

    if (input.consume('confirm')) return this.items[this.index];
    if (input.consume('click')) {
      for (let i = 0; i < n; i++) {
        if (inRect(input.mouseX, input.mouseY, rects[i])) { this.index = i; return this.items[i]; }
      }
    }
    return null;
  },

  draw(ctx) {
    drawBackground(ctx);
    drawTitle(ctx);
    const rects = this.layout();
    for (let i = 0; i < this.items.length; i++) {
      drawButton(ctx, rects[i], this.items[i].id, this.items[i].label, i === this.index);
    }
    ctx.fillStyle = CONFIG.HUD.DIM;
    ctx.font = `13px ${CONFIG.HUD.FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Up / Down or mouse to select  ·  Enter or click to choose', W / 2, H - 28);
  },
};

export const HowToPlay = {
  // returns true when the player wants out
  update(input) {
    return input.consume('back') || input.consume('click');
  },
  draw(ctx) {
    drawBackground(ctx);
    const { TEXT, DIM, ACCENT, FONT } = CONFIG.HUD;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = ACCENT;
    ctx.font = `bold 34px ${FONT}`;
    ctx.fillText('HOW TO PLAY', W / 2, 56);

    const lines = [
      'Drive with the Arrow keys or WASD.',
      'One pedal: hold to accelerate, tap back to brake & reverse.',
      'Stay on the asphalt — the dirt bogs you down to a crawl.',
      '',
      'Cross the start line each lap going forward; you must pass',
      'the far checkpoint first, so every lap counts honestly.',
      'Finish 3 laps to win. The clock starts when you hit the gas.',
      'Press M anytime to mute the music.',
      '',
      'Coming soon: Standard Race & Crash & Score modes.',
    ];
    ctx.fillStyle = TEXT;
    ctx.font = `16px ${FONT}`;
    let y = 130;
    for (const ln of lines) { ctx.fillText(ln, W / 2, y); y += 26; }

    ctx.fillStyle = DIM;
    ctx.font = `14px ${FONT}`;
    ctx.fillText('Esc or click — back', W / 2, H - 42);
  },
};

export const ComingSoon = {
  label: '',
  enter(label) { this.label = label || 'This'; },
  update(input) {
    return input.consume('back') || input.consume('click');
  },
  draw(ctx) {
    drawBackground(ctx);
    const { TEXT, DIM, ACCENT, FONT } = CONFIG.HUD;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ACCENT;
    ctx.font = `bold 40px ${FONT}`;
    ctx.fillText(this.label, W / 2, H / 2 - 28);
    ctx.fillStyle = TEXT;
    ctx.font = `20px ${FONT}`;
    ctx.fillText('Coming soon', W / 2, H / 2 + 18);
    ctx.fillStyle = DIM;
    ctx.font = `14px ${FONT}`;
    ctx.fillText('Esc or click — back', W / 2, H - 42);
  },
};

// Game Mode select (Phase 6). Lists the mode registry; available modes start a
// race, unavailable ones show "Coming soon". main.js handles Esc (back).
export const GameMode = {
  items: MODES.map((m) => ({ id: m.id, label: m.label, available: m.available })),
  index: 0,
  _lastMX: -1,
  _lastMY: -1,

  layout() {
    const rects = [];
    let y = 210;
    for (let i = 0; i < this.items.length; i++) {
      rects.push({ x: Math.round((W - BTN_W) / 2), y, w: BTN_W, h: BTN_H_FALLBACK });
      y += BTN_H_FALLBACK + GAP;
    }
    return rects;
  },

  update(input) {
    const rects = this.layout();
    const n = this.items.length;
    const moved = input.mouseX !== this._lastMX || input.mouseY !== this._lastMY;
    this._lastMX = input.mouseX;
    this._lastMY = input.mouseY;
    if (moved) {
      for (let i = 0; i < n; i++) if (inRect(input.mouseX, input.mouseY, rects[i])) this.index = i;
    }
    if (input.consume('navUp'))   this.index = (this.index - 1 + n) % n;
    if (input.consume('navDown')) this.index = (this.index + 1) % n;
    if (input.consume('confirm')) return this.items[this.index];
    if (input.consume('click')) {
      for (let i = 0; i < n; i++) {
        if (inRect(input.mouseX, input.mouseY, rects[i])) { this.index = i; return this.items[i]; }
      }
    }
    return null;
  },

  draw(ctx) {
    drawBackground(ctx);
    const { DIM, ACCENT, FONT } = CONFIG.HUD;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ACCENT;
    ctx.font = `bold 34px ${FONT}`;
    ctx.fillText('SELECT MODE', W / 2, 120);

    const rects = this.layout();
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      drawButton(ctx, rects[i], it.id, it.label, i === this.index);
      if (!it.available) {                      // dim + tag the not-yet-built modes
        const r = rects[i];
        ctx.fillStyle = 'rgba(10, 8, 6, 0.55)';
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.fillStyle = ACCENT;
        ctx.font = `bold 13px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('COMING SOON', r.x + r.w / 2, r.y + r.h / 2);
      }
    }

    ctx.fillStyle = DIM;
    ctx.font = `13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Up / Down or mouse to select  ·  Enter / click to start  ·  Esc back', W / 2, H - 28);
  },
};
