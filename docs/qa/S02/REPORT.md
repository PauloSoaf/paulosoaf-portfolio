# S02 — Featured Work cinematográfico e catálogo comercial

Data: 10/10/2026. Branch: `feat/s02-cinematic-projects`. Base local/remota conferida: `758557ecc342875ce098f6912cc26d14bf3fc284`, branch S01; `main` permanece em `ea3cf243094ba524335c6e367467c8bbf6107574`. Implementação e QA locais; revisão visual/editorial, aparelhos físicos e publicação continuam pendentes. Nenhum candidato foi aprovado. Não houve merge, push ou deploy nesta continuação.

## Implementação e arquivos

O grid da S00 foi aprimorado por uma ilha de carrossel que recebe os cards do servidor. Desktop mostra o ativo centralizado, amplo e opaco, com vizinhos menores em perspectiva; mobile simplifica transforms e mantém conteúdo/controles legíveis. Há anterior/próximo, posição/progresso, pausa/reprodução de 7 segundos, setas quando o estágio está focado, drag com mouse e swipe touch real, sem capturar rolagem vertical. Sem JS, todos os artigos/links visíveis no catálogo permanecem acessíveis.

Autoplay suspende por hover/drag/viewport/aba; entrada de foco encerra a intenção de reprodução até solicitação explícita. Pausa manual persiste. Reduced motion remove transições e impede autoplay. Inativos recebem `inert`/`aria-hidden`; somente mudanças manuais são anunciadas. Lista vazia conserva o fallback editorial/GitHub anterior; uma lista com um item não apresenta controles de rotação nem timer. Seleção por slug resiste a reordenação; remover o selecionado volta ao primeiro.

NutriOpus e Déborah Lima entram como `draft`, primeiros na ordem configurável. Modelos distinguem tipo, política de código, ordem, stack pendente, imagem opcional e disponibilidade futura de case. Demo continua sendo um link verificado opcional, não um booleano duplicado. Os sete projetos foram conservados. Novos candidatos não expõem código, demo, screenshot real ou stack presumida; artes abstratas têm identificação explícita. Não existem cases/ações fictícias. Aprovação/filtro/release gate anteriores permanecem.

| Área / arquivos | Trabalho S02 |
|---|---|
| `src/components/carousel/`, `src/features/projects/carousel-controller.ts` | Controlador/reducer, estado explícito, hidratação, observadores/timeout, ARIA, teclado/gestos e evento opcional de seleção. |
| `src/styles/carousel.css`, import em `src/app/globals.css` | Composição desktop/mobile, transform/opacity, tamanhos reservados, controle compacto e tokens v0.1. |
| `WorkSection`, `ProjectCard`, `ProjectMedia.client`, `ProjectArtFallback` | Reutilização servidor, ações verificadas, imagens ativas/adjacentes, recuperação e sete identidades gráficas locais. |
| `project-{types,data,validation,presentation}.ts` | Catálogo comercial, ordenação configurável sem mutação, exposição de fonte pública, validação de stack/cases/ordem. |
| `src/i18n/dictionaries/{pt,en,es}.ts` | Labels completos, posição, estados, tipos e legendas. |
| `src/app/fonts.ts` | Corrige fallback mono proporcional que mudava linhas/altura durante font swap; fonte final e preloads preservados. |
| `tests/unit/carousel.test.tsx`, ajuste em `content.test.ts` | Catálogo privado, gates, reducer, lista 0/1/2, mudanças de quantidade/ordem e dados sem ações. |
| `tests/e2e/carousel.spec.ts` | Interações reais, mídia quebrada, no-JS, temas/idiomas, reflow/axe, fonte atrasada e diagnóstico de observador em falhas. |
| `tests/visual/carousel.spec.ts`, `playwright.carousel-visual.config.ts` | 36 cenários e 52 imagens próprias, sem substituir S00/S01. |
| `tests/visual/hero.spec.ts` | Somente diretório de saída configurável da nova regressão; cena do Hero intacta. |
| `scripts/{profile-carousel,summarize-carousel-qa}.mjs`, scripts npm | Medição reproduzível de chunks/transforms/vitals e resumo versionado. |
| `README`, `HANDOFF`, `ADR-010`, `docs/qa/S02/` | Operação, fronteira de autoria, decisões, pendências e evidências. |

