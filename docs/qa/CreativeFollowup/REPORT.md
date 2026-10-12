# Contador, scroll e escultura — continuação da Recovery

Data: **12/10/2026**. Branch: `feat/creative-direction-recovery`. Base limpa: **`922fd77a29549694eaed3bc00ac437b027df7360`**.

**Os três ajustes pedidos estão implementados e verificados.** Aceite estético do proprietário e performance mobile para lançamento continuam pendentes. Dados, projetos, contatos e aprovações editoriais foram preservados; S04/S06/Dev Mode não foram iniciados.

## Ver a experiência

- [Revisão com seis vídeos](review.html).
- Contador com tempo real: [desktop](videos/countdown-1440.webm), [celular](videos/countdown-390.webm).
- Página inteira: [desktop Dark](videos/after-pt-dark-1440.webm), [celular Dark](videos/after-pt-dark-390.webm), [desktop Light](videos/after-pt-light-1440.webm), [celular Light](videos/after-pt-light-390.webm).
- [Sequência nativa desktop](countdown-1440.json), [celular](countdown-390.json), [métricas](metrics.json), [duração/dimensões/hashes dos vídeos](video-metadata.json).
- Local: `http://localhost:1010/pt`, `/en`, `/es`. Comparação da esfera anterior: `?experience=classic`.
- [ADR-014](../../adr/ADR-014-visible-motion-and-page-companion.md), [fronteira Claude/Codex](../../HANDOFF.md#continuação-do-contador-scroll-e-3d--fronteira-exata-e-autoria), [revisão anterior](../CreativeRecovery/REPORT.md).

Os vídeos usam gravação nativa Playwright em tempo real, sem retiming ou frames fabricados. Desktop é 1440×900; celular, 390×844 com touch. Percurso completo usa wheel real e drag mouse/touch; E2E também testa swipe vertical por eventos touch do Chromium. São condições de laboratório, sem certificação em aparelho físico.

## Mudanças e critérios demonstrados

| Pedido / critério | Implementação e evidência |
|---|---|
| Contador funcional 7→0 | Um deadline dirige número, círculo e troca real. E2E verifica cada segundo e índice; gravações nativas mostram 7/6/5/4/3/2/1/0 e o projeto seguinte. Observação do primeiro sete ao zero: 7005 ms desktop / 6999 ms celular; o registro começa após a reprodução, não é uma medição da precisão do agendador. |
| Pausa coerente | Hover/drag/foco/aba oculta/viewport/pausa manual congelam o restante. Retomada continua; seleção manual reinicia sete. Foco exige reprodução explícita. Unitário cobre callback cancelado já na fila; E2E congela cinco segundos mesmo após esperar nove e retoma no deadline restante. |
| Projetos mais exploráveis | Sete seletores diretos, conteúdo real e `aria-pressed`, sem novos projetos/links. E2E seleciona ChessInReact e verifica título e índice reais. |
| Entradas mais tardias e perceptíveis | Margem inferior −18%, deslocamentos 32–72 px e duração mínima 850 ms / 1100 ms editorial/profundidade. E2E mostra heading ainda aguardando na borda e mede opacidade/transform em progresso após 400 ms, depois conclusão. |
| 3D pela página com escala variável | Um único canvas Three/R3F em portal; posição, diâmetro e orientação variam entre cinco seções. E2E compara identidade do canvas, dimensões com diferença superior a 60 px e presença na viewport. Smoke 1010 mediu diâmetros de aproximadamente 179/240/209/257/162 px em Work/About/Expertise/Services/Contact. |
| Navegação natural | Runtime passivo com um frame pendente; nenhum wheel hijacking. Miniatura deixa passar ponteiros, com controles de pausa/estática de 44 px. Desktop amplo reserva área lateral; mobile reduz escala/opacidade para preservar leitura. Hit-test manual local das ações de contato no celular confirmou o destino real no centro e na borda direita. |
| Componentes atraentes | Spotlight radial ligado ao ponteiro, aros orbitais, três símbolos SVG próprios nas especialidades, emblemas dos serviços e luz/seta circular nos CTAs. E2E mede coordenada de luz e navega pela CTA existente até `#contact`. |
| Reduced motion / fallback | Sem autoplay, reveal, acompanhamento 3D automático ou transforms de hover; controle manual e seleção continuam. Sete regressões reduced passaram após ajustar a especificidade dos novos efeitos. GL/chunk/shader/contexto perdido/Save-Data/sem JS também cobertos. |
| Temas, idiomas e responsividade | PT/EN/ES, Dark/Light, 360/390/768/1024/1440/1920, zoom textual 200%, teclado e axe nos controles/catálogo/timeline/cena. Nenhum overflow nos perfis/capturas. |
| Hidratação | Quatro cenários 390/1440 × início/`#about`, rede 120 ms, 180 kB/s, CPU 4× e JS retido por 800 ms após fontes: deltas de altura/topos/scroll **zero**. [Antes](screenshots/after-hydration-about-before-js.png) / [depois](screenshots/after-hydration-about-after-js.png). |

O relógio publica a cada 100 ms somente para o indicador; os artigos não renderizam a cada tick. O zero permanece até o primeiro tick do ciclo seguinte, sem acrescentar um segundo ao intervalo. O indicador evita anúncios repetidos (`aria-live="off"`) e tem descrição traduzida.

O gate de carregamento ainda observa o Hero; o render observa o portal real. Entrar diretamente em `#contact` não inicializa Three antes de visitar o Hero/opt-in. **A cena continua renderizando fora do Hero quando a miniatura está visível**, conforme o pedido atual. Pausa, aba oculta, superfície fora da viewport e arte estática suspendem frames/desmontam recursos. A cena clássica conserva sua política anterior.

## Referências visuais e autoria

Foram comparados os mockups Hero/Work/timeline desktop/mobile do pacote v0.1 com as capturas atuais. Tipografia, tokens e acento discretamente distribuído permanecem. A escultura aberta/composição Recovery já estavam na base `922fd77`; esta continuação acrescenta área lateral, acompanhamento global, seletores/contador e ornamentação dos cards. Essas diferenças de composição e ritmo são intencionais pelo pedido atual. Não foi usada v0.2.

[Uiverse](https://uiverse.io/), [botões](https://uiverse.io/ui/animated-buttons), [cards](https://uiverse.io/ui/card-components), [seta circular](https://uiverse.io/marcelodolza/stupid-vampirebat-24) e [luz nos cards](https://uiverse.io/05akalan57/thin-sloth-31) foram consultados como referências de comportamento. Código, SVGs e efeitos desta continuação são próprios; nenhum componente/asset foi copiado. Não há capturas fictícias de produtos; artes conceituais permanecem identificadas.

Claude criou a fundação herdada da S00 conforme HANDOFF. Codex criou S01–S03.5 e Recovery anteriores; esses módulos foram reaproveitados. **O trabalho desta continuação é o diff contra `922fd77`**, iniciado pelo relógio/indicador e motion engine. HANDOFF identifica caminhos, sequência e responsabilidades sem reatribuir o trabalho anterior.

## Arquivos e verificação

| Grupo de arquivos | Alterações |
|---|---|
| `src/features/projects/carousel-clock.ts`, `src/components/carousel/CarouselCountdown.client.tsx`, `ProjectCarousel.client.tsx`, `src/styles/carousel.css` | Relógio/pausa/proteção contra callback obsoleto, indicador, seletores e layout. Reducer e catálogo não mudaram. |
| `src/features/motion/motion-engine.ts` | Intensidade, início e duração dos presets existentes. |
| `src/features/creative/companion.ts`, `HeroArtBoundary.client.tsx`, `HeroScene.client.tsx` | Portal, progresso/diâmetro por seção, superfície real, eventos de exploração, orientação e lifecycle do mesmo canvas. |
| `src/styles/creative-followup.css`, `src/app/globals.css`, `CreativeRuntime.client.tsx`, `ExpertiseSection.tsx`, `ServicesSection.tsx`, `ButtonLink.tsx` | Área lateral/miniatura, spotlight, SVGs/emblemas, CTAs e reduced motion. |
| `src/i18n/dictionaries/{pt,en,es}.ts` | Três labels de contador/seleção, preservando a ordem canônica das chaves. |
| `tests/unit/{carousel-clock,motion}.test.ts`, `tests/e2e/{creative-followup,carousel,creative,hero,interaction-polish,timeline-motion}.spec.ts` | Deadline, callback obsoleto, interações, movimento visível, pausa/canvas, compatibilidade das regressões. |
| `tests/visual/creative.spec.ts`, `scripts/{record-followup-counter,summarize-followup-qa,profile-hero,profile-motion,profile-creative-load,summarize-recovery-videos}.mjs` | Evidências novas, saídas separadas, perfis e resumos. |
| `README.md`, `docs/HANDOFF.md`, `docs/adr/ADR-014…`, `docs/qa/CreativeFollowup/` | Operação, autoria, decisões, evidências/métricas e relatório. |

Lint, typecheck e builds de prévia/público passaram. **79 unitários em 12 arquivos**. Suíte E2E completa de prévia: **87 passaram**, um skip condicional para o build público; o gate público adicional passou nos três idiomas, totalizando **88 casos distintos**. Após a guarda final de CSS reduced, os **sete E2E afetados** foram reexecutados e passaram. Suíte visual: **14 cenários**, mais sete mobile reexecutados após reduzir a opacidade da miniatura.

**66 PNGs e seis WebM** selecionados. PNGs incluem quatro etapas nos seis estados idioma/tema × desktop/mobile, Expertise/Services/Contact em PT/Dark/Light nos dois tamanhos, dois reduced, dois do contador e dois da hidratação. Os seis vídeos foram decodificados e tiveram duração/dimensões/hash SHA-256 verificados. Os estados capturados sem hover não mudaram com a última guarda reduced; comportamento de hover estático foi verificado em E2E.

Regressões revelaram callback cancelado ainda enfileirado no relógio; foi corrigido na aplicação. Teste de chunk bloqueado foi movido para antes da navegação e passou a esperar hidratação. Teste de tema rápido agora espera seis frames de scroll estável após o clique anterior no carrossel, preservando a comparação exata de posição; diagnósticos nativos comprovaram a origem do deslocamento. Capturas motivaram ajustar opacidade mobile. Não se usaram cliques forçados para contornar controles.

## Performance e limites

Valores finais em [metrics.json](metrics.json). Lighthouse 13.5.0, Chromium/SwiftShader, build otimizado local 3300, throttling `simulate`, uma amostra por condição final, navegadores executados sequencialmente. Não são p75 de campo. Rodadas anteriores de diagnóstico não foram escolhidas pelo melhor score.

| Condição final | Performance | LCP | CLS | TBT |
|---|---:|---:|---:|---:|
| Prévia desktop | 100 | 657 ms | 0,003738 | 5 ms |
| Prévia mobile | 87 | 3119 ms | 0 | 309 ms |
| Público desktop | 100 | 591 ms | 0,003738 | 27 ms |
| Público mobile | 87 | 2956 ms | 0 | 343 ms |

Acessibilidade e boas práticas: **100** nas quatro amostras, sem warnings Lighthouse. SEO: 63 na prévia pelo `noindex` deliberado e 100 no público. **LCP mobile ainda não atende 2,5 s.** Recovery anterior registrou público 81 / 3013 ms / TBT 506,5 ms; esta amostra tem score/TBT melhores, mas uma rodada não prova ganho estatístico. TBT ainda supera os 117 ms da S03.5. Não foi declarado pronto para publicação.

| Orçamento / runtime | Medição final |
|---|---|
| JS inicial externo | **160.275 bytes gzip**, +1767 / 1,11% vs Recovery, abaixo do alvo 180 kB. Exclui HTML/Flight/CSS. |
| Chunk lazy Three/R3F/Hero | **246.280 bytes gzip**, +76 bytes vs Recovery; nenhuma nova dependência. |
| Cena mobile / desktop | 6 draw calls, 6 geometrias, 1936 / 3472 triângulos; DPR 1 no perfil. Regressão separada confirma limites 1 / 1,25 / 1,5 em DPR alto. |
| CPU de `gl.render` após aquecimento | **0,201 / 0,204 ms** mobile/desktop; exclui cinco frames iniciais, em software rendering. |
| Ambiente no Hero, espera 500 ms | 15 / 22 frames mobile/desktop. |
| Miniatura visível em Contact, espera 500 ms | **16 / 23 frames**, após 1800 ms de assentamento. Agendamento ambiente 30 / 45 Hz; inclui o limite da janela/protocolo Playwright. |
| Miniatura pausada, espera 500 ms | **Zero frames** nos dois perfis. Superfície fora da viewport e aba oculta também cobertas por E2E. |
| Carregamento automático sem throttling | FCP 180 ms nos dois perfis; primeiro frame 3D em **1940 / 1033 ms** mobile/desktop. |
| Navegação Save-Data — prévia | INP **64 / 56 ms**, CLS 0,000863 / 0,002466; zero canvas/overflow/animações running no repouso. |
| Navegação Save-Data — público | INP **24 / 24 ms**, CLS 0,012340 / 0,004953; zero canvas/overflow/animações running no repouso. |
| Perfil isolado Hero com WebGL | INP 16 / 16 ms, CLS 0,006335 / 0,009569. Sequência de controles menor, distinta da navegação Save-Data. |

Os pequenos shifts dos perfis de percurso incluem mudanças dos controles da miniatura durante rolagem programática; não equivalem ao teste de geometria/hidratação, que manteve deltas zero. Permanecem abaixo de 0,05 nas amostras, sem declaração de CLS zero no percurso.

GPU timer indisponível em SwiftShader; CPU de `gl.render` não é tempo de GPU. rAF de aproximadamente 60 Hz é cadência observada do browser, não FPS certificado em celular. Janelas de frames ambiente são medidas após assentamento; a primeira amostra de chegada à miniatura ainda incluía damping e foi substituída pelo protocolo de repouso de 1800 ms. Movimento visível fora do Hero amplia o tempo de uso da cena por decisão solicitada, com pausa e opt-out disponíveis.

Save-Data isola orçamento/navegação sem WebGL, com reveals ativos. Os perfis finais sincronizam `document.hidden` e `visibilityState` antes do evento de ocultação, para tanto suspender animações quanto finalizar os Web Vitals do Next. Nenhum INP foi estimado a partir de FID. O perfil Hero começa com reduced e depois ativa Three; carregamento automático foi medido separadamente.

`release:check` mantém os **dez bloqueios herdados**: origem HTTPS, perfil, textos PT/EN/ES, projetos, trajetória, especialidades, serviços, email, LinkedIn e CV. Não houve bypass. Leitor de tela manual, aparelho físico, performance de campo, conteúdo comercial e aceite estético permanecem pendentes. Logs/perfis/scripts operacionais ficam em `docs/report/CreativeFollowup/`, **fora do Git**. Não houve merge, push ou deploy.

## Reproduzir

```powershell
$env:PORTFOLIO_CONTENT_PREVIEW='1'
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run qa:creative
$env:QA_CREATIVE_OUTPUT_DIR='docs/qa/CreativeFollowup'
node scripts/summarize-recovery-videos.mjs
npm run start -- --port 3300
```

Em outro terminal, com os navegadores executados sequencialmente:

```powershell
$env:QA_ORIGIN='http://127.0.0.1:3300'
$env:QA_HERO_OUTPUT_DIR='docs/report/CreativeFollowup'
$env:QA_MOTION_OUTPUT_DIR='docs/report/CreativeFollowup'
$env:QA_HYDRATION_OUTPUT_DIR='docs/report/CreativeFollowup'
$env:QA_HYDRATION_SCREENSHOT_DIR='docs/qa/CreativeFollowup/screenshots'
$env:QA_CREATIVE_PROFILE_DIR='docs/report/CreativeFollowup'
$env:QA_POLISH_PROFILE='1'
node scripts/record-followup-counter.mjs
node scripts/profile-hydration.mjs
node scripts/profile-motion.mjs
node scripts/profile-hero.mjs
node scripts/profile-creative-load.mjs
$env:CHROME_PATH=(node -p "require('playwright').chromium.executablePath()")
npm exec --yes --package=lighthouse@13.5.0 -- lighthouse http://127.0.0.1:3300/pt --only-categories=performance,accessibility,best-practices,seo --chrome-flags='--headless --enable-unsafe-swiftshader' --output=json --output-path=docs/report/CreativeFollowup/lighthouse-preview-mobile.json --quiet
```

Repita desktop com `--preset=desktop` e caminho `lighthouse-preview-desktop.json`. Encerre apenas o servidor QA antes de reconstruir com `PORTFOLIO_CONTENT_PREVIEW=0`; execute o gate com `QA_EXPECT_PUBLIC_CONTENT=1`, depois o perfil motion com `QA_PUBLIC_SAMPLE=1` e dois Lighthouse `lighthouse-public-{desktop,mobile}.json`. `node scripts/summarize-followup-qa.mjs` gera o resumo com os quatro relatórios/perfis finais. O servidor dev solicitado permanece na porta **1010**.
