// Build casero, cero dependencias. Concatena los módulos ES de src/ (quitando
// import/export) y los inyecta en src/shell.html para generar un index.html
// autocontenido y abrible con doble-clic (file://). Uso: node build.mjs
import { readFileSync, writeFileSync } from "node:fs";

// Orden topológico: hojas primero, main al final. Los `const` de cada módulo se
// declaran antes de que cualquier código de arranque (en main) los use.
const ORDER = [
  "src/config.js",
  "src/geometry.js",
  "src/effects.js",
  "src/canvas2d.js",
  "src/skills.js",
  "src/input.js",
  "src/state.js",
  "src/systems/tickets.js",
  "src/systems/subagents.js",
  "src/systems/stations.js",
  "src/systems/players.js",
  "src/systems/interaction.js",
  "src/systems/index.js",
  "src/render/hud.js",
  "src/render/entities.js",
  "src/render/screens.js",
  "src/render/index.js",
  "src/main.js",
];

function strip(src) {
  return src
    .replace(/^\s*import\s+[\s\S]*?;\s*$/gm, "") // quita imports (incl. multilínea)
    .replace(/^export\s+/gm, ""); // quita el prefijo `export `
}

const parts = ORDER.map((f) => `// ── ${f} ──\n${strip(readFileSync(f, "utf8")).trim()}`);
const code = parts.join("\n\n");

// Aviso si hay colisiones de nombres top-level (rompería en modo estricto).
const seen = new Map();
for (const m of code.matchAll(/^(?:const|let|function)\s+([A-Za-z_$][\w$]*)/gm)) {
  const name = m[1];
  seen.set(name, (seen.get(name) || 0) + 1);
}
const dupes = [...seen].filter(([, n]) => n > 1).map(([k]) => k);
if (dupes.length) {
  console.error("AVISO: nombres top-level duplicados:", dupes.join(", "));
  process.exit(1);
}

const shell = readFileSync("src/shell.html", "utf8");
const scriptTag = `<script>\n      (function () {\n        'use strict';\n\n${code}\n\n      })();\n    </script>`;
const html =
  "<!-- GENERADO por build.mjs — NO editar a mano; edita src/ y re-ejecuta `node build.mjs` -->\n" +
  shell.replace(
    "    __SCRIPT__",
    scriptTag
      .split("\n")
      .map((l) => (l ? "    " + l : l))
      .join("\n"),
  );

writeFileSync("index.html", html);
console.log(`index.html generado: ${ORDER.length} módulos, ${code.length} bytes de JS.`);
