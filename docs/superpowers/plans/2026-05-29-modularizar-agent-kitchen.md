# Modularizar Agent Kitchen — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar `agent-kitchen_3.html` (~2.300 líneas, un solo `<script>`) en módulos ES enfocados (config, geometry, canvas2d, skills, state, input, systems/, render/, main) preservando el comportamiento exacto del juego.

**Architecture:** Refactor incremental que preserva comportamiento. `main.js` es el composition root: posee `state`, `input` y arranca el loop. Cada frame llama `update(state, input, dt)` (muta state) y `render(state)` (solo lee state; `ctx` es un singleton importado de `canvas2d.js`). Se eliminan los globales `state`/`ctx`/`keys`. Dependencias solo hacia abajo: `config` y `geometry` son hojas; `systems` y `render` dependen de ellas pero no entre sí.

**Tech Stack:** JavaScript ES modules nativos. Sin bundler, sin TypeScript, sin dependencias, sin test runner. Canvas 2D.

---

## Nota sobre verificación (en vez de TDD)

El spec excluye explícitamente un test runner; la red de seguridad es jugar tras cada paso. Por eso cada tarea termina con una **verificación manual** en navegador en lugar de tests automáticos. Los módulos ES requieren servidor (no `file://`):

```bash
cd /Users/pablo/Development/Pausejo/ai-kitchen
python3 -m http.server 8000
# Abrir http://localhost:8000/index.html
```

**Checklist de humo (CH)** — se repite en varias tareas, referida como "CH completo":
1. La pantalla de carga desaparece y aparece el MENÚ.
2. La consola del navegador (DevTools) no muestra errores.
3. Pulsar `1`/`2` cambia jugadores; `ESPACIO` inicia partida.
4. Tutorial: recoger ticket en INBOX (`F`), llevarlo a PLAN→CODE→SHIP PR, ver `+10`.
5. Una FEATURE por TDD da `+25`; el CONTEXTO sube y baja en COMPACT.
6. Al acabar el tiempo → GAME OVER; `S` abre SHOP; comprar skill resta horas.
7. Desde SHOP, `ESPACIO` vuelve al MENÚ; el mejor score persiste al recargar.

> Convención de extracción: cuando un paso dice "mover líneas X–Y del original", el cuerpo de las funciones se copia **verbatim**; solo se añaden los `import`/`export` y los cambios de firma que el paso enumera. "Original" = `agent-kitchen_3.html`.

---

## Task 1: Scaffold — HTML + main.js como módulo único

Objetivo: pasar a `<script type="module">` sin trocear todavía. Si esto funciona, todo lo demás es mover código.

**Files:**
- Create: `index.html`
- Create: `src/main.js`
- Keep: `agent-kitchen_3.html` (intacto como referencia hasta el final)

- [ ] **Step 1: Crear `index.html`**

Copiar las líneas 1–60 del original (de `<!DOCTYPE html>` hasta `<canvas id="game"...>`) y cerrar con el script de módulo. Es decir, el mismo `<head>` (estilos y fuentes) y el `<body>` con `#loading` y `#game`, pero el `<script>` inline se sustituye por:

```html
  <script type="module" src="src/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Crear `src/main.js`**

Copiar **todo** el contenido entre `<script>` y `</script>` del original (líneas 62–2289), es decir desde `'use strict';` hasta el bloque `document.fonts.ready...`, tal cual, en `src/main.js`. Sin cambios.

- [ ] **Step 3: Verificar**

Arrancar el server y abrir `http://localhost:8000/index.html`. Ejecutar **CH completo**. Debe comportarse idéntico al original.

- [ ] **Step 4: Commit**

```bash
git add index.html src/main.js
git commit -m "refactor: cargar Agent Kitchen como modulo ES (sin trocear)"
```

---

## Task 2: Extraer `config.js` (constantes — hoja)

**Files:**
- Create: `src/config.js`
- Modify: `src/main.js`

- [ ] **Step 1: Crear `src/config.js`**

Mover desde `src/main.js` al nuevo archivo, prefijando cada declaración con `export`:
- `const TAU` (original L71) y añadir `export const W = 1280, H = 800;` (sustituyen a los `W`/`H` derivados del canvas, que era 1280×800).
- `COL` (L73–89)
- `SKILL_DEFS` (L94–127)
- `FONT_SERIF`, `FONT_MONO` (L171–172)
- `CLAUDE_PATH_DATA`, `CLAUDE_PATH` (L175–176)
- `PLAYER_CONFIGS` (L179–200)
- Tuning: `GAME_TIME, PLAYER_SPEED, PLAYER_R, TICKET_LIFETIME_BUG, TICKET_LIFETIME_FEAT, CONTEXT_MAX, COMPACT_RATE, SPAWN_BASE, SPAWN_MIN` (L203–211)
- Subagent: `SUBAGENT_SPEED, SUBAGENT_PROCESS_MULT, SUBAGENT_DEPLOY_CTX` (L167–169)
- `POINTS` (L213–218)
- `BUG_DESCS`, `FEAT_DESCS` (L221–246)
- `TUTORIAL_TICKETS` (L335–341)

