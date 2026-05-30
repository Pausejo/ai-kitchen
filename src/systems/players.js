// Movimiento de jugadores, colisiones y trail.
import { W, PLAYER_SPEED } from "../config.js";
import { speedMultiplier } from "../skills.js";
import { getInputDirFor } from "../input.js";

export function updatePlayers(state, input, dt) {
  const speedMult = speedMultiplier(state.skills);
  for (const p of state.players) {
    const dir = getInputDirFor(p, input);
    p.vx = dir.x * PLAYER_SPEED * speedMult;
    p.vy = dir.y * PLAYER_SPEED * speedMult;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    // Track running animation
    p.isMoving = Math.abs(p.vx) + Math.abs(p.vy) > 1;
    if (p.isMoving) {
      p.stepPhase += dt * 15;
      // Update facing direction (normalized)
      const len = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1;
      p.faceX = p.vx / len;
      p.faceY = p.vy / len;
    }
    // Clamp to play area
    const padX = 30;
    const playTop = 230,
      playBot = 720;
    p.x = Math.max(padX, Math.min(W - padX, p.x));
    p.y = Math.max(playTop + 30, Math.min(playBot - 30, p.y));
    // Resolve station collisions (push-out)
    for (const s of state.stations) {
      const left = s.x - s.w / 2,
        right = s.x + s.w / 2;
      const top = s.y - s.h / 2,
        bot = s.y + s.h / 2;
      const closestX = Math.max(left, Math.min(p.x, right));
      const closestY = Math.max(top, Math.min(p.y, bot));
      const dx = p.x - closestX;
      const dy = p.y - closestY;
      const d2 = dx * dx + dy * dy;
      if (d2 < p.r * p.r) {
        const d = Math.sqrt(d2) || 0.001;
        const push = p.r - d;
        p.x += (dx / d) * push;
        p.y += (dy / d) * push;
      }
    }
    // Trail
    p.trail.push({ x: p.x, y: p.y, a: 1 });
    if (p.trail.length > 14) p.trail.shift();
    for (const t of p.trail) t.a *= 0.88;
  }
  // Player-vs-player collision (push apart)
  if (state.players.length === 2) {
    const a = state.players[0],
      b = state.players[1];
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const d2 = dx * dx + dy * dy;
    const minD = a.r + b.r;
    if (d2 < minD * minD && d2 > 0.0001) {
      const d = Math.sqrt(d2);
      const push = (minD - d) / 2;
      const nx = dx / d,
        ny = dy / d;
      a.x -= nx * push;
      a.y -= ny * push;
      b.x += nx * push;
      b.y += ny * push;
    }
  }
}
