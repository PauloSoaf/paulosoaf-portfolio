import { workstationAvailable } from "@/features/workstation/config";
import { workstationLabels } from "@/features/workstation/labels";
import { isLocale } from "@/i18n/config";

/** A clearly labelled local fixture, never a substitute for a commercial website. */
export function GET(request: Request) {
  if (!workstationAvailable()) return new Response(null, { status: 404 });
  const url = new URL(request.url), language = url.searchParams.get("locale");
  const locale = isLocale(language) ? language : "pt", text = workstationLabels[locale];
  const light = url.searchParams.get("theme") === "light";
  return new Response(`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${text.fixture}</title><style>
    :root{color-scheme:${light ? "light" : "dark"};font-family:system-ui,sans-serif;color:${light ? "#18232d" : "#e6edef"};background:${light ? "#f2f4f3" : "#0c141b"};scrollbar-color:${light ? "#526a69 #e0e5e3" : "#8da8a1 #101a21"};scrollbar-width:auto}
    *{box-sizing:border-box}body{margin:0;padding:32px;line-height:1.6}header,section{max-width:800px;margin:auto}h1{font-size:clamp(28px,5vw,48px);line-height:1.05;letter-spacing:-.05em}small{letter-spacing:.12em}a{color:inherit}button,input{font:inherit;padding:12px;border:1px solid #67827a;border-radius:8px}input{width:100%;margin:8px 0 12px}button{cursor:pointer;background:${light ? "#176b63" : "#65e6c3"};color:${light ? "#fff" : "#092018"}}button:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid #609cdb;outline-offset:4px}section{min-height:420px;border-top:1px solid #67827a;padding-top:40px;margin-top:48px}p{max-width:55ch}.number{font-size:80px;opacity:.45}output{display:block;min-height:32px;margin:12px 0}
    </style></head><body><header id="start"><small>OBSIDIAN / ${text.fixture}</small><h1>${text.fixtureTitle}</h1><p>${text.fixtureNote}</p><label for="idea">${text.fixtureInput}</label><input id="idea" autocomplete="off" maxlength="120"><button id="confirm" type="button">${text.fixtureAction}</button><output id="result" aria-live="polite"></output><a href="#end">${text.fixtureLink} ↓</a></header>
    ${[1, 2, 3].map((n) => `<section><span class="number">0${n}</span><h2>${text.fixtureScroll}</h2><p>${text.fixtureNote}</p></section>`).join("")}
    <section id="end"><h2>${text.fixtureEnd}</h2><a href="#start">↑ ${text.fixtureBack}</a></section>
    <script>document.getElementById('confirm').addEventListener('click',function(){document.getElementById('result').textContent=${JSON.stringify(text.fixtureResult)}})</script></body></html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
}