Además, añadir al final el helper puro (movido de L2231–2235):

```js
export function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}
```

- [ ] **Step 2: Borrar de `src/main.js`** las mismas declaraciones (incluidas las líneas `const canvas/ctx/W/H` L67–70: conservar `canvas`/`ctx` por ahora, eliminar `W`/`H`/`TAU`) y `formatTime`.

- [ ] **Step 3: Importar en `src/main.js`** (al inicio del archivo, tras `'use strict';` — nota: en módulos `'use strict'` es implícito, se puede quitar):

```js
import {
  TAU, W, H, COL, SKILL_DEFS, FONT_SERIF, FONT_MONO, CLAUDE_PATH,
  PLAYER_CONFIGS, GAME_TIME, PLAYER_SPEED, PLAYER_R,
  TICKET_LIFETIME_BUG, TICKET_LIFETIME_FEAT, CONTEXT_MAX, COMPACT_RATE,
  SPAWN_BASE, SPAWN_MIN, SUBAGENT_SPEED, SUBAGENT_PROCESS_MULT,
  SUBAGENT_DEPLOY_CTX, POINTS, BUG_DESCS, FEAT_DESCS, TUTORIAL_TICKETS,
  formatTime,
} from './config.js';
```

- [ ] **Step 4: Verificar** — CH completo, sin errores de consola.

- [ ] **Step 5: Commit**

```bash
git add src/config.js src/main.js
git commit -m "refactor: extraer constantes y datos a config.js"
```

---

## Task 3: Extraer `geometry.js` (helpers puros)

Estas funciones hoy leen `state` global; se cambian a recibir colecciones por argumento.

**Files:**
- Create: `src/geometry.js`
- Modify: `src/main.js`

- [ ] **Step 1: Crear `src/geometry.js`**

```js
// Distancia de un punto al borde más cercano del rect de la estación.
export function distToStation(p, s) {
  const dx = Math.max(s.x - s.w/2 - p.x, 0, p.x - (s.x + s.w/2));
  const dy = Math.max(s.y - s.h/2 - p.y, 0, p.y - (s.y + s.h/2));
  return Math.sqrt(dx*dx + dy*dy);
}

export function nearestStation(p, stations, maxDist = 24) {
  let best = null, bestD = Infinity;
  for (const s of stations) {
    const d = distToStation(p, s);
    if (d < bestD && d <= maxDist) { best = s; bestD = d; }
  }
  return best;
}

export function playerNearStation(player, s) {
  return distToStation(player, s) <= 28;
}

export function anyPlayerNearStation(s, players) {
  return players.some(p => playerNearStation(p, s));
}
```

- [ ] **Step 2: Borrar de `src/main.js`** las funciones `distToStation`, `nearestStation`, `playerNearStation`, `anyPlayerNearStation` (L479–501).

- [ ] **Step 3: Actualizar las llamadas en `src/main.js`** (de momento siguen ahí):
- En `nearestStation(p)` → `nearestStation(p, state.stations)` (dentro de `handleInteract`, L772).
- `anyPlayerNearStation(s)` → `anyPlayerNearStation(s, state.players)` (buscar usos; si no hay, omitir).
- `playerNearStation` y `distToStation` se llaman con la misma firma (no cambian).

- [ ] **Step 4: Importar en `src/main.js`:**

```js
import { distToStation, nearestStation, playerNearStation, anyPlayerNearStation } from './geometry.js';
```

- [ ] **Step 5: Verificar** — CH completo, con foco en: acercarse a una estación y pulsar interactuar funciona (usa `nearestStation`).

- [ ] **Step 6: Commit**

```bash
git add src/geometry.js src/main.js
git commit -m "refactor: extraer helpers de geometria a geometry.js"
```

---

## Task 4: Extraer `canvas2d.js` (primitivos + ctx singleton)

**Files:**
- Create: `src/canvas2d.js`
- Modify: `src/main.js`

- [ ] **Step 1: Crear `src/canvas2d.js`**

Mueve aquí el acceso al DOM y los primitivos. Empieza con:

