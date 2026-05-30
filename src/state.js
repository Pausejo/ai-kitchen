// Fábrica del estado del juego. Sin lógica de update.
import { W, GAME_TIME, PLAYER_CONFIGS, PLAYER_R } from "./config.js";
import { loadSkills, subagentSlots, processTimeMultiplier, isTutorialDone } from "./skills.js";

export function createState(numPlayers = 1) {
  const skills = loadSkills();
  const players = [];
  for (let i = 0; i < numPlayers; i++) {
    const cfg = PLAYER_CONFIGS[i];
    players.push({
      cfg,
      x: numPlayers === 1 ? W / 2 : i === 0 ? W / 2 - 80 : W / 2 + 80,
      y: 480,
      vx: 0,
      vy: 0,
      r: PLAYER_R,
      holding: null,
      trail: [],
      pendingInteract: false,
      pendingTrash: false,
      stepPhase: 0,
      isMoving: false,
      faceX: 0,
      faceY: 1,
    });
  }
  // Build subagent slots (boxes) and subagent ghosts
  const stations = makeStations();
  const slots = subagentSlots(skills);
  const subagentBoxes = [];
  const subagents = [];
  for (let i = 0; i < slots; i++) {
    // Place subagent boxes along the bottom, left of COMPACT
    const baseX = 80 + i * 140;
    const box = {
      id: "SUBA_" + i,
      label: "SUBAGENT " + (i + 1),
      num: "α" + (i + 1),
      x: baseX,
      y: 600,
      w: 120,
      h: 110,
      kind: "subagent_box",
      subagentIdx: i,
    };
    stations.push(box);
    subagents.push({
      idx: i,
      box,
      state: "idle", // idle | toStation | working | toShip
      x: baseX,
      y: 600,
      vx: 0,
      vy: 0,
      faceX: 0,
      faceY: -1,
      stepPhase: 0,
      isMoving: false,
      ticket: null,
      target: null, // station object to walk to
      processStart: 0,
      processDuration: 0,
      stage: null, // current pipeline stage being processed
    });
  }
  // Apply model multiplier to process stations
  const mult = processTimeMultiplier(skills);
  for (const s of stations) {
    if (s.kind === "process") s.time = s.baseTime * mult;
  }
  return {
    phase: "menu",
    menuPlayers: numPlayers,
    elapsed: 0,
    timeLeft: GAME_TIME,
    score: 0,
    context: 0,
    skills,
    players,
    subagents,
    stations,
    inbox: [],
    nextSpawnIn: numPlayers === 1 ? 1.5 : 2.5,
    nextTicketId: 1,
    flashes: [],
    shipped: 0,
    expired: 0,
    perfectFeatures: 0,
    bestScore: parseInt(localStorage.getItem("agentKitchenBest") || "0", 10),
    learningPhase: numPlayers === 1 && !isTutorialDone(),
    learningTimer: 0,
    learningTicketIdx: 0,
  };
}

export function makeStations() {
  // Top row of process stations
  return [
    { id: "INBOX", label: "INBOX", num: "00", x: 220, y: 330, w: 150, h: 110, kind: "inbox" },
    {
      id: "PLAN",
      label: "PLAN",
      num: "01",
      x: 420,
      y: 330,
      w: 150,
      h: 110,
      kind: "process",
      baseTime: 2.0,
      time: 2.0,
      stage: "planned",
      requires: null,
      contextCost: 14,
      capacity: 3,
      queue: [],
      accept: ["BUG", "FEATURE"],
    },
    {
      id: "TDD",
      label: "TDD",
      num: "02",
      x: 620,
      y: 330,
      w: 150,
      h: 110,
      kind: "process",
      baseTime: 2.4,
      time: 2.4,
      stage: "tested",
      requires: "planned",
      contextCost: 12,
      capacity: 3,
      queue: [],
      accept: ["FEATURE"],
      featureOnly: true,
    },
    {
      id: "CODE",
      label: "CODE",
      num: "03",
      x: 820,
      y: 330,
      w: 150,
      h: 110,
      kind: "process",
      baseTime: 3.0,
      time: 3.0,
      stage: "coded",
      requires: "planned",
      contextCost: 24,
      capacity: 3,
      queue: [],
      accept: ["BUG", "FEATURE"],
    },
    { id: "PR", label: "SHIP PR", num: "04", x: 1050, y: 330, w: 180, h: 110, kind: "ship", holds: null },
    { id: "COMPACT", label: "COMPACT", num: "∞", x: 870, y: 600, w: 200, h: 110, kind: "compact" },
  ];
}