Ponto exato de retomada e divisão Claude/Codex: [HANDOFF](../../HANDOFF.md). Arquitetura, diferenças da POC e APIs consultadas: [ADR-010](../../adr/ADR-010-cinematic-project-carousel.md). Pendências por projeto: [EDITORIAL-PENDING](EDITORIAL-PENDING.md).

## Verificação e critérios

| Check | Resultado local |
|---|---|
| Lint/typecheck | Passaram, sem warnings; TypeScript strict/typegen Next. |
| `npm test` | 47 testes passaram em seis arquivos; 13 casos S02, incluindo variantes de suspensão. |
| Build otimizado | Prévia e público geraram PT/EN/ES. |
| E2E completo | 44 passaram, um skip condicional do gate público na prévia. Além disso, 20 repetições focadas de drag/troca de idioma passaram sem retries após a correção do observador. |
| Gate público | Um teste separado passou no build público final, cobrindo PT/EN/ES sem drafts, artigos de candidato ou contatos não aprovados. |
| `qa:carousel` | 36 cenários passaram; 52 PNGs gerados. |
| `qa:hero` | 36 cenários passaram após a correção de fallback de fonte; evidência nova em `docs/report/S02/hero-regression/`. |
| `release:check` | Falhou conforme esperado: dez bloqueadores de origem HTTPS, perfil/copy, coleções aprovadas e e-mail/LinkedIn/CV. Nenhuma aprovação foi alterada. |

Os E2E verificam mudança de projeto/arte/pixels, wrap, posição, links e ausência de canvas em Work; teclado/Tab/Space/Enter; mouse drag iniciado em link sem popup; toque via CDP `Input.dispatchTouchEvent` e scroll vertical; timer real controlado por relógio virtual a 7 segundos; hover/foco/pausa/reduced motion/aba/viewport; recuperação de imagem e dimensão estável; catálogo inteiro sem JS; seis idiomas/temas e seis larguras; fonte a 200%; axe e persistência do tema/âncora na troca de idioma. A troca de idioma usa navegação nativa e reinicia seleção, mantendo catálogo/ações. Modelo/listas vazia/única/dupla e reordenação/remoção também têm testes unitários de DOM; o build público cobre lista editorial vazia real.

Um teste mantém pendentes exclusivamente os WOFF2 IBM Plex Mono, deixa Inter/Space Grotesk carregar e compara selo/topo do título antes/depois da liberação (tolerância 1 px). O perfil inicial identificou uma falha intermitente de registro de observador; callback ref acompanha o nó montado, e o cenário recebeu repetição dedicada. Isso foi corrigido, não escondido com retries globais.

| AC / tarefa | Evidência / limite |
|---|---|
| AC-003 / T02-02,03 | Controles, timer, foco/hover, teclado, drag/swipe, pausa e prevenção de clique acidental testados. |
| AC-004 / T02-01,05 | Parte S02: links verificados opcionais, código privado omitido, drafts filtrados e nenhuma demo/case fictício. O critério completo de contribuições/cases aprovados pertence à S04 e continua pendente. |
| AC-008 | Reduced motion não remove conteúdo; desativa autoplay e transições, com controles manuais. |
| AC-009 / T02-04 | 360/390/768/1024/1440/1920 sem overflow; controle mobile mantém largura legível; temas/idiomas e zoom testados. |
| AC-015 | Erro de mídia recupera arte distinta e preserva links; Work não cria WebGL. Regressão real de Hero/context loss/disposal passou. |
| T02-06 | Evento `portfolio:project-change` com `{slug, selectedIndex}` desacoplado; nenhuma integração futura com materiais foi antecipada. |
| T02-07 | Unitários, E2E, 52 PNGs e relatório próprios; evidências anteriores preservadas. |

