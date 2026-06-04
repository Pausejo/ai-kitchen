# AI Kitchen 3D — Diseño de la conversión a cocina 3D estilo Overcooked

**Fecha**: 2026-06-04 · **Estado**: aprobado

## Objetivo

Convertir la presentación del juego de 2D (canvas top-down editorial) a una cocina 3D
colorida estilo Overcooked: cámara isométrica fija ~45°, estaciones como
electrodomésticos, chefs chibi con gorro, luz cálida y HUD cartoon. **Sin tocar la
lógica del juego**: el estado sigue siendo 2D puro en píxeles y `render(state)` sigue
siendo una capa que solo lee el estado.

## Restricciones

- **Index.html autocontenido**: `node build.mjs` debe seguir generando un único
  archivo abrible con doble-clic vía `file://`, sin servidor ni red (salvo fuentes).
- **Cero npm**: sin package.json. Three.js se vendoriza como archivo estático.
- **Lógica intacta**: `state.js`, `systems/*`, `geometry.js`, `input.js`, `skills.js`,
  `config.js`, `effects.js` no cambian. Colisiones y movimiento siguen en píxeles.

## Decisiones

| Decisión | Elección | Razón |
|---|---|---|
| Motor | Three.js **r147 UMD** (`window.THREE`) en `vendor/three.min.js`, inlinado en el HTML por build.mjs como `<script>` propio fuera del IIFE | Última versión con build UMD; el strip-por-regex del build rompería un ESM. Tiene CapsuleGeometry, PCFSoftShadowMap, CanvasTexture |
| Cámara | `OrthographicCamera` fija isométrica | El look Overcooked es proyección ortográfica; proyección al overlay trivial |
| Texto 3D | `CanvasTexture` cacheadas (texto → canvas offscreen → textura) | TextGeometry necesita fetch de fuente (rompe file://) |
| HUD | Canvas 2D transparente superpuesto al WebGL; pantallas con la cocina visible detrás | Texto nítido, reusa canvas2d.js |
| Geometría | 100% primitivas procedurales | Sin assets externos → sin CORS |

## Arquitectura

- **Doble canvas** en `shell.html`: `#game3d` (WebGL, debajo) + `#game` (2D overlay,
  encima, `pointer-events:none`), apilados en un `#stage` responsivo 16:10.
  Resolución interna fija 1280×800 escalada por CSS → sin listener de resize.
- **`src/render3d/`**: `project.js` (mapeo px↔mundo, único sitio), `labels.js`
  (cachés CanvasTexture), `models.js` (fábricas de meshes), `scene.js` (renderer,
  cámara, luces, entorno), `sync.js` (reconciliación state→scene con Maps id→mesh),
  `overlay.js` (flashes proyectados, viñeta, textos), `index.js` (orquestador con la
  misma firma `render(state)`; absorbe `computeLearningHint`).
- **`main.js`** cambia solo el import de `render`.
- **Mapeo**: 1 unidad = 40 px; `worldX=(px-640)/40`, `worldZ=(py-475)/40`; suelo en
  y=0, plano XZ. Fila de estaciones y=330 al fondo, COMPACT/subagentes delante.
- **Reconciliación**: por colección (stations/tickets/players/subagents), clave =
  id estable; crear si falta, actualizar cada frame, eliminar+dispose si sobra; pop-in
  al crear y shrink-out al eliminar. Tickets enumerados de inbox + colas + holds +
  manos + subagentes.

## Dirección de arte

- **Paleta**: baldosas `#F4D9A6`/`#E8B873`, encimera `#E8E0D0`, muebles `#5BB5C9`,
  backsplash `#7FCBA4`, madera `#B5793C`, J1 `#D97757`, J2 `#3A8F8F`, BUG `#E5484D`,
  FEATURE `#F2820D`, subagente `#FFC94D`, ok/PR `#3FB68B`.
- **Luz**: ambient cálida + hemi + 1 directional con sombra PCFSoft (mapa 1024,
  frustum ajustado) + 1 point naranja sobre CODE al procesar. Materiales Lambert.
  Chefs con blob-shadow. Estáticos con `matrixAutoUpdate=false`.
- **Estaciones**: INBOX = ventanilla de comandas con rail; PLAN = pizarra de menú;
  TDD = báscula con dial morado; CODE = horno/fogones con llamas y humo; SHIP PR =
  pase con lámpara de calor; COMPACT = fregadero/triturador; SUBAGENT = dock de robot.
  Placa de nombre flotante por estación.
- **Chefs chibi**: cápsula + delantal con logo Claude + cabeza + gorro de cocinero +
  pies animados; bob/squash/lean con `stepPhase`/`isMoving`/`faceX/Y` existentes;
  ticket llevado sobre la cabeza estilo Overcooked.
- **Tickets**: plato + tarjeta CanvasTexture (regenerada solo al cambiar `stages`),
  barra de tiempo como mesh escalado (umbrales verde/ámbar/rojo del 2D), borde
  emissive por tipo.

## Paridad de feedback con el 2D (crítico)

Barra de progreso billboard sobre la estación (+READY verde), spotlight+flecha de
tutorial (`computeLearningHint`), presión de INBOX (≥3 ámbar, ≥5 rojo), pulso de
COMPACT con contexto ≥80, viñeta de pantalla con contexto >60/≥100, flashes de
`state.flashes` proyectados al overlay con `vector.project(camera)`, contadores de
cola `N/CAP`, estado de subagentes.

## HUD cartoon

`drawPanel` (roundRect) nuevo en canvas2d.js. Header con banner-pill + pills de stats
(mismos textos/umbrales que el 2D). Footer con keycaps por jugador. Pantallas
menu/shop/gameover con lavado translúcido sobre la cocina 3D.

## Verificación

`node build.mjs` (sin duplicados top-level) + `node _smoke.mjs` + `node
_smoke_bundle.mjs` (con stub de THREE). Manual: doble-clic en index.html, 1P y 2P,
tutorial completo, expiración, COMPACT, subagentes, shop, gameover. 60fps.
