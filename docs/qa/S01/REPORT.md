# S01 — Hero procedural WebGL

Data: 10/10/2026. Branch: `feat/s01-hero-procedural`. Base auditada: `ea3cf243094ba524335c6e367467c8bbf6107574` (`main`). **Implementação e verificações técnicas locais concluídas; metas de campo/aparelhos físicos, aceite do proprietário e publicação pendentes.** Nenhum conteúdo editorial foi aprovado. Push/deploy desta sprint não foram executados.

## Escopo entregue e arquivos

O hero editorial continua Server Component: copy, idioma, CTAs e SVG chegam no HTML. A nova ilha cliente carrega Three.js/R3F real, com esfera deformada deterministicamente, shader topográfico próprio, rim light, órbitas, estrelas e marcadores. O ponteiro altera a rotação 3D, limitada a ±0,10 rad e interpolada sem estado React por frame. A câmera acompanha as dimensões da arte.

Há perfis mobile/tablet/desktop, DPR limitado, render sob demanda, pausa por botão/viewport/aba/reduced motion e opt-in em dispositivos/conexões limitados. Touch preserva scroll nativo e não gera parallax. Em mobile coarse, o carregamento automático espera 90% da arte visível; o SVG permanece na primeira dobra. O host reserva 820:760 antes de qualquer mídia; erro de chunk, criação WebGL, shader ou perda de contexto devolve a arte estática. O canvas pode ser desmontado e reativado sem acumular contextos antigos.

| Arquivos / área | Alteração S01 |
|---|---|
| `src/graphics/hero/{quality.ts,shaders.ts,HeroScene.client.tsx}` | Cena real, material, geometria, limites, câmera, frame loop, descarte e diagnóstico CPU/GPU. |
| `src/components/hero/{HeroArtBoundary.client.tsx,HeroVitals.client.tsx,HeroEditorial.tsx}` | Progressive enhancement, controles, estabilidade do layout, integração servidor/cliente e vitals locais. |
| `src/i18n/dictionaries/{pt,en,es}.ts` | Labels dos controles; copy anterior preservado. |
| `package.json`, `package-lock.json` | Three 0.186.1, R3F 9.8.1, tipos Three 0.186.0 e comandos QA. |
| `tests/unit/hero-quality.test.ts`, `tests/e2e/hero.spec.ts` | Regressões matemáticas e interações/renderização/falhas reais. |
| `tests/visual/hero.spec.ts`, `playwright.hero-visual.config.ts`, `playwright.visual.config.ts` | Evidências próprias S01; captura S00 continua separada. |
| `scripts/{profile-hero.mjs,summarize-hero-qa.mjs}` | Perfil reproduzível e resumo versionável, com logs brutos ignorados. |
| `README.md`, `docs/HANDOFF.md`, `docs/adr/ADR-009-progressive-hero-webgl.md`, `docs/qa/S01/` | Operação, autoria exata, decisões e resultados. |

A atribuição Claude/Codex e o marco da retomada estão em [HANDOFF](../../HANDOFF.md). Decisões e desvios de implementação estão no [ADR-009](../../adr/ADR-009-progressive-hero-webgl.md). S02–S05 permanecem no roadmap; S06 e Obsidian Dev Mode não foram implementados.

## Verificação executada

| Check | Resultado |
|---|---|
| `npm run lint` | Passou, sem warnings. |
| `npm run typecheck` | Passou: typegen desta versão Next + TypeScript strict. |
| `npm test` | 34 testes passaram, em cinco arquivos; nove novos casos S01. |
| `npm run build` | Passou; PT/EN/ES gerados, sem client boundary global. |
| `npm run test:e2e` | 28 passaram; um gate público condicional é executado separadamente. |
| `QA_EXPECT_PUBLIC_CONTENT=1`, teste `public build` | Um passou: drafts/contatos não aprovados continuam excluídos. |
| `npm run qa:hero` | 36 passaram: seis viewports × três idiomas × dois temas, canvas renderizado e rotação estabilizada. |
| `npm audit --omit=dev` | Zero vulnerabilidades conhecidas em produção. Auditoria completa conserva cinco alertas altos da cadeia ESLint já registrados na S00. |
| `npm run release:check` | Bloqueio esperado: dez pendências editoriais/de contato/origem HTTPS, sem mudança de aprovações. |

