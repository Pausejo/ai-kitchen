// Capa 2D nítida sobre el WebGL durante la partida: flashes de texto
// proyectados desde el mundo 3D, contadores de cola, estados de subagente,
// presión del inbox y la viñeta de contexto alto. Todo lee el estado y
// proyecta posiciones con la cámara orto (fija → proyección estable).
import { W, H, CONTEXT_MAX, FONT_MONO, FONT_SERIF } from "../config.js";
import { ctx } from "../canvas2d.js";
import { getThree } from "./scene.js";
import { worldToOverlay, pxToWorldX, pxToWorldZ } from "./project.js";

const INK = "#1A1611";
const CREAM = "#FAF6EE";
const RED = "#E5484D";
const WARN = "#F2B70D";
const OK = "#3FB68B";
const MUTED = "#6B6358";
const ACCENT = "#D97757";

// Proyecta un punto 2D del estado (px) a coords del overlay, a altura wy.
function project(px, py, wy) {
  const { camera } = getThree();
  return worldToOverlay(camera, pxToWorldX(px), wy, pxToWorldZ(py));
}

// Texto cartoon con contorno para legibilidad sobre la escena.
function outlinedText(text, x, y, { size = 15, color = CREAM, font = FONT_MONO, weight = 700, align = "center", alpha = 1, italic = false } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${italic ? "italic " : ""}${weight} ${size}px ${font}, monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(3, size * 0.28);
  ctx.strokeStyle = "rgba(26,22,17,0.85)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawPlayingOverlay(state) {
  drawStationOverlays(state);
  drawFlashesProjected(state);
  drawContextVignette(state);
}

// Barra de progreso redondeada estilo cartoon.
function progressBar(x, y, w, h, pct, color) {
  ctx.save();
  const r = h / 2;
  ctx.beginPath();
  ctx.roundRect(x - w / 2 - 2, y - h / 2 - 2, w + 4, h + 4, r + 2);
  ctx.fillStyle = "rgba(26,22,17,0.82)";
  ctx.fill();
  if (pct > 0.02) {
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w * Math.min(1, pct), h, r);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.restore();
}

function drawStationOverlays(state) {
  for (const s of state.stations) {
    if (s.kind === "process" && s.queue.length > 0) {
      const front = s.queue[0];
      const done = front.progress >= 1;
      // Barra de progreso flotante sobre el mueble
      const b = project(s.x, s.y, 2.55);
      progressBar(b.x, b.y, 86, 9, done ? 1 : front.progress, done ? OK : ACCENT);
      // Contador de cola N/CAP junto a la barra
      const full = s.queue.length >= s.capacity;
      outlinedText(`${s.queue.length}/${s.capacity}`, b.x + 62, b.y, {
        size: 12,
        color: full ? RED : s.queue.length >= 2 ? WARN : CREAM,
        align: "left",
      });
      // READY encima cuando está listo
      if (done) {
        outlinedText("READY · PICK UP", b.x, b.y - 17, { size: 12, color: OK });
      }
    }

    if (s.kind === "subagent_box") {
      const sa = state.subagents[s.subagentIdx];
      let text = "IDLE · DROP TICKET";
      let color = MUTED;
      if (sa) {
        if (sa.state === "toStation" && sa.target) {
          text = "→ " + sa.target.label;
          color = CREAM;
        } else if (sa.state === "waiting") {
          text = "WAITING · QUEUE FULL";
          color = WARN;
        } else if (sa.state === "working") {
          text = "PROCESSING…";
          color = CREAM;
        } else if (sa.state === "toShip") {
          text = "→ SHIP PR";
          color = ACCENT;
        } else if (sa.state === "returning") {
          text = "RETURNING";
          color = MUTED;
        }
      }
      const p = project(s.x, s.y + s.h / 2 + 10, 0.0);
      outlinedText(text, p.x, p.y, { size: 11, color });
    }

    if (s.kind === "inbox") {
      // Overflow de la cola visible (+N) y aviso de presión
      if (state.inbox.length > 4) {
        const o = project(s.x - s.w / 2 - 14, s.y, 1.9);
        outlinedText("+" + (state.inbox.length - 4), o.x, o.y, {
          size: 26,
          font: FONT_SERIF,
          weight: 900,
          italic: true,
          color: state.inbox.length >= 5 ? RED : ACCENT,
        });
      }
      if (state.inbox.length >= 3) {
        const angry = state.inbox.length >= 5;
        const a = project(s.x, s.y - s.h / 2, 4.6);
        outlinedText(angry ? "!! ANGRY USERS !!" : "USERS WAITING", a.x, a.y, {
          size: 14,
          color: angry ? RED : WARN,
        });
      }
    }
  }
}

function drawFlashesProjected(state) {
  for (const f of state.flashes) {
    const p = project(f.x, f.y, 2.5);
    outlinedText(f.text, p.x, p.y, {
      size: 15,
      color: f.color,
      alpha: Math.max(0, Math.min(1, f.life)),
    });
  }
}

function drawContextVignette(state) {
  if (state.context < 60) return;
  const blocked = state.context >= CONTEXT_MAX;
  const hot = state.context >= 80;
  const t = performance.now() / 1000;
  const pulse = (Math.sin(t * (blocked ? 8 : 5)) + 1) / 2;
  ctx.save();
  ctx.globalAlpha = blocked ? 0.3 + pulse * 0.25 : hot ? 0.2 + pulse * 0.16 : 0.1 + pulse * 0.1;
  ctx.strokeStyle = blocked || hot ? RED : WARN;
  ctx.lineWidth = 26;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.restore();
}
