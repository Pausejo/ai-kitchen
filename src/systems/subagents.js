// Máquina de estados de los subagentes (cajas que procesan tickets solos).
import { SUBAGENT_SPEED, SUBAGENT_PROCESS_MULT, POINTS, COL } from "../config.js";
import { flash } from "../effects.js";

export function updateSubagents(state, dt) {
  for (const sa of state.subagents) {
    if (sa.state === "idle") {
      sa.isMoving = false;
      continue;
    }
    if (sa.state === "toStation" || sa.state === "toShip" || sa.state === "returning") {
      // Move toward target
      const tx = sa.target ? sa.target.x : sa.box.x;
      const ty = sa.target ? sa.target.y : sa.box.y;
      const dx = tx - sa.x,
        dy = ty - sa.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 6) {
        // Arrived
        if (sa.state === "toStation") {
          handleSubagentArrival(state, sa);
        } else if (sa.state === "toShip") {
          handleSubagentShip(state, sa);
        } else if (sa.state === "returning") {
          sa.x = sa.box.x;
          sa.y = sa.box.y;
          sa.state = "idle";
          sa.target = null;
          sa.isMoving = false;
        }
      } else {
        const nx = dx / dist,
          ny = dy / dist;
        sa.vx = nx * SUBAGENT_SPEED;
        sa.vy = ny * SUBAGENT_SPEED;
        sa.x += sa.vx * dt;
        sa.y += sa.vy * dt;
        sa.faceX = nx;
        sa.faceY = ny;
        sa.isMoving = true;
        sa.stepPhase += dt * 12;
      }
    } else if (sa.state === "waiting") {
      // Standing at a station, queue is full. Re-check periodically.
      sa.isMoving = false;
      const target = sa.target;
      if (target.queue.length < target.capacity) {
        // Drop in now
        sa.state = "working";
        target.queue.push({ ticket: sa.ticket, progress: 0, isSubagent: true, processMult: SUBAGENT_PROCESS_MULT });
        sa.ticket = null; // it lives in the station queue now
      }
    } else if (sa.state === "working") {
      // Wait until our ticket has been processed in the target station, then pick it up.
      sa.isMoving = false;
      const target = sa.target;
      // Find our entry (we marked it with isSubagent and subagentIdx)
      const entry = target.queue.find((e) => e.isSubagent && e.subagentRef === sa);
      if (!entry) {
        // We were just pushed — tag it now
        const lastEntry = target.queue[target.queue.length - 1];
        if (lastEntry && lastEntry.isSubagent && !lastEntry.subagentRef) {
          lastEntry.subagentRef = sa;
        }
      } else if (entry.progress >= 1 && target.queue[0] === entry) {
        // Our ticket is the front and done — grab it
        sa.ticket = entry.ticket;
        target.queue.shift();
        // Decide next step
        const next = pickSubagentNextStation(state, sa);
        if (next.kind === "ship") {
          sa.state = "toShip";
          sa.target = next;
        } else {
          sa.state = "toStation";
          sa.target = next;
        }
      }
    }
  }
}

function handleSubagentArrival(state, sa) {
  const target = sa.target;
  if (target.queue.length >= target.capacity) {
    sa.state = "waiting";
    return;
  }
  // Push ticket into queue with subagent flag
  target.queue.push({
    ticket: sa.ticket,
    progress: 0,
    isSubagent: true,
    subagentRef: sa,
    processMult: SUBAGENT_PROCESS_MULT,
  });
  sa.ticket = null;
  sa.state = "working";
}

function handleSubagentShip(state, sa) {
  const t = sa.ticket;
  if (!t || !t.stages.has("coded")) {
    // Shouldn't happen, but safety net: dump ticket
    sa.ticket = null;
    sa.state = "returning";
    sa.target = null;
    return;
  }
  let pts;
  if (t.type === "BUG") pts = POINTS.BUG;
  else if (t.stages.has("tested")) {
    pts = POINTS.FEATURE_TDD;
    state.perfectFeatures++;
  } else pts = POINTS.FEATURE_NOTDD;
  state.score += pts;
  state.shipped++;
  flash(state, sa.target.x, sa.target.y - sa.target.h / 2 - 16, "+" + pts + " [α]", COL.accent);
  sa.ticket = null;
  sa.state = "returning";
  sa.target = null;
  if (state.learningPhase && state.shipped >= 5) {
    state.learningPhase = false;
    flash(state, W / 2, 270, "TUTORIAL · DONE — PACE UP", COL.accent);
    state.nextSpawnIn = Math.min(state.nextSpawnIn, 3.0);
  }
}

export function pickSubagentNextStation(state, sa) {
  const t = sa.ticket;
  if (!t.stages.has("planned")) return state.stations.find((s) => s.id === "PLAN");
  if (t.type === "FEATURE" && !t.stages.has("tested") && !t.stages.has("coded")) {
    return state.stations.find((s) => s.id === "TDD");
  }
  if (!t.stages.has("coded")) return state.stations.find((s) => s.id === "CODE");
  return state.stations.find((s) => s.id === "PR");
}
