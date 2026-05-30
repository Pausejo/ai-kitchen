// Composition root: posee el estado y el input, conduce el game loop y las
// transiciones de fase. Cada frame: update(state, input, dt) → render(state).
import { createState } from "./state.js";
import { createInput, consumePresses } from "./input.js";
import { update } from "./systems/index.js";
import { render } from "./render/index.js";
import { resetSkills, loadSkills, tryBuySkill } from "./skills.js";

let state = null;
let input = null;

// Interpreta las pulsaciones del frame según la fase actual.
function routeInput(input) {
  for (const k of consumePresses(input)) {
    if (state.phase === "playing") {
      for (const p of state.players) {
        if (k === p.cfg.controls.interact) p.pendingInteract = true;
        if (k === p.cfg.controls.trash) p.pendingTrash = true;
      }
    } else if (state.phase === "gameover") {
      if (k === "s") openShop();
      if (k === " " || k === "enter") startGame();
    } else if (state.phase === "shop") {
      if (state.shopResetConfirm) {
        if (k === "y") {
          resetSkills();
          state.skills = loadSkills();
          state.shopResetConfirm = false;
        }
        if (k === "n" || k === "escape") state.shopResetConfirm = false;
      } else {
        if (k === "1") tryBuySkill(state, "SPEED");
        if (k === "2") tryBuySkill(state, "MODEL");
        if (k === "3") tryBuySkill(state, "SUBAGENT");
        if (k === "4") tryBuySkill(state, "CONTEXT");
        if (k === "5") tryBuySkill(state, "AUTOCOMPACT");
        if (k === "r") state.shopResetConfirm = true;
        if (k === " " || k === "enter" || k === "escape") backToMenu();
      }
    } else {
      // menu
      if (k === "1") state.menuPlayers = 1;
      if (k === "2") state.menuPlayers = 2;
      if (k === " " || k === "enter") startGame();
    }
  }
}

function startGame() {
  if (state.phase !== "menu" && state.phase !== "gameover") return;
  const best = state.bestScore;
  const numPlayers = state.menuPlayers || 1;
  state = createState(numPlayers);
  state.bestScore = best;
  state.phase = "playing";
}

function openShop() {
  if (state.phase !== "gameover") return;
  state.phase = "shop";
  state.shopResetConfirm = false;
  state.elapsed = 0;
}

function backToMenu() {
  if (state.phase !== "shop") return;
  const numPlayers = state.menuPlayers || 1;
  state = createState(numPlayers);
  state.phase = "menu";
}

let lastT = performance.now();
function loop(t) {
  const dt = Math.min(0.05, (t - lastT) / 1000);
  lastT = t;
  if (state.phase === "playing") update(state, input, dt);
  routeInput(input);
  render(state);
  requestAnimationFrame(loop);
}

document.fonts.ready.then(() => {
  document.getElementById("loading").classList.add("gone");
  input = createInput();
  state = createState();
  lastT = performance.now();
  requestAnimationFrame(loop);
});
