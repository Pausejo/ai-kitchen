// Texturas generadas en canvas offscreen (CanvasTexture), cacheadas.
// Todo el texto del mundo 3D (placas de estación, tarjetas de ticket, tags)
// y las texturas procedurales (baldosas, azulejos, pizarra, humo) salen de aquí.
// Sin assets externos: funciona con doble-clic vía file://.
import { FONT_SERIF, FONT_MONO, CLAUDE_PATH, COMPACT_RATE, SUBAGENT_DEPLOY_CTX } from "../config.js";

const texCache = new Map();

function makeTexture(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  draw(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

export function cachedTexture(key, w, h, draw) {
  let t = texCache.get(key);
  if (!t) {
    t = makeTexture(w, h, draw);
    texCache.set(key, t);
  }
  return t;
}

// Rounded-rect manual (compatible con canvas antiguos y stubs).
function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// ── Texturas procedurales del entorno ──────────────────────────────────────

export function floorTexture() {
  return cachedTexture("floor", 256, 256, (g, w, h) => {
    const tile = 64;
    for (let y = 0; y < h / tile; y++) {
      for (let x = 0; x < w / tile; x++) {
        g.fillStyle = (x + y) % 2 === 0 ? "#F4D9A6" : "#E8B873";
        g.fillRect(x * tile, y * tile, tile, tile);
      }
    }
    // Lechada entre baldosas
    g.strokeStyle = "#D9B97C";
    g.lineWidth = 3;
    for (let i = 0; i <= w / tile; i++) {
      g.beginPath();
      g.moveTo(i * tile, 0);
      g.lineTo(i * tile, h);
      g.stroke();
      g.beginPath();
      g.moveTo(0, i * tile);
      g.lineTo(w, i * tile);
      g.stroke();
    }
    // Moteado sutil
    g.fillStyle = "rgba(0,0,0,0.05)";
    for (let i = 0; i < 90; i++) {
      g.fillRect((i * 73) % w, (i * 131) % h, 2, 2);
    }
  });
}

export function tilesTexture() {
  return cachedTexture("tiles", 256, 128, (g, w, h) => {
    g.fillStyle = "#9BD9B8";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(250,246,238,0.7)";
    g.lineWidth = 2;
    const t = 32;
    for (let i = 0; i <= w / t; i++) {
      g.beginPath();
      g.moveTo(i * t, 0);
      g.lineTo(i * t, h);
      g.stroke();
    }
    for (let i = 0; i <= h / t; i++) {
      g.beginPath();
      g.moveTo(0, i * t);
      g.lineTo(w, i * t);
      g.stroke();
    }
  });
}

export function chalkTexture() {
  return cachedTexture("chalk", 256, 160, (g, w, h) => {
    g.fillStyle = "#2C2620";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(250,246,238,0.85)";
    g.lineWidth = 3;
    // Garabatos de "plan": título + checkboxes + líneas
    g.font = "bold 22px " + FONT_MONO + ", monospace";
    g.fillStyle = "rgba(250,246,238,0.9)";
    g.fillText("PLAN.md", 16, 32);
    g.beginPath();
    g.moveTo(16, 42);
    g.lineTo(150, 42);
    g.stroke();
    for (let i = 0; i < 3; i++) {
      const y = 64 + i * 30;
      g.strokeRect(18, y, 16, 16);
      if (i === 0) {
        g.beginPath();
        g.moveTo(20, y + 8);
        g.lineTo(25, y + 14);
        g.lineTo(34, y + 2);
        g.stroke();
      }
      g.beginPath();
      g.moveTo(46, y + 8);
      g.lineTo(46 + 120 - i * 25, y + 8);
      g.stroke();
    }
  });
}

export function dialTexture() {
  return cachedTexture("dial", 128, 128, (g, w, h) => {
    g.fillStyle = "#FAF6EE";
    g.beginPath();
    g.arc(w / 2, h / 2, w / 2 - 4, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#9B6CD9";
    g.lineWidth = 6;
    g.stroke();
    // Marcas del dial
    g.strokeStyle = "#1A1611";
    g.lineWidth = 3;
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * 0.75 + (i / 6) * Math.PI * 1.5;
      g.beginPath();
      g.moveTo(w / 2 + Math.cos(a) * 42, h / 2 + Math.sin(a) * 42);
      g.lineTo(w / 2 + Math.cos(a) * 52, h / 2 + Math.sin(a) * 52);
      g.stroke();
    }
  });
}

export function smokeTexture() {
  return cachedTexture("smoke", 64, 64, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
    grad.addColorStop(0, "rgba(255,255,255,0.85)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
}

export function logoTexture(color) {
  return cachedTexture("logo:" + color, 128, 128, (g, w) => {
    g.save();
    g.translate(w * 0.08, w * 0.08);
    g.scale((w * 0.84) / 24, (w * 0.84) / 24);
    g.fillStyle = color;
    g.fill(CLAUDE_PATH);
    g.restore();
  });
}

// Tag flotante (J1, J2, α1…): pill con texto bold.
export function tagTexture(text, color) {
  return cachedTexture("tag:" + text + ":" + color, 128, 64, (g, w, h) => {
    rr(g, 14, 8, w - 28, h - 16, 16);
    g.fillStyle = "rgba(26,22,17,0.78)";
    g.fill();
    g.font = "700 30px " + FONT_MONO + ", monospace";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = color;
    g.fillText(text, w / 2, h / 2 + 1);
  });
}

// Texto HUD con contorno (réplica del outlinedText del overlay) para planos
// del mundo 3D: a diferencia del overlay, el depth-test los oculta tras los
// personajes. Cacheado por texto+color y compartido entre estaciones.
function hudTextDims(text, px) {
  return { w: Math.ceil(text.length * px * 0.64 + px), h: Math.ceil(px * 1.9) };
}

// Relación ancho/alto de la textura: dimensiona el plano sin leer tex.image.
export function hudTextAspect(text, px = 36) {
  const { w, h } = hudTextDims(text, px);
  return w / h;
}

export function hudTextTexture(text, color, px = 36) {
  const { w, h } = hudTextDims(text, px);
  return cachedTexture("hud:" + text + ":" + color, w, h, (g) => {
    g.font = "700 " + px + "px " + FONT_MONO + ", monospace";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineJoin = "round";
    g.lineWidth = Math.max(3, px * 0.28);
    g.strokeStyle = "rgba(26,22,17,0.85)";
    g.strokeText(text, w / 2, h / 2);
    g.fillStyle = color;
    g.fillText(text, w / 2, h / 2);
  });
}

// ── Placa de nombre de estación ────────────────────────────────────────────

export function stationSubText(s) {
  if (s.kind === "process") {
    return s.featureOnly
      ? `${s.time.toFixed(1)}s · +${s.contextCost} · FEAT ONLY`
      : `${s.time.toFixed(1)}s · +${s.contextCost} · CAP ${s.capacity}`;
  }
  if (s.kind === "ship") return "NEEDS · CODED";
  if (s.kind === "compact") return "STAND HERE · -" + COMPACT_RATE + "/SEC";
  if (s.kind === "subagent_box") return `+${SUBAGENT_DEPLOY_CTX} CTX · 2× SLOW`;
  return "";
}

export function stationPlateKey(s, accent) {
  return "plate:" + s.id + ":" + s.label + ":" + stationSubText(s) + ":" + accent;
}

export function stationPlateTexture(s, accent) {
  const sub = stationSubText(s);
  return cachedTexture(stationPlateKey(s, accent), 384, 144, (g, w, h) => {
    // Panel pill crema con sombra y banda de acento
    g.fillStyle = "rgba(26,22,17,0.18)";
    rr(g, 10, 14, w - 20, h - 22, 26);
    g.fill();
    g.fillStyle = "#FAF6EE";
    rr(g, 6, 6, w - 12, h - 22, 26);
    g.fill();
    g.strokeStyle = accent;
    g.lineWidth = 6;
    rr(g, 6, 6, w - 12, h - 22, 26);
    g.stroke();
    // Número en círculo de acento
    g.fillStyle = accent;
    g.beginPath();
    g.arc(46, h / 2 - 8, 24, 0, Math.PI * 2);
    g.fill();
    g.font = "700 19px " + FONT_MONO + ", monospace";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = "#FAF6EE";
    g.fillText(s.num, 46, h / 2 - 7);
    // Label
    g.font = "italic 900 " + (s.label.length > 8 ? 32 : 40) + "px " + FONT_SERIF + ", serif";
    g.textAlign = "left";
    g.fillStyle = "#1A1611";
    g.fillText(s.label, 84, h / 2 - (sub ? 18 : 8));
    // Sub-info
    if (sub) {
      g.font = "700 14px " + FONT_MONO + ", monospace";
      g.fillStyle = "#6B6358";
      g.fillText(sub, 84, h / 2 + 22);
    }
  });
}

// ── Tarjeta de ticket (plato + comanda) ────────────────────────────────────

export function ticketStagesKey(t) {
  let k = "";
  for (const st of ["planned", "tested", "coded"]) k += t.stages.has(st) ? "1" : "0";
  return k;
}

export function ticketTextureKey(t) {
  return "ticket:" + t.id + ":" + ticketStagesKey(t);
}

export function ticketCardTexture(t) {
  return cachedTexture(ticketTextureKey(t), 256, 288, (g, w, h) => {
    const typeColor = t.type === "BUG" ? "#E5484D" : "#F2820D";
    // Sombra + tarjeta
    g.fillStyle = "rgba(26,22,17,0.2)";
    rr(g, 12, 14, w - 20, h - 22, 18);
    g.fill();
    g.fillStyle = "#FFF8EC";
    rr(g, 6, 6, w - 16, h - 20, 18);
    g.fill();
    g.strokeStyle = typeColor;
    g.lineWidth = 7;
    rr(g, 6, 6, w - 16, h - 20, 18);
    g.stroke();
    // Banda de tipo
    g.fillStyle = typeColor;
    rr(g, 6, 6, w - 16, 54, 18);
    g.fill();
    g.fillRect(6, 36, w - 16, 24);
    g.font = "700 26px " + FONT_MONO + ", monospace";
    g.textAlign = "left";
    g.textBaseline = "middle";
    g.fillStyle = "#FFF8EC";
    g.fillText(t.type, 22, 35);
    g.font = "700 18px " + FONT_MONO + ", monospace";
    g.textAlign = "right";
    g.fillStyle = "rgba(255,248,236,0.85)";
    g.fillText("#" + String(t.id).padStart(3, "0"), w - 22, 35);
    // Descripción (wrap manual, serif italic)
    g.font = "italic 600 24px " + FONT_SERIF + ", serif";
    g.textAlign = "center";
    g.fillStyle = "#1A1611";
    const maxW = w - 44;
    const words = t.desc.split(" ");
    const lines = [];
    let cur = "";
    for (const word of words) {
      const test = cur ? cur + " " + word : word;
      if (g.measureText(test).width > maxW && cur) {
        lines.push(cur);
        cur = word;
      } else cur = test;
    }
    if (cur) lines.push(cur);
    for (let i = 0; i < Math.min(lines.length, 3); i++) {
      g.fillText(lines[i], w / 2, 95 + i * 28);
    }
    // Sellos de stages
    const stamps = [
      ["PLN", "planned"],
      ["TST", "tested"],
      ["COD", "coded"],
    ];
    g.font = "700 16px " + FONT_MONO + ", monospace";
    for (let i = 0; i < 3; i++) {
      const has = t.stages.has(stamps[i][1]);
      const sx = 24 + i * 72;
      const sy = h - 64;
      rr(g, sx, sy, 62, 32, 8);
      if (has) {
        g.fillStyle = "#3FB68B";
        g.fill();
        g.fillStyle = "#FFF8EC";
      } else {
        g.strokeStyle = "#C4BAA0";
        g.lineWidth = 3;
        g.stroke();
        g.fillStyle = "#C4BAA0";
      }
      g.textAlign = "center";
      g.fillText(stamps[i][0], sx + 31, sy + 17);
    }
  });
}

// Libera las texturas cacheadas de un ticket que ha salido del juego.
export function disposeTicketTextures(id) {
  const prefix = "ticket:" + id + ":";
  for (const [key, tex] of texCache) {
    if (key.startsWith(prefix)) {
      tex.dispose();
      texCache.delete(key);
    }
  }
}

// Cambia la textura de una placa cacheada (p.ej. s.time cambia con la skill MODEL).
export function dropCachedTexture(key) {
  const tex = texCache.get(key);
  if (tex) {
    tex.dispose();
    texCache.delete(key);
  }
}
