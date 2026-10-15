import { CanvasTexture, InstancedBufferAttribute, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, type Texture } from "three";
import { NOTEBOOK_KEYS } from "../input/keyboard-layout";
const COLS = 8, CELL = 128;
export function createKeyMaterial(texture: Texture) {
  const material = new MeshBasicMaterial({ map: texture, transparent: true, opacity: 1, depthWrite: false, toneMapped: false });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute vec4 keyUv;\n${shader.vertexShader}`.replace("#include <uv_vertex>", "#include <uv_vertex>\nvMapUv = keyUv.xy + uv * keyUv.zw;");
  };
  material.customProgramCacheKey = () => "notebook-key-atlas-v2";
  return material;
}

/** One cell per key, drawn in physical key coordinates to preserve glyph aspect ratios. */
export function createKeyLegends() {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = COLS * CELL;
  const context = canvas.getContext("2d")!;
  const uv = new Float32Array(NOTEBOOK_KEYS.length * 4);
  NOTEBOOK_KEYS.forEach((key, index) => {
    const x = index % COLS, y = Math.floor(index / COLS);
    context.save(); context.translate(x * CELL + CELL / 2, y * CELL + CELL / 2);
    context.scale(CELL / key.width, CELL / .17);
    context.fillStyle = "#f1f5f7"; context.textAlign = "center"; context.textBaseline = "middle";
    const font = key.label.length === 1 ? .135 : Math.min(.12, key.width / (key.label.length * .65));
    context.font = `700 ${font}px Consolas, monospace`;
    context.fillText(key.label, 0, .002); context.restore();
    uv.set([x / COLS, 1 - (y + 1) / COLS, 1 / COLS, 1 / COLS], index * 4);
  });
  const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; texture.anisotropy = 16;
  const geometry = new PlaneGeometry(1, 1); geometry.setAttribute("keyUv", new InstancedBufferAttribute(uv, 4));
  return { texture, geometry };
}
