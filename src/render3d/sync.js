// Reconciliación state→scene por frame: Maps id→mesh, crear si falta,
// actualizar posiciones/efectos, eliminar (con animación de salida) si sobra.
// Sin ECS: la escena es función del mismo estado 2D que usaba el render plano.
import { CONTEXT_MAX } from "../config.js";
import { anyPlayerNearStation, nearestStation } from "../geometry.js";
import { getThree } from "./scene.js";
import { pxToWorldX, pxToWorldZ } from "./project.js";
import {
  makeStationGroup,
  makeChefGroup,
  makeSubagentGroup,
  makeTicketGroup,
  PALETTE,
} from "./models.js";
import { ticketCardTexture, ticketTextureKey, disposeTicketTextures, stationPlateTexture, stationPlateKey, dropCachedTexture } from "./labels.js";

const maps = {
  stations: new Map(),
  tickets: new Map(),
  players: new Map(),
  subagents: new Map(),
};
const dying = [];
let lastSyncT = 0;
let lastShipped = 0;
let lastContext = 0;
let shipFxT = -1; // instante del último envío (anima el anillo en PR)

function easeOutBack(k) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
}

// Amortiguación exponencial independiente del framerate.
function damp(cur, target, lambda, dt) {
  return cur + (target - cur) * (1 - Math.exp(-lambda * dt));
}

function dampAngle(cur, target, lambda, dt) {
  let d = target - cur;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return cur + d * (1 - Math.exp(-lambda * dt));
}

export function syncScene(state, hint) {
  const { scene } = getThree();
  const t = performance.now() / 1000;
  const dt = Math.min(0.05, lastSyncT ? t - lastSyncT : 0.016);
  lastSyncT = t;

  // Eventos detectados por diff de contadores (el estado no emite eventos).
  if (state.shipped > lastShipped) shipFxT = t;
  if (state.shipped < lastShipped) shipFxT = -1; // nueva partida
  lastShipped = state.shipped;
  const draining = state.context < lastContext - 0.001;
  lastContext = state.context;

  reconcile(scene, t, maps.stations, state.stations, (s) => s.id, makeStationGroup, (g, s) =>
    updateStation(g, s, state, hint, t, draining),
  );
  reconcile(scene, t, maps.players, state.players, (p) => p.cfg.id, (p) => makeChefGroup(p.cfg), (g, p) =>
    updateChef(g, p, state, t, dt),
  );
  reconcile(scene, t, maps.subagents, state.subagents, (sa) => "sa" + sa.idx, makeSubagentGroup, (g, sa) =>
    updateSubagent(g, sa, t, dt),
  );
  reconcile(scene, t, maps.tickets, collectTickets(state), (pl) => pl.t.id, (pl) => makeTicketGroup(pl.t), (g, pl) =>
    updateTicket(g, pl, t, dt),
  );

  updateDying(scene, t);
}

function reconcile(scene, t, map, items, keyOf, create, update) {
  const seen = new Set();
  for (const item of items) {
    const key = keyOf(item);
    seen.add(key);
    let g = map.get(key);
    if (!g) {
      g = create(item);
      g.userData.spawnT = t;
      scene.add(g);
      map.set(key, g);
    }
    update(g, item);
    // Pop-in con overshoot al aparecer
    const age = t - g.userData.spawnT;
    const base = age < 0.25 ? Math.max(0.001, easeOutBack(age / 0.25)) : 1;
    const pulse = g.userData.pulse || 1;
    g.scale.setScalar(base * pulse);
  }
  for (const [key, g] of map) {
    if (!seen.has(key)) {
      map.delete(key);
      dying.push({ g, t0: t });
      if (g.userData.kind === "ticket") disposeTicketTextures(g.userData.ticketId);
    }
  }
}

// Animación de salida: encoge y se hunde, luego se libera la GPU.
function updateDying(scene, t) {
  for (let i = dying.length - 1; i >= 0; i--) {
    const { g, t0 } = dying[i];
    const k = (t - t0) / 0.22;
    if (k >= 1) {
      scene.remove(g);
      disposeGroup(g);
      dying.splice(i, 1);
    } else {
      g.scale.setScalar(Math.max(0.001, 1 - k));
      g.position.y -= 0.012;
    }
  }
}

function disposeGroup(g) {
  g.traverse((o) => {
    if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
    const m = o.material;
    if (m && !(m.userData && m.userData.shared)) m.dispose();
  });
}

// ── Estaciones ─────────────────────────────────────────────────────────────

