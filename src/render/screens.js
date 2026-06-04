// Pantallas completas estilo cartoon sobre la cocina 3D (lavado translúcido):
// overlay de tutorial, menú, shop y game over.
import { W, H, TAU, FONT_SERIF, FONT_MONO, SKILL_DEFS, PLAYER_CONFIGS } from "../config.js";
import { drawText, drawPanel, drawLine, wrapText, ctx, UI } from "../canvas2d.js";
import { drawKeycap } from "./hud.js";


// Lavado cálido translúcido: deja ver la cocina 3D de fondo.
function wash(alpha = 0.88) {
  ctx.save();
  ctx.fillStyle = `rgba(252, 242, 222, ${alpha})`;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

export function drawLearningOverlay(state, hint) {
  if ((!state.learningPhase && !state.subagentLearningPhase) || !hint) return;
  // Bocadillo de tutorial en la zona inferior central
  const w = 380,
    h = 64;
  const x = W / 2 - w / 2,
    y = H - 136;
  drawPanel(x, y, w, h, { r: 16, fill: UI.cream, stroke: UI.accent, lw: 2.5, shadow: 3 });
  const header = state.subagentLearningPhase ? "TUTORIAL · SUBAGENTES" : "TUTORIAL · LO BÁSICO";
  drawText(header, x + 16, y + 19, {
    font: FONT_MONO,
    size: 8,
    color: UI.accent,
    letterSpacing: 1.8,
    weight: 700,
  });
  // Texto del hint con wrap
  ctx.font = `italic 600 14px ${FONT_SERIF}, serif`;
  const maxW = w - 32;
  const words = hint.text.split(" ");
  const lines = [];
  let cur = "";
  for (const word of words) {
    const test = cur ? cur + " " + word : word;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = word;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  for (let i = 0; i < lines.length; i++) {
    drawText(lines[i], x + 16, y + 38 + i * 17, {
      font: FONT_SERIF,
      size: 13,
      italic: true,
      weight: 600,
      color: UI.ink,
    });
  }
}

export function drawMenu(state) {
  wash(0.84);
  ctx.save();

  drawText("UN JUEGO DE PABLO AUSEJO", W - 100, 80, {
    font: FONT_MONO,
    size: 10,
    weight: 500,
    color: UI.muted,
    letterSpacing: 2,
    align: "right",
  });

  // Título gigante
  drawText("AI", W / 2, 230, {
    font: FONT_SERIF,
    size: 160,
    weight: 900,
    italic: true,
    align: "center",
    color: UI.ink,
  });
  drawText("KITCHEN", W / 2, 350, {
    font: FONT_SERIF,
    size: 160,
    weight: 900,
    align: "center",
    color: UI.accent,
  });
  drawText("— CLAUDE CODE x OVERCOOKED —", W / 2, 385, {
    font: FONT_MONO,
    size: 11,
    color: UI.muted,
    align: "center",
    letterSpacing: 3,
  });

  // Selector de modo: dos botones-pill grandes
  drawText("§ MODO", W / 2, 448, {
    font: FONT_MONO,
    size: 10,
    color: UI.muted,
    letterSpacing: 2,
    weight: 700,
    align: "center",
  });
  const modes = [
    { n: 1, label: "1 JUGADOR", x: W / 2 - 160 },
    { n: 2, label: "2 JUGADORES", x: W / 2 + 160 },
  ];
  for (const m of modes) {
    const selected = state.menuPlayers === m.n;
    const y = 470;
    if (selected) {
      drawPanel(m.x - 135, y, 270, 56, { r: 18, fill: UI.accent, stroke: UI.ink, lw: 2.5, shadow: 4 });
      drawText(m.label, m.x, y + 36, {
        font: FONT_SERIF,
        size: 22,
        weight: 900,
        italic: true,
        color: UI.cream,
        align: "center",
        letterSpacing: 1,
      });
    } else {
      drawPanel(m.x - 135, y, 270, 56, { r: 18, fill: UI.cream, stroke: UI.muted, lw: 1.5 });
      drawText(m.label, m.x, y + 36, {
        font: FONT_SERIF,
        size: 22,
        weight: 400,
        italic: true,
        color: UI.muted,
        align: "center",
        letterSpacing: 1,
      });
    }
    drawText("PULSA " + m.n, m.x, y + 74, {
      font: FONT_MONO,
      size: 9,
      color: selected ? UI.accent : UI.muted,
      align: "center",
      letterSpacing: 2,
      weight: selected ? 700 : 400,
    });
  }

  // Controles con keycaps — J1 (y J2 si procede) o puntos
  drawText("§ CONTROLES — J1", 170, 610, {
    font: FONT_MONO,
    size: 10,
    color: PLAYER_CONFIGS[0].color,
    letterSpacing: 2,
    weight: 700,
  });
  const c1 = [
    [["W", "A", "S", "D"], "mover"],
    [["F"], "interactuar / coger / dejar"],
    [["Q"], "descartar ticket (-8 pts)"],
  ];
  for (let i = 0; i < c1.length; i++) {
    let kx = 170;
    for (const k of c1[i][0]) kx += drawKeycap(kx, 624 + i * 32, k, UI.ink) + 4;
    drawText(c1[i][1], 300, 641 + i * 32, { font: FONT_SERIF, size: 14, italic: true, color: UI.muted });
  }

  if (state.menuPlayers === 2) {
    drawText("§ CONTROLES — J2", 670, 610, {
      font: FONT_MONO,
      size: 10,
      color: PLAYER_CONFIGS[1].color,
      letterSpacing: 2,
      weight: 700,
    });
    const c2 = [
      [["↑", "↓", "←", "→"], "mover"],
      [["/"], "interactuar / coger / dejar"],
      [["."], "descartar ticket (-8 pts)"],
    ];
    for (let i = 0; i < c2.length; i++) {
      let kx = 670;
      for (const k of c2[i][0]) kx += drawKeycap(kx, 624 + i * 32, k, UI.ink) + 4;
      drawText(c2[i][1], 800, 641 + i * 32, { font: FONT_SERIF, size: 14, italic: true, color: UI.muted });
    }
  } else {
    drawText("§ PUNTOS", 670, 610, {
      font: FONT_MONO,
      size: 10,
      color: UI.muted,
      letterSpacing: 2,
      weight: 700,
    });
    drawText("BUG · 10", 670, 642, { font: FONT_SERIF, size: 14, italic: true });
    drawText("FEATURE · 12", 670, 666, { font: FONT_SERIF, size: 14, italic: true });
    drawText("FEATURE + TDD · 25", 670, 690, { font: FONT_SERIF, size: 14, italic: true, color: UI.accent });
  }

  // CTA pulsante
  const pulse = (Math.sin(state.elapsed * 3) + 1) / 2;
  ctx.globalAlpha = 0.6 + pulse * 0.4;
  drawPanel(W / 2 - 250, 726, 500, 40, { r: 20, fill: UI.ink, shadow: 3 });
  drawText("▸  SPACE · EMPEZAR        S · STUDIO  ◂", W / 2, 751, {
    font: FONT_MONO,
    size: 13,
    weight: 700,
    color: UI.cream,
    align: "center",
    letterSpacing: 2.5,
  });
  ctx.globalAlpha = 1;

  // Estado del studio si hay skills compradas
  const sk = state.skills;
  const anySkills = sk.SPEED + sk.MODEL + sk.SUBAGENT > 0 || (sk.hours || 0) > 0;
  if (anySkills) {
    const parts = [];
    if (sk.SPEED > 0) parts.push(`SPD ${sk.SPEED}/${SKILL_DEFS.SPEED.maxLevel}`);
    if (sk.MODEL > 0) parts.push(`MDL ${sk.MODEL}/${SKILL_DEFS.MODEL.maxLevel}`);
    if (sk.SUBAGENT > 0) parts.push(`SUB ${sk.SUBAGENT}/${SKILL_DEFS.SUBAGENT.maxLevel}`);
    if (sk.CONTEXT > 0) parts.push(`CTX ${sk.CONTEXT}/${SKILL_DEFS.CONTEXT.maxLevel}`);
    if (sk.AUTOCOMPACT > 0) parts.push(`A-CPT ${sk.AUTOCOMPACT}/${SKILL_DEFS.AUTOCOMPACT.maxLevel}`);
    parts.push(`${sk.hours || 0}h`);
    drawText("FORMACIÓN · " + parts.join("  ·  "), W / 2, 788, {
      font: FONT_MONO,
      size: 10,
      color: UI.accent,
      align: "center",
      letterSpacing: 2,
      weight: 700,
    });
  } else {
    drawText("© CLAUDE & CO.", 100, 788, {
      font: FONT_MONO,
      size: 9,
      color: UI.muted,
      letterSpacing: 1.5,
    });
    drawText("AUTO-AGENT PRESS", W - 100, 788, {
      font: FONT_MONO,
      size: 9,
      color: UI.muted,
      letterSpacing: 1.5,
      align: "right",
    });
  }

  ctx.restore();
  state.elapsed += 1 / 60;
}

export function drawShop(state) {
  wash(0.9);
  const skills = state.skills;

  drawText("STUDIO UPGRADES", 100, 80, {
    font: FONT_MONO,
    size: 10,
    weight: 500,
    color: UI.muted,
    letterSpacing: 2.5,
  });
  drawText("META · PROGRESSION", W - 100, 80, {
    font: FONT_MONO,
    size: 10,
    weight: 500,
    color: UI.muted,
    letterSpacing: 2,
    align: "right",
  });

  // Título
  drawText("FORMACIÓN", W / 2, 165, {
    font: FONT_SERIF,
    size: 92,
    weight: 900,
    italic: true,
    align: "center",
    color: UI.ink,
  });
  drawText("— invierte tus horas en habilidades —", W / 2, 196, {
    font: FONT_MONO,
    size: 10,
    color: UI.muted,
    align: "center",
    letterSpacing: 2.5,
  });

  // Horas disponibles en panel oscuro
  const hours = skills.hours || 0;
  drawPanel(W / 2 - 190, 222, 380, 66, { r: 20, fill: UI.ink, shadow: 4 });
  drawText("HORAS DISPONIBLES", W / 2, 246, {
    font: FONT_MONO,
    size: 9,
    color: "#C9C2B4",
    align: "center",
    letterSpacing: 2.5,
    weight: 500,
  });
  drawText(String(hours).padStart(4, "0") + "h", W / 2, 278, {
    font: FONT_SERIF,
    size: 32,
    weight: 900,
    italic: true,
    color: UI.cream,
    align: "center",
  });

  // Cards de skills en rejilla de 3 columnas
  const skillKeys = ["SPEED", "MODEL", "SUBAGENT", "CONTEXT", "AUTOCOMPACT"];
  const cols = 3;
  const cardW = 360,
    cardH = 188,
    gapX = 24,
    gapY = 18;
  const totalW = cardW * cols + gapX * (cols - 1);
  const startX = (W - totalW) / 2;
  const startY = 312;

  for (let i = 0; i < skillKeys.length; i++) {
    const key = skillKeys[i];
    const def = SKILL_DEFS[key];
    const level = skills[key];
    const maxed = level >= def.maxLevel;
    const nextCost = maxed ? null : def.costs[level];
    const canAfford = !maxed && hours >= nextCost;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardW + gapX);
    const cardY = startY + row * (cardH + gapY);

    drawPanel(x, cardY, cardW, cardH, {
      r: 18,
      fill: UI.cream,
      stroke: canAfford ? UI.accent : "#C4BAA0",
      lw: canAfford ? 3 : 1.5,
      shadow: 3,
    });

    // Hotkey + nombre corto
    drawText("[" + (i + 1) + "]", x + 18, cardY + 28, {
      font: FONT_MONO,
      size: 12,
      weight: 700,
      color: UI.accent,
      letterSpacing: 1,
    });
    drawText(def.short, x + cardW - 18, cardY + 28, {
      font: FONT_MONO,
      size: 10,
      weight: 500,
      color: UI.muted,
      letterSpacing: 2,
      align: "right",
    });

    // Label + descripción
    drawText(def.label, x + 22, cardY + 68, {
      font: FONT_SERIF,
      size: 24,
      weight: 900,
      italic: true,
      color: UI.ink,
    });
    wrapText(def.desc, x + 22, cardY + 90, cardW - 170, 14, {
      font: FONT_SERIF,
      size: 11,
      italic: true,
      color: UI.muted,
      align: "left",
    });

    // Dots de nivel
    const dotsY = cardY + cardH - 40;
    for (let j = 0; j < def.maxLevel; j++) {
      const dx = x + 26 + j * 17;
      ctx.beginPath();
      ctx.arc(dx, dotsY, 5, 0, TAU);
      if (j < level) {
        ctx.fillStyle = UI.accent;
        ctx.fill();
      } else {
        ctx.strokeStyle = "#C4BAA0";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    const nivelText = `NIVEL ${level}/${def.maxLevel}` + (level > 0 ? "  ·  " + def.effectText(level) : "");
    drawText(nivelText, x + 22, cardY + cardH - 16, {
      font: FONT_MONO,
      size: 8,
      color: level > 0 ? UI.ok : UI.muted,
      letterSpacing: 1,
      weight: 500,
    });

    // Botón de coste a la derecha
    const btnX = x + cardW - 140,
      btnY = cardY + 44,
      btnW = 122,
      btnH = 100;
    drawPanel(btnX, btnY, btnW, btnH, {
      r: 14,
      fill: maxed ? "rgba(26,22,17,0.05)" : canAfford ? UI.accent : "rgba(26,22,17,0.05)",
      stroke: maxed ? "#C4BAA0" : canAfford ? UI.ink : "#C4BAA0",
      lw: 1.5,
      shadow: canAfford ? 2 : 0,
    });
    if (maxed) {
      drawText("MAX", btnX + btnW / 2, btnY + 50, {
        font: FONT_SERIF,
        size: 26,
        weight: 900,
        italic: true,
        color: UI.muted,
        align: "center",
      });
      drawText("LEVEL", btnX + btnW / 2, btnY + 74, {
        font: FONT_MONO,
        size: 9,
        color: UI.muted,
        align: "center",
        letterSpacing: 2,
      });
    } else {
      const buyColor = canAfford ? UI.cream : UI.muted;
      drawText("SIGUIENTE", btnX + btnW / 2, btnY + 22, {
        font: FONT_MONO,
        size: 8,
        color: buyColor,
        align: "center",
        letterSpacing: 2,
      });
      drawText(nextCost + "h", btnX + btnW / 2, btnY + 56, {
        font: FONT_SERIF,
        size: 28,
        weight: 900,
        italic: true,
        color: buyColor,
        align: "center",
      });
      drawText("pulsa [" + (i + 1) + "]", btnX + btnW / 2, btnY + 82, {
        font: FONT_MONO,
        size: 9,
        color: buyColor,
        align: "center",
        letterSpacing: 1.5,
        weight: 700,
      });
    }
  }

  // Controles del pie
  const pulse = (Math.sin(state.elapsed * 3) + 1) / 2;
  ctx.globalAlpha = 0.6 + pulse * 0.4;
  drawText("SPACE · VOLVER AL MENÚ          R · RESET PROGRESO", W / 2, 758, {
    font: FONT_MONO,
    size: 12,
    weight: 700,
    color: UI.ink,
    align: "center",
    letterSpacing: 2.5,
  });
  ctx.globalAlpha = 1;

  // Confirmación de reset
  if (state.shopResetConfirm) {
    ctx.fillStyle = "rgba(26, 22, 17, 0.82)";
    ctx.fillRect(0, 0, W, H);
    drawPanel(W / 2 - 290, H / 2 - 90, 580, 180, { r: 22, fill: UI.cream, stroke: UI.red, lw: 3, shadow: 5 });
    drawText("¿RESETEAR PROGRESO?", W / 2, H / 2 - 30, {
      font: FONT_SERIF,
      size: 28,
      weight: 900,
      italic: true,
      color: UI.red,
      align: "center",
    });
    drawText("Perderás todas las horas y habilidades. Esto no se puede deshacer.", W / 2, H / 2 + 5, {
      font: FONT_SERIF,
      size: 13,
      italic: true,
      color: UI.ink,
      align: "center",
    });
    drawText("Y · CONFIRMAR        N · CANCELAR", W / 2, H / 2 + 50, {
      font: FONT_MONO,
      size: 12,
      weight: 700,
      color: UI.ink,
      align: "center",
      letterSpacing: 2.5,
    });
  }

  state.elapsed += 1 / 60;
}

export function drawGameOver(state) {
  wash(0.84);
  drawText("— END OF SHIFT —", W / 2, 96, {
    font: FONT_MONO,
    size: 12,
    color: UI.muted,
    align: "center",
    letterSpacing: 4,
  });

  drawText("PR", W / 2 - 330, 270, {
    font: FONT_SERIF,
    size: 140,
    weight: 900,
    italic: true,
    align: "center",
    color: UI.ink,
  });
  drawText("MERGED", W / 2 + 90, 270, {
    font: FONT_SERIF,
    size: 140,
    weight: 900,
    align: "center",
    color: UI.accent,
  });

  // Panel central de puntuación
  drawPanel(W / 2 - 300, 312, 600, 270, { r: 24, fill: UI.cream, stroke: UI.ink, lw: 2.5, shadow: 5 });
  drawText("H. AHORRADAS", W / 2, 348, {
    font: FONT_MONO,
    size: 10,
    color: UI.muted,
    align: "center",
    letterSpacing: 3,
    weight: 500,
  });
  drawText(String(state.score).padStart(3, "0"), W / 2, 422, {
    font: FONT_SERIF,
    size: 80,
    weight: 900,
    italic: true,
    align: "center",
    color: UI.ink,
  });

  const earned = state.earnedHours || 0;
  const totalHours = state.skills.hours || 0;
  drawLine(W / 2 - 260, 448, W / 2 + 260, 448, "#C4BAA0", 1);
  drawText("+" + String(earned).padStart(3, "0") + "h", W / 2, 502, {
    font: FONT_SERIF,
    size: 44,
    weight: 900,
    italic: true,
    color: UI.accent,
    align: "center",
  });
  drawText("« horas ganadas con IA »", W / 2, 528, {
    font: FONT_SERIF,
    size: 13,
    italic: true,
    color: UI.muted,
    align: "center",
  });
  drawText("TOTAL · " + totalHours + "h disponibles", W / 2, 556, {
    font: FONT_MONO,
    size: 10,
    color: UI.ink,
    align: "center",
    letterSpacing: 2,
    weight: 700,
  });

  // Pills de stats
  const stats = [
    ["PR ENVIADAS", String(state.shipped).padStart(2, "0"), UI.ok],
    ["CON TDD", String(state.perfectFeatures).padStart(2, "0"), UI.accent],
    ["EXPIRADAS", String(state.expired).padStart(2, "0"), state.expired > 0 ? UI.red : UI.ink],
  ];
  for (let i = 0; i < stats.length; i++) {
    const x = W / 2 - 310 + i * 220;
    drawPanel(x, 608, 200, 64, { r: 16, fill: UI.cream, stroke: UI.ink, lw: 2, shadow: 3 });
    drawText(stats[i][0], x + 100, 630, {
      font: FONT_MONO,
      size: 9,
      color: UI.muted,
      align: "center",
      letterSpacing: 2,
    });
    drawText(stats[i][1], x + 100, 660, {
      font: FONT_SERIF,
      size: 30,
      weight: 900,
      italic: true,
      color: stats[i][2],
      align: "center",
    });
  }

  // CTAs
  const pulse = (Math.sin(state.elapsed * 4) + 1) / 2;
  ctx.globalAlpha = 0.7 + pulse * 0.3;
  drawText("S · INVERTIR HORAS EN EL STUDIO", W / 2 - 220, 716, {
    font: FONT_MONO,
    size: 12,
    weight: 700,
    color: UI.accent,
    align: "center",
    letterSpacing: 2.5,
  });
  drawText("SPACE · NUEVA PARTIDA", W / 2 + 220, 716, {
    font: FONT_MONO,
    size: 12,
    weight: 700,
    color: UI.ink,
    align: "center",
    letterSpacing: 2.5,
  });
  ctx.globalAlpha = 1;
  drawText("BEST · " + String(state.bestScore).padStart(3, "0"), W / 2, 756, {
    font: FONT_MONO,
    size: 10,
    color: UI.muted,
    align: "center",
    letterSpacing: 2.5,
  });

  state.elapsed += 1 / 60;
}
