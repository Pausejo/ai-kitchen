// Input desacoplado del estado del juego. El listener solo registra teclas;
// main interpreta las pulsaciones por fase, una vez por frame.
const GAME_KEYS = ["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "/"];

export function createInput() {
  const input = {
    keys: {}, // teclas mantenidas (para movimiento, polling)
    pressedThisFrame: [], // teclas pulsadas desde el último consume()
  };

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (GAME_KEYS.includes(k)) e.preventDefault();
    input.keys[k] = true;
    input.pressedThisFrame.push(k); // incluye auto-repeat del SO (equivale al keydown repetido original)
  });
  window.addEventListener("keyup", (e) => {
    input.keys[e.key.toLowerCase()] = false;
  });

  return input;
}

// Devuelve y vacía las pulsaciones acumuladas en el frame.
export function consumePresses(input) {
  const pressed = input.pressedThisFrame;
  input.pressedThisFrame = [];
  return pressed;
}

export function getInputDirFor(player, input) {
  const c = player.cfg.controls;
  let x = 0,
    y = 0;
  if (input.keys[c.left]) x -= 1;
  if (input.keys[c.right]) x += 1;
  if (input.keys[c.up]) y -= 1;
  if (input.keys[c.down]) y += 1;
  if (x && y) {
    x *= 0.7071;
    y *= 0.7071;
  }
  return { x, y };
}