```js
import { COL, W, H, FONT_MONO, FONT_SERIF } from './config.js';

export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');
```

Luego mover **verbatim** desde `src/main.js`: `clear` (L968–979), `drawText` (L981–1010), `drawLine` (L1012–1019), `drawRect` (L1021–1025), y `wrapText` (L1387–1403); prefijar cada una con `export`. Usan `ctx`, `COL`, `W`, `H`, fuentes — ya importados/definidos arriba.

- [ ] **Step 2: Borrar de `src/main.js`** esas 5 funciones y las líneas `const canvas`/`const ctx` (L67–68).

- [ ] **Step 3: Importar en `src/main.js`:**

```js
import { canvas, ctx, clear, drawText, drawLine, drawRect, wrapText } from './canvas2d.js';
```

- [ ] **Step 4: Verificar** — CH completo. El render debe ser pixel-idéntico.

- [ ] **Step 5: Commit**

```bash
git add src/canvas2d.js src/main.js
git commit -m "refactor: extraer primitivos de dibujo y ctx a canvas2d.js"
```

---

## Task 5: Extraer `skills.js` (meta-progresión)

**Files:**
- Create: `src/skills.js`
- Modify: `src/main.js`

- [ ] **Step 1: Crear `src/skills.js`**

```js
import { SKILL_DEFS } from './config.js';
```

Mover **verbatim** y exportar: `loadSkills` (L129–144), `saveSkills` (L145–147), `resetSkills` (L148–150), `speedMultiplier` (L153–155), `processTimeMultiplier` (L156–158), `subagentSlots` (L159–161), `contextCostMultiplier` (L162–164), y `tryBuySkill` (L2120–2137). Prefijar cada una con `export`. `tryBuySkill` usa `SKILL_DEFS` (importado) y recibe `state`; cambiar su firma:

```js
export function tryBuySkill(state, key) {   // antes: tryBuySkill(key)
```

(el cuerpo no cambia: ya usa `state.skills`, `SKILL_DEFS[key]`, `saveSkills(state.skills)`).

- [ ] **Step 2: Borrar de `src/main.js`** esas 8 funciones.

- [ ] **Step 3: Actualizar la llamada** en `src/main.js`: dentro del keydown handler de la fase `shop` (L390–393), `tryBuySkill('SPEED')` → `tryBuySkill(state, 'SPEED')` (y MODEL/SUBAGENT/CONTEXT igual).

- [ ] **Step 4: Importar en `src/main.js`:**

```js
import {
  loadSkills, saveSkills, resetSkills, speedMultiplier,
  processTimeMultiplier, subagentSlots, contextCostMultiplier, tryBuySkill,
} from './skills.js';
```

- [ ] **Step 5: Verificar** — CH completo, foco en: SHOP compra skills, resta horas, persiste al recargar; `R` resetea con confirmación `Y`/`N`.

- [ ] **Step 6: Commit**

```bash
git add src/skills.js src/main.js
git commit -m "refactor: extraer meta-progresion a skills.js"
```

---

## Task 6: Extraer `state.js` (fábrica de estado)

**Files:**
- Create: `src/state.js`
- Modify: `src/main.js`

- [ ] **Step 1: Crear `src/state.js`**

```js
import {
  W, H, GAME_TIME, PLAYER_CONFIGS, PLAYER_R,
} from './config.js';
import { loadSkills, subagentSlots, processTimeMultiplier } from './skills.js';
```

Mover **verbatim** `newState` (L253–332) y `makeStations` (L343–356). Renombrar `newState` → `createState` y exportar ambas:

```js
export function createState(numPlayers = 1) {   // antes: newState
export function makeStations() {
```

`createState` llama a `makeStations()`, `subagentSlots(skills)`, `processTimeMultiplier(skills)`, `loadSkills()` — todos disponibles. Usa `W`, `PLAYER_CONFIGS`, `PLAYER_R`, `GAME_TIME`.

- [ ] **Step 2: Borrar de `src/main.js`** `newState` y `makeStations`.

- [ ] **Step 3: Actualizar usos de `newState` en `src/main.js`** → `createState`: en el keydown de menú no se usa; sí en `loop` (L2261, L2270) y en el boot `document.fonts.ready` (L2285).

- [ ] **Step 4: Importar en `src/main.js`:**

```js
import { createState, makeStations } from './state.js';
```

- [ ] **Step 5: Verificar** — CH completo, foco en: empezar partida 1P y 2P, posiciones iniciales de jugadores correctas, cajas de subagente aparecen según skill SUBAGENT.

- [ ] **Step 6: Commit**

