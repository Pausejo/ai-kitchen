// Orquestador del render 3D: misma firma render(state) que el render 2D.
// Cada frame sincroniza la escena Three.js con el estado, la renderiza al
// canvas WebGL y dibuja el HUD/pantallas en el canvas 2D superpuesto.
import { W, H } from "../config.js";
import { ctx } from "../canvas2d.js";
import { getThree } from "./scene.js";
import { syncScene } from "./sync.js";
import { drawPlayingOverlay } from "./overlay.js";
import { drawHeader, drawStatsBar, drawFooter } from "../render/hud.js";
import { drawMenu, drawShop, drawGameOver, drawLearningOverlay } from "../render/screens.js";

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
  // Prioridad 1: un jugador lleva ticket → guía según los stages que faltan
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
  // Prioridad 2: una estación tiene un ticket listo para recoger
  const ready = state.stations.find((s) => s.kind === "process" && s.queue.length > 0 && s.queue[0].progress >= 1);
  if (ready) {
    return { text: `Recoge el ticket en ${ready.label} (verde = listo).`, stationId: ready.id };
  }
  // Prioridad 3: una estación está procesando
  const busy = state.stations.find((s) => s.kind === "process" && s.queue.length > 0 && s.queue[0].progress < 1);
  if (busy) {
    return { text: `Espera a que ${busy.label} termine. Mientras puedes coger otro ticket.`, stationId: busy.id };
  }
  // Prioridad 4: ticket en el inbox
  if (state.inbox.length > 0) {
    return { text: "Recoge el ticket en INBOX. Pulsa F (J1) o / (J2).", stationId: "INBOX" };
  }
  // Prioridad 5: aviso de contexto
  if (state.context >= 70) {
    return { text: "Tu CONTEXTO está alto. Ve a COMPACT y quédate quieto para vaciarlo.", stationId: "COMPACT" };
  }
  return { text: "Esperando próximo ticket…", stationId: null };
}

export function render(state) {
  const world = getThree();
  const hint = state.phase === "playing" ? computeLearningHint(state) : null;

  // La cocina 3D se renderiza en TODAS las fases (de fondo en menú/pantallas).
  syncScene(state, hint);
  world.renderer.render(world.scene, world.camera);

  // Overlay 2D: transparente; cada pantalla pinta su propio lavado de fondo.
  ctx.clearRect(0, 0, W, H);
  if (state.phase === "menu") return drawMenu(state);
  if (state.phase === "gameover") return drawGameOver(state);
  if (state.phase === "shop") return drawShop(state);

  drawHeader(state);
  drawStatsBar(state);
  drawPlayingOverlay(state);
  drawLearningOverlay(state, hint);
  drawFooter(state);
}
