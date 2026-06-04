// Fábricas de meshes: muebles de cocina por estación, chefs chibi, robots
// subagente, platos-ticket y entorno. Geometrías y materiales compartidos en
// caché (marcados shared para que el dispose de sync.js no los libere); los
// que se animan por frame usan materiales propios (uniqueMat).
import { pxToWorldX, pxToWorldZ, pxToWorld, BILLBOARD_RX } from "./project.js";
import {
  floorTexture,
  tilesTexture,
  chalkTexture,
  dialTexture,
  smokeTexture,
  logoTexture,
  tagTexture,
  stationPlateTexture,
  stationPlateKey,
  ticketCardTexture,
  ticketTextureKey,
} from "./labels.js";

export const PALETTE = {
  sky: "#FCEFD6",
  counter: "#E8E0D0",
  cabinet: "#5BB5C9",
  wood: "#B5793C",
  cream: "#FAF6EE",
  steel: "#C9CDD4",
  steelDark: "#8A94A6",
  sinkInner: "#6F7889",
  skin: "#F2C9A0",
  ink: "#1A1611",
  ink2: "#2C2620",
  bug: "#E5484D",
  feature: "#F2820D",
  warn: "#F2B70D",
  ok: "#3FB68B",
  sub: "#FFC94D",
  glass: "#3A2E26",
  accent: "#D97757",
  rug: "#E89B7A",
  plant: "#5FA84A",
  pot: "#C26B3E",
};

export const STATION_ACCENT = {
  INBOX: "#F2820D",
  PLAN: "#6C8FE0",
  TDD: "#9B6CD9",
  CODE: "#E5484D",
  PR: "#3FB68B",
  COMPACT: "#8A94A6",
};

// Tapa pastel por estación: identifica cada mueble de un vistazo (Overcooked).
const STATION_PASTEL = {
  INBOX: "#FFD9A8",
  PLAN: "#C9D7F7",
  TDD: "#E2D2F7",
  CODE: "#F7C8C8",
  PR: "#C8EBD9",
  COMPACT: "#D7DCE4",
};

// ── Cachés de geometrías y materiales compartidos ──────────────────────────

