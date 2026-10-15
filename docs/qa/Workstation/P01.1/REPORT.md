# Workstation P01.1 — input e acompanhamento espacial

**15/10/2026** · Branch `fix/workstation-input-scroll-motion` · Base exata **`3c395abeabed80004893fa30ac60fe4d0b9b1922`**. Autoria: [HANDOFF](../../../HANDOFF.md). Decisão: [ADR-016](../../../adr/ADR-016-workstation-input-and-continuous-motion.md).

**As quatro correções funcionais estão implementadas e verificadas em Chromium local.** Notebook maior, teclas acionáveis, trackpad com cursor e percurso em seis seções. Aceite estético, performance mobile e validação no domínio HTTPS continuam pendentes. Este relatório não aprova publicação, o pacote inteiro ou novas fases.

Abra **http://localhost:1010/pt**; o desenvolvimento encaminha à Workstation. Comparação anterior: `/pt?experience=recovery`. [Galeria de capturas/vídeos](review.html), [métricas](metrics.json), [manifesto de evidências](evidence-manifest.json).

## Reprodução e correções

| Defeito reproduzido | Correção concreta | Prova |
|---|---|---|
| Após Work, objeto continua seguindo a mesma âncora: `y=-792,5` em About, `-3501,5` em Contact | Seis estações reservadas no SSR, composições locais e faixa de trânsito; posição/escala/orientação com mola crítica e delta time | [Retângulos anteriores](baseline-positions.json), vídeos e seis JSONs de trajetória |
| Escala pouco expressiva, especialmente em Work | Enquadramento ortográfico maior e âncora Work proporcional; chassi de aproximadamente **606px no Hero 1440px** após estabilizar | E2E exige **520–680px**, [Hero](screenshots/pt-dark-1440-hero.png), [Work](screenshots/pt-dark-1440-work.png), [antes](screenshots/before-p01-hero-1440.png) |
| Keycaps passivas | Mapeamento por `instanceId`, pressão/retorno visual, Shift de uma tecla, Caps, Backspace, Enter, Space, Tab/indentação e setas | E2E escreve `A b\nd E` por cliques nas meshes; teclado nativo, persistência e foco também testados |
| Trackpad sem cursor/ações | Controlador normalizado, cursor Dark/Light, hover, callbacks próprios, clique, duplo clique/seleção, arraste da alça e wheel/dois dedos | E2E registra nota, seleciona texto, arrasta e rola sem mover a página; gesto touch real via CDP |
| Câmera/DOM podiam atualizar com dimensões diferentes | Viewport lógica fixa 800×620, `offsetSize`, uma escala CSS, raycast em client coordinates e um RAF do rig chamando R3F manualmente | Erro máximo medido **0,000889px lógicos** entre matriz DOM e três cantos projetados; regressão temporal nos quatro tamanhos |
| Tela remontava ao atravessar viewport | Preserva superfície/iframe durante scroll; o frame usa visibilidade geométrica atual, sem aguardar IntersectionObserver | Mesmo elemento iframe e texto nativo preservados Hero→Contact; vídeo tablet que falhou antes passou após correção |
| Repouso podia conservar resíduo angular | Último passo fixa exatamente o alvo antes de declarar repouso | Asserções herdadas de igualdade de pose continuam estritas; zero frames/600ms |

Notas é um app próprio mínimo para testar input, em memória da sessão. Não há envio, shell, jogos, Code real, conteúdo profissional inventado ou aprovação editorial. Ctrl/Alt não executam atalhos do sistema. A janela de Notas oferece uma alça de arraste limitado; não se implementou window manager completo.

## Validação técnica

