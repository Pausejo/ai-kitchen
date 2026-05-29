// HUD: cabecera, barra de stats, área de juego y pie.
import { COL, W, FONT_SERIF, FONT_MONO, GAME_TIME, CONTEXT_MAX, formatTime } from '../config.js';
import { drawText, drawLine, drawRect, ctx } from '../canvas2d.js';

export function drawHeader() {
  // Issue marker top left
  drawText('Nº', 40, 50, { font: FONT_SERIF, size: 14, italic: true, color: COL.muted });
  drawText('01', 40, 90, { font: FONT_SERIF, size: 56, weight: 800 });
  drawText('VOL. I — ISSUE 01', 40, 112, { font: FONT_MONO, size: 9, weight: 500, color: COL.muted, letterSpacing: 1.5 });

  // Center title
  drawText('AGENT KITCHEN', W / 2, 80, {
    font: FONT_SERIF, size: 64, weight: 900, align: 'center', italic: true,
  });
  drawText('— UN JUEGO SOBRE SER UN AGENTE DE IA —', W / 2, 108, {
    font: FONT_MONO, size: 10, color: COL.muted, align: 'center', letterSpacing: 2.5,
  });

  // Right side: date/byline
  const dateText = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
  drawText(dateText, W - 40, 50, { font: FONT_MONO, size: 9, color: COL.muted, align: 'right', letterSpacing: 1.5 });
  drawText('PG. 01 / 01', W - 40, 70, { font: FONT_MONO, size: 9, color: COL.muted, align: 'right', letterSpacing: 1.5 });
  drawText('CLAUDE & CO.', W - 40, 90, { font: FONT_SERIF, size: 14, italic: true, color: COL.ink, align: 'right' });

  // Horizontal rules
  drawLine(40, 130, W - 40, 130, COL.ink, 1.2);
  drawLine(40, 134, W - 40, 134, COL.ink, 0.4);
}

export function drawStatsBar(state) {
  const y = 165;
  // Three primary stats with editorial labels
  const stats = [
    {
      x: 90,
      label: 'TIEMPO',
      value: formatTime(state.timeLeft),
      sub: `/ ${formatTime(GAME_TIME)}`,
      font: FONT_MONO, weight: 700, italic: false,
    },
    {
      x: 320,
      label: 'PUNTUACIÓN',
      value: String(state.score).padStart(3, '0'),
      sub: `BEST ${String(state.bestScore).padStart(3, '0')}`,
      font: FONT_SERIF, weight: 900, italic: true,
    },
    {
      x: 600,
      label: 'CONTEXTO',
      value: String(Math.floor(state.context)).padStart(3, '0') + '%',
      sub: state.context >= CONTEXT_MAX ? 'BLOCKED · GO COMPACT' :
           state.context >= 80 ? 'PROCESS · SLOW' :
           state.context >= 60 ? 'WARNING' : 'STABLE',
      font: FONT_MONO, weight: 700, italic: false,
      isContext: true,
    },
    {
      x: 900,
      label: 'PR ENVIADAS',
      value: String(state.shipped).padStart(2, '0'),
      sub: `${state.perfectFeatures} W/ TDD`,
      font: FONT_SERIF, weight: 900, italic: true,
    },
    {
      x: 1140,
      label: 'EXPIRADAS',
      value: String(state.expired).padStart(2, '0'),
      sub: 'USER ANGRY',
      font: FONT_SERIF, weight: 900, italic: true,
    },
  ];

  for (const stat of stats) {
    drawText(stat.label, stat.x, y - 18, {
      font: FONT_MONO, size: 9, color: COL.muted, letterSpacing: 1.8, weight: 500,
    });
    let valColor = COL.ink;
    if (stat.isContext) {
      if (state.context >= CONTEXT_MAX) valColor = COL.red;
      else if (state.context >= 80) valColor = COL.warn;
    }
    drawText(stat.value, stat.x, y + 18, {
      font: stat.font, size: 32, weight: stat.weight, italic: stat.italic, color: valColor,
    });
    drawText(stat.sub, stat.x, y + 34, {
      font: FONT_MONO, size: 8, color: COL.muted, letterSpacing: 1.2,
    });
    if (stat.isContext) {
      // Draw context bar
      const bx = stat.x + 95, by = y + 5, bw = 130, bh = 12;
      drawRect(bx, by, bw, bh, { stroke: COL.ink, lw: 1 });
      const pct = state.context / CONTEXT_MAX;
      let barColor = COL.ink;
      if (state.context >= CONTEXT_MAX) barColor = COL.red;
      else if (state.context >= 80) barColor = COL.warn;
      drawRect(bx + 1.5, by + 1.5, (bw - 3) * pct, bh - 3, { fill: barColor });
      // Marks
      drawLine(bx + bw * 0.6, by, bx + bw * 0.6, by + bh, COL.ink, 0.5);
      drawLine(bx + bw * 0.8, by, bx + bw * 0.8, by + bh, COL.ink, 0.5);
    }
  }

  // Bottom rule
  drawLine(40, 215, W - 40, 215, COL.ink, 1.2);
}