function updateStation(g, s, state, hint, t, draining) {
  const ud = g.userData;

  // Highlight de proximidad (alfombrilla)
  const near = anyPlayerNearStation(s, state.players);
  ud.highlightMat.opacity = near ? 0.34 : 0.1;
  ud.highlightMat.color.set(near ? ud.accent : PALETTE.ink);

  // Spotlight + flecha del tutorial
  const spot = !!(hint && hint.stationId === s.id);
  ud.spotlight.visible = spot;
  ud.arrow.visible = spot;
  if (spot) {
    const pulse = (Math.sin(t * 5) + 1) / 2;
    ud.spotMat.opacity = 0.4 + pulse * 0.45;
    ud.spotlight.scale.setScalar(1 + pulse * 0.07);
    ud.arrow.position.y = 4.7 + Math.sin(t * 4) * 0.28;
    ud.arrow.rotation.y = t * 2.2;
  }

  // Placa: se rehace si cambia su contenido (p.ej. s.time con la skill MODEL)
  const pk = stationPlateKey(s, ud.accent);
  if (pk !== ud.plateKey) {
    dropCachedTexture(ud.plateKey);
    ud.plateKey = pk;
    ud.plate.material.map = stationPlateTexture(s, ud.accent);
    ud.plate.material.needsUpdate = true;
  }

  // La barra de progreso vive en el overlay 2D (overlay.js): siempre visible.
  const front = s.kind === "process" && s.queue.length > 0 ? s.queue[0] : null;
  const processing = !!front && front.progress < 1;

  switch (s.id) {
    case "INBOX": {
      const n = state.inbox.length;
      const pressure = n >= 5 ? 2 : n >= 3 ? 1 : 0;
      if (pressure > 0) {
        const pulse = (Math.sin(t * (pressure === 2 ? 8 : 5)) + 1) / 2;
        ud.fx.panelMat.emissive.set(pressure === 2 ? PALETTE.bug : PALETTE.warn);
        ud.fx.panelMat.emissiveIntensity = 0.25 + pulse * 0.5;
        ud.fx.bell.position.y = ud.fx.bellY + Math.abs(Math.sin(t * 6)) * 0.18 * pressure;
      } else {
        ud.fx.panelMat.emissiveIntensity = 0;
        ud.fx.bell.position.y = ud.fx.bellY;
      }
      break;
    }
    case "PLAN": {
      ud.fx.chalk.visible = processing;
      if (processing) {
        ud.fx.chalk.position.x = Math.sin(t * 7) * 0.6;
        ud.fx.chalk.position.y = ud.fx.chalkBase.y + Math.sin(t * 13) * 0.07;
        ud.fx.frameMat.emissive.set("#6C8FE0");
        ud.fx.frameMat.emissiveIntensity = 0.3 + ((Math.sin(t * 6) + 1) / 2) * 0.4;
      } else {
        ud.fx.frameMat.emissiveIntensity = 0;
      }
      break;
    }
    case "TDD": {
      ud.fx.needle.rotation.z = Math.PI / 2 + (processing ? Math.sin(t * 9) * 0.9 : 0);
      ud.fx.scalePlate.position.y = ud.fx.scalePlateY + (processing ? Math.sin(t * 9) * 0.05 : 0);
      break;
    }
    case "CODE": {
      for (let i = 0; i < ud.fx.flames.length; i++) {
        const f = ud.fx.flames[i];
        f.visible = processing;
        if (processing) {
          f.scale.y = 0.75 + (Math.sin(t * 12 + i * 2.1) + 1) * 0.35;
          f.position.y = f.userData.baseY + f.scale.y * 0.12;
        }
      }
      for (let i = 0; i < ud.fx.smoke.length; i++) {
        const sp = ud.fx.smoke[i];
        sp.visible = processing;
        if (processing) {
          const cycle = (t * 0.45 + i / ud.fx.smoke.length) % 1;
          sp.position.y = 2.1 + cycle * 2.1;
          sp.position.x = (i - 1.5) * 0.3 + Math.sin(t * 2 + i) * 0.15;
          sp.material.opacity = 0.4 * (1 - cycle);
          const sc = 0.5 + cycle * 1.0;
          sp.scale.set(sc, sc, 1);
        }
      }
      ud.fx.fire.intensity = processing ? 0.5 + Math.sin(t * 10) * 0.22 : 0;
      ud.fx.doorMat.emissive.set(PALETTE.feature);
      ud.fx.doorMat.emissiveIntensity = processing ? 0.35 + ((Math.sin(t * 8) + 1) / 2) * 0.25 : 0;
      break;
    }
    case "PR": {
      ud.fx.lampMat.emissiveIntensity = s.holds ? 1.6 : 0.4;
      const k = shipFxT >= 0 ? (t - shipFxT) / 0.6 : 2;
      if (k < 1) {
        ud.fx.shipRing.visible = true;
        ud.fx.shipRing.scale.setScalar(1 + k * 2.4);
        ud.fx.shipRingMat.opacity = 0.9 * (1 - k);
        ud.fx.bell.position.y = ud.fx.bellY + Math.abs(Math.sin(k * Math.PI * 3)) * 0.22 * (1 - k);
      } else {
        ud.fx.shipRing.visible = false;
        ud.fx.bell.position.y = ud.fx.bellY;
      }
      break;
    }
    case "COMPACT": {
      ud.fx.stream.visible = draining;
      ud.fx.vortex.visible = draining;
      if (draining) {
        ud.fx.vortex.rotation.z = t * 9;
        const vs = 0.8 + ((Math.sin(t * 8) + 1) / 2) * 0.5;
        ud.fx.vortex.scale.set(vs, vs, 1);
      }
      if (state.context >= 80) {
        const pulse = (Math.sin(t * 6) + 1) / 2;
        ud.fx.warnRing.visible = true;
        ud.fx.warnMat.color.set(state.context >= CONTEXT_MAX ? PALETTE.bug : PALETTE.warn);
        ud.fx.warnMat.opacity = 0.4 + pulse * 0.5;
        ud.fx.warnRing.scale.setScalar(1 + pulse * 0.06);
      } else {
        ud.fx.warnRing.visible = false;
      }
      break;
    }
    default: {
      if (s.kind === "subagent_box") {
        const sa = state.subagents[s.subagentIdx];
        const active = sa && sa.state !== "idle";
        ud.fx.dockRing.visible = !!active;
        if (active) ud.fx.dockRing.rotation.z = t * 3;
      }
    }
  }
}