| Verificação | Resultado |
|---|---|
| Lint / typecheck | PASS |
| Unitários | **121 PASS / 15 arquivos**; seis novos casos cobrem mola, taxas 30/60/120Hz, reversão, texto/modificadores, limites do ponteiro e ausência de input cross-origin |
| Build otimizado da prévia | PASS; flags editorial/Workstation explícitas |
| Suite Workstation com servidor gerenciado | **32 PASS** na execução completa, incluindo dois sites reais; **33 cenários distintos PASS** após a regressão tablet adicional e reexecução dos quatro cenários afetados |
| Regressões S00–S03.5/Recovery | **87 PASS**, um gate público condicionado ao build público |
| Idiomas/temas próprios | **8 PASS** EN/ES × Dark/Light × 1440/390, além de PT; entrada 3D, foco, texto preservado e axe |
| Hidratação lenta | **6 PASS**: 390/1440 × topo/#work/#about, 120ms/180KB/s/CPU4×, módulos retidos após fontes; deltas **zero** em altura/topos/scroll |
| E2E público / build público | **PASS**; laboratório/fixture 404, filtros editoriais e XFO DENY nos três idiomas |
| Visuais | **78 PNGs / 8 WebM** com dimensões/duração/hash, incluindo dois vídeos dos sites reais |
| Publicação / CI remoto | Não executados; workflow passa a incluir a suíte Workstation determinística, com servidor próprio e artefatos |

Os testes temporais cobrem as seis estações nos dois sentidos, wheel lento/rápido, reversão antes de terminar, resize e navegação direta por âncora. Verificam um Canvas, limites de deslocamento, alinhamento por frame e ausência de sobreposição entre a tela e textos/controles visíveis em cada estação. Gesto vertical da página, fallback, tampa, chassi, foco/retorno e tema permanecem cobertos. Axe não substitui leitor de tela manual.

Total: **121 testes unitários e 121 cenários E2E distintos** (87 regressões anteriores + 33 Workstation + um gate público), sem contar reexecuções como cenários novos. O CI local com servidor gerenciado foi exercitado; nenhuma execução remota desse hotfix foi presumida.

A revisão visual encontrou a reserva do Hero tablet menor que a cena ampliada, aproximando controles da assinatura. O breakpoint 768–1279px agora reserva a mesma proporção da cena, limita largura a 800px e inclui espaço dos controles/entrada. A regressão adicional verifica 768/1024px; percurso 768/390, carregamento mobile e captura/vídeo tablet foram refeitos após a correção. Desktop/mobile fora desse intervalo mantiveram a composição capturada.

O ensaio inicial de hidratação apontou 6px de scroll residual. A instrumentação separada, com módulos ainda bloqueados, mostrou a rolagem nativa percorrendo 0→2.950px e terminando depois da janela inicial de 800ms, sem chamada JS a scroll. O profiler agora aguarda a âncora nativa estabilizar **antes de liberar o JS**, mantendo tolerância de 1px e registrando a espera adicional (190–222ms nesta corrida). Não se alterou o scroll da aplicação para passar o teste.

## Movimento e evidência visual

| Vídeo nativo | Tamanho | Duração | Amostras de trajetória |
|---|---|---:|---:|
| [Desktop Dark](videos/pt-dark-1440.webm) | 1440×900 | 35,48s | 394 |
| [Desktop Light](videos/pt-light-1440.webm) | 1440×900 | 30,44s | 413 |
| [Desktop amplo](videos/pt-dark-1920.webm) | 1920×1080 | 30s | 430 |
| [Tablet](videos/pt-dark-768.webm) | 768×900 | 31,2s | 535 |
| [Mobile Dark](videos/pt-dark-390.webm) | 390×844 | 29s | 572 |
| [Mobile Light](videos/pt-light-390.webm) | 390×844 | 27,68s | 562 |

Todos os seis percursos registraram **≤2.400px/s** de translação e zero frames novos em 600ms de repouso. Limite evita salto instantâneo após mudanças bruscas; não é promessa de FPS. Posição, tamanho, ângulos, capítulo, estado, scroll e erro de projeção foram registrados em `pt-*-trajectory.json`, sem overlay artificial nos vídeos. Redução de movimento usa atualização direta; a medição de continuidade animada não se aplica a esse modo.