const GEOS = new Map();
function q(n) {
  return Math.round(n * 100) / 100;
}
function geo(kind, ...args) {
  const key = kind + ":" + args.map(q).join(",");
  let g = GEOS.get(key);
  if (!g) {
    if (kind === "box") g = new THREE.BoxGeometry(...args);
    else if (kind === "lbox") {
      // Caja anclada por la izquierda (para barras que escalan en X)
      g = new THREE.BoxGeometry(...args);
      g.translate(args[0] / 2, 0, 0);
    } else if (kind === "cyl") g = new THREE.CylinderGeometry(...args);
    else if (kind === "sphere") g = new THREE.SphereGeometry(...args);
    else if (kind === "hemi") g = new THREE.SphereGeometry(args[0], 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    else if (kind === "cone") g = new THREE.ConeGeometry(...args);
    else if (kind === "torus") g = new THREE.TorusGeometry(...args);
    else if (kind === "plane") g = new THREE.PlaneGeometry(...args);
    else if (kind === "circle") g = new THREE.CircleGeometry(...args);
    else if (kind === "capsule") g = new THREE.CapsuleGeometry(...args);
    else throw new Error("geo desconocida: " + kind);
    g.userData.shared = true;
    GEOS.set(key, g);
  }
  return g;
}

function buildMat(color, opts) {
  const m = opts.basic ? new THREE.MeshBasicMaterial({ color }) : new THREE.MeshLambertMaterial({ color });
  if (opts.map) m.map = opts.map;
  if (opts.emissive && !opts.basic) m.emissive = new THREE.Color(opts.emissive);
  if (opts.opacity !== undefined && opts.opacity < 1) {
    m.transparent = true;
    m.opacity = opts.opacity;
  }
  if (opts.transparent) m.transparent = true;
  if (opts.alphaTest) m.alphaTest = opts.alphaTest;
  if (opts.double) m.side = THREE.DoubleSide;
  return m;
}

const MATS = new Map();
export function mat(color, opts = {}) {
  const key = [color, opts.basic ? 1 : 0, opts.emissive || "", opts.opacity ?? 1, opts.double ? 1 : 0].join("|");
  let m = MATS.get(key);
  if (!m) {
    m = buildMat(color, opts);
    m.userData.shared = true;
    MATS.set(key, m);
  }
  return m;
}

export function uniqueMat(color, opts = {}) {
  return buildMat(color, opts);
}

function mesh(g, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  return o;
}

function box(w, h, d, m, x, y, z) {
  return mesh(geo("box", w, h, d), m, x, y, z);
}

// Plano con textura orientado a la cámara ortográfica (billboard estático).
function billboard(texture, w, h, opts = {}) {
  const m = uniqueMat("#FFFFFF", { basic: true, map: texture, transparent: true, alphaTest: 0.05, ...opts });
  const p = mesh(geo("plane", w, h), m);
  p.rotation.x = BILLBOARD_RX;
  return p;
}

// ── Entorno estático ───────────────────────────────────────────────────────

function freeze(o) {
  o.updateMatrix();
  o.matrixAutoUpdate = false;
  return o;
}

export function buildEnvironment(scene) {
  // Suelo de baldosas
  const ft = floorTexture();
  ft.wrapS = THREE.RepeatWrapping;
  ft.wrapT = THREE.RepeatWrapping;
  ft.repeat.set(12, 7.5);
  const floor = mesh(geo("plane", 48, 30), uniqueMat("#FFFFFF", { map: ft }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(freeze(floor));

  // Pared trasera con azulejos + moldura de madera
  const wallZ = -8.2;
  const wall = box(48, 7.5, 0.5, mat("#7FCBA4"), 0, 3.75, wallZ);
  wall.receiveShadow = true;
  scene.add(freeze(wall));
  const tt = tilesTexture();
  tt.wrapS = THREE.RepeatWrapping;
  tt.wrapT = THREE.RepeatWrapping;
  tt.repeat.set(12, 2);
  const splash = mesh(geo("plane", 48, 3.4), uniqueMat("#FFFFFF", { basic: true, map: tt }), 0, 1.7, wallZ + 0.26);
  scene.add(freeze(splash));
  scene.add(freeze(box(48, 0.32, 0.8, mat(PALETTE.wood), 0, 3.6, wallZ + 0.2)));

  // Paredes laterales bajas
  for (const side of [-1, 1]) {
    const sw = box(0.5, 3.4, 30, mat("#8FD3B0"), side * 16.9, 1.7, -1);
    sw.receiveShadow = true;
    scene.add(freeze(sw));
  }

  // Encimera continua (más baja que los muebles, que sobresalen por encima)
  const counterZ = pxToWorldZ(330);
  const counter = box(26.2, 1.06, 2.4, mat(PALETTE.cabinet), -1.4, 0.53, counterZ);
  counter.castShadow = true;
  counter.receiveShadow = true;
  scene.add(freeze(counter));
  scene.add(freeze(box(26.4, 0.1, 2.6, mat(PALETTE.counter), -1.4, 1.11, counterZ)));

  // Alfombra circular sutil que ancla la zona de juego
  const rug = mesh(geo("circle", 3.6, 36), uniqueMat(PALETTE.rug, { opacity: 0.22 }), 0, 0.015, 1.6);
  rug.rotation.x = -Math.PI / 2;
  rug.receiveShadow = true;
  scene.add(freeze(rug));

  // Props: plantas en las esquinas
  for (const [px, pz] of [
    [-15.6, 5.6],
    [15.6, -6.2],
  ]) {
    const plant = new THREE.Group();
    plant.position.set(px, 0, pz);
    plant.add(mesh(geo("cyl", 0.42, 0.55, 0.7, 14), mat(PALETTE.pot), 0, 0.35, 0));
    plant.add(mesh(geo("sphere", 0.55, 12, 9), mat(PALETTE.plant), 0, 1.0, 0));
    plant.add(mesh(geo("sphere", 0.4, 12, 9), mat(PALETTE.plant), 0.3, 1.35, 0.1));
    plant.add(mesh(geo("sphere", 0.34, 12, 9), mat(PALETTE.plant), -0.28, 1.3, -0.08));
    scene.add(freeze(plant));
  }

  // Estante flotante con tarros
  const shelf = new THREE.Group();
  shelf.position.set(-6, 3.6, wallZ + 0.5);
  shelf.add(box(4.2, 0.16, 0.8, mat(PALETTE.wood), 0, 0, 0));
  shelf.add(mesh(geo("cyl", 0.22, 0.22, 0.5, 12), mat(PALETTE.feature), -1.4, 0.34, 0));
  shelf.add(mesh(geo("cyl", 0.2, 0.2, 0.62, 12), mat(PALETTE.cabinet), -0.6, 0.4, 0));
  shelf.add(mesh(geo("cyl", 0.24, 0.24, 0.42, 12), mat(PALETTE.ok), 0.4, 0.3, 0));
  shelf.add(mesh(geo("cyl", 0.18, 0.18, 0.56, 12), mat(PALETTE.bug), 1.3, 0.37, 0));
  scene.add(freeze(shelf));

  // Reloj de pared
  const clock = new THREE.Group();
  clock.position.set(9, 4.35, wallZ + 0.4);
  clock.add(mesh(geo("cyl", 0.62, 0.62, 0.14, 24), mat(PALETTE.cream)));
  clock.children[0].rotation.x = Math.PI / 2;
  clock.add(box(0.05, 0.4, 0.04, mat(PALETTE.ink), 0, 0.12, 0.09));
  clock.add(box(0.05, 0.3, 0.04, mat(PALETTE.accent), 0.1, 0.06, 0.1));
  scene.add(freeze(clock));
}

// ── Estaciones como muebles ────────────────────────────────────────────────

function buildBase(g, fp, ud, h = 1.5) {
  const cab = box(fp.w, h, fp.d, mat(PALETTE.cabinet), 0, h / 2, 0);
  cab.castShadow = true;
  cab.receiveShadow = true;
  g.add(cab);
  // Tapa pastel del color de la estación (identificación de un vistazo)
  const top = box(fp.w + 0.16, 0.14, fp.d + 0.16, mat(ud.pastel), 0, h + 0.07, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  g.add(top);
  // Banda frontal de acento
  g.add(box(fp.w + 0.02, 0.18, 0.06, mat(ud.accent), 0, h - 0.16, fp.d / 2 + 0.02));
  return h + 0.14;
}

function buildInbox(g, fp, ud) {
  const topY = buildBase(g, fp, ud);
  // Panel-buzón trasero (pulsa con la presión de la cola)
  ud.fx.panelMat = uniqueMat(PALETTE.feature, { emissive: "#000000" });
  const panel = box(fp.w * 0.74, 1.35, 0.14, ud.fx.panelMat, 0, topY + 0.85, -fp.d * 0.22);
  panel.castShadow = true;
  g.add(panel);
  // Marco de ventanilla blanco
  const fm = mat(PALETTE.cream);
  g.add(box(0.18, 1.5, 0.18, fm, -fp.w * 0.42, topY + 0.75, 0));
  g.add(box(0.18, 1.5, 0.18, fm, fp.w * 0.42, topY + 0.75, 0));
  g.add(box(fp.w * 0.92, 0.18, 0.18, fm, 0, topY + 1.55, 0));
  // Rail metálico para colgar comandas
  const rail = mesh(geo("cyl", 0.04, 0.04, fp.w * 0.9, 10), mat("#7A828E"), 0, topY + 1.06, fp.d * 0.3);
  rail.rotation.z = Math.PI / 2;
  g.add(rail);
  // Campanita dorada
  ud.fx.bell = mesh(geo("hemi", 0.2), mat(PALETTE.sub), fp.w * 0.32, topY + 0.12, fp.d * 0.28);
  ud.fx.bellY = topY + 0.12;
  g.add(ud.fx.bell);
}

function buildPlan(g, fp, ud) {
  const topY = buildBase(g, fp, ud);
  // Pizarra de menú con marco de madera
  const board = new THREE.Group();
  board.position.set(0, topY + 1.0, -fp.d * 0.26);
  board.rotation.x = -0.12;
  ud.fx.frameMat = uniqueMat(STATION_ACCENT.PLAN, { emissive: "#000000" });
  board.add(box(2.5, 1.7, 0.1, mat(PALETTE.wood), 0, 0, -0.03));
  board.add(box(2.56, 0.14, 0.16, ud.fx.frameMat, 0, 0.86, 0));
  board.add(box(2.56, 0.14, 0.16, ud.fx.frameMat, 0, -0.86, 0));
  board.add(mesh(geo("plane", 2.3, 1.5), uniqueMat("#FFFFFF", { basic: true, map: chalkTexture() }), 0, 0, 0.04));
  board.children[0].castShadow = true;
  g.add(board);
  // Tiza flotante (visible solo procesando)
  ud.fx.chalk = mesh(geo("cyl", 0.05, 0.05, 0.34, 8), mat(PALETTE.cream), 0, topY + 1.0, -fp.d * 0.26 + 0.25);
  ud.fx.chalk.rotation.z = Math.PI / 2.4;
  ud.fx.chalk.visible = false;
  ud.fx.chalkBase = { y: topY + 1.0, z: -fp.d * 0.26 + 0.25 };
  g.add(ud.fx.chalk);
  // Tabla de cortar
  g.add(box(1.5, 0.12, 0.95, mat(PALETTE.wood), 0.3, topY + 0.06, fp.d * 0.18));
}

function buildTdd(g, fp, ud) {
  const topY = buildBase(g, fp, ud);
  // Báscula: columna + plato
  g.add(mesh(geo("cyl", 0.13, 0.2, 0.75, 12), mat(PALETTE.steel), -0.4, topY + 0.37, -0.2));
  ud.fx.scalePlate = mesh(geo("cyl", 0.62, 0.56, 0.1, 20), mat("#A9AEB8"), -0.4, topY + 0.8, -0.2);
  ud.fx.scalePlateY = topY + 0.8;
  ud.fx.scalePlate.castShadow = true;
  g.add(ud.fx.scalePlate);
  // Dial con aguja morada
  const dial = new THREE.Group();
  dial.position.set(0.85, topY + 0.45, fp.d * 0.2);
  const face = billboard(dialTexture(), 0.72, 0.72);
  dial.add(face);
  ud.fx.needle = mesh(geo("lbox", 0.26, 0.05, 0.03), uniqueMat(STATION_ACCENT.TDD, { basic: true }));
  ud.fx.needle.rotation.x = BILLBOARD_RX;
  ud.fx.needle.position.z = 0.03;
  ud.fx.needle.rotation.z = Math.PI / 2;
  dial.add(ud.fx.needle);
  g.add(dial);
}

function buildCode(g, fp, ud) {
  const h = 1.7;
  const body = box(fp.w, h, fp.d, mat(PALETTE.cream), 0, h / 2, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);
  g.add(box(fp.w + 0.16, 0.14, fp.d + 0.16, mat(ud.pastel), 0, h + 0.07, 0));
  g.add(box(fp.w + 0.02, 0.18, 0.06, mat(ud.accent), 0, h - 0.16, fp.d / 2 + 0.02));
  // Puerta de horno con cristal (brilla al procesar)
  ud.fx.doorMat = uniqueMat(PALETTE.glass, { emissive: "#000000" });
  g.add(box(fp.w * 0.66, 1.0, 0.1, ud.fx.doorMat, 0, 0.78, fp.d / 2 + 0.02));
  const handle = mesh(geo("cyl", 0.045, 0.045, fp.w * 0.6, 10), mat(PALETTE.steel), 0, 1.42, fp.d / 2 + 0.12);
  handle.rotation.z = Math.PI / 2;
  g.add(handle);
  // Perillas rojas
  for (let i = 0; i < 4; i++) {
    const knob = mesh(
      geo("cyl", 0.07, 0.07, 0.1, 10),
      mat(STATION_ACCENT.CODE),
      -fp.w * 0.3 + i * fp.w * 0.2,
      1.6,
      fp.d / 2 + 0.06,
    );
    knob.rotation.x = Math.PI / 2;
    g.add(knob);
  }
  // Quemadores + llamas (ocultas salvo procesando)
  ud.fx.flames = [];
  for (const bx of [-fp.w * 0.22, fp.w * 0.22]) {
    const burner = mesh(geo("torus", 0.34, 0.06, 8, 24), mat(PALETTE.ink2), bx, h + 0.16, 0);
    burner.rotation.x = -Math.PI / 2;
    g.add(burner);
    for (let i = 0; i < 3; i++) {
      const fm = uniqueMat(i === 1 ? PALETTE.warn : PALETTE.feature, { basic: true, opacity: 0.92 });
      const flame = mesh(geo("cone", 0.16, 0.5, 10), fm, bx + (i - 1) * 0.17, h + 0.42, 0);
      flame.visible = false;
      flame.userData.baseY = h + 0.42;
      ud.fx.flames.push(flame);
      g.add(flame);
    }
  }
  // Humo (sprites reciclados)
  ud.fx.smoke = [];
  for (let i = 0; i < 4; i++) {
    const sm = new THREE.SpriteMaterial({ map: smokeTexture(), transparent: true, opacity: 0 });
    const sp = new THREE.Sprite(sm);
    sp.position.set((i - 1.5) * 0.3, h + 0.8, 0);
    sp.scale.set(0.7, 0.7, 1);
    sp.visible = false;
    ud.fx.smoke.push(sp);
    g.add(sp);
  }
  // Luz de fuego
  ud.fx.fire = new THREE.PointLight(PALETTE.feature, 0, 7);
  ud.fx.fire.position.set(0, h + 1.2, 0.4);
  g.add(ud.fx.fire);
}

function buildPr(g, fp, ud) {
  const h = 1.35;
  const body = box(fp.w, h, fp.d, mat(PALETTE.counter), 0, h / 2, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);
  g.add(box(fp.w + 0.14, 0.1, fp.d + 0.14, mat(ud.pastel), 0, h + 0.05, 0));
  // Banda de acento verde "ship"
  g.add(box(fp.w + 0.02, 0.22, fp.d + 0.02, mat(STATION_ACCENT.PR), 0, h - 0.3, 0));
  // Lámpara de calor colgante
  const pole = mesh(geo("cyl", 0.06, 0.06, 2.3, 10), mat(PALETTE.steelDark), -fp.w * 0.38, h + 1.15, -fp.d * 0.3);
  g.add(pole);
  const arm = mesh(geo("cyl", 0.05, 0.05, fp.w * 0.5, 8), mat(PALETTE.steelDark), -fp.w * 0.13, h + 2.25, -fp.d * 0.15);
  arm.rotation.z = Math.PI / 2;
  arm.rotation.y = 0.45;
  g.add(arm);
  const shade = mesh(geo("cone", 0.55, 0.55, 18), mat(PALETTE.steelDark), 0.1, h + 1.95, 0);
  g.add(shade);
  ud.fx.lampMat = uniqueMat(PALETTE.warn, { emissive: "#553300" });
  g.add(mesh(geo("cyl", 0.3, 0.3, 0.06, 14), ud.fx.lampMat, 0.1, h + 1.68, 0));
  // Campana de servir
  ud.fx.bell = mesh(geo("hemi", 0.3), mat(PALETTE.steel), fp.w * 0.32, h + 0.1, fp.d * 0.2);
  ud.fx.bellY = h + 0.1;
  g.add(ud.fx.bell);
  // Anillo de celebración al enviar
  ud.fx.shipRingMat = uniqueMat(STATION_ACCENT.PR, { basic: true, opacity: 0.9 });
  ud.fx.shipRing = mesh(geo("torus", 0.9, 0.08, 8, 36), ud.fx.shipRingMat, 0, h + 0.4, 0);
  ud.fx.shipRing.rotation.x = -Math.PI / 2;
  ud.fx.shipRing.visible = false;
  g.add(ud.fx.shipRing);
}

function buildCompact(g, fp, ud) {
  const h = 1.35;
  const body = box(fp.w, h, fp.d, mat(PALETTE.steelDark), 0, h / 2, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);
  // Borde superior + seno hundido + triturador
  g.add(box(fp.w + 0.14, 0.1, fp.d + 0.14, mat(PALETTE.steel), 0, h + 0.05, 0));
  g.add(box(fp.w - 0.8, 0.1, fp.d - 0.8, mat(PALETTE.sinkInner), 0, h + 0.06, 0));
  const drain = mesh(geo("cyl", 0.3, 0.3, 0.04, 16), mat(PALETTE.ink2), 0, h + 0.12, 0);
  g.add(drain);
  // Grifo
  g.add(mesh(geo("cyl", 0.06, 0.08, 1.0, 10), mat(PALETTE.steel), 0, h + 0.5, -fp.d * 0.32));
  const spout = mesh(geo("cyl", 0.05, 0.05, 0.7, 10), mat(PALETTE.steel), 0, h + 1.0, -fp.d * 0.32 + 0.32);
  spout.rotation.x = Math.PI / 2;
  g.add(spout);
  // Chorro de agua (visible drenando)
  ud.fx.stream = mesh(geo("cyl", 0.05, 0.07, 0.85, 8), uniqueMat(PALETTE.cabinet, { opacity: 0.55 }), 0, h + 0.55, -fp.d * 0.32 + 0.62);
  ud.fx.stream.visible = false;
  g.add(ud.fx.stream);
  // Remolino
  ud.fx.vortex = mesh(geo("torus", 0.4, 0.05, 8, 24), uniqueMat(PALETTE.cabinet, { basic: true, opacity: 0.7 }), 0, h + 0.14, 0);
  ud.fx.vortex.rotation.x = -Math.PI / 2;
  ud.fx.vortex.visible = false;
  g.add(ud.fx.vortex);
  // Anillo de aviso de contexto alto
  ud.fx.warnMat = uniqueMat(PALETTE.warn, { basic: true, opacity: 0.85 });
  ud.fx.warnRing = mesh(geo("torus", Math.max(fp.w, fp.d) * 0.56, 0.08, 8, 36), ud.fx.warnMat, 0, h + 0.2, 0);
  ud.fx.warnRing.rotation.x = -Math.PI / 2;
  ud.fx.warnRing.visible = false;
  g.add(ud.fx.warnRing);
}

function buildDock(g, fp, ud) {
  const plat = box(fp.w, 0.24, fp.d, mat(PALETTE.sub), 0, 0.12, 0);
  plat.castShadow = true;
  plat.receiveShadow = true;
  g.add(plat);
  g.add(box(fp.w - 0.3, 0.06, fp.d - 0.3, mat("#E8B33F"), 0, 0.27, 0));
  // Anillo de luz girando cuando el robot trabaja
  ud.fx.dockRing = mesh(
    geo("torus", Math.min(fp.w, fp.d) * 0.42, 0.05, 8, 28),
    uniqueMat(PALETTE.accent, { basic: true, opacity: 0.9 }),
    0,
    0.4,
    0,
  );
  ud.fx.dockRing.rotation.x = -Math.PI / 2;
  ud.fx.dockRing.visible = false;
  g.add(ud.fx.dockRing);
}

export function makeStationGroup(s) {
  const g = new THREE.Group();
  g.position.set(pxToWorldX(s.x), 0, pxToWorldZ(s.y));
  const fp = { w: pxToWorld(s.w), d: pxToWorld(s.h) };
  const accent = STATION_ACCENT[s.id] || PALETTE.sub;
  const ud = g.userData;
  ud.kind = "station";
  ud.accent = accent;
  ud.pastel = STATION_PASTEL[s.id] || PALETTE.counter;
  ud.fx = {};

  // Alfombrilla/highlight de proximidad
  ud.highlightMat = uniqueMat(PALETTE.ink, { basic: true, opacity: 0.1 });
  const hl = box(fp.w + 0.5, 0.05, fp.d + 0.5, ud.highlightMat, 0, 0.026, 0);
  g.add(hl);

  // Spotlight de tutorial: anillo + flecha rebotando
  ud.spotMat = uniqueMat(PALETTE.accent, { basic: true, opacity: 0.8 });
  ud.spotlight = mesh(geo("torus", Math.max(fp.w, fp.d) * 0.62, 0.09, 10, 40), ud.spotMat, 0, 0.06, 0);
  ud.spotlight.rotation.x = -Math.PI / 2;
  ud.spotlight.visible = false;
  g.add(ud.spotlight);
  ud.arrow = mesh(geo("cone", 0.34, 0.75, 14), uniqueMat(PALETTE.accent, { basic: true }), 0, 3.9, 0);
  ud.arrow.rotation.x = Math.PI;
  ud.arrow.visible = false;
  g.add(ud.arrow);

  // Placa de nombre flotante
  ud.plateKey = stationPlateKey(s, accent);
  ud.plate = billboard(stationPlateTexture(s, accent), 2.9, 1.09);
  // Altas para no tapar el mueble: la placa flota claramente por encima.
  ud.plate.position.y = s.kind === "subagent_box" ? 2.8 : s.id === "COMPACT" ? 4.0 : 5.0;
  g.add(ud.plate);

  if (s.id === "INBOX") buildInbox(g, fp, ud);
  else if (s.id === "PLAN") buildPlan(g, fp, ud);
  else if (s.id === "TDD") buildTdd(g, fp, ud);
  else if (s.id === "CODE") buildCode(g, fp, ud);
  else if (s.id === "PR") buildPr(g, fp, ud);
  else if (s.id === "COMPACT") buildCompact(g, fp, ud);
  else if (s.kind === "subagent_box") buildDock(g, fp, ud);

  return g;
}

// ── Chef chibi ─────────────────────────────────────────────────────────────

export function makeChefGroup(cfg) {
  const g = new THREE.Group();
  const ud = g.userData;
  ud.kind = "chef";

  // Sombra blob (no rebota con el cuerpo)
  const blob = mesh(geo("circle", 0.62, 22), mat("#000000", { basic: true, opacity: 0.2 }));
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.02;
  g.add(blob);

  // Anillo de interacción
  ud.ring = mesh(geo("torus", 0.8, 0.06, 8, 32), uniqueMat(cfg.color, { basic: true, opacity: 0.85 }), 0, 0.045, 0);
  ud.ring.rotation.x = -Math.PI / 2;
  ud.ring.visible = false;
  g.add(ud.ring);

  // Pies (avanzan/retroceden a lo largo del facing local +Z)
  ud.feet = [];
  for (const side of [-1, 1]) {
    const foot = box(0.28, 0.16, 0.42, mat(cfg.badge), side * 0.27, 0.08, 0);
    ud.feet.push(foot);
    g.add(foot);
  }

  // Rig: bob + squash + lean del cuerpo entero
  const rig = new THREE.Group();
  ud.rig = rig;
  g.add(rig);

  const bodyM = mat(cfg.color);
  const body = mesh(geo("capsule", 0.46, 0.52, 6, 14), bodyM, 0, 0.88, 0);
  body.castShadow = true;
  rig.add(body);

  // Delantal blanco con logo Claude
  rig.add(box(0.64, 0.68, 0.14, mat(PALETTE.cream), 0, 0.78, 0.4));
  rig.add(mesh(geo("plane", 0.42, 0.42), uniqueMat("#FFFFFF", { basic: true, map: logoTexture(cfg.color), transparent: true, alphaTest: 0.05 }), 0, 0.8, 0.48));

  // Brazos con pivote en el hombro (se alzan al llevar un plato)
  ud.arms = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.52, 1.2, 0);
    const arm = mesh(geo("capsule", 0.13, 0.32, 4, 8), bodyM, 0, -0.28, 0);
    pivot.add(arm);
    pivot.rotation.z = side * -0.18;
    rig.add(pivot);
    ud.arms.push(pivot);
  }

  // Cabeza + ojos + gorro de cocinero
  const headG = new THREE.Group();
  headG.position.y = 1.66;
  rig.add(headG);
  const head = mesh(geo("sphere", 0.48, 20, 14), mat(PALETTE.skin));
  head.castShadow = true;
  headG.add(head);
  for (const side of [-1, 1]) {
    headG.add(mesh(geo("sphere", 0.07, 8, 6), mat(PALETTE.ink), side * 0.17, 0.05, 0.43));
  }
  headG.add(mesh(geo("cyl", 0.4, 0.43, 0.34, 16), mat(PALETTE.cream), 0, 0.5, 0));
  headG.add(mesh(geo("cyl", 0.44, 0.44, 0.12, 16), mat(cfg.color), 0, 0.36, 0));
  const pouf = mesh(geo("sphere", 0.46, 16, 12), mat(PALETTE.cream), 0, 0.74, 0);
  pouf.scale.y = 0.62;
  headG.add(pouf);

  // Etiqueta J1/J2 flotante
  const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagTexture(cfg.label, cfg.color), transparent: true }));
  tag.scale.set(1.05, 0.52, 1);
  tag.position.y = 3.85; // por encima del plato llevado (y≈2.9)
  g.add(tag);

  return g;
}

