import { readFile, writeFile, readdir } from "node:fs/promises";
const output = "docs/qa/Workstation/P01", raw = "docs/report/Workstation";
const read = async (path) => JSON.parse(await readFile(path, "utf8"));
const performance = await read(`${raw}/performance/profile.json`), hydration = await read(`${raw}/hydration/hydration.json`);
const lighthouse = [];
for (const filename of (await readdir(`${raw}/performance`)).filter((name) => name.startsWith("lighthouse-") && name.endsWith(".json"))) {
  const report = await read(`${raw}/performance/${filename}`);
  lighthouse.push({ sample: filename.replace("lighthouse-", "").replace(".json", ""),
    scores: Object.fromEntries(Object.entries(report.categories).map(([id, value]) => [id, value.score * 100])),
    metrics: Object.fromEntries(["first-contentful-paint", "largest-contentful-paint", "cumulative-layout-shift", "total-blocking-time"].map((id) => [id, report.audits[id].numericValue])) });
}
const screenshots = (await readdir(`${output}/screenshots`)).filter((name) => name.endsWith(".png")).sort();
const videos = await read(`${output}/video-metadata.json`);
const metrics = { baseSha: "5c607eb17d29d536620e0cd2080f8202586441b3", branch: "feat/workstation-notebook-poc", performance, hydration, lighthouse, screenshotCount: screenshots.length, videos };
await writeFile(`${output}/metrics.json`, JSON.stringify(metrics, null, 2) + "\n");
const audit = await read("docs/report/Workstation/P00/canonical-verified/embed-audit.json");
for (const site of audit.sites) if (site.browser?.content) delete site.browser.content.bodyText;
await writeFile("docs/qa/Workstation/P00/embed-audit.json", JSON.stringify(audit, null, 2) + "\n");
const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Workstation P01 — evidências</title><style>
:root{font:15px/1.6 system-ui;color-scheme:dark;background:#090d11;color:#f2f6f4}body{margin:0;padding:32px}a{color:#a7f8df}h1{letter-spacing:-.04em;font-size:clamp(30px,5vw,54px);margin:0}header{max-width:900px;margin-bottom:32px}input{font:inherit;padding:12px;min-width:min(90%,320px);border:1px solid #5e7578;border-radius:8px;background:#141b20;color:inherit}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,330px),1fr));gap:20px}figure{margin:0;background:#141b20;border:1px solid #2b383d;border-radius:10px;overflow:hidden}img{width:100%;height:300px;object-fit:contain;background:#090d11}figcaption{padding:12px;font-size:12px;overflow-wrap:anywhere}video{width:100%;max-height:500px}h2{margin-top:40px}.video-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:20px}[hidden]{display:none!important}</style>
<header><p>OBSIDIAN / P00 + P01 / 14.10.2026</p><h1>Um notebook para explorar.</h1><p>Evidências reais em Chromium, Dark/Light e PT/EN/ES. Capturas e vídeos não substituem aceite estético nem validação em aparelho físico. Code é placeholder P03; física/jogos permanecem no backlog.</p><p><a href="REPORT.md">Relatório</a> · <a href="../P00/EMBED-MATRIX.md">Matriz dos sites</a> · <a href="metrics.json">Métricas</a></p></header>
<h2>Vídeos nativos</h2><div class="video-grid">${videos.map((video) => `<figure><video controls preload="metadata" src="${video.file}"></video><figcaption>${video.file} · ${video.width}×${video.height} · ${video.durationSeconds.toFixed(2)} s</figcaption></figure>`).join("")}</div>
<h2>${screenshots.length} capturas</h2><p><label for="filter">Filtrar por idioma, tema, largura ou estado </label><input id="filter" type="search" placeholder="pt-dark, 390, focus, live…"></p><div class="grid">${screenshots.map((file) => `<figure data-name="${file}"><a href="screenshots/${file}" target="_blank" rel="noopener"><img loading="lazy" src="screenshots/${file}" alt="Evidência ${file.replaceAll("-", " ")}"></a><figcaption>${file}</figcaption></figure>`).join("")}</div>
<script>document.getElementById('filter').addEventListener('input',function(){const query=this.value.toLowerCase();document.querySelectorAll('[data-name]').forEach(item=>item.hidden=!item.dataset.name.includes(query))})</script></html>`;
await writeFile(`${output}/review.html`, html);
console.log(JSON.stringify({ lighthouse, screenshots: screenshots.length, videos: videos.length }, null, 2));
