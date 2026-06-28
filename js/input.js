// input.js
// Keyboard input as polled state. Held keys (drive) are read every frame;
// one-shot keys (start / restart / menu) are consumed once per press.
// Supports Arrow keys and WASD. Listens on window so no canvas focus is needed.

const down = new Set();                       // physical key codes currently held

// one-shot press flags, set on key-DOWN transition, cleared when consumed
const pressed = { start: false, restart: false, menu: false };

const HELD = {                                // code -> drive action
  ArrowUp: 'up',     KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};
const ONESHOT = { Enter: 'start', KeyR: 'restart', Escape: 'menu' };

window.addEventListener('keydown', (e) => {
  // stop arrows / enter from scrolling or activating page chrome
  if (HELD[e.code] || ONESHOT[e.code]) e.preventDefault();
  if (down.has(e.code)) return;               // ignore OS auto-repeat
  down.add(e.code);
  const one = ONESHOT[e.code];
  if (one) pressed[one] = true;
});

window.addEventListener('keyup', (e) => {
  down.delete(e.code);
});

// If the tab/window loses focus mid-press, the keyup may never arrive —
// clear everything so the car doesn't keep driving on its own.
window.addEventListener('blur', () => {
  down.clear();
});

function any(...codes) { return codes.some((c) => down.has(c)); }

export const Input = {
  get up()    { return any('ArrowUp', 'KeyW'); },
  get down()  { return any('ArrowDown', 'KeyS'); },
  get left()  { return any('ArrowLeft', 'KeyA'); },
  get right() { return any('ArrowRight', 'KeyD'); },

  // returns true once for each physical press of start / restart / menu
  consume(action) {
    if (pressed[action]) { pressed[action] = false; return true; }
    return false;
  },
};