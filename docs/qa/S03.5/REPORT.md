# S03.5 — Premium Interaction & Visual Polish

Data: 11/10/2026. Branch `feat/s03-5-interaction-polish`, criada da S03 em `0ad2532814677035435367a7aa5f7ed7c62445a0`, com árvore inicialmente limpa. Base local/remota e [CI S03](https://github.com/PauloSoaf/paulosoaf-portfolio/actions/runs/38109153478) completed/success conferidos antes de modificar a aplicação. `main` continua na S00. Implementação/QA locais; sem merge, push ou deploy.

## Entrega e comparação

| Área | Antes, na S03 | S03.5 |
|---|---|---|
| Tema | Supressão global de transições e troca instantânea dos ícones. | Sol/Lua persistentes com rotate/scale/opacity, superfícies/bordas/foreground explícitos em 320 ms. Cookie/meta/Three atualizam imediatamente; cleanup substituível de 400 ms limpa marcador e finaliza apenas caudas CSS de cor do Chromium. Bootstrap antes do paint preservado; reduced imediato. |
| CTAs/controles | Principalmente transições de cor. | Elevação até 2 px, sombra, setas direcionais, compressão .975, foco visível e disabled compartilhados. Touch recebe feedback passivo, com release/cancel/blur/cleanup. Links/ações existentes continuam reais. |
| Header/cards/seleção | Hover/seleção discretos. | Indicadores de âncora/idioma, navegação mobile, estados de seleção da timeline, controles Work e profundidade em Expertise/Services/Contact. Cards sem ação continuam conteúdo. |
| Hero | Cursor ±.10 rad, touch sem exploração direta. | Cursor ±.18 rad, drag horizontal limitado a ±.60 rad, projeção de velocidade/damping, equivalentes por teclado, entrada real de 850 ms e saída por scroll até .08 rad. Sem giro ambiente contínuo; repouso sob demanda. |
| Motion editorial | Títulos com 16 px / 280 ms, profundidade .985. | Motivo próprio de títulos 24 px / 550 ms e profundidade .97; demais durações preservadas. Conteúdo inicialmente visível continua imediato. |
| Hidratação | Timeline 1.248→470,0625 px; em `#about`, topo 88,21875→−1.396,90625 px, incluindo encolhimento do carrossel acima. | Geometria antes dos módulos: links nativos/CSS entre capítulos no desktop e faixa horizontal navegável em Work. Altura máxima/controles reservados. Lista/grid completos sem JS. Testes lentos exigem variação ≤1 px de altura/topos/scroll. |
| Observadores | Primeira entrada de visibilidade no lote; acompanhamento por topo/IntersectionObserver. | Última entrada do lote, com regressão false→true/true→false. Timeline acompanha centros e recalcula por evento de scroll, mantendo opt-in, foco/prioridade manual e cleanup. |

Three/R3F real, objeto/shader/órbitas autorais, qualidade/DPR, SVG, erros GL/chunk/shader/contexto, Save-Data/opt-in e reduced motion foram reaproveitados. A cena permanece isolada; não há motor de física, nova cena WebGL ou remount ao trocar tema. O autoplay/reducer da S02 conserva timer de sete segundos e suspensão por foco/hover/viewport/aba/drag. Scroll permanece nativo.

Sete projetos, perfil, trajetória e contatos mantêm os status herdados. Não foram inventados cases, imagens reais, stacks, datas/cargos/empresas ou aprovadas coleções. Venturus/Jabil/Cyberlabs citadas na auditoria exigem revisão de dados na S04. S04/S05 seguem no roadmap; S06/Dev Mode não iniciados. [Pendências editoriais S03](../S03/EDITORIAL-PENDING.md), [ADR-012](../../adr/ADR-012-interaction-polish-and-stable-hydration.md), [marco/autoria Claude/Codex](../../HANDOFF.md).

## Arquivos e autoria desta continuação

| Arquivos | Trabalho Codex S03.5 |
|---|---|
| `src/theme/theme-client.ts`, `ThemeToggle.client.tsx`, `globals.css` | Transição solicitada pelo usuário, ícones estáveis, cleanup e import do vocabulário compartilhado. `theme-script.ts` não mudou. |
| `src/styles/interactions.css`, `src/features/motion/press-feedback.ts`, `MotionRuntime.client.tsx` | Classes e ciclo de vida de pressão touch. |
| `ButtonLink`, `Icon`, `LanguageSwitch`, `SiteHeader`, `MobileMenu` | Estados compartilhados, movimento direcional, indicadores e navegação real. |
| `ExpertiseSection`, `ServicesSection`, `ContactSection` | Refinamento dos cards/ações existentes, sem novas ações/editorial. |
| `HeroArtBoundary.client.tsx`, `HeroScene.client.tsx`, `quality.ts`, dicionários PT/EN/ES | Superfície de exploração, captura horizontal/cleanup, damping/limites, entrada/scroll, controles equivalentes e labels traduzidos. Pausa mobile compacta com nome acessível completo. |
| `JourneyTimeline.client.tsx`, `timeline.css` | Geometria responsiva antes da hidratação, navegação nativa, hash preservado, tabs/Space/roving focus e acompanhamento por centro/evento. |
| `ProjectCarousel.client.tsx`, `carousel.css` | Faixa inicial acessível, espaço reservado, estados de controles e última entrada do observador; reducer/autoplay preservados. |
| `motion-engine.ts`, `SectionHeading.tsx` | Motivo editorial pontual e calibração de profundidade. |
| `tests/unit/{theme-transition,press-feedback,carousel}.test.*` | Timers/subscrição, cancelamento touch e lotes de visibilidade. |
| `tests/e2e/interaction-polish.spec.ts`, ajustes Hero/carrossel/timeline | Interações reais, hidratação/falhas, persistência, keyboard/Space, estados e adaptações às novas capacidades. |
| `tests/visual/interaction-polish.spec.ts`, `playwright.polish-visual.config.ts`, ajustes Hero/timeline visuais | Capturas/vídeos próprios e saídas que conservam evidências anteriores. |
| `scripts/{profile-hydration,summarize-polish-qa}.mjs`, ajustes `profile-{hero,motion}.mjs`, `package.json` | Medição reproduzível, diretórios configuráveis, perfil de input com troca real de tema e resumo. Sem dependências/lockfile novos. |
| `README`, `HANDOFF`, `ADR-012`, `docs/qa/S03.5/` | Decisões, resultados, autoria e evidências versionadas. `docs/report/S03.5/` permanece ignorado. |

Claude é autor da fundação herdada documentada no HANDOFF. Cena/carrossel/timeline históricos vêm das continuações Codex S01–S03. O proprietário forneceu a auditoria/escopo e o pacote v0.1. Primeiro arquivo de aplicação alterado nesta retomada: `src/theme/theme-client.ts`; base e primeira escrita operacional estão registradas exatamente no HANDOFF. Nenhum histórico foi reescrito.

## Verificação

| Check | Resultado |
|---|---|
| Lint/typecheck | Passaram; build usa TypeScript strict/typegen do Next instalado. |
| Unitários | 69 passaram em dez arquivos; nove novos casos de ciclo de vida/regressão. |
| E2E S00–S03.5 | 79 passaram, um skip condicional do gate público na prévia. |
| QA S03.5 | 14 cenários passaram; screenshots e dois vídeos reais desktop/mobile. |
| Regressão visual S00 | 12 cenários / 24 PNGs passaram, saída própria ignorada. |
| Regressão visual Hero | 36 cenários / 36 PNGs passaram, seis viewports × três idiomas × dois temas. |
| Regressão visual Work | 36 cenários / 52 PNGs passaram. |
| Regressão visual timeline/motion | 38 cenários / 52 PNGs / dois vídeos passaram. |
| Build de prévia / público | Ambos passaram. Gate E2E público passou nos três idiomas, sem drafts/contatos não aprovados. |
| Gate de publicação | `release:check` segue bloqueado pelas mesmas dez pendências editoriais/contatos/origem HTTPS; não foi desabilitado. |
| Performance | Quatro Lighthouse e perfis reais, consolidados abaixo e em `metrics.json`. |

E2E específico retém todos os módulos Next, emula rede de 120 ms / 180 KB/s e CPU 4×, deixa fontes/HTML assentar e mede antes/depois. Quatro cenários: 390/1440 px, topo e `#about`. Conferem altura, topo de About/Expertise, scroll e visibilidade da âncora. Outro caso seleciona capítulo por link nativo antes de liberar módulos e confirma preservação após hidratar. Falha permanente de módulos mantém capítulos navegáveis e Work scrollável por teclado; no-JS desktop/mobile expõe toda a lista/grid.

Tema é observado antes do primeiro paint útil nas seis combinações PT/EN/ES × Dark/Light, sem marcador de transição inicial. Eventos nativos `transitionrun` comprovam keyframes reais de superfície/ícone; reload mantém preferência, e cleanup não deixa transições de cor running. Oito cliques reais repetidos preservam canvas, timeline, projeto, URL e scroll. Reduced motion remove transform/transição decorativa; Save-Data e falhas conservam SVG. Hover/press usam medidas de layout inalteradas, matrizes reais e foco/Enter; touch usa eventos CDP reais, pressão sustentada, drag horizontal e swipe vertical. Hero muda pixels da mesma cena, respeita limite/damping e encerra frames no repouso. Suítes anteriores verificam autoplay, teclado, contexto perdido/descarte, zoom 200%, seis viewports, links e axe.

A implementação inicial de teste mediu ícones em chamadas separadas depois de uma transição curta; passou a registrar `transitionrun` nativo. Cliques de teste no header sticky passaram a usar coordenadas para não confundir scroll de automação com troca de tema. Comparação de touch-hover aguarda repouso real da entrada; Space mede após scroll de foco anterior assentar e exige defaultPrevented. Controles SSR ocultos sem JS são verificados por visibilidade/semântica, em vez de exigir ausência física no HTML. Sem retries locais para esconder falhas. As alterações de produto identificadas estão no ADR; os testes verificam a experiência efetiva.

## Evidências visuais

Examinados mockups Hero desktop/mobile e timeline v0.1, POC-001/003 abertas no Chromium (seleção real da POC mudou “Engenharia de aplicações” para “Software industrial”). Copy/composição, tipografia, paleta Dark e Light neutro foram preservados. Refinamento mobile após inspeção: pausa com ícone e nome completo permite os quatro controles em uma linha, abaixo do objeto. A referência v0.2 não foi usada.

| Idioma / tema / largura | Hero | Work selecionado | About |
|---|---|---|---|
| PT Dark 390 | [PNG](screenshots/pt-dark-390-hero.png) | [PNG](screenshots/pt-dark-390-work.png) | [PNG](screenshots/pt-dark-390-about.png) |
| PT Dark 1440 | [PNG](screenshots/pt-dark-1440-hero.png) | [PNG](screenshots/pt-dark-1440-work.png) | [PNG](screenshots/pt-dark-1440-about.png) |
| PT Light 390 | [PNG](screenshots/pt-light-390-hero.png) | [PNG](screenshots/pt-light-390-work.png) | [PNG](screenshots/pt-light-390-about.png) |
| PT Light 1440 | [PNG](screenshots/pt-light-1440-hero.png) | [PNG](screenshots/pt-light-1440-work.png) | [PNG](screenshots/pt-light-1440-about.png) |
| EN Dark 390 | [PNG](screenshots/en-dark-390-hero.png) | [PNG](screenshots/en-dark-390-work.png) | [PNG](screenshots/en-dark-390-about.png) |
| EN Dark 1440 | [PNG](screenshots/en-dark-1440-hero.png) | [PNG](screenshots/en-dark-1440-work.png) | [PNG](screenshots/en-dark-1440-about.png) |
| EN Light 390 | [PNG](screenshots/en-light-390-hero.png) | [PNG](screenshots/en-light-390-work.png) | [PNG](screenshots/en-light-390-about.png) |
| EN Light 1440 | [PNG](screenshots/en-light-1440-hero.png) | [PNG](screenshots/en-light-1440-work.png) | [PNG](screenshots/en-light-1440-about.png) |
| ES Dark 390 | [PNG](screenshots/es-dark-390-hero.png) | [PNG](screenshots/es-dark-390-work.png) | [PNG](screenshots/es-dark-390-about.png) |
| ES Dark 1440 | [PNG](screenshots/es-dark-1440-hero.png) | [PNG](screenshots/es-dark-1440-work.png) | [PNG](screenshots/es-dark-1440-about.png) |
| ES Light 390 | [PNG](screenshots/es-light-390-hero.png) | [PNG](screenshots/es-light-390-work.png) | [PNG](screenshots/es-light-390-about.png) |
| ES Light 1440 | [PNG](screenshots/es-light-1440-hero.png) | [PNG](screenshots/es-light-1440-work.png) | [PNG](screenshots/es-light-1440-about.png) |

| PT adicional | Mobile | Desktop |
|---|---|---|
| Dark→Light, transição CSS nativa em 160 ms | [PNG](screenshots/pt-dark-390-theme-midpoint.png) | [PNG](screenshots/pt-dark-1440-theme-midpoint.png) |
| Light→Dark, transição CSS nativa em 160 ms | [PNG](screenshots/pt-light-390-theme-midpoint.png) | [PNG](screenshots/pt-light-1440-theme-midpoint.png) |
| Reduced Dark | [PNG](screenshots/pt-dark-390-reduced.png) | [PNG](screenshots/pt-dark-1440-reduced.png) |
| Reduced Light | [PNG](screenshots/pt-light-390-reduced.png) | [PNG](screenshots/pt-light-1440-reduced.png) |
| Interações reais em tempo contínuo | [WebM](videos/interactions-390.webm) | [WebM](videos/interactions-1440.webm) |

Desktop [hover](screenshots/pt-dark-1440-hover.png) / [press](screenshots/pt-dark-1440-press.png). [Hero anterior](screenshots/before-hero-desktop.png). Hidratação `#about` na base: [antes de JS](screenshots/before-hydration-about.png) / [após JS](screenshots/before-hydration-about-after-js.png). S03.5: [antes de JS](screenshots/after-hydration-about-before-js.png) / [após JS](screenshots/after-hydration-about-after-js.png).

Os 51 PNGs selecionados e os dois WebM são capturas reais. Work/About ocultam header somente no screenshot de seção, para evitar costura; o Hero inclui header real. Midpoints pausam transições CSS nativas em 160 ms, com contagem/cor computada em JSON adjacente, exclusivamente para repetição da captura. Vídeos não alteram tempo, keyframes ou estilos: 390×844 / 11,32 s e 1440×900 / 13,36 s, decodificados e inspecionados. Não são usados PNGs para alegar fluidez universal ou artes conceituais como screenshots de projetos.

## Performance, critérios e limites

Resumo reproduzível: [metrics.json](metrics.json). Logs/perfis/Lighthouse/traces, POCs e nova regressão das evidências S00–S03 ficam em `docs/report/S03.5/`, fora do Git. Lighthouse 13.5.0 / Chromium 153, produção local em 3202, throttling simulate; uma rodada isolada por condição, sem warnings. Medições não representam p75 de campo ou hardware físico.

| Amostra | Performance / acessibilidade / boas práticas / SEO | LCP | CLS | TBT |
|---|---|---|---|---|
| Prévia desktop | 100 / 100 / 100 / 63 | 0,653 s | 0,003704 | 10 ms |
| Prévia mobile | 91 / 100 / 100 / 63 | 3,189 s | 0 | 178,4 ms |
| Público desktop | 100 / 100 / 100 / 100 | 0,593 s | 0,003704 | 9 ms |
| Público mobile | 94 / 100 / 100 / 100 | 2,945 s | 0 | 117 ms |

SEO 63 da prévia decorre do noindex intencional. O **LCP mobile permanece acima de 2,5 s**. Na S03, prévia/público eram 3,184/2,779 s e scores 92/95; nesta rodada foram 3,189/2,945 s e 91/94. Houve diferença observada, sem afirmar melhoria ou regressão estatística por uma amostra. A meta não foi cumprida nem dispensada; carregamento/otimização final e medição em campo continuam no roadmap antes da publicação.

JS inicial: **157.834 bytes gzip** nas quatro condições de perfil, contra 157.083 na S03: **+751 bytes / 0,48%**, abaixo do orçamento de 180 KB. São scripts externos Next únicos antes de rolar, sem HTML/Flight inline ou garantia de transferência CDN idêntica. Save-Data mantém motion ativo e isola o custo sem WebGL. Nenhuma dependência nova. Lazy Three/R3F/Hero medido separadamente: 245.140 bytes gzip.

Perfis com input real: prévia **INP 48 ms** em 390/1440, público **24 ms** em ambas larguras; CLS 0, zero overflow/canvas e zero animações running no repouso nos quatro perfis. Foram observadas 32/39 entradas na prévia e 22/22 no público, em 280/550 ms. A sequência S03.5 acrescenta duas trocas de tema e menu/Escape mobile aos cliques/scroll/tabs anteriores, portanto não é uma comparação idêntica de INP com a S03. A sombra finita de foco do Menu assenta durante 350 ms após Escape antes da medição de repouso. LCP do perfil mobile de prévia não foi emitido nessa sessão; comparação de LCP usa os quatro Lighthouse.

Perfil isolado da cena: cinco draw calls/geometrias, 2.540 triângulos mobile / 7.852 desktop, DPR 1 observado e zero frames adicionais em 500 ms após assentamento. Média de CPU em `gl.render`: 0,202/0,210 ms; cadence rAF observada 60,00/59,67 Hz, p95 16,7 ms. Renderer SwiftShader, timer GPU indisponível: isso não certifica FPS/custo GPU de aparelhos reais. Esse perfil parte de reduced e habilita a cena depois; CLS 0,006072/0,004058 ligado à mudança dos controles/dica, sem deslocamento da seção. Não se alega CLS zero para todos os caminhos ou dispositivos.

Hidratação final: rede 120 ms / 180 KB/s, CPU 4× e JS retido; **delta 0 em altura, topo de About/Expertise e scroll** nas quatro condições 390/1440 × topo/`#about`. O baseline bruto anterior tinha reduced motion e não emulava rede/CPU; documenta o defeito de geometria confirmado, não uma comparação de velocidade nas mesmas condições.

O gate E2E público passou em PT/EN/ES. `release:check` continua falhando de forma esperada por dez bloqueios herdados: origem HTTPS, perfil/interface, mínimo de projetos, trajetória, especialidades, serviços e email/LinkedIn/CV. Não foi aprovado conteúdo para alterar o resultado.

Aceite técnico cobre transição observável/repetível, bootstrap/reload, feedback mouse/teclado/touch, Hero real/fallback/damping, responsividade, reduced/Save-Data, geometria lenta/âncora, integridade dos links e conservação de estados/autoplay. RNF-015/017/019 e AC-008/009/017–023 foram exercitados no escopo local. RNF-001 exige continuidade de otimização e medição em campo; conteúdo comercial, aceite estético do proprietário, leitor de tela e hardware/browsers físicos continuam pendentes. A solução pré-hidratação de tabs usa feature query `:has`; browsers sem suporte recebem fallback linear e melhoria React, com garantia de geometria limitada aos browsers testados. Gate editorial permanece obrigatório.

## Reprodução

```powershell
$env:PORTFOLIO_CONTENT_PREVIEW='1'
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run qa:polish
# Saídas opcionais para regressões anteriores, sem sobrescrever S00–S03:
$env:QA_FOUNDATION_SCREENSHOT_DIR='docs/report/S03.5/foundation-regression'
$env:QA_HERO_SCREENSHOT_DIR='docs/report/S03.5/hero-regression'
$env:QA_CAROUSEL_SCREENSHOT_DIR='docs/report/S03.5/carousel-regression'
$env:QA_TIMELINE_SCREENSHOT_DIR='docs/report/S03.5/timeline-regression'
$env:QA_TIMELINE_VIDEO_DIR='docs/report/S03.5/timeline-regression-videos'
npm run qa:screenshots
npm run qa:hero
npm run qa:carousel
npm run qa:timeline
npm run start -- --port 3202
```

Em outro terminal, sem suítes pesadas de browser concorrentes:

```powershell
$env:QA_ORIGIN='http://127.0.0.1:3202'
$env:QA_MOTION_OUTPUT_DIR='docs/report/S03.5'
$env:QA_HERO_OUTPUT_DIR='docs/report/S03.5'
$env:QA_POLISH_PROFILE='1'
node scripts/profile-hydration.mjs
node scripts/profile-motion.mjs
node scripts/profile-hero.mjs
$env:CHROME_PATH=(node -p "require('playwright').chromium.executablePath()")
npm exec --yes --package=lighthouse@13.5.0 -- lighthouse http://127.0.0.1:3202/pt --preset=desktop --only-categories=performance,accessibility,best-practices,seo --chrome-flags='--headless --enable-unsafe-swiftshader' --output=json --output-path=docs/report/S03.5/lighthouse-preview-desktop.json --quiet
npm exec --yes --package=lighthouse@13.5.0 -- lighthouse http://127.0.0.1:3202/pt --only-categories=performance,accessibility,best-practices,seo --chrome-flags='--headless --enable-unsafe-swiftshader' --output=json --output-path=docs/report/S03.5/lighthouse-preview-mobile.json --quiet
```

Encerrar 3202 antes de reconstruir público (`PORTFOLIO_CONTENT_PREVIEW=0`); executar `QA_EXPECT_PUBLIC_CONTENT=1 npx playwright test -g 'public build'` e reiniciar produção 3202. Perfil com `QA_PUBLIC_SAMPLE=1`; Lighthouse com nomes `lighthouse-public-{desktop,mobile}.json`. `npm run qa:polish:summary` consolida os quatro Lighthouse, perfis e hidratação. O baseline bruto desta sessão fica ignorado, mas o resumo conserva os resultados; num clone, compare esse resumo sem pretender regenerar a base antiga usando código atual.

Dev permanece em `http://localhost:1010/pt`. Smoke final no servidor existente: HTTP 200, Hero ready, carrossel enhanced, timeline desktop, tema mudou para Light e nenhum erro JavaScript; não foi necessário reiniciar. Servidores de QA 3200/3202 encerrados. Commit local na branch dedicada, sem merge/push/deploy; autoria e diretório operacional ignorado documentados no HANDOFF.