Os E2E exercitam pixels diferentes após pointer, clamp, retorno ao repouso, ausência de frames em idle, pausa, viewport/aba oculta, atualização de tema no mesmo canvas, reduced motion, Save-Data, touch/scroll, chunk abortado, GL indisponível, shader inválido, `WEBGL_lose_context`, retry e teclado tablet. Ao retornar ao SVG, verificam que os contextos antigos efetivamente ficam perdidos; novos renders mantêm cinco geometrias. Em DPR emulado 3, o renderer respeitou 1,5 desktop, 1,25 tablet e 1 mobile. O teste de SVG atrasado comprova dimensões reservadas antes/depois da imagem.

Regressões da S00 também passaram: três idiomas sem JS, links/metadados/404, tema/idioma/cookies/âncoras, menu por teclado, seis larguras, fonte a 200%, mídia abortada e axe. O warning servidor `Internal: NoFallbackError` do Next na 404 continua sendo a limitação herdada descrita em ADR-005; respostas e testes de 404 passaram. Não foi alterado o framework para ocultá-lo.

## Aceite e tarefas

| Critério | Evidência / resultado local |
|---|---|
| AC-001 | Sem JS: HTML e CTAs disponíveis/clicáveis em PT/EN/ES. |
| AC-002 | Chunk 3D separado, solicitado após conteúdo/gate; GL/chunk/shader falhos restauram SVG. |
| AC-008 | Reduced motion não importa WebGL automaticamente; opt-in rende estático, sem parallax/loop. |
| AC-009 | 360/390/768/1024/1440/1920 sem overflow; desktop, tablet, mobile, fonte ampliada e temas testados. |
| AC-010 | Lighthouse e Web Vitals instrumentados e medidos; metas não comprovadas são explicitadas abaixo. |
| AC-015 | Falhas não bloqueiam projetos/contato; descarte de contextos e repetidas montagens verificados. |

T01-01 a T01-05 implementadas e testadas. T01-06 executada com perfil CPU, inspeção de renderer/capacidade GPU, chunks e capturas; a extensão de timer GPU não existe neste ambiente e a aferição física permanece pendente. Isso não é apresentado como certificação de FPS. AC-010 exige medição/relato honesto, não uma alegação de p75 antes de publicação.

## Performance e limites medidos

Build otimizado público, Windows, Chromium 153 do Playwright, Lighthouse CLI 13.5.0, throttling padrão **simulate** mobile / preset desktop. Não havia outra sessão de captura/teste pesada concorrente durante estas medições. Uma amostra por configuração; não há significância estatística nem dados de campo. O resumo completo é [metrics.json](metrics.json); logs/trace/request lists ficam em `docs/report/S01/`, ignorados pelo Git.

| Amostra | Performance | A11y / boas práticas / SEO | LCP | CLS | TBT |
|---|---:|---|---:|---:|---:|
| S00 desktop, `ea3cf24` | 100 | 100 / 100 / 100 | 0,547 s | 0 | 0 ms |
| S01 desktop final | 100 | 100 / 100 / 100 | 0,596 s | 0,000648 | 0 ms |
| S00 mobile, `ea3cf24` | 95 | 100 / 100 / 100 | 2,727 s | 0 | 110 ms |
| S01 mobile final, primeira dobra com SVG | 95 | 100 / 100 / 100 | 2,866 s | 0 | 100 ms |

O primeiro experimento carregava 3D mobile a 1% de interseção: performance 84 e TBT 440 ms. O gate coarse a 90% preserva leitura/CTAs e ativa a cena com scroll até a arte. Uma rodada intermediária sem proporção explícita registrou CLS 0,115; a proporção reservada e teste de mídia atrasada foram acrescentados. Esses experimentos permanecem em `metrics.json`, sem substituir a comparação S00.