```bash
git add src/state.js src/main.js
git commit -m "refactor: extraer fabrica de estado a state.js"
```

---

## Task 7: Extraer `input.js` (objeto input, sin globales)

Este es el único paso con cambio estructural real: los globales `keys`, `pendingStart`, `pendingShopOpen`, `pendingMenuFromShop` y los flags `pendingInteract`/`pendingTrash` por jugador dejan de ser globales/eventos sueltos. El listener pasa a registrar pulsaciones genéricas; el ruteo por fase se hace por frame en `main`.

**Files:**
- Create: `src/input.js`
- Modify: `src/main.js`

- [ ] **Step 1: Crear `src/input.js`**

```js
// Input desacoplado del estado del juego. El listener solo registra teclas;
// main interpreta las pulsaciones por fase, una vez por frame.
const GAME_KEYS = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', '/'];

export function createInput() {
  const input = {
    keys: {},               // teclas mantenidas (para movimiento, polling)
    pressedThisFrame: [],    // teclas pulsadas desde el último consume()
  };

  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (GAME_KEYS.includes(k)) e.preventDefault();
    input.keys[k] = true;
    input.pressedThisFrame.push(k);   // incluye auto-repeat del SO (equivale al keydown repetido original)
  });
  window.addEventListener('keyup', e => {
    input.keys[e.key.toLowerCase()] = false;
  });

  return input;
}

// Devuelve y vacía las pulsaciones acumuladas en el frame.
export function consumePresses(input) {
  const pressed = input.pressedThisFrame;
  input.pressedThisFrame = [];
  return pressed;
}

export function getInputDirFor(player, input) {
  const c = player.cfg.controls;
  let x = 0, y = 0;
  if (input.keys[c.left])  x -= 1;
  if (input.keys[c.right]) x += 1;
  if (input.keys[c.up])    y -= 1;
  if (input.keys[c.down])  y += 1;
  if (x && y) { x *= 0.7071; y *= 0.7071; }
  return { x, y };
}
```

- [ ] **Step 2: Borrar de `src/main.js`:** el `const keys = {}` (L361), los `let pendingStart/pendingShopOpen/pendingMenuFromShop` (L362–364), ambos listeners `keydown`/`keyup` (L366–407) y `getInputDirFor` (L409–418).

- [ ] **Step 3: Añadir en `src/main.js` la función `routeInput`** (reemplaza la lógica del antiguo keydown + las transiciones del `loop`). Colocar antes de `loop`:

```js
function routeInput(input) {
  for (const k of consumePresses(input)) {
    if (state.phase === 'playing') {
      for (const p of state.players) {
        if (k === p.cfg.controls.interact) p.pendingInteract = true;
        if (k === p.cfg.controls.trash)    p.pendingTrash = true;
      }
    } else if (state.phase === 'gameover') {
      if (k === 's') openShop();
      if (k === ' ' || k === 'enter') startGame();
    } else if (state.phase === 'shop') {
      if (state.shopResetConfirm) {
        if (k === 'y') { resetSkills(); state.skills = loadSkills(); state.shopResetConfirm = false; }
        if (k === 'n' || k === 'escape') state.shopResetConfirm = false;
      } else {
        if (k === '1') tryBuySkill(state, 'SPEED');
        if (k === '2') tryBuySkill(state, 'MODEL');
        if (k === '3') tryBuySkill(state, 'SUBAGENT');
        if (k === '4') tryBuySkill(state, 'CONTEXT');
        if (k === 'r') state.shopResetConfirm = true;
        if (k === ' ' || k === 'enter' || k === 'escape') backToMenu();
      }
    } else { // menu
      if (k === '1') state.menuPlayers = 1;
      if (k === '2') state.menuPlayers = 2;
      if (k === ' ' || k === 'enter') startGame();
    }
  }
}

function startGame() {
  if (state.phase !== 'menu' && state.phase !== 'gameover') return;
  const best = state.bestScore;
  const numPlayers = state.menuPlayers || 1;
  state = createState(numPlayers);
  state.bestScore = best;
  state.phase = 'playing';
}

function openShop() {
  if (state.phase !== 'gameover') return;
  state.phase = 'shop';
  state.shopResetConfirm = false;
  state.elapsed = 0;
}

function backToMenu() {
  if (state.phase !== 'shop') return;
  const numPlayers = state.menuPlayers || 1;
  state = createState(numPlayers);
  state.phase = 'menu';
}
```

- [ ] **Step 4: Sustituir el cuerpo de `loop`** en `src/main.js`. Las transiciones `pending*` (L2247–2274) ahora las hace `routeInput`. El nuevo `loop`:

