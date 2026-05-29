# Modularizar Agent Kitchen — Diseño

**Fecha:** 2026-05-29
**Estado:** Aprobado para planificación

## Contexto

`agent-kitchen_3.html` es un juego de canvas HTML5 ("Agent Kitchen") de ~2.300
líneas en un único archivo. Todo el código vive en un solo `<script>`: constantes,
estado, input, lógica de juego, render y game loop. Hay tres globales mutables
(`state`, `ctx`, `keys`) que cualquier función toca libremente.

## Objetivo

Mejorar la **mantenibilidad de este juego** separando responsabilidades en módulos
ES enfocados. El comportamiento del juego debe quedar **idéntico** tras el refactor.

Esto NO es construir un motor genérico ni una librería reutilizable para otros
juegos. "Reusable" aquí significa separación de responsabilidades (SRP), no
abstracción especulativa.

### Principios

- **SOLID (sobre todo SRP)**: cada módulo, una sola razón para cambiar. DIP ligero:
  el estado se pasa explícitamente, no se accede como global.
- **YAGNI**: nada de motor genérico, ECS, sistema de plugins ni capas de abstracción
  especulativas. No se añade test runner todavía.
- **KISS**: módulos ES nativos, **sin paso de build**. Funciona con
  `<script type="module">` y un servidor local simple.

## Restricciones

- Salida: módulos ES, sin bundler ni herramientas de build.
- Sin dependencias nuevas.
- Comportamiento del juego inalterado (refactor que preserva comportamiento).

## Arquitectura

### Estructura de archivos

```
ai-kitchen/
  index.html              <canvas> + <script type="module" src="src/main.js">
  src/
    config.js             Constantes puras: COL, fuentes, W/H, PLAYER_CONFIGS,
                          GAME_TIME y tuning, POINTS, BUG/FEAT_DESCS, SKILL_DEFS,
                          TUTORIAL_TICKETS, CLAUDE_PATH. (hoja: no importa nada)
    geometry.js           Helpers puros: distToStation, nearestStation,
                          playerNearStation, anyPlayerNearStation.
    canvas2d.js           Primitivos de dibujo: clear, drawText, drawLine,
                          drawRect, wrapText. (única pieza genuinamente reusable)
    skills.js             Meta-progresión: load/save/resetSkills, los 4
                          multiplicadores, tryBuySkill. (localStorage aislado aquí)
    state.js              createState(numPlayers), makeStations, makeTicket.
    input.js              createInput(): listeners, keys, getInputDirFor() y
                          eventos consumibles de fase.
    systems/
      players.js          updatePlayers (movimiento, colisiones, trail)
      subagents.js        updateSubagents + arrival/ship + pickSubagentNextStation
      stations.js         updateStations (procesado de la cola)
      tickets.js          spawnIfDue, updateTickets (expiración), flash/updateFlashes
      interaction.js      handleInteract, doInteract, handleTrash, updateContext
      index.js            update(state, input, dt) → orquesta en orden
    render/
      hud.js              drawHeader, drawStatsBar, drawPlayArea, drawFooter
      entities.js         drawStation, drawPlayer(s), drawSubagent(s),
                          drawMiniTicket, drawTicketCard
      screens.js          drawMenu, drawShop, drawGameOver, drawLearningOverlay,
                          computeLearningHint
      index.js            render(ctx, state) → despacha según state.phase
    main.js               Composition root: crea state+input+ctx, loop(t),
                          requestAnimationFrame, transiciones de fase.
```

### El cambio clave: eliminar los globales

Hoy `state`, `ctx` y `keys` son globales mutables que rompen SRP e impiden testear.
La solución:

- **`main.js` es el único dueño** de `state`, `input` y `ctx` (composition root).
- Cada frame ejecuta exactamente:
  ```js
  update(state, input, dt);   // muta state, lee input
  render(ctx, state);         // solo lee state, dibuja
  ```
- **Ningún otro módulo importa `state`.** Lo reciben por argumento (DIP ligero).
- **Regla de dependencias (nunca hacia arriba):** `config` y `geometry` son hojas;
  `systems` y `render` dependen de ellas pero no entre sí; `main` los une. Evita
  imports circulares.
- Los flags de input (`pendingInteract`, `pendingTrash`, `pendingStart`,
  `pendingShopOpen`, `pendingMenuFromShop`) que hoy mutan globales desde el listener
  pasan a vivir en el objeto `input` y se consumen dentro de `update`/`main`. El
  render deja de tener cualquier `pending*`.

Resultado: `render` es función pura de `state` (mismo state → mismo dibujo);
`systems` es testeable pasándole `state` e `input` falsos.

### Flujo de datos por frame

```
main.loop(t)
  ├─ dt = (t - last) / 1000
  ├─ if phase === 'playing': update(state, input, dt)
  ├─ render(ctx, state)
  ├─ main aplica transiciones de fase consumiendo input (start/shop/menu)
  └─ requestAnimationFrame(loop)
```

## Estrategia de migración (incremental, preserva comportamiento)

El juego debe correr idéntico tras cada paso. Cada paso es un commit verificable
abriendo el HTML en el navegador.

1. **Scaffold**: crear `index.html` + `src/main.js` con TODO el código actual tal
   cual, como `type="module"`. Verificar que funciona igual.
2. **Extraer hojas** (riesgo mínimo): `config.js`, `geometry.js`, `canvas2d.js`.
3. **Extraer** `skills.js` y `state.js`.
4. **Extraer `input.js`**: convertir globales `keys`/`pending*` en el objeto `input`.
5. **Extraer `systems/` y `render/`**. `main.js` queda fino.

## Testing

Fuera de scope (YAGNI). Tras el refactor, `geometry.js` y los multiplicadores de
`skills.js` quedan como funciones puras fácilmente testeables si más adelante se
quiere añadir un runner. La red de seguridad de este refactor es jugar una partida
completa tras cada paso (menú → tutorial → partida → game over → shop → reset).

## Criterios de éxito

- El juego se comporta de forma idéntica al original (jugabilidad, tutorial,
  shop, persistencia en localStorage, modos 1P/2P).
- Ningún módulo accede a `state`/`ctx`/`keys` como global; se pasan por argumento.
- Cada módulo tiene una responsabilidad clara y se entiende sin leer los demás.
- Cero dependencias nuevas, cero paso de build.

## Fuera de scope

- Motor de juego genérico o librería reutilizable entre juegos.
- Sistema de entidades/componentes (ECS).
- Test runner / suite de tests automatizada.
- Cambios de jugabilidad, contenido o estética.
- Bundler (Vite/esbuild) o TypeScript.