RF-004/005/017 implementados no escopo técnico; publicação de projetos revisados depende do gate. RF-013 tem contrato opcional, sem alterar o Hero. RNF-001 é medido abaixo sem alegar p75; RNF-007 é preservado pela regressão S01. Testes automatizados não certificam WCAG integral nem substituem leitor de tela/manual em aparelhos físicos.

## Comparação visual e evidências

Referências examinadas: [mockup desktop](../../../paulo_soaf_obsidian_orbit_specs_pocs_v01/assets/mockups/02-projects-desktop.png), [mobile](../../../paulo_soaf_obsidian_orbit_specs_pocs_v01/assets/mockups/06-projects-mobile.png), specs v0.1 e POC-002 aberta no Chromium; o botão Next original efetivamente mudou para ChessInReact. Captura da POC fica no diretório operacional ignorado.

Preservados título editorial, paleta/tokens, ativo dominante, profundidade lateral, hierarquia e navegação natural. Diferenças intencionais: sete candidatos em vez de três; NutriOpus/Déborah primeiro; resumos/badges/legenda honesta tornam o card mais alto; altura do maior slide permanece reservada, inclusive em privados sem CTA; fallback abstrato em vez de screenshots inexistentes; controles traduzidos/maiores; foco não retoma rotação sozinho; mobile dispõe controles em grid legível. Não foi usada referência v0.2 nem arte gerada fingindo entrega.

Capturas mostram a seção Work inteira, cuja altura excede a viewport para manter texto legível. A pausa foi ativada pelo botão real; o header fixo é ocultado **somente durante a captura**, via opção `screenshot.style`, para não ser costurado no meio da seção. O header/navegação real continua coberto em E2E. Foram inspecionadas manualmente variantes Dark/Light desktop/mobile, Dr-Manaus e Déborah, além de ES 360. A revisão visual final é do proprietário.

| Idioma / tema | 360 | 390 | 768 | 1024 | 1440 | 1920 |
|---|---|---|---|---|---|---|
| PT Dark | [PNG](screenshots/pt-dark-360.png) | [PNG](screenshots/pt-dark-390.png) | [PNG](screenshots/pt-dark-768.png) | [PNG](screenshots/pt-dark-1024.png) | [PNG](screenshots/pt-dark-1440.png) | [PNG](screenshots/pt-dark-1920.png) |
| PT Light | [PNG](screenshots/pt-light-360.png) | [PNG](screenshots/pt-light-390.png) | [PNG](screenshots/pt-light-768.png) | [PNG](screenshots/pt-light-1024.png) | [PNG](screenshots/pt-light-1440.png) | [PNG](screenshots/pt-light-1920.png) |
| EN Dark | [PNG](screenshots/en-dark-360.png) | [PNG](screenshots/en-dark-390.png) | [PNG](screenshots/en-dark-768.png) | [PNG](screenshots/en-dark-1024.png) | [PNG](screenshots/en-dark-1440.png) | [PNG](screenshots/en-dark-1920.png) |
| EN Light | [PNG](screenshots/en-light-360.png) | [PNG](screenshots/en-light-390.png) | [PNG](screenshots/en-light-768.png) | [PNG](screenshots/en-light-1024.png) | [PNG](screenshots/en-light-1440.png) | [PNG](screenshots/en-light-1920.png) |
| ES Dark | [PNG](screenshots/es-dark-360.png) | [PNG](screenshots/es-dark-390.png) | [PNG](screenshots/es-dark-768.png) | [PNG](screenshots/es-dark-1024.png) | [PNG](screenshots/es-dark-1440.png) | [PNG](screenshots/es-dark-1920.png) |
| ES Light | [PNG](screenshots/es-light-360.png) | [PNG](screenshots/es-light-390.png) | [PNG](screenshots/es-light-768.png) | [PNG](screenshots/es-light-1024.png) | [PNG](screenshots/es-light-1440.png) | [PNG](screenshots/es-light-1920.png) |