// ── Robot subagente ────────────────────────────────────────────────────────

export function makeSubagentGroup(sa) {
  const g = new THREE.Group();
  const ud = g.userData;
  ud.kind = "subagent";

  const blob = mesh(geo("circle", 0.48, 20), mat("#000000", { basic: true, opacity: 0.18 }));
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.02;
  g.add(blob);

  // Rig flotante (hover senoidal, sin piernas)
  const rig = new THREE.Group();
  ud.rig = rig;
  g.add(rig);

  const chassis = mesh(geo("cyl", 0.38, 0.46, 0.6, 16), mat(PALETTE.sub), 0, 0.42, 0);
  chassis.castShadow = true;
  rig.add(chassis);
  rig.add(mesh(geo("cyl", 0.4, 0.4, 0.1, 16), mat(PALETTE.cabinet), 0, 0.62, 0));
  // Cúpula de cristal
  rig.add(mesh(geo("hemi", 0.34), uniqueMat(PALETTE.cabinet, { opacity: 0.65 }), 0, 0.7, 0));
  // Ojo LED
  rig.add(mesh(geo("sphere", 0.09, 10, 8), uniqueMat("#23F0C7", { basic: true }), 0, 0.74, 0.26));
  // Antena con punta parpadeante
  rig.add(mesh(geo("cyl", 0.025, 0.025, 0.34, 8), mat(PALETTE.steelDark), 0, 1.18, 0));
  ud.antennaTip = mesh(geo("sphere", 0.07, 8, 6), uniqueMat(PALETTE.bug, { basic: true }), 0, 1.38, 0);
  rig.add(ud.antennaTip);
  // Logo Claude pequeño
  rig.add(mesh(geo("plane", 0.3, 0.3), uniqueMat("#FFFFFF", { basic: true, map: logoTexture(PALETTE.ink2), transparent: true, alphaTest: 0.05 }), 0, 0.4, 0.45));

  const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagTexture("α" + (sa.idx + 1), PALETTE.accent), transparent: true }));
  tag.scale.set(0.95, 0.47, 1);
  tag.position.y = 2.85; // por encima del plato llevado (y≈1.9)
  g.add(tag);

  return g;
}