**LCP mobile ≤2,5 s não foi alcançado neste laboratório**, inclusive na base S00. A meta RNF-001 é p75 de campo: não existe publicação/coleta para certificá-la. INP local é medido por interações confiáveis e flush de visibilidade; não equivale a INP p75. A primeira rodada do perfil sintético após mudar reduced motion registrou CLS 0,113; está preservada em `diagnosticVitals`. A repetição com observador de fontes registrou CLS ~0,006 no perfil mobile, apenas deslocamentos dos controles, sem nova alteração da caixa SVG. A variação exige acompanhamento; o Lighthouse final CLS 0 não deve ser lido como garantia universal de estabilidade.

JS externo inicial S00: **145.309 bytes gzip**. S01: **151.218 bytes gzip**, +5.909 bytes, abaixo do alvo de 180.000. O chunk lazy Three/R3F/cena mede **244.519 bytes gzip** (923.067 bytes sem compressão). Se a cena for ativada, o total desses scripts é 395.737 bytes gzip. Medição soma corpos de scripts únicos comprimidos com `gzipSync`, exclui headers, inline RSC, CSS/fontes/imagens; não confundir com transferência total ou Brotli. O import WebGL não consta no conjunto inicial e não é solicitado automaticamente em reduced motion/Save-Data.

| Perfil ativo em largura | Draw calls | Triângulos | Geometrias | CPU média `gl.render` | rAF observado | Frames adicionais em idle |
|---|---:|---:|---:|---:|---:|---:|
| 390 px | 5 | 2.540 | 5 | ~0,222 ms | ~60,00 Hz | 0 |
| 1440 px | 5 | 7.852 | 5 | ~0,239 ms | ~59,67 Hz | 0 |

Esse perfil usa 180 eventos sintéticos de ponteiro, medindo frames/render real; o intervalo p95 foi ~16,7 ms. **rAF observado não é FPS físico nem tempo GPU.** O renderer é ANGLE/SwiftShader (software), DPR 1 nessas amostras. `EXT_disjoint_timer_query_webgl2` é indisponível; custo GPU não foi medido numericamente. O código usa queries assíncronas se a extensão existir, descartando resultados disjoint. As metas ≥50 FPS desktop / ≥30 FPS mobile em aparelhos de referência não foram verificadas em hardware real. O cenário 390 px do perfil emula largura, com mouse; touch real emulado é coberto em E2E separado.

## Evidências e comparação visual v0.1

Referências examinadas: [mockup desktop](../../../paulo_soaf_obsidian_orbit_specs_pocs_v01/assets/mockups/01-hero-desktop.png), [mockup mobile](../../../paulo_soaf_obsidian_orbit_specs_pocs_v01/assets/mockups/05-hero-mobile.png), SVG original e `pocs/preview/poc-001-hero.html`. A POC foi aberta no browser e inspecionada: composição SVG/CSS, zero canvases. A captura auxiliar dessa referência fica no relatório local ignorado.

Copy à esquerda / objeto à direita no desktop; mobile separa copy e arte; tablet usa translucidez e wash para contraste. Tokens/tipografia/composição S00 foram preservados. O material mantém grafite azul-petróleo e rim verde localizado, sem verde dominante. O shader topográfico substitui o desenho literal dos polígonos do SVG por terreno procedural; não é cópia pixel-perfect. Light conserva a variante neutra da fundação. Controles próprios ficam sob a esfera, acima da assinatura, e não capturam o scroll.

Foi realizada inspeção visual das variantes desktop/mobile Dark/Light e tablet, incluindo ES 360 px e EN; todas as 36 capturas foram geradas sem erro e verificadas por dimensões/ausência de overflow. Revisão visual do proprietário e leitura manual por leitor de tela continuam pendentes; axe/Lighthouse não certificam WCAG integralmente.

Capturas incluem header + hero completo; a altura do arquivo pode exceder a viewport mobile para mostrar arte/controles abaixo da dobra. O layout foi medido nos viewports **360×800, 390×844, 768×1024, 1024×768, 1440×900 e 1920×1080**. Este build filtra drafts e não mostra a faixa editorial do `next dev`/evidência S00 de prévia.