// ── Chefs ──────────────────────────────────────────────────────────────────

function updateChef(g, p, state, t, dt) {
  const ud = g.userData;
  g.position.x = pxToWorldX(p.x);
  g.position.z = pxToWorldZ(p.y);
  g.rotation.y = dampAngle(g.rotation.y, Math.atan2(p.faceX, p.faceY), 14, dt);

  // Bob + squash al caminar, respiración en idle
  const bob = p.isMoving ? Math.abs(Math.sin(p.stepPhase)) * 0.14 : Math.sin(t * 2) * 0.025;
  ud.rig.position.y = bob;
  const sq = p.isMoving ? 1 + Math.sin(p.stepPhase * 2) * 0.045 : 1 + Math.sin(t * 2) * 0.012;
  ud.rig.scale.y = sq;
  ud.rig.scale.x = ud.rig.scale.z = 1 - (sq - 1) * 0.6;
  // Lean hacia la marcha
  ud.rig.rotation.x = damp(ud.rig.rotation.x, p.isMoving ? 0.16 : 0, 10, dt);

  // Pasos: pies alternantes a lo largo del facing local
  const amp = 0.26;
  const s1 = p.isMoving ? Math.sin(p.stepPhase) * amp : 0;
  ud.feet[0].position.z = s1;
  ud.feet[1].position.z = -s1;

  // Brazos en alto cuando lleva un plato
  const armX = p.holding ? 2.75 : 0;
  for (const arm of ud.arms) arm.rotation.x = damp(arm.rotation.x, armX, 12, dt);

  // Anillo de interacción
  ud.ring.visible = !!nearestStation(p, state.stations);
}

// ── Subagentes ─────────────────────────────────────────────────────────────

function updateSubagent(g, sa, t, dt) {
  const ud = g.userData;
  g.visible = sa.state !== "idle";
  if (!g.visible) return;
  g.position.x = pxToWorldX(sa.x);
  g.position.z = pxToWorldZ(sa.y);
  g.rotation.y = dampAngle(g.rotation.y, Math.atan2(sa.faceX, sa.faceY), 12, dt);
  ud.rig.position.y = 0.16 + Math.sin(t * 3 + sa.idx * 1.7) * 0.06;
  ud.rig.rotation.x = damp(ud.rig.rotation.x, sa.isMoving ? 0.12 : 0, 8, dt);
  // Antena parpadeante
  const blink = (Math.sin(t * 5) + 1) / 2;
  ud.antennaTip.scale.setScalar(0.8 + blink * 0.5);
}