```js
function loop(t) {
  const dt = Math.min(0.05, (t - lastT) / 1000);
  lastT = t;
  if (state.phase === 'playing') update(dt);
  routeInput(input);
  render();
  requestAnimationFrame(loop);
}
```

> Orden: `update` (lee `pendingInteract/trash` puestos el frame anterior por `routeInput`) → `routeInput` (marca acciones para el siguiente frame y aplica transiciones de fase) → `render`. Esto preserva la semántica original, donde `handleInteract` consumía flags puestos por eventos previos.

- [ ] **Step 5: Crear el `input` en el boot.** En `document.fonts.ready` añadir `input = createInput();` y declarar arriba `let input;`, `let state;`, `let lastT = performance.now();`. Importar:

```js
import { createInput, consumePresses, getInputDirFor } from './input.js';
```

- [ ] **Step 6: Actualizar la llamada a `getInputDirFor`** en `updatePlayers` (L520, aún en main): `getInputDirFor(p)` → `getInputDirFor(p, input)`.

- [ ] **Step 7: Verificar** — CH completo, con foco extra en input:
  - Movimiento WASD (C-1) y flechas (C-2) en 2P simultáneo.
  - `F`/`Q` (C-1) y `/`/`.` (C-2) interactúan y tiran tickets.
  - Navegación de menú, compras en shop (incluida pulsación repetida), `R`+`Y`/`N`, `ESPACIO` en cada fase.

- [ ] **Step 8: Commit**

```bash
git add src/input.js src/main.js
git commit -m "refactor: extraer input a objeto sin globales (input.js)"
```

---

## Task 8: Extraer `systems/` (lógica de juego)

`src/main.js` queda solo con: imports, `flash`-callers, `update`, `routeInput`/transiciones, `loop`, boot. Movemos toda la lógica a `src/systems/`. Crear los archivos en este orden (de hoja a orquestador).

**Files:**
- Create: `src/systems/tickets.js`, `src/systems/subagents.js`, `src/systems/stations.js`, `src/systems/players.js`, `src/systems/interaction.js`, `src/systems/index.js`
- Modify: `src/main.js`

- [ ] **Step 1: Crear `src/systems/tickets.js`** (incluye `flash`/`updateFlashes`, usados por los demás systems)

```js
import {
  POINTS, SPAWN_BASE, SPAWN_MIN, GAME_TIME,
  TICKET_LIFETIME_BUG, TICKET_LIFETIME_FEAT, BUG_DESCS, FEAT_DESCS,
  TUTORIAL_TICKETS, COL,
} from '../config.js';

export function flash(state, x, y, text, color) {
  state.flashes.push({ x, y, text, color, life: 1.0 });
}
```

Mover **verbatim** y exportar, cambiando firmas para recibir `state` y, en `flash`, llamando `flash(state, ...)`:
- `makeTicket` (L423–451) → `export function makeTicket(state)`. Usa `state.learningPhase/learningTicketIdx/nextTicketId`, `TUTORIAL_TICKETS`, `FEAT_DESCS`/`BUG_DESCS`, `TICKET_LIFETIME_*`.
- `spawnIfDue` (L453–477) → `export function spawnIfDue(state, dt)`. Llama `makeTicket(state)`. Usa `SPAWN_BASE/SPAWN_MIN/GAME_TIME`.
- `updateTickets` (L716–753) → `export function updateTickets(state, dt)`. Sustituir las 3 llamadas `flash(...)` por `flash(state, ...)`. Usa `POINTS`, `COL`.
- `updateFlashes` (L759–766) → `export function updateFlashes(state, dt)`.

- [ ] **Step 2: Crear `src/systems/subagents.js`**

```js
import { SUBAGENT_SPEED, SUBAGENT_PROCESS_MULT, POINTS, COL } from '../config.js';
import { flash } from './tickets.js';
```

Mover **verbatim** y adaptar firmas (`state` como primer parámetro; `flash(...)`→`flash(state, ...)`):
- `updateSubagents` (L576–649) → `export function updateSubagents(state, dt)`. Llama internamente a las tres siguientes con `state`.
- `handleSubagentArrival` (L651–667) → `function handleSubagentArrival(state, sa)`.
- `handleSubagentShip` (L669–693) → `function handleSubagentShip(state, sa)`. Cambiar `flash(...)`→`flash(state, ...)`. Usa `POINTS`, `COL`.
- `pickSubagentNextStation` (L906–914) → `export function pickSubagentNextStation(state, sa)` (lo necesita `interaction.js`).
  Ajustar las llamadas internas dentro de `updateSubagents`/handlers para pasar `state`.

