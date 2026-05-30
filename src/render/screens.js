// Pantallas completas: overlay de tutorial, menú, shop, game over.
import { COL, W, H, TAU, FONT_SERIF, FONT_MONO, SKILL_DEFS, PLAYER_CONFIGS } from "../config.js";
import { clear, drawText, drawLine, wrapText, ctx } from "../canvas2d.js";

export function drawLearningOverlay(state, hint) {
  if (!state.learningPhase || !hint) return;
  // Editor's note box, positioned in the empty corner top-right of the play area
  const x = W - W / 2 - 170,
    y = H - 130,
    w = 340,
    h = 60;
  // Background
  ctx.fillStyle = COL.paper3;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COL.ink;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  // Inner rule
  ctx.strokeStyle = COL.line;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
  // Header
  drawText("TUTORIAL — " + String(Math.min(state.shipped + 1, 5)).padStart(2, "0") + " / 05", x + 12, y + 18, {
    font: FONT_MONO,
    size: 8,
    color: COL.accent,
    letterSpacing: 1.8,
    weight: 700,
  });
  // Hint text — wrap if needed
  ctx.font = `italic 600 14px ${FONT_SERIF}, serif`;
  const maxW = w - 24;
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
    drawText(lines[i], x + 12, y + 36 + i * 16, {
      font: FONT_SERIF,
      size: 13,
      italic: true,
      weight: 600,
      color: COL.ink,
    });
  }
}