export function drawPlayArea() {
  // Background subtle grid
  ctx.save();
  ctx.strokeStyle = COL.lineL;
  ctx.lineWidth = 0.5;
  for (let x = 40; x <= W - 40; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 230);
    ctx.lineTo(x, 720);
    ctx.stroke();
  }
  for (let y = 240; y <= 720; y += 40) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(W - 40, y);
    ctx.stroke();
  }
  ctx.restore();

  // Section label
  drawText('§ FLUJO DE TRABAJO', 50, 245, {
    font: FONT_MONO, size: 9, color: COL.muted, letterSpacing: 2, weight: 500,
  });
  drawText('FIG. A', W - 50, 245, {
    font: FONT_SERIF, size: 11, italic: true, color: COL.muted, align: 'right',
  });
}

export function drawFooter(state) {
  drawLine(40, 740, W - 40, 740, COL.ink, 1.2);

  if (state.players.length === 1) {
    const p = state.players[0];
    drawText('LLEVANDO', 50, 762, {
      font: FONT_MONO, size: 9, color: COL.muted, letterSpacing: 1.8, weight: 500,
    });
    const t = p.holding;
    let carryText = '— vacío —';
    let carryColor = COL.muted;
    if (t) {
      const flags = [];
      if (t.stages.has('planned')) flags.push('planned');
      if (t.stages.has('tested')) flags.push('tested');
      if (t.stages.has('coded')) flags.push('coded');
      carryText = `${t.type} #${String(t.id).padStart(3,'0')} · ${t.desc}${flags.length ? ' · ' + flags.join(', ') : ''}`;
      carryColor = COL.ink;
    }
    drawText(carryText, 50, 780, {
      font: FONT_SERIF, size: 15, italic: true, color: carryColor,
    });
    drawText('WASD  MOVER     F  INTERACTUAR     Q  DESCARTAR', W - 50, 780, {
      font: FONT_MONO, size: 10, color: COL.muted, align: 'right', letterSpacing: 1.4,
    });
  } else {
    // Two-player footer: split into two columns
    for (let i = 0; i < 2; i++) {
      const p = state.players[i];
      const baseX = i === 0 ? 50 : W / 2 + 20;
      drawText(p.cfg.label, baseX, 762, {
        font: FONT_MONO, size: 10, weight: 700,
        color: p.cfg.color, letterSpacing: 1.8,
      });
      const t = p.holding;
      let carryText = '— vacío —';
      let carryColor = COL.muted;
      if (t) {
        const flags = [];
        if (t.stages.has('planned')) flags.push('P');
        if (t.stages.has('tested')) flags.push('T');
        if (t.stages.has('coded')) flags.push('C');
        carryText = `${t.type} #${String(t.id).padStart(3,'0')} · ${t.desc}${flags.length ? ' [' + flags.join('') + ']' : ''}`;
        carryColor = COL.ink;
      }
      drawText(carryText, baseX, 782, {
        font: FONT_SERIF, size: 13, italic: true, color: carryColor,
      });
    }
    // Center divider
    drawLine(W / 2, 750, W / 2, 795, COL.line, 0.5);
  }
}