| Slides adicionais PT | Dark desktop / mobile | Light desktop / mobile |
|---|---|---|
| Déborah Lima | [1440](screenshots/pt-dark-1440-deborah-lima.png) / [390](screenshots/pt-dark-390-deborah-lima.png) | [1440](screenshots/pt-light-1440-deborah-lima.png) / [390](screenshots/pt-light-390-deborah-lima.png) |
| Dr-Manaus | [1440](screenshots/pt-dark-1440-dr-manaus.png) / [390](screenshots/pt-dark-390-dr-manaus.png) | [1440](screenshots/pt-light-1440-dr-manaus.png) / [390](screenshots/pt-light-390-dr-manaus.png) |
| IoT Devices Manager | [1440](screenshots/pt-dark-1440-iot-devices-manager.png) / [390](screenshots/pt-dark-390-iot-devices-manager.png) | [1440](screenshots/pt-light-1440-iot-devices-manager.png) / [390](screenshots/pt-light-390-iot-devices-manager.png) |
| ChessInReact | [1440](screenshots/pt-dark-1440-chess-in-react.png) / [390](screenshots/pt-dark-390-chess-in-react.png) | [1440](screenshots/pt-light-1440-chess-in-react.png) / [390](screenshots/pt-light-390-chess-in-react.png) |

## Performance e repetição

Resumo: [metrics.json](metrics.json). Logs brutos/perfis/fontes de shifts, POC e regressão Hero ficam em `docs/report/S02/`, fora do Git. Comparação S01 usa o resumo histórico versionado da base, não uma nova certificação de hardware. Windows/Chromium 153/Lighthouse 13.5.0, throttling `simulate`; amostras locais isoladas de outras suítes de browser. Prévia é `noindex`, portanto seu SEO 63 não representa o build público. Não publicar prévia.

| Amostra final | Performance / acessibilidade / boas práticas / SEO | LCP | CLS | TBT |
|---|---|---|---|---|
| Prévia desktop | 100 / 100 / 100 / 63 | 662 ms | 0,00040 | 9,5 ms |
| Prévia mobile | 92 / 100 / 100 / 63 | 3.178 ms | 0 | 120 ms |
| Público desktop | 100 / 100 / 100 / 100 | 586 ms | 0,00040 | 8,5 ms |
| Público mobile | 94 / 100 / 100 / 100 | 2.904 ms | 0 | 100 ms |

JavaScript inicial: **154.711 bytes gzip**, tanto na prévia quanto no público, contra 151.218 bytes da S01: +3.493 bytes / **2,31%**, abaixo do orçamento de 180 KB. São chunks externos únicos observados antes de Work, com reduced motion para isolar o custo inicial sem Three; não incluem o HTML/Flight inline nem garantem custo idêntico de transferência em CDN. O público contém zero projetos aprovados, portanto sua amostra não mede transições de cards publicados.

O perfil da prévia mediu quatro mudanças reais por viewport, 34–35 transforms distintos por transição, cadência rAF ~60 Hz e intervalo p95 16,7–16,8 ms; nenhum canvas. INP local foi 24 ms em 390 e 1440 px. Isso comprova evolução de transform, sem certificar FPS de dispositivo físico nem p75. CLS do perfil foi **0,0540 mobile / 0,00033 desktop**; o maior shift mobile foi observado no início da fase de transições em Work e está preservado com fontes/fase no JSON, mesmo quando Lighthouse aponta zero. No perfil público sem interação, CLS foi 0,00195 mobile / 0,00033 desktop; INP não foi medido.

