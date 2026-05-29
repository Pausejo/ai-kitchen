// Flashes flotantes de feedback (texto que sube y se desvanece).
// Mutadores de estado puros, sin dependencias: módulo hoja.

export function flash(state, x, y, text, color) {
  state.flashes.push({ x, y, text, color, life: 1.0 });
}

export function updateFlashes(state, dt) {
  for (let i = state.flashes.length - 1; i >= 0; i--) {
    const f = state.flashes[i];
    f.life -= dt * 1.3;
    f.y -= dt * 30;
    if (f.life <= 0) state.flashes.splice(i, 1);
  }
}
