// ui.js
// All on-screen text/overlay drawing: the menu and the in-race HUD.
// Pure drawing — no game state lives here. (The Phase-1 placeholder floor is
// gone now that track.js draws the real track.)

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

  drawHud(ctx, W, H, car, onTrack) {
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

      // surface readout so the on/off-track test is visible while testing
      ctx.font = `13px ${FONT}`;
      ctx.fillStyle = onTrack ? DIM : '#e0723a';
      ctx.fillText(onTrack ? 'on track' : 'OFF TRACK — slow', 12, 72);
    }
  },
};