// ── Ticket: plato + comanda ────────────────────────────────────────────────

export function makeTicketGroup(t) {
  const g = new THREE.Group();
  const ud = g.userData;
  ud.kind = "ticket";
  ud.ticketId = t.id;
  const typeColor = t.type === "BUG" ? PALETTE.bug : PALETTE.feature;

  // Plato con borde de color por tipo
  const plate = mesh(geo("cyl", 0.55, 0.62, 0.09, 22), mat(PALETTE.cream), 0, 0.06, 0);
  g.add(plate);
  ud.rimMat = uniqueMat(typeColor, { basic: true });
  const rim = mesh(geo("torus", 0.56, 0.05, 8, 30), ud.rimMat, 0, 0.1, 0);
  rim.rotation.x = -Math.PI / 2;
  g.add(rim);

  // Tarjeta-comanda billboard
  ud.cardKey = ticketTextureKey(t);
  ud.cardMat = uniqueMat("#FFFFFF", { basic: true, map: ticketCardTexture(t), transparent: true, alphaTest: 0.05 });
  const card = mesh(geo("plane", 1.46, 1.64), ud.cardMat, 0, 1.06, 0);
  card.rotation.x = BILLBOARD_RX;
  g.add(card);

  // Barra de tiempo de expiración (mesh aparte: no re-rasteriza la textura)
  const barGrp = new THREE.Group();
  barGrp.position.set(0, 0.3, 0.34);
  barGrp.rotation.x = BILLBOARD_RX;
  barGrp.add(box(1.14, 0.12, 0.04, mat(PALETTE.ink2, { basic: true })));
  ud.barMat = uniqueMat(PALETTE.ok, { basic: true });
  ud.barFill = mesh(geo("lbox", 1, 0.08, 0.05), ud.barMat, -0.54, 0, 0.01);
  ud.barFill.scale.x = 1.08;
  barGrp.add(ud.barFill);
  g.add(barGrp);

  return g;
}
