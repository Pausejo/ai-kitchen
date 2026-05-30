// Acciones del jugador: pick/drop/ship/compact/subagente + contexto.
import { CONTEXT_MAX, POINTS, SUBAGENT_DEPLOY_CTX, COMPACT_RATE, COL } from "../config.js";
import { contextCostMultiplier } from "../skills.js";
import { nearestStation, playerNearStation } from "../geometry.js";
import { flash } from "../effects.js";
import { pickSubagentNextStation } from "./subagents.js";

export function updateContext(state, dt) {
  // Any player standing still at COMPACT drains context
  const cs = state.stations.find((s) => s.id === "COMPACT");
  let draining = false;
  for (const p of state.players) {
    const near = playerNearStation(p, cs);
    const moving = Math.abs(p.vx) + Math.abs(p.vy) > 1;
    if (near && !moving) {
      draining = true;
      break;
    }
  }
  if (draining) {
    state.context = Math.max(0, state.context - COMPACT_RATE * dt);
    // Lección de COMPACT del tutorial: cuenta solo tras enviar bug+feature
    if (state.learningPhase && state.shipped >= 2) state.learningCompacted = true;
  }
}

export function handleInteract(state) {
  for (const p of state.players) {
    if (!p.pendingInteract) continue;
    p.pendingInteract = false;
    const s = nearestStation(p, state.stations);
    if (!s) continue;
    doInteract(state, p, s);
  }
}

export function doInteract(state, p, s) {
  if (s.kind === "inbox") {
    if (!p.holding && state.inbox.length > 0) {
      p.holding = state.inbox.shift();
      flash(state, s.x, s.y - s.h / 2 - 16, "PICKED", COL.ink);
    } else if (p.holding) {
      // Trash held ticket back at INBOX
      state.score += POINTS.EXPIRED;
      state.expired++;
      flash(state, s.x, s.y - s.h / 2 - 16, "TRASHED", COL.red);
      p.holding = null;
    }
    return;
  }

  if (s.kind === "process") {
    // Pickup completed (front of queue, only if done)
    if (!p.holding && s.queue.length > 0 && s.queue[0].progress >= 1) {
      const entry = s.queue[0];
      p.holding = entry.ticket;
      // If this was a subagent's ticket, the subagent gives up / returns
      if (entry.isSubagent && entry.subagentRef) {
        entry.subagentRef.state = "returning";
        entry.subagentRef.target = null;
        entry.subagentRef.ticket = null;
      }
      s.queue.shift();
      flash(state, s.x, s.y - s.h / 2 - 16, "PICKED", COL.ink);
      return;
    }
    // Drop into queue
    if (p.holding) {
      if (s.queue.length >= s.capacity) {
        flash(state, s.x, s.y - s.h / 2 - 16, "QUEUE FULL", COL.red);
        return;
      }
      if (state.context >= CONTEXT_MAX) {
        flash(state, s.x, s.y - s.h / 2 - 16, "CTX FULL", COL.red);
        return;
      }
      if (s.accept && !s.accept.includes(p.holding.type)) {
        flash(state, s.x, s.y - s.h / 2 - 16, "WRONG TYPE", COL.red);
        return;
      }
      if (s.requires && !p.holding.stages.has(s.requires)) {
        flash(state, s.x, s.y - s.h / 2 - 16, "NEEDS " + s.requires.toUpperCase(), COL.red);
        return;
      }
      if (p.holding.stages.has(s.stage)) {
        flash(state, s.x, s.y - s.h / 2 - 16, "DONE", COL.warn);
        return;
      }
      s.queue.push({ ticket: p.holding, progress: 0 });
      p.holding = null;
      const ctxCost = s.contextCost * contextCostMultiplier(state.skills);
      state.context = Math.min(CONTEXT_MAX, state.context + ctxCost);
      return;
    }
    // Empty-handed at station with queue but front not done
    if (s.queue.length > 0 && s.queue[0].progress < 1) {
      flash(state, s.x, s.y - s.h / 2 - 16, "WORKING", COL.warn);
    }
  }

  if (s.kind === "ship") {
    if (!p.holding) {
      flash(state, s.x, s.y - s.h / 2 - 16, "NO TICKET", COL.warn);
      return;
    }
    if (!p.holding.stages.has("coded")) {
      flash(state, s.x, s.y - s.h / 2 - 16, "NEEDS CODED", COL.red);
      return;
    }
    const t = p.holding;
    let pts;
    if (t.type === "BUG") pts = POINTS.BUG;
    else if (t.stages.has("tested")) {
      pts = POINTS.FEATURE_TDD;
      state.perfectFeatures++;
    } else pts = POINTS.FEATURE_NOTDD;
    state.score += pts;
    state.shipped++;
    flash(state, s.x, s.y - s.h / 2 - 16, "+" + pts, COL.accent);
    p.holding = null;
    state.context = Math.min(CONTEXT_MAX, state.context + 4 * contextCostMultiplier(state.skills));
    // El fin del tutorial se decide de forma centralizada en systems/index.js
  }

  if (s.kind === "compact") {
    flash(state, s.x, s.y - s.h / 2 - 16, "AUTO", COL.muted);
  }

  if (s.kind === "subagent_box") {
    const sa = state.subagents[s.subagentIdx];
    // Pickup if subagent has returned a finished ticket... not currently used,
    // subagents auto-ship. But handle anyway: if pickup of result is needed, here.
    if (!p.holding) {
      // Empty interact — show status
      if (sa.state === "idle") flash(state, s.x, s.y - s.h / 2 - 16, "IDLE", COL.muted);
      else flash(state, s.x, s.y - s.h / 2 - 16, "BUSY · " + sa.state.toUpperCase(), COL.warn);
      return;
    }
    // Drop ticket to subagent
    if (sa.state !== "idle") {
      flash(state, s.x, s.y - s.h / 2 - 16, "BUSY", COL.red);
      return;
    }
    if (state.context >= CONTEXT_MAX) {
      flash(state, s.x, s.y - s.h / 2 - 16, "CTX FULL", COL.red);
      return;
    }
    // Dispatch subagent
    sa.ticket = p.holding;
    p.holding = null;
    state.context = Math.min(CONTEXT_MAX, state.context + SUBAGENT_DEPLOY_CTX * contextCostMultiplier(state.skills));
    // Decide first target based on ticket state
    sa.state = "toStation";
    sa.target = pickSubagentNextStation(state, sa);
    flash(state, s.x, s.y - s.h / 2 - 16, "DISPATCHED", COL.accent);
  }
}

// Decide next station for subagent based on ticket type and stages

export function handleTrash(state) {
  for (const p of state.players) {
    if (!p.pendingTrash) continue;
    p.pendingTrash = false;
    if (p.holding) {
      state.score += POINTS.EXPIRED;
      state.expired++;
      flash(state, p.x, p.y - 30, "TRASHED", COL.red);
      p.holding = null;
    }
  }
}
