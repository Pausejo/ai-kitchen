// Entidades dibujables: tickets, estaciones, jugadores, subagentes, flashes.
import {
  COL,
  TAU,
  FONT_SERIF,
  FONT_MONO,
  CLAUDE_PATH,
  CONTEXT_MAX,
  PLAYER_R,
  COMPACT_RATE,
  SUBAGENT_DEPLOY_CTX,
} from "../config.js";
import { drawText, drawLine, drawRect, wrapText, ctx } from "../canvas2d.js";
import { nearestStation, anyPlayerNearStation } from "../geometry.js";

export function drawMiniTicket(cx, cy, ticket, rotated) {
  // Small ticket card preview, rotated slightly
  ctx.save();
  ctx.translate(cx, cy);
  if (rotated) ctx.rotate(-0.08);
  const w = 70,
    h = 80;
  ctx.fillStyle = COL.cardBg;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = COL.ink;
  ctx.lineWidth = 1;
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  // Type label
  drawText(ticket.type, 0, -h / 2 + 14, {
    font: FONT_MONO,
    size: 8,
    weight: 700,
    align: "center",
    letterSpacing: 1,
    color: ticket.type === "BUG" ? COL.red : COL.accent,
  });
  drawLine(-w / 2 + 6, -h / 2 + 20, w / 2 - 6, -h / 2 + 20, COL.ink, 0.5);
  // Time bar
  const pct = Math.max(0, ticket.timeLeft / ticket.maxTime);
  drawRect(-w / 2 + 6, h / 2 - 10, w - 12, 3, { fill: COL.line });
  drawRect(-w / 2 + 6, h / 2 - 10, (w - 12) * pct, 3, {
    fill: pct < 0.25 ? COL.red : pct < 0.5 ? COL.warn : COL.ok,
  });
  // ID
  drawText("#" + String(ticket.id).padStart(3, "0"), 0, h / 2 - 18, {
    font: FONT_MONO,
    size: 7,
    color: COL.muted,
    align: "center",
  });
  ctx.restore();
}

export function drawTicketCard(cx, cy, ticket, big = false) {
  ctx.save();
  ctx.translate(cx, cy);
  const hasHint = !!ticket.hint && big;
  const w = big ? 130 : 110;
  const h = big ? (hasHint ? 116 : 100) : 88;
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(-w / 2 + 2, -h / 2 + 3, w, h);
  // Card
  ctx.fillStyle = COL.cardBg;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = COL.ink;
  ctx.lineWidth = 1;
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  // Type
  drawText(ticket.type, -w / 2 + 8, -h / 2 + 14, {
    font: FONT_MONO,
    size: 9,
    weight: 700,
    letterSpacing: 1.2,
    color: ticket.type === "BUG" ? COL.red : COL.accent,
  });
  // ID
  drawText("#" + String(ticket.id).padStart(3, "0"), w / 2 - 8, -h / 2 + 14, {
    font: FONT_MONO,
    size: 8,
    color: COL.muted,
    align: "right",
  });
  drawLine(-w / 2 + 6, -h / 2 + 19, w / 2 - 6, -h / 2 + 19, COL.ink, 0.5);
  // Description (wrap)
  wrapText(ticket.desc, 0, -h / 2 + 36, w - 14, 12, {
    font: FONT_SERIF,
    size: 11,
    italic: true,
    align: "center",
  });
  // Tutorial hint inset (only on big cards)
  if (hasHint) {
    const hintY = h / 2 - 36;
    // Background highlight
    ctx.fillStyle = "rgba(194, 65, 12, 0.08)";
    ctx.fillRect(-w / 2 + 4, hintY - 8, w - 8, 14);
    drawLine(-w / 2 + 6, hintY - 8, w / 2 - 6, hintY - 8, COL.accent, 0.5);
    drawText(ticket.hint, 0, hintY + 2, {
      font: FONT_MONO,
      size: 7,
      weight: 700,
      color: COL.accent,
      align: "center",
      letterSpacing: 0.7,
    });
  }
  // Stages stamps
  const stages = ["planned", "tested", "coded"];
  const stampLabels = { planned: "PLN", tested: "TST", coded: "COD" };
  for (let i = 0; i < stages.length; i++) {
    const st = stages[i];
    const has = ticket.stages.has(st);
    const sx = -w / 2 + 8 + i * 24;
    const sy = h / 2 - 24;
    if (has) {
      ctx.fillStyle = COL.ok;
      ctx.fillRect(sx, sy, 20, 12);
      drawText(stampLabels[st], sx + 10, sy + 9, {
        font: FONT_MONO,
        size: 7,
        weight: 700,
        color: COL.paper,
        align: "center",
        letterSpacing: 0.5,
      });
    } else {
      ctx.strokeStyle = COL.line;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(sx, sy, 20, 12);
      drawText(stampLabels[st], sx + 10, sy + 9, {
        font: FONT_MONO,
        size: 7,
        color: COL.line,
        align: "center",
        letterSpacing: 0.5,
      });
    }
  }
  // Time bar
  const pct = Math.max(0, ticket.timeLeft / ticket.maxTime);
  drawRect(-w / 2 + 6, h / 2 - 8, w - 12, 3, { fill: COL.line });
  drawRect(-w / 2 + 6, h / 2 - 8, (w - 12) * pct, 3, {
    fill: pct < 0.25 ? COL.red : pct < 0.5 ? COL.warn : COL.ok,
  });
  ctx.restore();
}

