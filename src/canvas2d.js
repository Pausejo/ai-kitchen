// Primitivos de dibujo 2D y el contexto del canvas (singleton del DOM).
import { COL, W, H, FONT_MONO, FONT_SERIF } from "./config.js";

export const canvas = document.getElementById("game");
export const ctx = canvas.getContext("2d");

// Paleta cartoon del HUD/overlay (compartida por hud, screens y overlay 3D).
export const UI = {
  cream: "#FFF8EC",
  ink: "#1A1611",
  accent: "#D97757",
  red: "#E5484D",
  warn: "#F2B70D",
  ok: "#3FB68B",
  muted: "#6B6358",
};

export function clear() {
  ctx.fillStyle = COL.paper;
  ctx.fillRect(0, 0, W, H);
  // Subtle paper texture
  ctx.save();
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = COL.ink;
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
  }
  ctx.restore();
}

export function drawText(text, x, y, opts = {}) {
  const {
    font = FONT_MONO,
    size = 12,
    weight = 400,
    color = COL.ink,
    align = "left",
    baseline = "alphabetic",
    italic = false,
    letterSpacing = 0,
    tracking = 0,
  } = opts;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.font = `${italic ? "italic " : ""}${weight} ${size}px ${font}, serif`;
  if (letterSpacing) {
    // Manual letter spacing
    const chars = text.split("");
    const w = chars.map((c) => ctx.measureText(c).width);
    const total = w.reduce((a, b) => a + b, 0) + (chars.length - 1) * letterSpacing;
    let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], cx, y);
      cx += w[i] + letterSpacing;
    }
  } else {
    ctx.fillText(text, x, y);
  }
}

export function drawLine(x1, y1, x2, y2, color = COL.ink, w = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function drawRect(x, y, w, h, opts = {}) {
  const { fill, stroke, lw = 1 } = opts;
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.strokeRect(x, y, w, h);
  }
}

// Panel redondeado estilo cartoon: relleno + borde + sombra opcional.
export function drawPanel(x, y, w, h, opts = {}) {
  const { r = 12, fill = "#FFF8EC", stroke, lw = 2, shadow = 0 } = opts;
  ctx.save();
  if (shadow) {
    ctx.beginPath();
    ctx.roundRect(x + shadow, y + shadow + 1, w, h, r);
    ctx.fillStyle = "rgba(26,22,17,0.18)";
    ctx.fill();
  }
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
  ctx.restore();
}

export function wrapText(text, x, y, maxW, lh, opts) {
  ctx.font = `${opts.italic ? "italic " : ""}${opts.weight || 400} ${opts.size}px ${opts.font || FONT_SERIF}, serif`;
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  for (let i = 0; i < lines.length; i++) {
    drawText(lines[i], x, y + i * lh, opts);
  }
}
