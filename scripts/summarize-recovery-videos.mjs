import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
const output = "docs/qa/CreativeRecovery", browser = await chromium.launch(), metadata = [];
try {
  const page = await browser.newPage();
  for (const filename of (await readdir(`${output}/videos`)).filter(name => name.endsWith(".webm")).sort()) {
    const bytes = await readFile(`${output}/videos/${filename}`);
    const decoded = await page.evaluate(async src => {
      const video = document.createElement("video"); video.src = src;
      await new Promise((resolve, reject) => { video.onloadedmetadata = resolve; video.onerror = () => reject(new Error("Video decoding failed")); });
      return { durationSeconds: video.duration, width: video.videoWidth, height: video.videoHeight };
    }, `data:video/webm;base64,${bytes.toString("base64")}`);
    if (!Number.isFinite(decoded.durationSeconds) || decoded.durationSeconds <= 0) throw new Error(`Invalid video: ${filename}`);
    metadata.push({ file: `videos/${filename}`, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), ...decoded });
  }
} finally { await browser.close(); }
await writeFile(`${output}/video-metadata.json`, JSON.stringify(metadata, null, 2) + "\n");
console.log(metadata.map(({ file, durationSeconds, width, height }) => ({ file, durationSeconds, width, height })));
