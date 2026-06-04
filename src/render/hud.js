// HUD cartoon sobre la cocina 3D: banner, pills de stats y pie con keycaps.
// Mantiene los mismos textos y umbrales que el HUD editorial original.
import { W, H, FONT_SERIF, FONT_MONO, GAME_TIME, CONTEXT_MAX, formatTime } from "../config.js";
import { drawText, drawPanel, ctx, UI } from "../canvas2d.js";


export function drawHeader() {
  // Banner-pill central con el título
  const bw = 380;
  drawPanel(W / 2 - bw / 2, 10, bw, 58, { r: 18, fill: UI.cream, stroke: UI.ink, lw: 2.5, shadow: 3 });
  drawText("AI KITCHEN", W / 2, 49, {
    font: FONT_SERIF,
    size: 34,
    weight: 900,
    italic: true,
    align: "center",
    color: UI.ink,
  });
  // Nº de edición a la izquierda y fecha a la derecha
  drawPanel(40, 16, 64, 44, { r: 14, fill: UI.ink, shadow: 2 });
  drawText("Nº 01", 72, 44, { font: FONT_MONO, size: 12, weight: 700, color: UI.cream, align: "center" });
  const dateText = new Date()
    .toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })
    .toUpperCase();
  drawText(dateText, W - 44, 42, { font: FONT_MONO, size: 9, color: UI.muted, align: "right", letterSpacing: 1.2 });
}

