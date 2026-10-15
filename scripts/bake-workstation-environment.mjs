import { createServer } from "vite";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
const entry = `
import { WebGLRenderer, PMREMGenerator, REVISION } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const renderer = new WebGLRenderer(); renderer.setSize(16,16);
const room = new RoomEnvironment(), generator = new PMREMGenerator(renderer);
const target = generator.fromScene(room,.02,.1,100,{size:64});
const data = new Uint16Array(target.width*target.height*4);
renderer.readRenderTargetPixels(target,0,0,target.width,target.height,data);
window.studioBaked = {width:target.width,height:target.height,data:Array.from(data),revision:REVISION,colorSpace:target.texture.colorSpace};
target.dispose(); room.dispose(); generator.dispose(); renderer.dispose();
`;
const server = await createServer({ configFile: false, server: { host: "127.0.0.1", port: 3044, strictPort: true },
  plugins: [{ name: "workstation-studio-bake", resolveId(id) { if (id === "/studio-bake-entry.js") return "\0studio-bake-entry"; },
    load(id) { if (id === "\0studio-bake-entry") return entry; },
    configureServer(server) { server.middlewares.use((req, res, next) => { if (req.url !== "/__studio_bake.html") return next(); res.setHeader("Content-Type", "text/html"); res.end('<script type="module" src="/studio-bake-entry.js"></script>'); }); },
  }],
});
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] });
try {
  await server.listen(); const page = await browser.newPage(); page.on("pageerror", (error) => { console.error(error); });
  await page.goto("http://127.0.0.1:3044/__studio_bake.html"); await page.waitForFunction(() => window.studioBaked);
  const { data, ...metadata } = await page.evaluate(() => window.studioBaked);
  if (!data.some((value, index) => index % 4 !== 3 && value > 0)) throw new Error("Empty environment readback");
  const raw = Buffer.alloc(12 + data.length * 2); raw.writeUInt32LE(0x4e454f4f, 0); raw.writeUInt32LE(metadata.width, 4); raw.writeUInt32LE(metadata.height, 8);
  data.forEach((value, index) => raw.writeUInt16LE(value, 12 + index * 2)); const packed = gzipSync(raw, { level: 9 });
  const output = "public/art/workstation"; await mkdir(output, { recursive: true });
  await writeFile(`${output}/studio-pmrem-v1.bin.gz`, packed);
  await writeFile(`${output}/studio-pmrem-v1.json`, JSON.stringify({ ...metadata, source: "Three.js RoomEnvironment (MIT), PMREM fromScene; generated locally by scripts/bake-workstation-environment.mjs, no external HDR photograph", faceSize: 64, sigma: .02, near: .1, far: 100, format: "OOEN magic uint32 LE, width/height uint32 LE, RGBA16F little-endian CubeUV; gzip", rawBytes: raw.length, packedBytes: packed.length, sha256: createHash("sha256").update(packed).digest("hex") }, null, 2) + "\n");
  console.log({ ...metadata, rawBytes: raw.length, packedBytes: packed.length });
} finally { await browser.close(); await server.close(); }