export function drawMenu(state) {
  clear();
  ctx.save();
  drawLine(80, 90, W - 80, 90, COL.ink, 1.2);
  drawLine(80, 94, W - 80, 94, COL.ink, 0.4);

  drawText("UN JUEGO DE PABLO AUSEJO", W - 100, 80, {
    font: FONT_MONO,
    size: 10,
    weight: 500,
    color: COL.muted,
    letterSpacing: 2,
    align: "right",
  });

  // Massive title
  drawText("AI", W / 2, 230, {
    font: FONT_SERIF,
    size: 160,
    weight: 900,
    italic: true,
    align: "center",
    color: COL.ink,
  });
  drawText("KITCHEN", W / 2, 350, {
    font: FONT_SERIF,
    size: 160,
    weight: 900,
    align: "center",
    color: COL.accent,
  });

  drawText("— CLAUDE CODE x OVERCOOKED —", W / 2, 385, {
    font: FONT_MONO,
    size: 11,
    color: COL.muted,
    align: "center",
    letterSpacing: 3,
  });

  drawLine(150, 425, W - 150, 425, COL.ink, 0.5);

  // Mode selector
  drawText("§ MODO", W / 2, 455, {
    font: FONT_MONO,
    size: 10,
    color: COL.muted,
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
    const y = 500;
    if (selected) {
      ctx.fillStyle = COL.ink;
      ctx.fillRect(m.x - 130, y - 30, 260, 50);
      drawText("[ " + m.label + " ]", m.x, y + 5, {
        font: FONT_SERIF,
        size: 22,
        weight: 900,
        italic: true,
        color: COL.paper,
        align: "center",
        letterSpacing: 1,
      });
      drawText("PULSA " + m.n, m.x, y + 32, {
        font: FONT_MONO,
        size: 9,
        color: COL.accent,
        align: "center",
        letterSpacing: 2,
      });
    } else {
      ctx.strokeStyle = COL.line;
      ctx.lineWidth = 1;
      ctx.strokeRect(m.x - 130, y - 30, 260, 50);
      drawText(m.label, m.x, y + 5, {
        font: FONT_SERIF,
        size: 22,
        weight: 400,
        italic: true,
        color: COL.muted,
        align: "center",
        letterSpacing: 1,
      });
      drawText("PULSA " + m.n, m.x, y + 32, {
        font: FONT_MONO,
        size: 9,
        color: COL.muted,
        align: "center",
        letterSpacing: 2,
      });
    }
  }

  drawLine(150, 565, W - 150, 565, COL.ink, 0.5);

  // Controls — two columns
  drawText("§ CONTROLES — C-1", 150, 600, {
    font: FONT_MONO,
    size: 10,
    color: PLAYER_CONFIGS[0].color,
    letterSpacing: 2,
    weight: 700,
  });
  const c1 = [
    ["WASD", "mover"],
    ["F", "interactuar / coger / dejar"],
    ["Q", "descartar ticket (-8 pts)"],
  ];
  for (let i = 0; i < c1.length; i++) {
    drawText(c1[i][0], 150, 630 + i * 22, {
      font: FONT_MONO,
      size: 13,
      weight: 700,
      color: COL.ink,
      letterSpacing: 1,
    });
    drawText(c1[i][1], 250, 630 + i * 22, {
      font: FONT_SERIF,
      size: 14,
      italic: true,
      color: COL.muted,
    });
  }

  if (state.menuPlayers === 2) {
    drawText("§ CONTROLES — C-2", 670, 600, {
      font: FONT_MONO,
      size: 10,
      color: PLAYER_CONFIGS[1].color,
      letterSpacing: 2,
      weight: 700,
    });
    const c2 = [
      ["↑↓←→", "mover"],
      ["/", "interactuar / coger / dejar"],
      [".", "descartar ticket (-8 pts)"],
    ];
    for (let i = 0; i < c2.length; i++) {
      drawText(c2[i][0], 670, 630 + i * 22, {
        font: FONT_MONO,
        size: 13,
        weight: 700,
        color: COL.ink,
        letterSpacing: 1,
      });
      drawText(c2[i][1], 760, 630 + i * 22, {
        font: FONT_SERIF,
        size: 14,
        italic: true,
        color: COL.muted,
      });
    }
  } else {
    drawText("§ PUNTOS", 670, 600, {
      font: FONT_MONO,
      size: 10,
      color: COL.muted,
      letterSpacing: 2,
      weight: 700,
    });
    drawText("BUG · 10", 670, 632, { font: FONT_SERIF, size: 14, italic: true });
    drawText("FEATURE · 12", 670, 654, { font: FONT_SERIF, size: 14, italic: true });
    drawText("FEATURE + TDD · 25", 670, 676, { font: FONT_SERIF, size: 14, italic: true, color: COL.accent });
  }

  // CTA
  const pulse = (Math.sin(state.elapsed * 3) + 1) / 2;
  ctx.globalAlpha = 0.5 + pulse * 0.5;
  drawText("▸  PULSA  SPACE  PARA  EMPEZAR  ◂", W / 2, 745, {
    font: FONT_MONO,
    size: 14,
    weight: 700,
    color: COL.accent,
    align: "center",
    letterSpacing: 3,
  });
  ctx.globalAlpha = 1;

  drawLine(80, 770, W - 80, 770, COL.ink, 0.5);
  // Show studio status if any skills purchased
  const sk = state.skills;
  const anySkills = sk.SPEED + sk.MODEL + sk.SUBAGENT > 0 || (sk.hours || 0) > 0;
  if (anySkills) {
    const parts = [];
    if (sk.SPEED > 0) parts.push(`SPD ${sk.SPEED}/${SKILL_DEFS.SPEED.maxLevel}`);
    if (sk.MODEL > 0) parts.push(`MDL ${sk.MODEL}/${SKILL_DEFS.MODEL.maxLevel}`);
    if (sk.SUBAGENT > 0) parts.push(`SUB ${sk.SUBAGENT}/${SKILL_DEFS.SUBAGENT.maxLevel}`);
    if (sk.CONTEXT > 0) parts.push(`CTX ${sk.CONTEXT}/${SKILL_DEFS.CONTEXT.maxLevel}`);
    parts.push(`${sk.hours || 0}h`);
    drawText("STUDIO · " + parts.join("  ·  "), W / 2, 786, {
      font: FONT_MONO,
      size: 10,
      color: COL.accent,
      align: "center",
      letterSpacing: 2,
      weight: 700,
    });
  } else {
    drawText("© CLAUDE & CO.", 100, 788, {
      font: FONT_MONO,
      size: 9,
      color: COL.muted,
      letterSpacing: 1.5,
    });
    drawText("AUTO-AGENT PRESS", W - 100, 788, {
      font: FONT_MONO,
      size: 9,
      color: COL.muted,
      letterSpacing: 1.5,
      align: "right",
    });
  }

  ctx.restore();
  state.elapsed += 1 / 60;
}

export function drawShop(state) {
  clear();
  const skills = state.skills;

  // Header
  drawLine(80, 90, W - 80, 90, COL.ink, 1.2);
  drawLine(80, 94, W - 80, 94, COL.ink, 0.4);
  drawText("STUDIO UPGRADES", 100, 80, {
    font: FONT_MONO,
    size: 10,
    weight: 500,
    color: COL.muted,
    letterSpacing: 2.5,
  });
  drawText("META · PROGRESSION", W - 100, 80, {
    font: FONT_MONO,
    size: 10,
    weight: 500,
    color: COL.muted,
    letterSpacing: 2,
    align: "right",
  });

  // Title
  drawText("STUDIO", W / 2, 175, {
    font: FONT_SERIF,
    size: 100,
    weight: 900,
    italic: true,
    align: "center",
    color: COL.ink,
  });
  drawText("— invierte tus horas en habilidades —", W / 2, 205, {
    font: FONT_MONO,
    size: 10,
    color: COL.muted,
    align: "center",
    letterSpacing: 2.5,
  });

  // Hours available
  const hours = skills.hours || 0;
  ctx.fillStyle = COL.ink;
  ctx.fillRect(W / 2 - 200, 230, 400, 70);
  drawText("HORAS DISPONIBLES", W / 2, 252, {
    font: FONT_MONO,
    size: 10,
    color: COL.paper2,
    align: "center",
    letterSpacing: 2.5,
    weight: 500,
  });
  drawText(String(hours).padStart(4, "0") + "h", W / 2, 290, {
    font: FONT_SERIF,
    size: 36,
    weight: 900,
    italic: true,
    color: COL.paper,
    align: "center",
  });

  // Four skill cards in a 2×2 grid
  const skillKeys = ["SPEED", "MODEL", "SUBAGENT", "CONTEXT"];
  const cardW = 480,
    cardH = 200,
    gapX = 32,
    gapY = 22;
  const totalW = cardW * 2 + gapX;
  const startX = (W - totalW) / 2;
  const startY = 335;

  for (let i = 0; i < skillKeys.length; i++) {
    const key = skillKeys[i];
    const def = SKILL_DEFS[key];
    const level = skills[key];
    const maxed = level >= def.maxLevel;
    const nextCost = maxed ? null : def.costs[level];
    const canAfford = !maxed && hours >= nextCost;
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = startX + col * (cardW + gapX);
    const cardY = startY + row * (cardH + gapY);

    // Card background
    ctx.fillStyle = COL.paper2;
    ctx.fillRect(x, cardY, cardW, cardH);
    ctx.strokeStyle = COL.ink;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x, cardY, cardW, cardH);
    ctx.strokeStyle = COL.line;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x + 4, cardY + 4, cardW - 8, cardH - 8);

    // Hotkey badge
    drawText("[" + (i + 1) + "]", x + 16, cardY + 26, {
      font: FONT_MONO,
      size: 12,
      weight: 700,
      color: COL.accent,
      letterSpacing: 1,
    });
    drawText(def.short, x + cardW - 16, cardY + 26, {
      font: FONT_MONO,
      size: 10,
      weight: 500,
      color: COL.muted,
      letterSpacing: 2,
      align: "right",
    });
    drawLine(x + 14, cardY + 34, x + cardW - 14, cardY + 34, COL.ink, 0.5);

    // Label (left side of card)
    drawText(def.label, x + 20, cardY + 78, {
      font: FONT_SERIF,
      size: 30,
      weight: 900,
      italic: true,
      color: COL.ink,
    });
    // Description below label
    wrapText(def.desc, x + 20 + (cardW - 240) / 2, cardY + 108, cardW - 260, 15, {
      font: FONT_SERIF,
      size: 12,
      italic: true,
      color: COL.muted,
      align: "center",
    });

    // Level dots (bottom-left)
    const dotsY = cardY + cardH - 36;
    const dotSpacing = 18;
    for (let j = 0; j < def.maxLevel; j++) {
      const dx = x + 22 + j * dotSpacing;
      ctx.beginPath();
      ctx.arc(dx, dotsY, 5, 0, TAU);
      if (j < level) {
        ctx.fillStyle = COL.accent;
        ctx.fill();
      } else {
        ctx.strokeStyle = COL.line;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    drawText(`NIVEL ${level} / ${def.maxLevel}`, x + 22, cardY + cardH - 14, {
      font: FONT_MONO,
      size: 8,
      color: COL.muted,
      letterSpacing: 1.5,
      weight: 500,
    });
    if (level > 0) {
      drawText(def.effectText(level), x + 22 + def.maxLevel * dotSpacing + 12, dotsY + 4, {
        font: FONT_SERIF,
        size: 12,
        italic: true,
        color: COL.ok,
      });
    }

    // Cost / button (right side of card)
    const btnX = x + cardW - 150,
      btnY = cardY + 60,
      btnW = 130,
      btnH = 110;
    ctx.strokeStyle = canAfford ? COL.accent : COL.line;
    ctx.lineWidth = canAfford ? 1.5 : 0.8;
    ctx.strokeRect(btnX, btnY, btnW, btnH);
    if (maxed) {
      drawText("MAX", btnX + btnW / 2, btnY + 55, {
        font: FONT_SERIF,
        size: 28,
        weight: 900,
        italic: true,
        color: COL.muted,
        align: "center",
      });
      drawText("LEVEL", btnX + btnW / 2, btnY + 80, {
        font: FONT_MONO,
        size: 9,
        color: COL.muted,
        align: "center",
        letterSpacing: 2,
      });
    } else {
      drawText("SIGUIENTE", btnX + btnW / 2, btnY + 22, {
        font: FONT_MONO,
        size: 8,
        color: COL.muted,
        align: "center",
        letterSpacing: 2,
      });
      const buyColor = canAfford ? COL.accent : COL.muted;
      drawText(nextCost + "h", btnX + btnW / 2, btnY + 60, {
        font: FONT_SERIF,
        size: 30,
        weight: 900,
        italic: true,
        color: buyColor,
        align: "center",
      });
      drawText("pulsa [" + (i + 1) + "]", btnX + btnW / 2, btnY + 85, {
        font: FONT_MONO,
        size: 9,
        color: buyColor,
        align: "center",
        letterSpacing: 1.5,
        weight: 700,
      });
    }
  }

  // Bottom rule
  drawLine(80, 695, W - 80, 695, COL.ink, 0.5);

  // Footer controls
  const pulse = (Math.sin(state.elapsed * 3) + 1) / 2;
  ctx.globalAlpha = 0.6 + pulse * 0.4;
  drawText("SPACE · VOLVER AL MENÚ          R · RESET PROGRESO", W / 2, 730, {
    font: FONT_MONO,
    size: 12,
    weight: 700,
    color: COL.ink,
    align: "center",
    letterSpacing: 2.5,
  });
  ctx.globalAlpha = 1;

  // Reset confirmation prompt
  if (state.shopResetConfirm) {
    ctx.fillStyle = "rgba(26, 22, 17, 0.85)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = COL.paper;
    ctx.fillRect(W / 2 - 280, H / 2 - 80, 560, 160);
    ctx.strokeStyle = COL.red;
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 280, H / 2 - 80, 560, 160);
    drawText("¿RESETEAR PROGRESO?", W / 2, H / 2 - 30, {
      font: FONT_SERIF,
      size: 28,
      weight: 900,
      italic: true,
      color: COL.red,
      align: "center",
    });
    drawText("Perderás todas las horas y habilidades. Esto no se puede deshacer.", W / 2, H / 2 + 5, {
      font: FONT_SERIF,
      size: 13,
      italic: true,
      color: COL.ink,
      align: "center",
    });
    drawText("Y · CONFIRMAR        N · CANCELAR", W / 2, H / 2 + 50, {
      font: FONT_MONO,
      size: 12,
      weight: 700,
      color: COL.ink,
      align: "center",
      letterSpacing: 2.5,
    });
  }

  state.elapsed += 1 / 60;
}