export function drawStation(state, s, spotlighted) {
  const left = s.x - s.w / 2,
    top = s.y - s.h / 2;
  const isNear = anyPlayerNearStation(s, state.players);
  const isPR = s.kind === "ship";
  const isInbox = s.kind === "inbox";

  // Spotlight from learning hint — pulsing accent glow behind station
  if (spotlighted) {
    const pulse = (Math.sin(state.elapsed * 4) + 1) / 2;
    ctx.save();
    ctx.fillStyle = `rgba(194, 65, 12, ${0.1 + pulse * 0.18})`;
    ctx.fillRect(left - 8, top - 8, s.w + 16, s.h + 16);
    ctx.restore();
  }

  // INBOX pressure level (0 = calm, 1 = warning, 2 = critical)
  let pressure = 0;
  if (isInbox) {
    if (state.inbox.length >= 5) pressure = 2;
    else if (state.inbox.length >= 3) pressure = 1;
  }

  // Background — flash on inbox pressure
  let bg = isPR ? COL.paper3 : COL.paper2;
  if (pressure > 0) {
    const pulse = (Math.sin(state.elapsed * (pressure === 2 ? 8 : 5)) + 1) / 2;
    bg = pressure === 2 ? `rgba(139, 44, 32, ${0.1 + pulse * 0.2})` : `rgba(168, 132, 16, ${0.08 + pulse * 0.14})`;
    ctx.fillStyle = COL.paper2;
    ctx.fillRect(left, top, s.w, s.h);
    ctx.fillStyle = bg;
    ctx.fillRect(left, top, s.w, s.h);
  } else {
    ctx.fillStyle = bg;
    ctx.fillRect(left, top, s.w, s.h);
  }

  // Border
  let borderColor = isNear ? COL.accent : COL.ink;
  let borderWidth = isNear ? 2.5 : 1.2;
  if (pressure === 2) {
    const pulse = (Math.sin(state.elapsed * 8) + 1) / 2;
    borderColor = COL.red;
    borderWidth = 2 + pulse * 1.5;
  } else if (pressure === 1) {
    borderColor = isNear ? COL.accent : COL.warn;
    borderWidth = 1.8;
  }
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(left, top, s.w, s.h);

  // Inner thin border (editorial double-rule)
  ctx.strokeStyle = isNear ? COL.accentL : COL.line;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(left + 4, top + 4, s.w - 8, s.h - 8);

  // Number top-left
  drawText(s.num, left + 10, top + 22, {
    font: FONT_MONO,
    size: 10,
    weight: 700,
    color: COL.muted,
    letterSpacing: 1.5,
  });
  // Label center
  let labelColor = isPR ? COL.accent : COL.ink;
  if (pressure === 2) labelColor = COL.red;
  drawText(s.label, s.x, top + 50, {
    font: FONT_SERIF,
    size: isPR ? 22 : 22,
    weight: 900,
    italic: true,
    color: labelColor,
    align: "center",
  });

  // Sub-info
  let sub = "";
  let subColor = COL.muted;
  if (s.kind === "process") {
    sub = `${s.time.toFixed(1)}s · +${s.contextCost} · CAP ${s.capacity}`;
    if (s.featureOnly) sub = `${s.time.toFixed(1)}s · +${s.contextCost} · FEAT ONLY`;
  } else if (s.kind === "inbox") {
    if (pressure === 2) {
      sub = `${state.inbox.length} USERS ANGRY`;
      subColor = COL.red;
    } else if (pressure === 1) {
      sub = `${state.inbox.length} USERS WAITING`;
      subColor = COL.warn;
    } else sub = `${state.inbox.length} EN COLA`;
  } else if (s.kind === "ship") {
    sub = "NEEDS · CODED";
  } else if (s.kind === "compact") {
    sub = "STAND HERE · -" + COMPACT_RATE + "/SEC";
  } else if (s.kind === "subagent_box") {
    sub = `+${SUBAGENT_DEPLOY_CTX} CTX · 2× SLOW`;
  }
  drawText(sub, s.x, top + s.h - 14, {
    font: FONT_MONO,
    size: 8,
    color: subColor,
    align: "center",
    letterSpacing: 1.2,
    weight: pressure > 0 ? 700 : 400,
  });

  // Show held tickets on station
  if (s.kind === "process" && s.queue.length > 0) {
    const front = s.queue[0];
    // Waiting tickets stacked to the LEFT of the front, rotated like papers on a desk
    for (let i = s.queue.length - 1; i >= 1; i--) {
      const entry = s.queue[i];
      const offset = i; // 1, 2, ...
      ctx.save();
      ctx.translate(s.x - 18 * offset, top - 44 + 4 * offset);
      ctx.rotate(-0.12 * offset);
      // Draw a compact card (without the hint inset, even if ticket has one)
      const w = 90,
        h = 70;
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fillRect(-w / 2 + 2, -h / 2 + 3, w, h);
      ctx.fillStyle = COL.cardBg;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeStyle = COL.ink;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      drawText(entry.ticket.type, -w / 2 + 6, -h / 2 + 12, {
        font: FONT_MONO,
        size: 8,
        weight: 700,
        letterSpacing: 1,
        color: entry.ticket.type === "BUG" ? COL.red : COL.accent,
      });
      drawText("#" + String(entry.ticket.id).padStart(3, "0"), w / 2 - 6, -h / 2 + 12, {
        font: FONT_MONO,
        size: 7,
        color: COL.muted,
        align: "right",
      });
      drawLine(-w / 2 + 4, -h / 2 + 16, w / 2 - 4, -h / 2 + 16, COL.ink, 0.4);
      wrapText(entry.ticket.desc, 0, -h / 2 + 30, w - 10, 10, {
        font: FONT_SERIF,
        size: 9,
        italic: true,
        align: "center",
      });
      // Small "WAITING" stamp
      drawText("WAITING", 0, h / 2 - 18, {
        font: FONT_MONO,
        size: 6,
        weight: 700,
        color: COL.warn,
        align: "center",
        letterSpacing: 1,
      });
      // Time bar
      const pct = Math.max(0, entry.ticket.timeLeft / entry.ticket.maxTime);
      drawRect(-w / 2 + 4, h / 2 - 6, w - 8, 2, { fill: COL.line });
      drawRect(-w / 2 + 4, h / 2 - 6, (w - 8) * pct, 2, {
        fill: pct < 0.25 ? COL.red : pct < 0.5 ? COL.warn : COL.ok,
      });
      ctx.restore();
    }
    // Front (active) ticket on top, large
    drawTicketCard(s.x, top - 50, front.ticket);
    // Progress bar / ready stamp
    if (front.progress < 1) {
      const bx = left + 10,
        by = top + s.h - 28,
        bw = s.w - 20,
        bh = 4;
      drawRect(bx, by, bw, bh, { stroke: COL.ink, lw: 0.5 });
      drawRect(bx, by, bw * front.progress, bh, { fill: COL.accent });
    } else {
      ctx.save();
      ctx.fillStyle = COL.ok;
      ctx.fillRect(left + 10, top + s.h - 28, s.w - 20, 4);
      ctx.restore();
      drawText("READY · PICK UP", s.x, top + s.h - 32, {
        font: FONT_MONO,
        size: 8,
        weight: 700,
        color: COL.ok,
        align: "center",
        letterSpacing: 1.5,
      });
    }
    // Queue counter in top-right corner of the station
    const qFull = s.queue.length >= s.capacity;
    drawText(`${s.queue.length}/${s.capacity}`, left + s.w - 10, top + 22, {
      font: FONT_MONO,
      size: 10,
      weight: 700,
      color: qFull ? COL.red : s.queue.length >= 2 ? COL.warn : COL.muted,
      align: "right",
      letterSpacing: 1,
    });
  } else if (s.kind === "ship" && s.holds) {
    drawTicketCard(s.x, top - 50, s.holds);
  }

  // Compact station shows pulse if context high
  if (s.kind === "compact") {
    if (state.context >= 80) {
      const pulse = (Math.sin(state.elapsed * 6) + 1) / 2;
      ctx.strokeStyle = state.context >= CONTEXT_MAX ? COL.red : COL.warn;
      ctx.lineWidth = 2 + pulse * 2;
      ctx.strokeRect(left - 4, top - 4, s.w + 8, s.h + 8);
    }
  }

  // Subagent box: render status / mini ticket icon when busy
  if (s.kind === "subagent_box") {
    const sa = state.subagents[s.subagentIdx];
    if (sa && sa.state !== "idle") {
      // Dashed border to indicate "in use"
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = COL.accent;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(left + 2, top + 2, s.w - 4, s.h - 4);
      ctx.restore();
    }
    // Status line
    let statusText = "IDLE · DROP TICKET";
    let statusColor = COL.muted;
    if (sa) {
      if (sa.state === "toStation" && sa.target) {
        statusText = "→ " + sa.target.label;
        statusColor = COL.ink;
      } else if (sa.state === "waiting") {
        statusText = "WAITING · QUEUE FULL";
        statusColor = COL.warn;
      } else if (sa.state === "working") {
        statusText = "PROCESSING…";
        statusColor = COL.ink;
      } else if (sa.state === "toShip") {
        statusText = "→ SHIP PR";
        statusColor = COL.accent;
      } else if (sa.state === "returning") {
        statusText = "RETURNING";
        statusColor = COL.muted;
      }
    }
    drawText(statusText, s.x, top + s.h - 28, {
      font: FONT_MONO,
      size: 8,
      color: statusColor,
      align: "center",
      letterSpacing: 1.2,
      weight: 700,
    });
  }
}

