// Orquestador: ejecuta todos los sistemas en orden cada frame.
import { GAME_TIME, W, COL } from "../config.js";
import { saveSkills } from "../skills.js";
import { flash, updateFlashes } from "../effects.js";
import { spawnIfDue, updateTickets } from "./tickets.js";
import { updateSubagents } from "./subagents.js";
import { updateStations } from "./stations.js";
import { updatePlayers } from "./players.js";
import { updateContext, handleInteract, handleTrash } from "./interaction.js";

export function update(state, input, dt) {
  state.elapsed += dt;
  state.timeLeft = Math.max(0, GAME_TIME - state.elapsed);
  // Learning phase auto-end after 60s
  if (state.learningPhase) {
    state.learningTimer += dt;
    if (state.learningTimer >= 60) {
      state.learningPhase = false;
      flash(state, W / 2, 270, "PACE UP", COL.accent);
    }
  }
  updatePlayers(state, input, dt);
  updateSubagents(state, dt);
  spawnIfDue(state, dt);
  updateStations(state, dt);
  updateContext(state, dt);
  updateTickets(state, dt);
  handleInteract(state);
  handleTrash(state);
  updateFlashes(state, dt);
  if (state.timeLeft <= 0) {
    if (state.phase === "playing") {
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
