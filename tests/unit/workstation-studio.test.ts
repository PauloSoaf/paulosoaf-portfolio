import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { expect, it } from "vitest";
import { CubeUVReflectionMapping, HalfFloatType } from "three";
import { studioTexture } from "@/features/workstation/scene/studio-environment";
it("loads the baked HDR CubeUV atlas without regenerating PMREM", () => {
  const raw = gunzipSync(readFileSync("public/art/workstation/studio-pmrem-v1.bin.gz"));
  const texture = studioTexture(Uint8Array.from(raw).buffer);
  expect(texture.image.width).toBe(336); expect(texture.image.height).toBe(256);
  expect(texture.mapping).toBe(CubeUVReflectionMapping); expect(texture.type).toBe(HalfFloatType);
  expect(texture.image.data!.some((value: number) => value > 0)).toBe(true); texture.dispose();
});
it("rejects a truncated or wrong atlas instead of uploading corrupt pixels", () => {
  expect(() => studioTexture(new ArrayBuffer(4))).toThrow("Truncated");
  expect(() => studioTexture(new ArrayBuffer(12))).toThrow("Invalid");
});
