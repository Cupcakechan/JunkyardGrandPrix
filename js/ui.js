// ui.js
// All on-screen text/overlay drawing: the menu, the Phase-1 placeholder floor,
// and the in-race HUD. Pure drawing — no game state lives here.

import { CONFIG } from './config.js';

export const UI = {
  drawMenu(ctx, W, H) {
    const { TEXT, DIM, ACCENT, FONT } = CONFIG.HUD;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = ACCENT;
    ctx.font = `bold 46px ${FONT}`;
    ctx.fillText('JUNKYARD GRAND PRIX', W / 2, H / 2 - 70);

    ctx.fillStyle = TEXT;
    ctx.font = `20px ${FONT}`;
    ctx.fillText('Press ENTER to drive', W / 2, H / 2);

    ctx.fillStyle = DIM;
    ctx.font = `14px ${FONT}`;
    ctx.fillText('Arrows / WASD  drive      R  restart      Esc  menu', W / 2, H / 2 + 50);
    ctx.fillText('Cocolito Collective  ·  20 Games Challenge  ·  Game 4', W / 2, H - 28);
  },

  // Temporary motion reference so speed is readable on an empty floor.
  // Replaced by the actual track art in Phase 2.
  drawFloor(ctx, W, H) {
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    const step = 40;
    ctx.beginPath();
    for (let x = step; x < W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = step; y < H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
  },

  drawHud(ctx, W, H, car) {
    const { DIM, ACCENT, FONT } = CONFIG.HUD;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillStyle = DIM;
    ctx.font = `13px ${FONT}`;
    ctx.fillText('Arrows / WASD  drive    R  restart    Esc  menu', 12, 10);

    if (CONFIG.DEBUG.SHOW_SPEED) {
      const spd = Math.round(car.speed);
      ctx.fillStyle = ACCENT;
      ctx.font = `bold 16px ${FONT}`;
      ctx.fillText(`SPEED ${spd} px/s`, 12, 32);

      // little speed bar (fraction of forward max; orange when reversing)
      const frac = Math.min(1, Math.abs(car.speed) / CONFIG.CAR.MAX_SPEED);
      const bw = 160, bh = 8, bx = 12, by = 56;
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = car.speed < 0 ? '#e0723a' : ACCENT;
      ctx.fillRect(bx, by, bw * frac, bh);
    }
  },
};