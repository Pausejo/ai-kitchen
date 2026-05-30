// Procesado de la cola de cada estación de proceso.
import { COL } from "../config.js";
import { flash } from "../effects.js";

export function updateStations(state, dt) {
  for (const s of state.stations) {
    if (s.kind !== "process" || s.queue.length === 0) continue;
    const front = s.queue[0];
    if (front.progress >= 1) continue;
    // Context-based speed multiplier (only affects player work, NOT subagents)
    let ctxMult = 1;
    if (!front.isSubagent) {
      if (state.context > 80) ctxMult = 0.6;
      else if (state.context > 60) ctxMult = 0.85;
    }
    const procMult = front.processMult || 1;
    front.progress += (dt / (s.time * procMult)) * ctxMult;
    if (front.progress >= 1) {
      front.progress = 1;
      front.ticket.stages.add(s.stage);
      flash(state, s.x, s.y - s.h / 2 - 16, "+" + s.stage.toUpperCase() + (front.isSubagent ? " [α]" : ""), COL.ok);
    }
  }
}