- [ ] **Step 3: Crear `src/systems/stations.js`**

```js
import { COL } from '../config.js';
import { flash } from './tickets.js';
```

Mover **verbatim** `updateStations` (L695–714) → `export function updateStations(state, dt)`. Cambiar `flash(...)`→`flash(state, ...)`. (Los umbrales de contexto 80/60 quedan como literales, igual que el original.)

- [ ] **Step 4: Crear `src/systems/players.js`**

```js
import { W, H, PLAYER_SPEED } from '../config.js';
import { speedMultiplier } from '../skills.js';
import { getInputDirFor } from '../input.js';
```

Mover **verbatim** `updatePlayers` (L517–574) → `export function updatePlayers(state, input, dt)`. Cambiar `getInputDirFor(p)`→`getInputDirFor(p, input)`. Usa `speedMultiplier(state.skills)`, `PLAYER_SPEED`, `W`. (Las constantes locales `padX/playTop/playBot` quedan dentro.)

- [ ] **Step 5: Crear `src/systems/interaction.js`**

```js
import { CONTEXT_MAX, POINTS, SUBAGENT_DEPLOY_CTX, COMPACT_RATE, COL } from '../config.js';
import { contextCostMultiplier } from '../skills.js';
import { nearestStation, playerNearStation } from '../geometry.js';
import { flash } from './tickets.js';
import { pickSubagentNextStation } from './subagents.js';
```

Mover **verbatim** y adaptar (`state` como primer parámetro; `flash`→`flash(state,...)`; `nearestStation(p)`→`nearestStation(p, state.stations)`; `pickSubagentNextStation(sa)`→`pickSubagentNextStation(state, sa)`):
- `updateContext` (L503–515) → `export function updateContext(state, dt)`. Usa `playerNearStation`, `COMPACT_RATE`.
- `handleInteract` (L768–776) → `export function handleInteract(state)`. `nearestStation(p)` → `nearestStation(p, state.stations)`.
- `doInteract` (L778–903) → `export function doInteract(state, p, s)`. Reemplazar todas las llamadas `flash(...)`→`flash(state, ...)`, y `pickSubagentNextStation(sa)`→`pickSubagentNextStation(state, sa)`. Usa `CONTEXT_MAX`, `POINTS`, `SUBAGENT_DEPLOY_CTX`, `contextCostMultiplier(state.skills)`, `COL`.
- `handleTrash` (L916–927) → `export function handleTrash(state)`. `flash`→`flash(state, ...)`.

- [ ] **Step 6: Crear `src/systems/index.js`** (orquestador `update`)

```js
import { GAME_TIME, COL, W } from '../config.js';
import { saveSkills } from '../skills.js';
import { spawnIfDue, updateTickets, updateFlashes, flash } from './tickets.js';
import { updateSubagents } from './subagents.js';
import { updateStations } from './stations.js';
import { updatePlayers } from './players.js';
import { updateContext, handleInteract, handleTrash } from './interaction.js';
```

Mover **verbatim** `update` (L929–963) → `export function update(state, input, dt)`. Adaptar las llamadas internas para pasar `state`/`input`:

```js
export function update(state, input, dt) {
  state.elapsed += dt;
  state.timeLeft = Math.max(0, GAME_TIME - state.elapsed);
  if (state.learningPhase) {
    state.learningTimer += dt;
    if (state.learningTimer >= 60) {
      state.learningPhase = false;
      flash(state, W / 2, 270, 'PACE UP', COL.accent);
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
  if (state.timeLeft <= 0 && state.phase === 'playing') {
    const earnedHours = Math.max(0, state.score);
    state.earnedHours = earnedHours;
    state.skills.hours = (state.skills.hours || 0) + earnedHours;
    saveSkills(state.skills);
    state.phase = 'gameover';
    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      try { localStorage.setItem('agentKitchenBest', String(state.score)); } catch (e) {}
    }
  }
}
```

- [ ] **Step 7: Borrar de `src/main.js`** todas las funciones movidas en los steps 1–6 (`makeTicket`, `spawnIfDue`, `updateContext`, `updatePlayers`, `updateSubagents`, `handleSubagentArrival`, `handleSubagentShip`, `updateStations`, `updateTickets`, `flash`, `updateFlashes`, `handleInteract`, `doInteract`, `pickSubagentNextStation`, `handleTrash`, `update`) y los imports de `skills`/`geometry`/`config` que ya solo usaba la lógica (dejar los que aún use el render que sigue en main).

- [ ] **Step 8: Importar en `src/main.js`:**

```js
import { update } from './systems/index.js';
```