| Idioma / tema | 360 | 390 | 768 | 1024 | 1440 | 1920 |
|---|---|---|---|---|---|---|
| PT Dark | [PNG](screenshots/pt-dark-360.png) | [PNG](screenshots/pt-dark-390.png) | [PNG](screenshots/pt-dark-768.png) | [PNG](screenshots/pt-dark-1024.png) | [PNG](screenshots/pt-dark-1440.png) | [PNG](screenshots/pt-dark-1920.png) |
| PT Light | [PNG](screenshots/pt-light-360.png) | [PNG](screenshots/pt-light-390.png) | [PNG](screenshots/pt-light-768.png) | [PNG](screenshots/pt-light-1024.png) | [PNG](screenshots/pt-light-1440.png) | [PNG](screenshots/pt-light-1920.png) |
| EN Dark | [PNG](screenshots/en-dark-360.png) | [PNG](screenshots/en-dark-390.png) | [PNG](screenshots/en-dark-768.png) | [PNG](screenshots/en-dark-1024.png) | [PNG](screenshots/en-dark-1440.png) | [PNG](screenshots/en-dark-1920.png) |
| EN Light | [PNG](screenshots/en-light-360.png) | [PNG](screenshots/en-light-390.png) | [PNG](screenshots/en-light-768.png) | [PNG](screenshots/en-light-1024.png) | [PNG](screenshots/en-light-1440.png) | [PNG](screenshots/en-light-1920.png) |
| ES Dark | [PNG](screenshots/es-dark-360.png) | [PNG](screenshots/es-dark-390.png) | [PNG](screenshots/es-dark-768.png) | [PNG](screenshots/es-dark-1024.png) | [PNG](screenshots/es-dark-1440.png) | [PNG](screenshots/es-dark-1920.png) |
| ES Light | [PNG](screenshots/es-light-360.png) | [PNG](screenshots/es-light-390.png) | [PNG](screenshots/es-light-768.png) | [PNG](screenshots/es-light-1024.png) | [PNG](screenshots/es-light-1440.png) | [PNG](screenshots/es-light-1920.png) |

## Repetição e publicação

`npm run verify`, `npm run test:e2e` e `npm run qa:hero` validam o build corrente. `npm run dev` permanece em `http://localhost:1010/pt`; Playwright possui a porta 3200. Para repetir o perfil, iniciar produção na porta 3202 e executar `QA_ORIGIN=http://127.0.0.1:3202 node scripts/profile-hero.mjs` (no PowerShell, atribuir via `$env:QA_ORIGIN`).

Para Lighthouse, usar o Chromium instalado pelo Playwright:

```powershell
$env:CHROME_PATH = (node -p "require('playwright').chromium.executablePath()")
npm exec --yes --package=lighthouse@13.5.0 -- lighthouse http://127.0.0.1:3202/pt --preset=desktop --only-categories=performance,accessibility,best-practices,seo --chrome-flags='--headless --enable-unsafe-swiftshader' --output=json --output-path=docs/report/S01/lighthouse-desktop.json --quiet
npm exec --yes --package=lighthouse@13.5.0 -- lighthouse http://127.0.0.1:3202/pt --only-categories=performance,accessibility,best-practices,seo --chrome-flags='--headless --enable-unsafe-swiftshader' --output=json --output-path=docs/report/S01/lighthouse-mobile.json --quiet
npm run qa:hero:summary
```

O resumo exige perfil + dois relatórios finais; se logs históricos estiverem ausentes num clone, conserva a comparação histórica versionada. A comparação S00 original foi feita em worktree detached, apenas ampliando o root Turbopack para compartilhar dependências via junction, sem alterar aplicação S00/main.

A liberação pública continua bloqueada pelas aprovações, contato/CV e origem HTTPS já documentados na S00. Não houve deploy, push, aprovação automática, fabricação de links/métricas profissionais ou implementação antecipada de outra sprint. Antes de publicar, revisar esses gates e aferir performance/acessibilidade nos aparelhos/browsers de referência.
