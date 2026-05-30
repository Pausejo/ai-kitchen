// Constantes, datos y helpers puros. Hoja del grafo: no importa nada.

export const W = 1280,
  H = 800;
export const TAU = Math.PI * 2;

export const COL = {
  paper: "#ECE4D0",
  paper2: "#E2D8BD",
  paper3: "#F4EEDD",
  ink: "#1A1611",
  ink2: "#2C2620",
  inkSoft: "rgba(26, 22, 17, 0.55)",
  accent: "#C2410C",
  accentL: "#E89B7A",
  muted: "#6B6358",
  line: "#C4BAA0",
  lineL: "#D9CFB5",
  ok: "#4A6B2C",
  warn: "#A88410",
  red: "#8B2C20",
  cardBg: "#F7F1DE",
};

export const SKILL_DEFS = {
  SPEED: {
    label: "VELOCIDAD",
    short: "SPEED",
    desc: "Más rápido al moverte entre estaciones.",
    maxLevel: 5,
    costs: [30, 50, 80, 120, 180],
    effectText: (l) => `+${l * 10}% velocidad`,
  },
  MODEL: {
    label: "MODELO",
    short: "MODEL",
    desc: "Plan, TDD y Code procesan más rápido.",
    maxLevel: 3,
    costs: [60, 120, 240],
    effectText: (l) => `-${l * 15}% tiempo de proceso`,
  },
  SUBAGENT: {
    label: "SUBAGENTES",
    short: "SUBAGENT",
    desc: "Cajas que envían PRs solos (lentos, sin contexto).",
    maxLevel: 3,
    costs: [80, 160, 320],
    effectText: (l) => `${l} subagente${l === 1 ? "" : "s"} disponible${l === 1 ? "" : "s"}`,
  },
  CONTEXT: {
    label: "CONTEXTO",
    short: "CONTEXT",
    desc: "Cada acción consume menos ventana de contexto.",
    maxLevel: 5,
    costs: [40, 70, 110, 170, 240],
    effectText: (l) => `-${l * 10}% coste por acción`,
  },
  AUTOCOMPACT: {
    label: "AUTO-COMPACT",
    short: "AUTO-CPT",
    desc: "Compacta solo: baja el contexto al 20% cada cierto tiempo.",
    maxLevel: 3,
    costs: [120, 220, 360],
    effectText: (l) => `cada ${[40, 30, 20][l - 1]}s → 20%`,
  },
};

// Intervalo (segundos) del auto-compact por nivel; 0 = desactivado.
export const AUTOCOMPACT_INTERVALS = [40, 30, 20];

export const SUBAGENT_SPEED = 130; // slower than player
export const SUBAGENT_PROCESS_MULT = 2.0; // 2x the time at each station
export const SUBAGENT_DEPLOY_CTX = 5; // small context cost to dispatch

export const FONT_SERIF = "'Fraunces'";
export const FONT_MONO = "'JetBrains Mono'";

export const CLAUDE_PATH_DATA =
  "M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z";
export const CLAUDE_PATH = new Path2D(CLAUDE_PATH_DATA);

export const PLAYER_CONFIGS = [
  {
    id: "C-1",
    color: "#D97757", // Claude orange
    badge: "#1A1611", // ink badge bg
    label: "C-1",
    controls: {
      up: "w",
      down: "s",
      left: "a",
      right: "d",
      interact: "f",
      trash: "q",
    },
  },
  {
    id: "C-2",
    color: "#3A8F8F", // Deep teal
    badge: "#1A1611",
    label: "C-2",
    controls: {
      up: "arrowup",
      down: "arrowdown",
      left: "arrowleft",
      right: "arrowright",
      interact: "/",
      trash: ".",
    },
  },
];

export const GAME_TIME = 120;
export const PLAYER_SPEED = 280; // px/sec
export const PLAYER_R = 17;
export const TICKET_LIFETIME_BUG = 35;
export const TICKET_LIFETIME_FEAT = 50;
export const CONTEXT_MAX = 100;
export const COMPACT_RATE = 35; // context units/sec
export const SPAWN_BASE = 5.5;
export const SPAWN_MIN = 2.6;

export const POINTS = {
  BUG: 10,
  FEATURE_NOTDD: 12,
  FEATURE_TDD: 25,
  EXPIRED: -8,
};

export const BUG_DESCS = [
  "404 en /pricing",
  "Botón roto en Safari",
  "Logo pixelado",
  "Login falla en móvil",
  "Form sin validar",
  "Margin descuadrado",
  "Falta favicon",
  "Typo en h1",
  "Hover sin estado",
  "Z-index al revés",
];
export const FEAT_DESCS = [
  "TikTok para gatos",
  "IA pero no Claude",
  "Modo oscuro premium",
  "Hazlo viral",
  "Blockchain genérico",
  "Notion clone v2",
  "Más Apple por favor",
  "Onboarding inteligente",
  "Chat con el equipo",
  "Editor WYSIWYG",
  "Login con magic link",
  "Métricas en tiempo real",
];

// Tutorial principal (primera partida): un bug, una feature, y luego compactar.
export const TUTORIAL_TICKETS = [
  { type: "BUG", desc: "Botón no clickea", hint: "BUG: PLAN → CODE → SHIP PR · +10" },
  { type: "FEATURE", desc: "Modo oscuro premium", hint: "FEATURE: PLAN → TDD (2×) → CODE → PR · +25" },
];

// Tutorial de subagentes: una sola tarea para aprender a delegar.
export const SUBAGENT_TUTORIAL_TICKETS = [
  { type: "BUG", desc: "Favicon roto", hint: "SUÉLTALO EN α1 · TRABAJA SOLO" },
];

export function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}