Y cambiar la llamada del loop a `update(state, input, dt)`.

- [ ] **Step 9: Verificar** — CH completo, exhaustivo: tutorial entero, FEATURE con/sin TDD, expiración de tickets (dejar uno sin atender), CONTEXTO a 100% bloquea (`CTX FULL`), COMPACT lo vacía, subagentes (comprar skill SUBAGENT, despachar un ticket y verlo shipear `[α]`), modo 2P.

- [ ] **Step 10: Commit**

```bash
git add src/systems src/main.js
git commit -m "refactor: extraer logica de juego a systems/"
```

---

## Task 9: Extraer `render/` (dibujo)

**Files:**
- Create: `src/render/hud.js`, `src/render/entities.js`, `src/render/screens.js`, `src/render/index.js`
- Modify: `src/main.js`

- [ ] **Step 1: Crear `src/render/hud.js`**

```js
import { COL, W, H, GAME_TIME, CONTEXT_MAX, FONT_SERIF, FONT_MONO, formatTime } from '../config.js';
import { ctx, drawText, drawLine, drawRect } from '../canvas2d.js';
```

Mover **verbatim** y exportar (reciben `state` donde lo usen): `drawHeader` (L1027–1050) → `export function drawHeader()` (no usa state), `drawStatsBar` (L1052–1128) → `export function drawStatsBar(state)`, `drawPlayArea` (L1130–1156) → `export function drawPlayArea()`, `drawFooter` (L1752–1804) → `export function drawFooter(state)`.
> Nota: revisar cuáles usan `state` (p.ej. `drawStatsBar` usa `state.score`, etc.) y añadir el parámetro `state` solo a esas; las que no, sin parámetro.

- [ ] **Step 2: Crear `src/render/entities.js`**

```js
import { COL, W, H, FONT_SERIF, FONT_MONO, CLAUDE_PATH, TAU } from '../config.js';
import { ctx, drawText, drawLine, drawRect, wrapText } from '../canvas2d.js';
```

Mover **verbatim** y exportar (añadiendo `state` a las que lo usen): `drawMiniTicket` (L1284–1312), `drawTicketCard` (L1314–1386), `drawStation` (L1405–1601) → `export function drawStation(state, s, spotlighted)` (revisar si usa `state`; si no, mantener `(s, spotlighted)`), `drawPlayer` (L1603–1681), `drawAllPlayers` (L1683–1685) → `export function drawAllPlayers(state)`, `drawSubagent` (L1687–1736), `drawAllSubagents` (L1738–1740) → `export function drawAllSubagents(state)`, `drawInboxQueue` (L1158–1205) → `export function drawInboxQueue(state)`.

- [ ] **Step 3: Crear `src/render/screens.js`**

```js
import { COL, W, H, GAME_TIME, FONT_SERIF, FONT_MONO, SKILL_DEFS, formatTime } from '../config.js';
import { ctx, clear, drawText, drawLine, drawRect, wrapText } from '../canvas2d.js';
```

Mover **verbatim** y exportar con `state`: `drawLearningOverlay` (L1245–1283) → `export function drawLearningOverlay(state, hint)`, `drawMenu` (L1806–1950) → `export function drawMenu(state)`, `drawShop` (L1952–2118) → `export function drawShop(state)`, `drawGameOver` (L2139–2208) → `export function drawGameOver(state)`. (`tryBuySkill` ya está en `skills.js`, no aquí.)

- [ ] **Step 4: Crear `src/render/index.js`** (orquestador + `computeLearningHint`)

```js
import { clear } from '../canvas2d.js';
import { drawHeader, drawStatsBar, drawPlayArea, drawFooter } from './hud.js';
import {
  drawInboxQueue, drawStation, drawAllSubagents, drawAllPlayers,
} from './entities.js';
import { drawMenu, drawShop, drawGameOver, drawLearningOverlay } from './screens.js';
```

Mover **verbatim** `computeLearningHint` (L1207–1243) → `function computeLearningHint(state)` y `render` (L2210–2226) → `export function render(state)`, adaptando para pasar `state` y mover `drawFlashes` (ver step 5):

```js
function computeLearningHint(state) { /* cuerpo verbatim, ya usa state */ }

export function render(state) {
  if (state.phase === 'menu') return drawMenu(state);
  if (state.phase === 'gameover') return drawGameOver(state);
  if (state.phase === 'shop') return drawShop(state);
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
```

> Si en el step 2 `drawStation` NO recibió `state`, llamar `drawStation(s, hint && hint.stationId === s.id)` aquí en su lugar. Mantener coherencia con la firma elegida.

