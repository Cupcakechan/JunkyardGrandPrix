// ui.js
// In-race overlay drawing: the HUD and the win screen. (The menu/title screens
// live in menu.js now.) Pure drawing — no game state lives here.

import { CONFIG } from './config.js';

// mm:ss.cs — the race clock, shared by the HUD and the win screen.
function formatTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const cs = Math.floor((t * 100) % 100);
  return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export const UI = {
  drawHud(ctx, W, H, car, onTrack, race) {
    const { TEXT, DIM, ACCENT, HINT, FONT } = CONFIG.HUD;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillStyle = HINT;
    ctx.font = `13px ${FONT}`;
    ctx.fillText('Arrows / WASD  drive    R  restart    Esc  menu    M  mute', 12, 10);

    // lap counter + race clock, top-right
    ctx.textAlign = 'right';
    ctx.fillStyle = ACCENT;
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillText(`LAP ${race.lap}/${race.laps}`, W - 12, 10);
    ctx.fillStyle = TEXT;
    ctx.font = `16px ${FONT}`;
    ctx.fillText(formatTime(race.time), W - 12, 36);
    ctx.textAlign = 'left';

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

  // Win overlay, drawn over the frozen race frame.
  drawWin(ctx, W, H, race) {
    const { TEXT, DIM, ACCENT, FONT } = CONFIG.HUD;

    ctx.fillStyle = 'rgba(10, 8, 6, 0.72)';   // dim the scene behind the result
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = ACCENT;
    ctx.font = `bold 52px ${FONT}`;
    ctx.fillText('YOU WIN!', W / 2, H / 2 - 60);

    ctx.fillStyle = TEXT;
    ctx.font = `24px ${FONT}`;
    ctx.fillText(`Time  ${formatTime(race.time)}`, W / 2, H / 2);

    ctx.fillStyle = DIM;
    ctx.font = `16px ${FONT}`;
    ctx.fillText(`${race.laps} laps · Junkyard Grand Prix`, W / 2, H / 2 + 34);
    ctx.fillText('ENTER / R  race again      Esc  menu', W / 2, H / 2 + 64);
  },

  // Crash & Score HUD: score + countdown (clock turns orange when low).
  drawCrashHud(ctx, W, H, score, timeLeft) {
    const { ACCENT, HINT, FONT } = CONFIG.HUD;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = HINT;
    ctx.font = `13px ${FONT}`;
    ctx.fillText('Arrows / WASD  drive    R  restart    Esc  menu    M  mute', 12, 10);

    ctx.fillStyle = ACCENT;
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillText('SCORE ' + score, 12, 32);

    const secs = Math.ceil(timeLeft);
    ctx.textAlign = 'right';
    ctx.fillStyle = secs <= 10 ? '#e0723a' : ACCENT;
    ctx.fillText('TIME ' + secs, W - 12, 10);
    ctx.textAlign = 'left';
  },

  // Crash & Score result overlay.
  drawCrashResult(ctx, W, H, score) {
    const { TEXT, DIM, ACCENT, FONT } = CONFIG.HUD;
    ctx.fillStyle = 'rgba(10, 8, 6, 0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ACCENT;
    ctx.font = `bold 52px ${FONT}`;
    ctx.fillText("TIME'S UP!", W / 2, H / 2 - 60);
    ctx.fillStyle = TEXT;
    ctx.font = `28px ${FONT}`;
    ctx.fillText('SCORE  ' + score, W / 2, H / 2);
    ctx.fillStyle = DIM;
    ctx.font = `16px ${FONT}`;
    ctx.fillText('ENTER / R  play again      Esc  menu', W / 2, H / 2 + 50);
  },
};
