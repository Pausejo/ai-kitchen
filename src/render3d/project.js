// Mapeo píxeles 2D ↔ mundo 3D y constantes de la cámara isométrica.
// ÚNICO sitio que conoce la escala, el centro del play area y la vista.
// El estado del juego sigue siendo 2D en píxeles; aquí se traduce a XZ
// (suelo) con Y = altura. THREE es un global (vendor inlinado en el HTML).
import { W, H } from "../config.js";

// 1 unidad de mundo = 40 px. El centro del play area 2D (640, 475) es el origen.
export const PX_PER_UNIT = 40;
export const PLAY_CY = 475; // centro vertical del play area 2D (230..720)

// Cámara ortográfica fija tipo Overcooked (~50° de picado desde el sur).
export const CAM_POS = { x: 0, y: 21, z: 18 };
export const CAM_TARGET = { x: 0, y: 0, z: 0.6 };
export const FRUSTUM_HALF_W = 17.6;
// Sube el frustum → la cocina baja en pantalla y deja hueco al HUD superior.
export const FRUSTUM_SHIFT_Y = 3.0;

// Rotación X que orienta un plano (normal +Z) hacia la cámara ortográfica.
// Con cámara orto la dirección de vista es constante: vale para toda la escena.
export const BILLBOARD_RX = -Math.atan2(CAM_POS.y - CAM_TARGET.y, CAM_POS.z - CAM_TARGET.z);

export function pxToWorldX(px) {
  return (px - W / 2) / PX_PER_UNIT;
}

export function pxToWorldZ(py) {
  return (py - PLAY_CY) / PX_PER_UNIT;
}

// Longitudes (anchos/altos) de píxeles a unidades de mundo.
export function pxToWorld(len) {
  return len / PX_PER_UNIT;
}

// Proyecta un punto del mundo a coordenadas del canvas overlay (1280×800).
let projV = null;
export function worldToOverlay(camera, wx, wy, wz) {
  if (!projV) projV = new THREE.Vector3();
  projV.set(wx, wy, wz);
  projV.project(camera);
  return { x: (projV.x * 0.5 + 0.5) * W, y: (-projV.y * 0.5 + 0.5) * H };
}
