// Setup único y perezoso del mundo Three.js: renderer WebGL sobre #game3d,
// cámara ortográfica isométrica fija, luces con una sola sombra direccional
// y el entorno estático de la cocina. Resolución interna fija 1280×800
// escalada por CSS (sin listener de resize), igual que el canvas 2D.
import { W, H } from "../config.js";
import { CAM_POS, CAM_TARGET, FRUSTUM_HALF_W, FRUSTUM_SHIFT_Y } from "./project.js";
import { buildEnvironment, PALETTE } from "./models.js";

let world = null;

export function getThree() {
  if (!world) world = initThree();
  return world;
}

function initThree() {
  const canvas3d = document.getElementById("game3d");
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas3d,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(W, H, false); // false: el CSS de #stage manda en el tamaño visual
  const dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
  renderer.setPixelRatio(Math.min(dpr, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(PALETTE.sky, 1);

  const scene = new THREE.Scene();

  // Cámara orto: frustum 16:10 desplazado hacia arriba para dejar sitio al HUD.
  const halfW = FRUSTUM_HALF_W;
  const halfH = halfW / (W / H);
  const camera = new THREE.OrthographicCamera(
    -halfW,
    halfW,
    halfH + FRUSTUM_SHIFT_Y,
    -halfH + FRUSTUM_SHIFT_Y,
    0.1,
    120,
  );
  camera.position.set(CAM_POS.x, CAM_POS.y, CAM_POS.z);
  camera.lookAt(CAM_TARGET.x, CAM_TARGET.y, CAM_TARGET.z);

  // Luces: relleno cálido + cielo/suelo + un solo sol con sombras suaves.
  // Suma total ~1.1–1.3 para no sobreexponer los materiales Lambert.
  scene.add(new THREE.AmbientLight("#FFF3DC", 0.42));
  scene.add(new THREE.HemisphereLight("#FFF6E0", "#D9A86C", 0.22));
  const sun = new THREE.DirectionalLight("#FFE8C2", 0.72);
  sun.position.set(-9, 19, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -19;
  sun.shadow.camera.right = 19;
  sun.shadow.camera.top = 13;
  sun.shadow.camera.bottom = -13;
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 50;
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  scene.add(sun.target);

  buildEnvironment(scene);

  return { renderer, scene, camera, sun };
}