Composição: Hero/Work à direita, About central, Expertise à esquerda, Services central e Contact à direita. A faixa externa permite sair temporariamente da viewport entre estações enquanto o visitante lê painéis de largura completa. Não se mantém o notebook por cima de todos os parágrafos. A comparação com o antes e as capturas das seis seções foi inspecionada; paleta/fonte/acento v0.1 preservados. O aceite visual final continua com o proprietário.

## Sites e limites de segurança

[NutriOpus real](videos/live-nutriopus.webm) e [Déborah real](videos/live-deborah.webm): documentos corretos, **0→650px de wheel**, clique real em âncora, X independente e zero erros de console registrados. [Resultados e políticas da nova execução](live-embed-results.json). Os testes são de landings anônimas em Chromium local; não validam formulários, autenticação, todo o conteúdo remoto ou a futura origem HTTPS.

O trackpad e as teclas virtuais controlam **somente aplicativos próprios registrados**. Não enviam eventos fingidos nem acessam DOM de iframe. Em qualquer iframe, inclusive fixture sandboxed, o visitante usa mouse/teclado/touch nativos na tela ou **Focar tela**. O feedback explica esse limite. CSP, sandbox e allowlist de URLs não foram ampliados.

O iframe permanece montado ao percorrer a página e pode continuar seu próprio JavaScript fora da viewport; o parent não consegue suspender código cross-origin com segurança. Fechar app/tampa ou desmontar a experiência libera a superfície. Mudar entre tela projetada e foco remonta o iframe; seu estado interno não é preservado nessa troca. Notas, por ser app próprio, conserva texto.

## Performance e pendências

Windows, Chromium/SwiftShader, Lighthouse **13.5.0**, origem local. Perfil de JS com Save-Data isola bootstrap/lazy; Lighthouse usa carregamento normal. Amostras de laboratório, sem equivalência com p75 de campo/GPU física.

| Página/amostra atual | Performance | LCP | TBT | CLS |
|---|---:|---:|---:|---:|
| Controle atual, mobile | 84 | 3102ms | 395ms | 0 |
| Workstation, mobile | **82** | **3292ms** | **412ms** | **0** |
| Workstation, desktop | **99** | **634ms** | **69ms** | **0,00098** |

A11y/boas práticas: 100 nas três corridas. SEO do laboratório: 60, com noindex intencional. JS inicial **171.152 bytes gzip**, +5.082/+3,1% sobre o perfil histórico P01 (166.070), abaixo de 180KB; lazy **250.144**, +1.527/+0,6%. Cena mantém **17 draw calls / 8.000 triângulos** e idle zero; média CPU `gl.render` incluindo inicialização: **1,81ms mobile / 1,78ms desktop**. INP da sequência local: **88/192ms**, CLS zero; não é p75. Não se convertem esses números em FPS/GPU.

**Performance mobile não aprovada:** LCP continua acima de 2,5s. A pontuação mobile foi 82, abaixo dos 92 históricos da P01; não houve ensaio A/B desses dois SHAs no mesmo ambiente. Na corrida contemporânea, o controle ficou em 84/TBT395 e a Workstation em 82/TBT412. Isso não autoriza afirmar ausência de regressão contra P01. O orçamento/idle se mantiveram, mas hardening de carregamento/React/mobile continua pendente. Não se escolheu apenas uma pontuação favorável para declarar aceite.

| Critério do hotfix | Situação |
|---|---|
| Notebook maior, tela clicável, teclado real local | VERIFIED em Chromium local |
| Trackpad/cursor/hover/clique/duplo/scroll/arraste | VERIFIED em app próprio, inclusive touch e rotação |
| Seis seções, reversão, scroll rápido/lento, resize, redução | VERIFIED com limites e estação/faixa de trânsito descritos |
| Tela DOM sincronizada e iframe persistente no percurso | VERIFIED nos cenários instrumentados; não prova universal de toda GPU/browser |
| Sites comerciais continuam navegáveis | VERIFIED localmente; domínio HTTPS de publicação pendente |
| Idiomas/temas/foco/a11y automatizada | VERIFIED nos cenários; leitor de tela/hardware real pendentes |
| Ausência de regressão relevante de performance | PARTIAL: orçamento/idle preservados; Lighthouse mobile/hardening pendentes |
| Aceite artístico / release | PENDING; não presumido |

