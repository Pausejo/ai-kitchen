import {
  TAU, W, H, COL, SKILL_DEFS, FONT_SERIF, FONT_MONO, CLAUDE_PATH,
  PLAYER_CONFIGS, GAME_TIME, PLAYER_SPEED, PLAYER_R,
  TICKET_LIFETIME_BUG, TICKET_LIFETIME_FEAT, CONTEXT_MAX, COMPACT_RATE,
  SPAWN_BASE, SPAWN_MIN, SUBAGENT_SPEED, SUBAGENT_PROCESS_MULT,
  SUBAGENT_DEPLOY_CTX, POINTS, BUG_DESCS, FEAT_DESCS, TUTORIAL_TICKETS,
  formatTime,
} from './config.js';
import { distToStation, nearestStation, playerNearStation, anyPlayerNearStation } from './geometry.js';
import { canvas, ctx, clear, drawText, drawLine, drawRect, wrapText } from './canvas2d.js';
import {
  loadSkills, saveSkills, resetSkills, speedMultiplier,
  processTimeMultiplier, subagentSlots, contextCostMultiplier, tryBuySkill,
} from './skills.js';
import { createState, makeStations } from './state.js';
import { createInput, consumePresses, getInputDirFor } from './input.js';
import { update } from './systems/index.js';
import { render } from './render/index.js';


// ============================================================
// CONSTANTS
// ============================================================


// ============================================================
// META-PROGRESSION: SKILLS (persistent across sessions)
// ============================================================


// Subagent gameplay constants


// Claude logo SVG path (viewBox 0 0 24 24)

// Player configurations (color, controls)

// Game tuning


// Content

// ============================================================
// STATE
// ============================================================
let state = null;
let input = null;

// ============================================================
// LOGIC
// ============================================================










































































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

let lastT = performance.now();
function loop(t) {
  const dt = Math.min(0.05, (t - lastT) / 1000);
  lastT = t;
  if (state.phase === 'playing') update(state, input, dt);
  routeInput(input);
  render(state);
  requestAnimationFrame(loop);
}

// ============================================================
// INIT
// ============================================================
document.fonts.ready.then(() => {
  document.getElementById('loading').classList.add('gone');
  input = createInput();
  state = createState();
  lastT = performance.now();
  requestAnimationFrame(loop);
});