export function drawStatsBar(state) {
  const y = 80;
  const hPill = 58;
  const stats = [
    {
      x: 40,
      w: 170,
      label: "TIEMPO",
      value: formatTime(state.timeLeft),
      sub: `/ ${formatTime(GAME_TIME)}`,
      font: FONT_MONO,
      weight: 700,
      italic: false,
      valColor: state.timeLeft <= 15 ? UI.red : UI.ink,
      border: state.timeLeft <= 15 ? UI.red : UI.ink,
    },
    {
      x: 224,
      w: 220,
      label: "H. AHORRADAS",
      value: String(state.score).padStart(3, "0") + "h",
      sub: `BEST ${String(state.bestScore).padStart(3, "0")}`,
      font: FONT_SERIF,
      weight: 900,
      italic: true,
      valColor: UI.accent,
      border: UI.ink,
    },
    {
      x: 458,
      w: 330,
      label: "CONTEXTO",
      value: String(Math.floor(state.context)).padStart(3, "0") + "%",
      sub:
        state.context >= CONTEXT_MAX
          ? "BLOCKED · GO COMPACT"
          : state.context >= 80
            ? "PROCESS · SLOW"
            : state.context >= 60
              ? "WARNING"
              : "STABLE",
      font: FONT_MONO,
      weight: 700,
      italic: false,
      isContext: true,
      valColor: state.context >= CONTEXT_MAX ? UI.red : state.context >= 80 ? UI.warn : UI.ink,
      border: state.context >= CONTEXT_MAX ? UI.red : state.context >= 80 ? UI.warn : UI.ink,
    },
    {
      x: 802,
      w: 220,
      label: "PR ENVIADAS",
      value: String(state.shipped).padStart(2, "0"),
      sub: `${state.perfectFeatures} W/ TDD`,
      font: FONT_SERIF,
      weight: 900,
      italic: true,
      valColor: UI.ok,
      border: UI.ink,
    },
    {
      x: 1036,
      w: 204,
      label: "EXPIRADAS",
      value: String(state.expired).padStart(2, "0"),
      sub: "USER ANGRY",
      font: FONT_SERIF,
      weight: 900,
      italic: true,
      valColor: state.expired > 0 ? UI.red : UI.ink,
      border: UI.ink,
    },
  ];

  for (const stat of stats) {
    drawPanel(stat.x, y, stat.w, hPill, { r: 16, fill: UI.cream, stroke: stat.border, lw: 2.5, shadow: 3 });
    drawText(stat.label, stat.x + 14, y + 17, {
      font: FONT_MONO,
      size: 8,
      color: UI.muted,
      letterSpacing: 1.6,
      weight: 700,
    });
    drawText(stat.value, stat.x + 14, y + 44, {
      font: stat.font,
      size: 26,
      weight: stat.weight,
      italic: stat.italic,
      color: stat.valColor,
    });
    drawText(stat.sub, stat.x + stat.w - 14, y + 17, {
      font: FONT_MONO,
      size: 8,
      color: stat.isContext ? stat.valColor : UI.muted,
      letterSpacing: 1,
      align: "right",
      weight: stat.isContext && state.context >= 60 ? 700 : 400,
    });
    if (stat.isContext) {
      // Barra de contexto redondeada con marcas en 60 y 80
      const bx = stat.x + 118,
        by = y + 30,
        bw = stat.w - 134,
        bh = 14;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, bh / 2);
      ctx.fillStyle = "rgba(26,22,17,0.12)";
      ctx.fill();
      ctx.strokeStyle = UI.ink;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const pct = Math.min(1, state.context / CONTEXT_MAX);
      if (pct > 0.03) {
        ctx.beginPath();
        ctx.roundRect(bx + 2, by + 2, (bw - 4) * pct, bh - 4, (bh - 4) / 2);
        ctx.fillStyle = state.context >= CONTEXT_MAX ? UI.red : state.context >= 80 ? UI.warn : UI.ok;
        ctx.fill();
      }
      for (const mark of [0.6, 0.8]) {
        ctx.beginPath();
        ctx.moveTo(bx + bw * mark, by - 2);
        ctx.lineTo(bx + bw * mark, by + bh + 2);
        ctx.strokeStyle = UI.ink;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

// Keycap estilo tecla física.
export function drawKeycap(x, y, label, color = UI.ink) {
  const w = Math.max(24, 12 + label.length * 8);
  drawPanel(x, y, w, 24, { r: 6, fill: UI.cream, stroke: color, lw: 2, shadow: 2 });
  drawText(label, x + w / 2, y + 16, {
    font: FONT_MONO,
    size: 11,
    weight: 700,
    color,
    align: "center",
  });
  return w;
}

function carryText(p, compact) {
  const t = p.holding;
  if (!t) return { text: "— vacío —", color: UI.muted };
  const flags = [];
  if (t.stages.has("planned")) flags.push(compact ? "P" : "planned");
  if (t.stages.has("tested")) flags.push(compact ? "T" : "tested");
  if (t.stages.has("coded")) flags.push(compact ? "C" : "coded");
  const tail = flags.length ? (compact ? " [" + flags.join("") + "]" : " · " + flags.join(", ")) : "";
  return { text: `${t.type} #${String(t.id).padStart(3, "0")} · ${t.desc}${tail}`, color: UI.ink };
}

export function drawFooter(state) {
  const y = H - 56;
  if (state.players.length === 1) {
    const p = state.players[0];
    // Panel "LLEVANDO" a la izquierda
    drawPanel(40, y, 560, 44, { r: 14, fill: UI.cream, stroke: p.cfg.color, lw: 2.5, shadow: 3 });
    drawText("LLEVANDO", 56, y + 17, { font: FONT_MONO, size: 8, color: UI.muted, letterSpacing: 1.6, weight: 700 });
    const c = carryText(p, false);
    drawText(c.text, 56, y + 33, { font: FONT_SERIF, size: 14, italic: true, color: c.color });
    // Keycaps a la derecha
    let kx = 760;
    for (const [keys, label] of [
      [["W", "A", "S", "D"], "MOVER"],
      [["F"], "USAR"],
      [["Q"], "TIRAR"],
    ]) {
      for (const k of keys) kx += drawKeycap(kx, y + 10, k, p.cfg.color) + 4;
      drawText(label, kx + 2, y + 27, { font: FONT_MONO, size: 9, color: UI.muted, letterSpacing: 1 });
      kx += label.length * 7 + 26;
    }
  } else {
    for (let i = 0; i < 2; i++) {
      const p = state.players[i];
      const baseX = i === 0 ? 40 : W / 2 + 16;
      const w = W / 2 - 56;
      drawPanel(baseX, y, w, 44, { r: 14, fill: UI.cream, stroke: p.cfg.color, lw: 2.5, shadow: 3 });
      drawText(p.cfg.label, baseX + 14, y + 28, {
        font: FONT_MONO,
        size: 12,
        weight: 700,
        color: p.cfg.color,
        letterSpacing: 1.4,
      });
      const c = carryText(p, true);
      drawText(c.text, baseX + 52, y + 28, { font: FONT_SERIF, size: 13, italic: true, color: c.color });
    }
  }
}