Diagnósticos pré-correção de fonte foram preservados: público mobile CLS ~0,115/performance 91 e prévia mobile perfil CLS ~0,121. O fallback proporcional e seus retângulos explicam a mudança de linhas antes de interação, registrada no ADR. A rodada final reduziu esses shifts, mas não constitui garantia de CLS zero em todos os acessos. Os resultados anteriores continuam no resumo, identificados como `before-font-fix`, ao lado dos finais.

O **LCP mobile continua acima da meta de 2,5 s**: público 2,904 s versus 2,866 s da amostra histórica S01; prévia 3,178 s. Uma amostra por cenário não determina regressão estatística nem resultado de campo. Performance mobile pública foi 94 versus 95 da S01; desktop permaneceu 100. A meta RNF-001/p75 e a otimização do carregamento mobile permanecem pendentes, sem alegação de resolução pela S02.

Para repetir, fazer build de prévia e executar E2E/visuais; para o gate público, build com preview 0 e teste separado, como README. Não executar build enquanto seu servidor de produção está ativo. Playwright possui/encerra a porta 3200; o perfil/Lighthouse usa um servidor próprio em 3202:

```powershell
$env:PORTFOLIO_CONTENT_PREVIEW='1'
npm run build
npm run test:e2e
npm run qa:carousel
$env:QA_HERO_SCREENSHOT_DIR='docs/report/S02/hero-regression'
npm run qa:hero
npm run start -- --port 3202
```

Em outro terminal, com o servidor da prévia ativo:

```powershell
$env:QA_ORIGIN='http://127.0.0.1:3202'
node scripts/profile-carousel.mjs
$env:CHROME_PATH=(node -p "require('playwright').chromium.executablePath()")
npm exec --yes --package=lighthouse@13.5.0 -- lighthouse http://127.0.0.1:3202/pt --preset=desktop --only-categories=performance,accessibility,best-practices,seo --chrome-flags='--headless --enable-unsafe-swiftshader' --output=json --output-path=docs/report/S02/lighthouse-preview-desktop.json --quiet
npm exec --yes --package=lighthouse@13.5.0 -- lighthouse http://127.0.0.1:3202/pt --only-categories=performance,accessibility,best-practices,seo --chrome-flags='--headless --enable-unsafe-swiftshader' --output=json --output-path=docs/report/S02/lighthouse-preview-mobile.json --quiet
```

Encerrar o servidor, reconstruir com `PORTFOLIO_CONTENT_PREVIEW=0`, executar `QA_EXPECT_PUBLIC_CONTENT=1 npx playwright test -g 'public build'` e iniciar produção novamente em 3202. Executar perfil com `$env:QA_PUBLIC_SAMPLE='1'` e repetir Lighthouse trocando os nomes para `lighthouse-public-desktop.json`/`lighthouse-public-mobile.json`. Depois `npm run qa:carousel:summary`. O resumo exige dois perfis/quatro relatórios atuais; histórico pré-correção é conservado a partir do JSON versionado quando os logs antigos faltarem num clone.

`npm run dev` continua em `http://localhost:1010/pt`. Smoke final nessa porta retornou HTTP 200, sete candidatos, avanço real NutriOpus → Déborah Lima e zero `pageerror`. O servidor dev foi reiniciado e seu cache anterior movido para `docs/report/S02/dev-cache-before-restart/`, ignorado, após apresentar estado desatualizado durante a sequência de builds/QA. Nenhuma alteração adicional de código foi necessária.

A S02 está tecnicamente implementada e validada localmente no escopo acima; a S03 permanece no roadmap e não foi iniciada. Ainda pendentes: revisão editorial/visual, testes manuais com leitor de tela e hardware/browsers físicos, metas de campo p75 e publicação após gates S05. S04 cases completos, S06 Explore Mode e Dev Mode não fazem parte da entrega.