export function drawPlayer(state, p) {
  // Trail
  for (const t of p.trail) {
    ctx.fillStyle = `rgba(26, 22, 17, ${t.a * 0.12})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, p.r * 0.6 * t.a, 0, TAU);
    ctx.fill();
  }
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + p.r + 2, p.r * 0.9, p.r * 0.3, 0, 0, TAU);
  ctx.fill();
  // Feet — top-down view: positioned perpendicular to facing direction,
  // stepping forward/back along the movement axis (sliding underneath)
  const dx = p.faceX;
  const dy = p.faceY;
  const perpX = -dy;
  const perpY = dx;
  const sideOffset = 12; // perpendicular spread from spine
  const stepAmp = 8; // stride length along facing direction
  const step1 = p.isMoving ? Math.sin(p.stepPhase) * stepAmp : 0;
  const step2 = p.isMoving ? Math.sin(p.stepPhase + Math.PI) * stepAmp : 0;
  ctx.fillStyle = p.cfg.badge;
  ctx.beginPath();
  ctx.arc(p.x + perpX * sideOffset + dx * step1, p.y + perpY * sideOffset + dy * step1, 6.5, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(p.x - perpX * sideOffset + dx * step2, p.y - perpY * sideOffset + dy * step2, 6.5, 0, TAU);
  ctx.fill();
  // Badge background (dark disc)
  ctx.fillStyle = p.cfg.badge;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, TAU);
  ctx.fill();
  // Claude logo (SVG path), colored per player
  ctx.save();
  ctx.translate(p.x, p.y);
  const logoScale = ((p.r * 2) / 24) * 0.85;
  ctx.scale(logoScale, logoScale);
  ctx.translate(-12, -12);
  ctx.fillStyle = p.cfg.color;
  ctx.fill(CLAUDE_PATH);
  ctx.restore();
  // Highlight ring (when interaction available)
  const nearS = nearestStation(p, state.stations);
  if (nearS) {
    ctx.strokeStyle = p.cfg.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 5, 0, TAU);
    ctx.stroke();
  }
  // Player ID tag (above the badge)
  drawText(p.cfg.label, p.x, p.y - p.r - 6, {
    font: FONT_MONO,
    size: 9,
    weight: 700,
    color: p.cfg.color,
    align: "center",
    letterSpacing: 1.5,
  });

  // Carried ticket
  if (p.holding) {
    // Offset card to avoid overlapping the other player
    const offsetX = p === state.players[0] ? 40 : -40;
    drawTicketCard(p.x + offsetX, p.y - 50, p.holding);
    drawLine(p.x + (offsetX > 0 ? 5 : -5), p.y - 8, p.x + (offsetX > 0 ? 30 : -30), p.y - 30, COL.muted, 0.5);
  }
}

export function drawAllPlayers(state) {
  for (const p of state.players) drawPlayer(state, p);
}

export function drawSubagent(state, sa) {
  if (sa.state === "idle") return; // hidden when idle inside box
  const alpha = 0.55;
  ctx.save();
  ctx.globalAlpha = alpha;
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.beginPath();
  ctx.ellipse(sa.x, sa.y + PLAYER_R + 2, PLAYER_R * 0.8, PLAYER_R * 0.25, 0, 0, TAU);
  ctx.fill();
  // Feet (smaller, same animation style)
  const dx = sa.faceX,
    dy = sa.faceY;
  const perpX = -dy,
    perpY = dx;
  const sideOffset = 11;
  const stepAmp = 6;
  const s1 = sa.isMoving ? Math.sin(sa.stepPhase) * stepAmp : 0;
  const s2 = sa.isMoving ? Math.sin(sa.stepPhase + Math.PI) * stepAmp : 0;
  ctx.fillStyle = COL.ink;
  ctx.beginPath();
  ctx.arc(sa.x + perpX * sideOffset + dx * s1, sa.y + perpY * sideOffset + dy * s1, 5, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(sa.x - perpX * sideOffset + dx * s2, sa.y - perpY * sideOffset + dy * s2, 5, 0, TAU);
  ctx.fill();
  // Body (smaller than player)
  const r = PLAYER_R - 2;
  ctx.fillStyle = COL.ink;
  ctx.beginPath();
  ctx.arc(sa.x, sa.y, r, 0, TAU);
  ctx.fill();
  // Claude logo, color of player C-1 but desaturated
  ctx.save();
  ctx.translate(sa.x, sa.y);
  const logoScale = ((r * 2) / 24) * 0.85;
  ctx.scale(logoScale, logoScale);
  ctx.translate(-12, -12);
  ctx.fillStyle = COL.accent;
  ctx.fill(CLAUDE_PATH);
  ctx.restore();
  // α badge above
  drawText("α" + (sa.idx + 1), sa.x, sa.y - r - 6, {
    font: FONT_MONO,
    size: 9,
    weight: 700,
    color: COL.accent,
    align: "center",
    letterSpacing: 1.5,
  });
  // Carried ticket
  if (sa.ticket) {
    drawTicketCard(sa.x + 40, sa.y - 50, sa.ticket);
    drawLine(sa.x + 5, sa.y - 8, sa.x + 30, sa.y - 30, COL.muted, 0.5);
  }
  ctx.restore();
}

export function drawAllSubagents(state) {
  for (const sa of state.subagents) drawSubagent(state, sa);
}

export function drawInboxQueue(state) {
  const inboxS = state.stations.find((s) => s.id === "INBOX");
  const baseX = inboxS.x - inboxS.w / 2 - 20;
  const baseY = inboxS.y;
  const visible = Math.min(state.inbox.length, 4);
  const pulse = (Math.sin(state.elapsed * 6) + 1) / 2;

  for (let i = visible - 1; i >= 0; i--) {
    const t = state.inbox[i];
    // Stack visually — more spread + more rotation when many tickets
    const stackOffset = state.inbox.length >= 3 ? 12 : 8;
    const cx = baseX - i * stackOffset;
    const cy = baseY + i * 2;
    const pct = Math.max(0, t.timeLeft / t.maxTime);
    // Critical tickets pulse
    if (pct < 0.25) {
      ctx.save();
      ctx.shadowColor = COL.red;
      ctx.shadowBlur = 8 + pulse * 8;
      drawMiniTicket(cx, cy, t, true);
      ctx.restore();
    } else {
      drawMiniTicket(cx, cy, t, true);
    }
  }

  if (state.inbox.length > 4) {
    const overflowX = baseX - 4 * (state.inbox.length >= 3 ? 12 : 8) - 18;
    drawText("+" + (state.inbox.length - 4), overflowX, baseY + 4, {
      font: FONT_SERIF,
      size: 28,
      weight: 900,
      italic: true,
      color: state.inbox.length >= 5 ? COL.red : COL.accent,
      align: "right",
    });
  }

  // Pressure label above the queue
  if (state.inbox.length >= 3) {
    const label = state.inbox.length >= 5 ? "!! ANGRY USERS !!" : "USERS WAITING";
    const labelColor = state.inbox.length >= 5 ? COL.red : COL.warn;
    drawText(label, baseX - 50, baseY - 70, {
      font: FONT_MONO,
      size: 10,
      weight: 700,
      color: labelColor,
      align: "center",
      letterSpacing: 2,
    });
    drawText(String(state.inbox.length).padStart(2, "0"), baseX - 50, baseY - 38, {
      font: FONT_SERIF,
      size: 36,
      weight: 900,
      italic: true,
      color: labelColor,
      align: "center",
    });
  }
}

export function drawFlashes(state) {
  for (const f of state.flashes) {
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
    drawText(f.text, f.x, f.y, {
      font: FONT_MONO,
      size: 11,
      weight: 700,
      color: f.color,
      align: "center",
      letterSpacing: 1.5,
    });
    ctx.globalAlpha = 1;
  }
}
