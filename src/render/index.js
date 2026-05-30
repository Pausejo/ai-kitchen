// Orquestador de render: despacha por fase y compone la escena de juego.
import { clear } from "../canvas2d.js";
import { drawHeader, drawStatsBar, drawPlayArea, drawFooter } from "./hud.js";
import { drawInboxQueue, drawStation, drawAllSubagents, drawAllPlayers, drawFlashes } from "./entities.js";
import { drawMenu, drawShop, drawGameOver, drawLearningOverlay } from "./screens.js";

function computeSubagentHint(state) {
  const holder = state.players.find((p) => p.holding);
  if (holder) {
    return { text: "Suéltalo en la caja SUBAGENT (α1): la procesa sola.", stationId: "SUBA_0" };
  }
  const busy = state.subagents.some((sa) => sa.state !== "idle");
  if (busy) {
    return {
      text: "El subagente hace PLAN → CODE → PR solo (es más lento, pero no consume contexto).",
      stationId: "SUBA_0",
    };
  }
  if (state.inbox.length > 0) {
    return { text: "Recoge el ticket en INBOX y llévalo a la caja SUBAGENT (α1).", stationId: "INBOX" };
  }
  return { text: "Delega: lleva un ticket a la caja SUBAGENT (α1).", stationId: "SUBA_0" };
}

function computeLearningHint(state) {
  if (state.subagentLearningPhase) return computeSubagentHint(state);
  if (!state.learningPhase) return null;
  // Priority 1: a player is holding a ticket → guide based on what stages are missing
  const holder = state.players.find((p) => p.holding);
  if (holder) {
    const t = holder.holding;
    if (!t.stages.has("planned")) {
      return { text: "Lleva el ticket a PLAN. Acércate y pulsa F (o /).", stationId: "PLAN" };
    }
    if (t.type === "FEATURE" && !t.stages.has("tested") && !t.stages.has("coded")) {
      return { text: "FEATURE: pasa por TDD para 2× puntos. O salta a CODE.", stationId: "TDD" };
    }
    if (!t.stages.has("coded")) {
      return { text: "Ahora CODE. Implementa el ticket.", stationId: "CODE" };
    }
    return { text: "Listo. Llévalo a SHIP PR para enviarlo.", stationId: "PR" };
  }
  // Lección de COMPACT: bug + feature enviados, falta compactar una vez
  if (state.shipped >= 2 && !state.learningCompacted) {
    return { text: "Contexto alto. Ve a COMPACT y quédate quieto para vaciarlo.", stationId: "COMPACT" };
  }
  // Priority 2: a station has a ready ticket waiting for pickup
  const ready = state.stations.find((s) => s.kind === "process" && s.queue.length > 0 && s.queue[0].progress >= 1);
  if (ready) {
    return { text: `Recoge el ticket en ${ready.label} (verde = listo).`, stationId: ready.id };
  }
  // Priority 3: a station is processing
  const busy = state.stations.find((s) => s.kind === "process" && s.queue.length > 0 && s.queue[0].progress < 1);
  if (busy) {
    return { text: `Espera a que ${busy.label} termine. Mientras puedes coger otro ticket.`, stationId: busy.id };
  }
  // Priority 4: ticket in inbox
  if (state.inbox.length > 0) {
    return { text: "Recoge el ticket en INBOX. Pulsa F (jugador C-1) o / (C-2).", stationId: "INBOX" };
  }
  // Priority 5: context warning
  if (state.context >= 70) {
    return { text: "Tu CONTEXTO está alto. Ve a COMPACT y quédate quieto para vaciarlo.", stationId: "COMPACT" };
  }
  return { text: "Esperando próximo ticket…", stationId: null };
}

export function render(state) {
  if (state.phase === "menu") return drawMenu(state);
  if (state.phase === "gameover") return drawGameOver(state);
  if (state.phase === "shop") return drawShop(state);
  clear();
  drawHeader();
  drawStatsBar(state);
  drawPlayArea();
  drawInboxQueue(state);
  const hint = computeLearningHint(state);
  for (const s of state.stations) drawStation(state, s, hint && hint.stationId === s.id);
  drawLearningOverlay(state, hint);
  drawAllSubagents(state);
  drawAllPlayers(state);
  drawFlashes(state);
  drawFooter(state);
}

// ============================================================
// HELPERS
// ============================================================

// ============================================================
// LOOP
// ============================================================