export function drawGameOver(state) {
  clear();
  drawText("— END OF SHIFT —", W / 2, 100, {
    font: FONT_MONO,
    size: 12,
    color: COL.muted,
    align: "center",
    letterSpacing: 4,
  });
  drawLine(80, 130, W - 80, 130, COL.ink, 1.2);
  drawLine(80, 134, W - 80, 134, COL.ink, 0.4);

  drawText("PR", W / 2 - 240, 290, {
    font: FONT_SERIF,
    size: 160,
    weight: 900,
    italic: true,
    align: "center",
    color: COL.ink,
  });
  drawText("MERGED", W / 2 + 100, 290, {
    font: FONT_SERIF,
    size: 160,
    weight: 900,
    align: "center",
    color: COL.accent,
  });

  drawText("PUNTUACIÓN", W / 2, 360, {
    font: FONT_MONO,
    size: 10,
    color: COL.muted,
    align: "center",
    letterSpacing: 3,
    weight: 500,
  });
  drawText(String(state.score).padStart(3, "0"), W / 2, 420, {
    font: FONT_SERIF,
    size: 80,
    weight: 900,
    italic: true,
    align: "center",
    color: COL.ink,
  });

  // Hours earned
  const earned = state.earnedHours || 0;
  const totalHours = state.skills.hours || 0;
  drawLine(W / 2 - 280, 460, W / 2 + 280, 460, COL.ink, 0.5);
  drawText("+" + String(earned).padStart(3, "0") + "h", W / 2, 510, {
    font: FONT_SERIF,
    size: 48,
    weight: 900,
    italic: true,
    color: COL.accent,
    align: "center",
  });
  drawText("« horas ganadas con IA »", W / 2, 538, {
    font: FONT_SERIF,
    size: 13,
    italic: true,
    color: COL.muted,
    align: "center",
  });
  drawText("TOTAL · " + totalHours + "h disponibles", W / 2, 560, {
    font: FONT_MONO,
    size: 10,
    color: COL.ink,
    align: "center",
    letterSpacing: 2,
    weight: 700,
  });
  drawLine(W / 2 - 280, 580, W / 2 + 280, 580, COL.ink, 0.5);

  // Stats row
  const stats = [
    ["PR ENVIADAS", String(state.shipped).padStart(2, "0")],
    ["CON TDD", String(state.perfectFeatures).padStart(2, "0")],
    ["EXPIRADAS", String(state.expired).padStart(2, "0")],
  ];
  for (let i = 0; i < stats.length; i++) {
    const x = 320 + i * 220;
    drawText(stats[i][0], x, 615, {
      font: FONT_MONO,
      size: 9,
      color: COL.muted,
      align: "center",
      letterSpacing: 2,
    });
    drawText(stats[i][1], x, 655, {
      font: FONT_SERIF,
      size: 36,
      weight: 900,
      italic: true,
      color: COL.ink,
      align: "center",
    });
  }
  drawLine(80, 680, W - 80, 680, COL.ink, 0.5);

  // CTAs
  const pulse = (Math.sin(state.elapsed * 4) + 1) / 2;
  ctx.globalAlpha = 0.7 + pulse * 0.3;
  drawText("S · INVERTIR HORAS EN EL STUDIO", W / 2 - 220, 730, {
    font: FONT_MONO,
    size: 12,
    weight: 700,
    color: COL.accent,
    align: "center",
    letterSpacing: 2.5,
  });
  drawText("SPACE · NUEVA PARTIDA", W / 2 + 220, 730, {
    font: FONT_MONO,
    size: 12,
    weight: 700,
    color: COL.ink,
    align: "center",
    letterSpacing: 2.5,
  });
  ctx.globalAlpha = 1;
  drawText("BEST · " + String(state.bestScore).padStart(3, "0"), W / 2, 770, {
    font: FONT_MONO,
    size: 10,
    color: COL.muted,
    align: "center",
    letterSpacing: 2.5,
  });

  state.elapsed += 1 / 60;
}
