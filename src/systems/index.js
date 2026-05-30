// Orquestador: ejecuta todos los sistemas en orden cada frame.
import { GAME_TIME, W, COL } from "../config.js";
import { saveSkills, markTutorialDone, markSubagentTutorialDone } from "../skills.js";
import { flash, updateFlashes } from "../effects.js";
import { spawnIfDue, updateTickets } from "./tickets.js";
import { updateSubagents } from "./subagents.js";
import { updateStations } from "./stations.js";
import { updatePlayers } from "./players.js";
import { updateContext, handleInteract, handleTrash } from "./interaction.js";

export function update(state, input, dt) {
  state.elapsed += dt;
  state.timeLeft = Math.max(0, GAME_TIME - state.elapsed);
  updatePlayers(state, input, dt);
  updateSubagents(state, dt);
  spawnIfDue(state, dt);
  updateStations(state, dt);
  updateContext(state, dt);
  updateTickets(state, dt);
  handleInteract(state);
  handleTrash(state);
  updateFlashes(state, dt);

  // Fin del tutorial principal: bug + feature enviados y ha compactado una vez.
  if (state.learningPhase && state.shipped >= 2 && state.learningCompacted) {
    state.learningPhase = false;
    markTutorialDone();
    flash(state, W / 2, 270, "TUTORIAL · COMPLETO — ¡A POR ELLO!", COL.accent);
    state.nextSpawnIn = Math.min(state.nextSpawnIn, 2.0);
  }
  // Fin del tutorial de subagentes: un subagente ha enviado una PR.
  if (state.subagentLearningPhase && state.subagentShipped >= 1) {
    state.subagentLearningPhase = false;
    markSubagentTutorialDone();
    flash(state, W / 2, 270, "SUBAGENTES · LISTO", COL.accent);
    state.nextSpawnIn = Math.min(state.nextSpawnIn, 2.0);
  }

  if (state.timeLeft <= 0) {
    if (state.phase === "playing") {
      // Cierra los tutoriales aunque no se completaran: se muestran solo 1 vez.
      if (state.learningPhase) markTutorialDone();
      if (state.subagentLearningPhase) markSubagentTutorialDone();
      // Transition to gameover: award hours and persist
      const earnedHours = Math.max(0, state.score);
      state.earnedHours = earnedHours;
      state.skills.hours = (state.skills.hours || 0) + earnedHours;
      saveSkills(state.skills);
      state.phase = "gameover";
      if (state.score > state.bestScore) {
        state.bestScore = state.score;
        try {
          localStorage.setItem("agentKitchenBest", String(state.score));
        } catch (e) {}
      }
    }
  }
}

// ============================================================
// RENDERING
// ============================================================
