import { CubeUVReflectionMapping, DataTexture, HalfFloatType, LinearFilter, LinearSRGBColorSpace, RGBAFormat } from "three";
let pixels: Promise<ArrayBuffer> | undefined;

/** Already-filtered CubeUV data; uploading it needs no runtime PMREM render passes. */
export function studioTexture(buffer: ArrayBuffer) {
  if (buffer.byteLength < 12) throw new Error("Truncated studio environment");
  const header = new DataView(buffer), width = header.getUint32(4, true), height = header.getUint32(8, true);
  if (header.getUint32(0, true) !== 0x4e454f4f || width !== 336 || height !== 256 || buffer.byteLength !== 12 + width * height * 8) throw new Error("Invalid studio environment");
  const texture = new DataTexture(new Uint16Array(buffer, 12), width, height, RGBAFormat, HalfFloatType);
  texture.mapping = CubeUVReflectionMapping; texture.minFilter = texture.magFilter = LinearFilter;
  texture.colorSpace = LinearSRGBColorSpace; texture.needsUpdate = true;
  return texture;
}
export function loadStudioPixels() {
  return pixels ??= fetch("/art/workstation/studio-pmrem-v1.bin.gz").then(async (response) => {
    if (!response.ok) throw new Error("Studio environment unavailable");
    const buffer = await response.arrayBuffer(), signature = new Uint8Array(buffer, 0, Math.min(2, buffer.byteLength));
    // Some hosts may serve the precompressed asset with Content-Encoding already applied.
    if (signature[0] !== 31 || signature[1] !== 139) return buffer;
    return new Response(new Blob([buffer]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
  }).catch((error) => { pixels = undefined; throw error; });
}