- [ ] **Step 5: `drawFlashes`** (L1742–1750): moverla a `entities.js` como `export function drawFlashes(state)` (usa `ctx`, `drawText`, `state.flashes`), e importarla en `render/index.js`:

```js
import { /* ... */ drawAllPlayers, drawFlashes } from './entities.js';
```

- [ ] **Step 6: Borrar de `src/main.js`** todas las funciones de dibujo movidas (steps 1–5) y los imports de `canvas2d`/`config` que ya solo usaba el render. `src/main.js` ya no debería referenciar `ctx` ni los primitivos.

- [ ] **Step 7: Importar en `src/main.js`:**

```js
import { render } from './render/index.js';
```

`loop` ya llama `render()` → cambiar a `render(state)`.

- [ ] **Step 8: Verificar** — CH completo. Revisar visualmente CADA pantalla: menú (1P/2P), juego (HUD, estaciones, jugadores, subagentes, tickets, flashes, footer, overlay de tutorial), game over, shop. Debe ser pixel-idéntico al original.

- [ ] **Step 9: Commit**

```bash
git add src/render src/main.js
git commit -m "refactor: extraer dibujo a render/"
```

---

## Task 10: Limpieza final de `main.js`

**Files:**
- Modify: `src/main.js`
- Delete: `agent-kitchen_3.html`

- [ ] **Step 1: Revisar `src/main.js`.** Debe contener SOLO: imports, `let state`, `let input`, `let lastT`, `startGame`/`openShop`/`backToMenu`, `routeInput`, `loop`, y el boot `document.fonts.ready`. Confirmar que el bloque de imports final es algo como:

```js
import { createState } from './state.js';
import { createInput, consumePresses } from './input.js';
import { update } from './systems/index.js';
import { render } from './render/index.js';
import { resetSkills, loadSkills, tryBuySkill } from './skills.js';
```

Eliminar cualquier import que ya no se use (lint mental: cada símbolo importado debe aparecer en el cuerpo).

- [ ] **Step 2: Verificar el boot** en `src/main.js`:

```js
document.fonts.ready.then(() => {
  document.getElementById('loading').classList.add('gone');
  input = createInput();
  state = createState();
  lastT = performance.now();
  requestAnimationFrame(loop);
});
```

- [ ] **Step 3: Borrar el archivo original** ahora que todo está migrado y verificado:

```bash
git rm agent-kitchen_3.html
```

- [ ] **Step 4: Verificar** — CH completo una última vez, partida entera 1P y 2P, recargar para confirmar persistencia (best score + skills).

- [ ] **Step 5: Commit**

```bash
git add src/main.js
git commit -m "refactor: adelgazar main.js y eliminar el HTML monolitico original"
```

---

## Self-Review (cobertura del spec)

- **Estructura de archivos del spec** → Tasks 2–9 crean exactamente `config, geometry, canvas2d, skills, state, input, systems/{players,subagents,stations,tickets,interaction,index}, render/{hud,entities,screens,index}, main`. ✓
- **Eliminar globales `state`/`ctx`/`keys`** → `state` pasa por argumento (Tasks 6–9); `keys` encapsulado en `input` (Task 7); `ctx` es singleton de `canvas2d` (Task 4). ✓
- **`render` función de `state`, `update(state,input,dt)`** → Tasks 8–9. ✓
- **Regla de dependencias (sin ciclos)** → `config`/`geometry` hojas; `tickets` no importa otros systems; `flash` en `tickets` lo consumen los demás sin ciclo; `render/*` no importan `systems`. ✓
- **Migración incremental, comportamiento idéntico** → cada Task termina en verificación CH + commit. ✓
- **Sin build, sin deps, sin tests** → solo ES modules + `python3 -m http.server`. ✓
- **Fuera de scope (ECS, bundler, TS, cambios de jugabilidad)** → no aparecen. ✓

**Consistencia de tipos/firmas:** `createState` (no `newState`), `flash(state, x, y, text, color)`, `nearestStation(p, stations, maxDist)`, `pickSubagentNextStation(state, sa)`, `tryBuySkill(state, key)`, `getInputDirFor(player, input)`, `update(state, input, dt)`, `render(state)` — usadas de forma consistente entre tasks.

**Riesgo señalado:** Task 7 convierte input dirigido por eventos a consumo por frame. Mitigación: `pressedThisFrame` acumula también el auto-repeat del SO (equivale al `keydown` repetido del original) y `routeInput` itera todas las pulsaciones del frame (no solo presencia), preservando pulsaciones múltiples. Verificación dedicada en Task 7 Step 7.