`release:check` conserva as dez pendências editoriais anteriores. Não se aprovaram cases, perfil, trajetória, contatos, CV ou serviços. Firefox/WebKit, dispositivo físico, leitor de tela, zoom manual abrangente e revisão no domínio definitivo não foram executados. Física destrutiva, jogos, Code P03 e demais apps continuam fora do hotfix.

## Reprodução

Arquivos principais desta correção:

- `src/features/workstation/orchestrator/{position.ts,WorkstationOrchestrator.client.tsx}`: trajetória, rig, escalas e ciclo de render.
- `scene/WorkstationScene.client.tsx`, `models/LaptopModel.client.tsx` e `input/{keyboard-layout,NotebookInputController,NotebookPointerController}.ts` dentro da feature: câmera/projeção, teclas e controles reais.
- `screen/{WorkbenchScreen,NotesApp}.client.tsx`, `state/workstation-machine.ts`, `labels.ts` e `src/styles/workstation.css`: app local, foco, estados, traduções e composição.
- `src/components/sections/{Section,WorkSection}.tsx`: marcadores das estações; `tests/unit/workstation-input-motion.test.ts` e `tests/workstation/{input-motion,notebook}.spec.ts`: novas regressões e escala dos alvos herdados.
- `playwright.workstation.config.ts` e `.github/workflows/ci.yml`: servidor da suíte e inclusão no CI; scripts de gravação/perfil/consolidação recebem saídas separadas para preservar históricos.
- README, HANDOFF, ADR-016 e esta pasta: decisões, fronteiras de autoria, resultados e evidências; nenhum arquivo de conteúdo comercial foi alterado.

```powershell
$env:PORTFOLIO_CONTENT_PREVIEW='1'
$env:EXPERIMENTAL_WORKSTATION='1'
npm run build
$env:QA_MANAGE_SERVER='1'
$env:QA_LIVE_EMBEDS='1' # Rede real opcional; não é substituída por mocks
npm run test:workstation
# Para os profilers/gravações, inicie o build manualmente em 3300:
npm run start -- --hostname 127.0.0.1 --port 3300
# Em outro terminal:
node scripts/qa-workstation-hotfix.mjs
$env:QA_WORKSTATION_LOCALE_SCREENSHOTS='docs/qa/Workstation/P01.1/screenshots'
npx playwright test --config playwright.workstation.config.ts -g 'translated owned'
$env:QA_WORKSTATION_OUTPUT='docs/qa/Workstation/P01.1'
$env:QA_WORKSTATION_RAW_OUTPUT='docs/report/Workstation/P01.1/live-recordings'
node scripts/record-workstation-live.mjs
$env:QA_WORKSTATION_PROFILE_OUTPUT='docs/report/Workstation/P01.1/performance'
node scripts/profile-workstation.mjs
$env:QA_CREATIVE_OUTPUT_DIR='docs/qa/Workstation/P01.1'
node scripts/summarize-recovery-videos.mjs
node scripts/summarize-workstation-hotfix.mjs
```

Hidratação usa `profile-hydration.mjs` com `QA_ORIGIN=http://127.0.0.1:3300`, `QA_HYDRATION_PAGE_PATH=/pt/workstation-lab`, `QA_HYDRATION_HASHES=,#work,#about` e saídas P01.1. A consolidação requer os perfis brutos/hidratação e três relatórios Lighthouse recém-executados em `docs/report/Workstation/P01.1/performance/`; os brutos não estão no Git. Versão/configuração e resumos ficam em métricas. O [manifesto](evidence-manifest.json) verifica arquivos selecionados; não contém vídeo fabricado/alterado.

`docs/report/` permanece ignorado. Evidências selecionadas novas ficam somente nesta P01.1; relatórios P00/P01/históricos preservados. Commit local, sem push, merge ou deploy.