// ── Tickets ────────────────────────────────────────────────────────────────

// Enumera todos los tickets visibles y dónde están (el estado no tiene esta
// lista unificada): inbox, colas de proceso, pase de PR, manos y subagentes.
function collectTickets(state) {
  const out = [];
  const inboxS = state.stations.find((s) => s.id === "INBOX");
  for (let i = 0; i < state.inbox.length; i++) {
    out.push({ t: state.inbox[i], kind: "inbox", s: inboxS, i });
  }
  for (const s of state.stations) {
    if (s.kind === "process") {
      for (let i = 0; i < s.queue.length; i++) {
        out.push({ t: s.queue[i].ticket, kind: "queue", s, i });
      }
    } else if (s.kind === "ship" && s.holds) {
      out.push({ t: s.holds, kind: "ship", s });
    }
  }
  for (const p of state.players) {
    if (p.holding) out.push({ t: p.holding, kind: "held", x: p.x, y: p.y, h: 2.9 });
  }
  for (const sa of state.subagents) {
    if (sa.ticket) out.push({ t: sa.ticket, kind: "held", x: sa.x, y: sa.y, h: 1.9 });
  }
  return out;
}

function ticketTarget(pl) {
  if (pl.kind === "inbox") {
    // En fila sobre la encimera del INBOX, frente a la ventanilla
    const sx = pxToWorldX(pl.s.x);
    const sz = pxToWorldZ(pl.s.y);
    return { x: sx - 1.4 + Math.min(pl.i, 3) * 0.8, y: 1.72, z: sz + 0.55, visible: pl.i < 4, scale: 0.75 };
  }
  if (pl.kind === "queue") {
    const sx = pxToWorldX(pl.s.x);
    const sz = pxToWorldZ(pl.s.y);
    if (pl.i === 0) return { x: sx, y: 1.66, z: sz + 0.5, visible: true, scale: 1 };
    return { x: sx - 1.1 - 0.6 * (pl.i - 1), y: 1.7 + 0.05 * pl.i, z: sz - 0.4, visible: true, scale: 0.74 };
  }
  if (pl.kind === "ship") {
    const sx = pxToWorldX(pl.s.x);
    const sz = pxToWorldZ(pl.s.y);
    return { x: sx + 0.1, y: 1.5, z: sz, visible: true, scale: 1 };
  }
  // held: sobre la cabeza del chef / la cúpula del robot
  return { x: pxToWorldX(pl.x), y: pl.h, z: pxToWorldZ(pl.y), visible: true, scale: 1 };
}

function updateTicket(g, pl, t, dt) {
  const ud = g.userData;
  const target = ticketTarget(pl);
  g.visible = target.visible;
  const isNew = t - ud.spawnT < 0.02;
  if (isNew) {
    g.position.set(target.x, target.y, target.z);
  } else {
    const k = 1 - Math.exp(-14 * dt);
    g.position.x += (target.x - g.position.x) * k;
    g.position.y += (target.y - g.position.y) * k;
    g.position.z += (target.z - g.position.z) * k;
  }

  // La tarjeta se re-rasteriza SOLO cuando cambian los sellos de stages
  const key = ticketTextureKey(pl.t);
  if (key !== ud.cardKey) {
    disposeTicketTextures(ud.ticketId); // borra la textura del estado anterior
    ud.cardKey = key;
    ud.cardMat.map = ticketCardTexture(pl.t);
    ud.cardMat.needsUpdate = true;
  }

  // Barra de tiempo con los mismos umbrales que el 2D
  const pct = Math.max(0, pl.t.timeLeft / pl.t.maxTime);
  ud.barFill.scale.x = Math.max(0.001, pct * 1.08);
  ud.barMat.color.set(pct < 0.25 ? PALETTE.bug : pct < 0.5 ? PALETTE.warn : PALETTE.ok);

  // Crítico: parpadeo del borde + pulso del plato
  let pulse = target.scale;
  if (pct < 0.25) {
    const blink = (Math.sin(t * 10) + 1) / 2;
    ud.rimMat.color.set(blink > 0.5 ? PALETTE.bug : PALETTE.cream);
    pulse = target.scale * (1 + blink * 0.06);
  } else {
    ud.rimMat.color.set(pl.t.type === "BUG" ? PALETTE.bug : PALETTE.feature);
  }
  ud.pulse = pulse;
}
