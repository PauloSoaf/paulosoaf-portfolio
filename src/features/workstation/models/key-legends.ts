import { CanvasTexture, InstancedBufferAttribute, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, type Texture } from "three";
import { NOTEBOOK_KEYS } from "../input/keyboard-layout";
const COLS = 8, CELL = 160, KEY_DEPTH = .18;
export function createKeyMaterial(texture: Texture) {
  const material = new MeshBasicMaterial({ map: texture, transparent: true, opacity: 1, depthWrite: false, toneMapped: false });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute vec4 keyUv;\n${shader.vertexShader}`.replace("#include <uv_vertex>", "#include <uv_vertex>\nvMapUv = keyUv.xy + uv * keyUv.zw;");
  };
  material.customProgramCacheKey = () => "notebook-key-atlas-v3";
  return material;
}

/** The page's own sans (next/font family), so the legends match the editorial typography. */
function siteSans() {
  const family = typeof document === "undefined" ? "" : getComputedStyle(document.body).fontFamily;
  return family || "Inter, system-ui, sans-serif";
}

/**
 * One cell per key, drawn in physical key coordinates to preserve glyph aspect ratios.
 * Letters are centred and small; modifiers sit lower-left in lowercase, like a real keyboard.
 */
export function createKeyLegends() {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = COLS * CELL;
  const context = canvas.getContext("2d")!;
  const uv = new Float32Array(NOTEBOOK_KEYS.length * 4), family = siteSans();
  NOTEBOOK_KEYS.forEach((key, index) => {
    const x = index % COLS, y = Math.floor(index / COLS);
    context.save(); context.translate(x * CELL + CELL / 2, y * CELL + CELL / 2);
    context.scale(CELL / key.width, CELL / KEY_DEPTH);
    context.fillStyle = "rgba(236,242,246,.92)"; context.textBaseline = "middle";
    const glyph = [...key.label].length === 1;
    if (glyph) {
      context.textAlign = "center";
      context.font = `500 ${/[A-Z0-9]/.test(key.label) ? .068 : .075}px ${family}`;
      context.fillText(key.label, 0, .002);
    } else {
      context.textAlign = key.label === "space" ? "center" : "left";
      context.font = `500 .042px ${family}`;
      context.fillText(key.label === "space" ? "" : key.label, key.label === "space" ? 0 : -key.width / 2 + .028, KEY_DEPTH / 2 - .04);
    }
    context.restore();
    uv.set([x / COLS, 1 - (y + 1) / COLS, 1 / COLS, 1 / COLS], index * 4);
  });
  const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; texture.anisotropy = 16;
  const geometry = new PlaneGeometry(1, 1); geometry.setAttribute("keyUv", new InstancedBufferAttribute(uv, 4));
  return { texture, geometry };
}
