// Meta-progresión: persistencia en localStorage y efectos derivados.
import { SKILL_DEFS, W, COL, AUTOCOMPACT_INTERVALS } from "./config.js";
import { flash } from "./effects.js";

export function loadSkills() {
  try {
    const raw = localStorage.getItem("agentKitchenSkills");
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        SPEED: parsed.SPEED || 0,
        MODEL: parsed.MODEL || 0,
        SUBAGENT: parsed.SUBAGENT || 0,
        CONTEXT: parsed.CONTEXT || 0,
        AUTOCOMPACT: parsed.AUTOCOMPACT || 0,
        hours: parsed.hours || 0,
      };
    }
  } catch (e) {}
  return { SPEED: 0, MODEL: 0, SUBAGENT: 0, CONTEXT: 0, AUTOCOMPACT: 0, hours: 0 };
}

export function saveSkills(skills) {
  try {
    localStorage.setItem("agentKitchenSkills", JSON.stringify(skills));
  } catch (e) {}
}

export function resetSkills() {
  try {
    localStorage.removeItem("agentKitchenSkills");
  } catch (e) {}
}

// Tutorial: se muestra solo en la primera partida. Se marca al terminarlo.
const TUTORIAL_KEY = "agentKitchenTutorialDone";
export function isTutorialDone() {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === "1";
  } catch (e) {
    return false;
  }
}
export function markTutorialDone() {
  try {
    localStorage.setItem(TUTORIAL_KEY, "1");
  } catch (e) {}
}

// Tutorial de subagentes: se muestra una vez, al desbloquear el primer subagente.
const SUBAGENT_TUTORIAL_KEY = "agentKitchenSubagentTutorialDone";
export function isSubagentTutorialDone() {
  try {
    return localStorage.getItem(SUBAGENT_TUTORIAL_KEY) === "1";
  } catch (e) {
    return false;
  }
}
export function markSubagentTutorialDone() {
  try {
    localStorage.setItem(SUBAGENT_TUTORIAL_KEY, "1");
  } catch (e) {}
}

// Efectos derivados de los niveles de skill
export function speedMultiplier(skills) {
  return 1 + skills.SPEED * 0.1;
}
export function processTimeMultiplier(skills) {
  return 1 - skills.MODEL * 0.15;
}
export function subagentSlots(skills) {
  return skills.SUBAGENT;
}
export function contextCostMultiplier(skills) {
  return 1 - (skills.CONTEXT || 0) * 0.1;
}
// Intervalo (s) del auto-compact según nivel; 0 si no se tiene la skill.
export function autoCompactInterval(skills) {
  const lvl = skills.AUTOCOMPACT || 0;
  return lvl > 0 ? AUTOCOMPACT_INTERVALS[lvl - 1] : 0;
}

export function tryBuySkill(state, key) {
  const skills = state.skills;
  const def = SKILL_DEFS[key];
  const level = skills[key];
  if (level >= def.maxLevel) {
    flash(state, W / 2, 320, "MAX LEVEL", COL.muted);
    return;
  }
  const cost = def.costs[level];
  if ((skills.hours || 0) < cost) {
    flash(state, W / 2, 320, "NO HOURS", COL.red);
    return;
  }
  skills.hours -= cost;
  skills[key] += 1;
  saveSkills(skills);
  flash(state, W / 2, 320, "+1 " + def.short, COL.accent);
}
