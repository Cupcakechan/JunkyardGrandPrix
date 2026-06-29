// input.js
// Keyboard + mouse input as polled state. Held keys (drive) are read every frame;
// one-shot keys (start/restart/menu and menu-nav) are consumed once per press.
// Mouse position is tracked in CANVAS space (mapped through the CSS scale) and a
// click is a one-shot. Listens on window (keys) + the canvas (mouse).

const down = new Set();                       // physical key codes currently held

// one-shot press flags, set on key-DOWN transition, cleared when consumed
const pressed = {
  start: false, restart: false, menu: false, mute: false,  // gameplay one-shots
  confirm: false, back: false,                 // menu activate / back
  navUp: false, navDown: false,                // menu selection move
  click: false,                                // left mouse pressed
};

const HELD = {                                // code -> drive action
  ArrowUp: 'up',     KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};
const ONESHOT = { Enter: 'start', KeyR: 'restart', Escape: 'menu', KeyM: 'mute' };
// menu one-shots; codes deliberately overlap the drive keys (Up/W, Down/S) and
// the gameplay one-shots (Enter, Escape) — both flags fire, each screen consumes
// only the ones it cares about, and transitions clear the rest.
const NAV = {
  ArrowUp: 'navUp', KeyW: 'navUp',
  ArrowDown: 'navDown', KeyS: 'navDown',
  Enter: 'confirm', Escape: 'back',
};

let mouseX = 0, mouseY = 0;

window.addEventListener('keydown', (e) => {
  if (HELD[e.code] || ONESHOT[e.code]) e.preventDefault();
  if (down.has(e.code)) return;               // ignore OS auto-repeat
  down.add(e.code);
  if (ONESHOT[e.code]) pressed[ONESHOT[e.code]] = true;
  if (NAV[e.code])     pressed[NAV[e.code]]     = true;
});

window.addEventListener('keyup', (e) => { down.delete(e.code); });

// If the tab/window loses focus mid-press, the keyup may never arrive —
// clear everything so the car doesn't keep driving on its own.
window.addEventListener('blur', () => { down.clear(); });

function any(...codes) { return codes.some((c) => down.has(c)); }

export const Input = {
  // Attach mouse listeners to the canvas. Coords are mapped from client space
  // into the 800x600 backing store, so hit-testing works regardless of CSS scale.
  init(canvas) {
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouseX = (e.clientX - r.left) * (canvas.width / r.width);
      mouseY = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) pressed.click = true;
    });
  },

  get up()    { return any('ArrowUp', 'KeyW'); },
  get down()  { return any('ArrowDown', 'KeyS'); },
  get left()  { return any('ArrowLeft', 'KeyA'); },
  get right() { return any('ArrowRight', 'KeyD'); },

  get mouseX() { return mouseX; },
  get mouseY() { return mouseY; },

  // returns true once for each physical press of the named one-shot
  consume(action) {
    if (pressed[action]) { pressed[action] = false; return true; }
    return false;
  },

  // drop any pending one-shots — called on screen transitions so a press from
  // one screen doesn't leak into the next (e.g. a held drive key into the menu)
  clearOneShots() {
    for (const k in pressed) pressed[k] = false;
  },
};
