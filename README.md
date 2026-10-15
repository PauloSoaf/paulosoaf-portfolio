# Paulo Soaf — Obsidian Orbit

Portfólio em Next.js App Router, React e TypeScript, com a identidade Obsidian Orbit v0.1. A fundação S00 contém landing renderizada no servidor, navegação acessível, PT-BR/EN/ES e temas Dark/Light. A S01 acrescenta um hero procedural real em Three.js/React Three Fiber, carregado progressivamente sobre o SVG local. A S02 acrescenta o carrossel cinematográfico e os candidatos comerciais NutriOpus/Déborah Lima. A S03 implementa timeline interativa e movimento compartilhado entre as seções. A S03.5 refina temas/microinterações, exploração do Hero e estabilidade durante hidratação lenta. Cases completos continuam no roadmap S04.

## Desenvolvimento

Requer Node.js 22.13+ (a versão principal está em `.nvmrc`).

```powershell
npm ci
npm run dev
```

Abra http://localhost:1010/pt. `npm run dev` usa a porta 1010. `/en` e `/es` têm textos e metadata próprios. A raiz escolhe idioma pelo cookie, depois `Accept-Language`, depois português. Uma URL com idioma sempre prevalece sobre preferências.

Em desenvolvimento, `/pt`, `/en` e `/es` abrem automaticamente a Workstation na rota do laboratório. A experiência anterior continua acessível em http://localhost:1010/pt?experience=recovery; `?experience=classic` mantém a comparação original. Esse encaminhamento é local ao `next dev`; o build público continua protegido pelos gates da POC.

A POC Creative Direction Recovery usa escultura procedural em camadas, abertura tipográfica, transição Hero → Work pelo scroll, vitrines ampliadas e profundidade na trajetória. Compare a experiência padrão com http://localhost:1010/pt?experience=classic. O parâmetro serve apenas à revisão visual; conteúdo/editorial/SEO continuam iguais. Vídeos, medições, diferenças intencionais e pendências: [QA Recovery](docs/qa/CreativeRecovery/REPORT.md). Aceite estético pertence ao proprietário; S04 ainda não foi iniciada.

A continuação solicitada acrescenta contador funcional 7→0, seleção direta dos sete projetos, entradas de scroll mais tardias e longas, escultura acompanhando as seções com tamanho variável e cards/CTAs com efeitos próprios. Evidências atuais: [QA da continuação](docs/qa/CreativeFollowup/REPORT.md), [ADR-014](docs/adr/ADR-014-visible-motion-and-page-companion.md).

A POC **Obsidian Workstation P00/P01** está em http://localhost:1010/pt/workstation-lab (também `/en/workstation-lab` e `/es/workstation-lab`). Notebook Three.js autoral com tampa, giro por arraste, desktop DOM projetado, browser de laboratório com input/scroll reais e foco 2D acessível. NutriOpus e Déborah têm prévias reais testadas localmente; a validação no futuro domínio HTTPS e o aceite de publicação continuam pendentes. A landing normal permanece como comparação. A barra de rolagem nativa foi personalizada em Dark/Light. [QA da Workstation](docs/qa/Workstation/P01/REPORT.md), [matriz de incorporação](docs/qa/Workstation/P00/EMBED-MATRIX.md), [ADR-015](docs/adr/ADR-015-workstation-dom-screen.md).

Para uma prévia otimizada da POC, use `PORTFOLIO_CONTENT_PREVIEW=1` **e** `EXPERIMENTAL_WORKSTATION=1` no build e no servidor. Com esse servidor em `127.0.0.1:3300`, execute `npm run test:workstation` e `npm run qa:workstation`. `QA_LIVE_EMBEDS=1` inclui os dois testes de rede real; `QA_ORIGIN` altera a origem de QA. Um build público normal retorna 404 para laboratório e fixture. P02–P07 seguem no backlog do pacote; Code é um stub P03, sem fonte externa. Jogos, destruição, teclado e trackpad virtuais não foram antecipados.

`next dev` mostra candidatos editoriais com avisos. Produção filtra coleções por `status: "approved"`. Perfil e textos da interface ainda exigem aprovação, verificada pelo gate de publicação.

## Verificação

```powershell
npm run verify
npx playwright install chromium
```

Para testar a composição completa de candidatos em um build otimizado local:

```powershell
$env:PORTFOLIO_CONTENT_PREVIEW = '1'
npm run build
npm run test:e2e
$env:QA_FOUNDATION_SCREENSHOT_DIR='docs/report/CreativeRecovery/foundation-regression'
$env:QA_HERO_SCREENSHOT_DIR='docs/report/CreativeRecovery/hero-regression'
$env:QA_CAROUSEL_SCREENSHOT_DIR='docs/report/CreativeRecovery/carousel-regression'
$env:QA_TIMELINE_SCREENSHOT_DIR='docs/report/CreativeRecovery/timeline-regression'
$env:QA_TIMELINE_VIDEO_DIR='docs/report/CreativeRecovery/timeline-regression-videos'
npm run qa:screenshots
npm run qa:hero
npm run qa:carousel
npm run qa:timeline
$env:QA_CREATIVE_OUTPUT_DIR='docs/qa/CreativeFollowup'
$env:QA_CREATIVE_RAW_DIR='docs/report/CreativeFollowup/recordings'
npm run qa:creative
```

Playwright inicia e encerra seu próprio servidor em `127.0.0.1:3200`; deixe essa porta livre. Os testes cobrem páginas sem JS, 404, teclado, mídia indisponível, reduced motion, responsividade, acessibilidade automatizada e persistência. A S01 também testa pixels e parallax reais, pausa, tema, touch, falha de chunk/criação WebGL e perda de contexto com recuperação. Capturas S00 ficam em `docs/qa/S00/`; `qa:hero` produz 36 capturas S01 em `docs/qa/S01/screenshots/`, sem sobrescrever a evidência anterior. Relatório interativo em `playwright-report/`.

O Hero preserva SVG em reduced motion, Save-Data e dispositivos limitados; “Ativar arte 3D” oferece opt-in. Na experiência Recovery, mobile carrega após 18% da arte visível, janela inicial de 1200 ms e idle callback; desktop usa 350 ms. A escultura tem movimento ambiente e acompanha toda a landing em um único canvas, variando tamanho por seção. Desktop amplo reserva uma área lateral; mobile usa uma miniatura que deixa passar scroll/cliques, com controles de pausa e arte estática. O render observa a superfície real, suspendendo em pausa/aba oculta/fora da tela. `classic` mantém o gate mobile de 90% e repouso sem loop. `?heroDebug=1` expõe diagnóstico no DOM; Web Vitals ficam no painel Performance local, sem envio de analytics.

O carrossel aprimora artigos renderizados no servidor: sem JS, todo o catálogo visível permanece acessível. Com JS, oferece profundidade desktop, swipe/drag, setas no estágio focado, anterior/próximo, seleção direta e autoplay de 7 segundos. O contador circular 7→0 usa o mesmo deadline da troca. Hover/drag/aba oculta/viewport e pausa manual congelam o tempo restante; retomada continua esse tempo, seleção manual reinicia em sete. Foco encerra autoplay até reprodução explícita. Reduced motion desativa rotação automática/transições. Apenas o slide ativo recebe foco; imagens do ativo e vizinhos carregam seletivamente, com proporção estável e fallback conceitual identificado.

`featuredOrder` configura destaque, sem excluir os secundários. Projetos privados não exigem GitHub; novos candidatos têm stack pendente e nenhuma demo/captura real aprovada. Produção mantém o fallback GitHub enquanto não houver projetos aprovados. Não existem rotas ou botões fictícios de case; S04 continua responsável pelos estudos de caso.

`qa:carousel` salva 52 PNGs próprios em `docs/qa/S02/screenshots/` (36 combinações e 16 slides adicionais). Para guardar nova regressão do Hero sem sobrescrever S01, execute `$env:QA_HERO_SCREENSHOT_DIR='docs/report/S02/hero-regression'` antes de `npm run qa:hero`. O diretório operacional continua ignorado pelo Git. Métricas do carrossel: produção local na porta 3202, depois `node scripts/profile-carousel.mjs`; resultados brutos ficam em `docs/report/S02/`. `QA_PUBLIC_SAMPLE=1` separa o perfil do build público. `npm run qa:carousel:summary` resume os dois perfis e quatro Lighthouse atuais, preservando diagnósticos históricos quando os logs antigos não estiverem no clone. Procedimento, limites e números em `docs/qa/S02/REPORT.md`.

A timeline S03 usa capítulos temáticos herdados, ainda rascunhos: desktop ≥64rem tem tabs verticais, Up/Down/Home/End, painel associado e progresso. “Acompanhar a rolagem” é opcional e seleção manual assume prioridade. Mobile mostra todos os cards em ordem, sem sticky. Reduced motion mantém seleção manual e suspende acompanhamento/parallax; sem JS, toda a trajetória visível no catálogo continua legível. Nenhuma empresa/período foi acrescentado ou aprovado.

O Motion System utiliza WAAPI/IntersectionObserver, sem dependências extras. HTML inicial é visível; elementos já na viewport/âncora não aguardam entrada. Entradas posteriores executam uma vez, com margem inferior de −18%, duração mínima 850 ms (editorial/profundidade 1100 ms) e movimentos de 32–72 px. Foco/saída de viewport/removal cancelam, aba oculta pausa. Falhas/ausência de WAAPI deixam estilos normais. Scroll nativo agenda somente um frame pendente para ornamentos/progresso; Work revela uma camada externa, preservando transforms dos slides. Na Recovery, câmera, plano editorial e escultura respondem ao scroll conforme ADR-013/014.

`qa:timeline` salva 52 PNGs e dois vídeos WebM próprios em `docs/qa/S03/`. A sequência PNG documenta timestamps controlados da animação nativa; os vídeos registram uma execução separada sem alterar tempo/frames. Nova regressão anterior: `QA_FOUNDATION_SCREENSHOT_DIR=docs/report/S03/foundation-regression`, `QA_HERO_SCREENSHOT_DIR=docs/report/S03/hero-regression`, `QA_CAROUSEL_SCREENSHOT_DIR=docs/report/S03/carousel-regression`. O perfil S03 usa `node scripts/profile-motion.mjs` com produção local em 3202, `QA_PUBLIC_SAMPLE=1` para público; depois `npm run qa:motion:summary` resume os dois perfis/quatro Lighthouse. Save-Data isola o orçamento inicial sem WebGL e mantém motion ativo; logs brutos ficam ignorados. Procedimento, métricas e limites: `docs/qa/S03/REPORT.md`.

A S03.5 anima a troca solicitada de tema em 320 ms, mantendo o bootstrap sem flash e reduced motion imediato. Controles compartilham elevação, press, foco e disabled; no touch, um runtime passivo garante pressão/cancelamento. O Hero permite drag horizontal com damping e limites, setas por teclado e entrada finita de 850 ms, sem giro contínuo em repouso. Os controles mobile cabem em uma linha. Antes da hidratação, a timeline desktop permite links nativos entre capítulos e Work uma faixa horizontal navegável; sem JS continuam a lista/grid completos. O teste de rede/JS lentos inclui abertura direta em `#about`, sem variação de altura/scroll acima de 1 px nos cenários medidos.

`npm run qa:polish` gera capturas PT/EN/ES, Dark/Light e vídeos reais desktop/mobile em `docs/qa/S03.5/`. `node scripts/profile-hydration.mjs` reproduz a medição contra prévia otimizada em 3202. Use `QA_MOTION_OUTPUT_DIR` / `QA_HERO_OUTPUT_DIR` para guardar os perfis em `docs/report/S03.5`; `QA_TIMELINE_SCREENSHOT_DIR` / `QA_TIMELINE_VIDEO_DIR` preservam capturas S03 anteriores. `npm run qa:polish:summary` consolida os perfis e quatro Lighthouse em métricas versionadas. Resultados, limites, arquivos e autoria: [QA S03.5](docs/qa/S03.5/REPORT.md), [ADR-012](docs/adr/ADR-012-interaction-polish-and-stable-hydration.md), [HANDOFF](docs/HANDOFF.md).

Para repetir o perfil de chunks/CPU/cadência, inicie um build de produção com `npm run start -- --port 3202` e, em outro terminal, execute:

```powershell
$env:QA_ORIGIN = 'http://127.0.0.1:3202'
node scripts/profile-hero.mjs
```

Os resultados brutos ficam em `docs/report/S01/`, fora do Git. O procedimento Lighthouse e os limites da medição constam no relatório S01. `npm run qa:hero:summary` gera `docs/qa/S01/metrics.json` a partir do perfil e dos dois relatórios Lighthouse finais, conservando a comparação histórica quando os logs antigos estiverem ausentes.

Para verificar o build público sem rascunhos:

```powershell
$env:PORTFOLIO_CONTENT_PREVIEW = '0'
npm run build
$env:QA_EXPECT_PUBLIC_CONTENT = '1'
npx playwright test -g 'public build'
```

O workflow `.github/workflows/ci.yml` executa lint, typecheck, testes, build de prévia e E2E. A configuração está preparada; sua execução no GitHub depende de o repositório ser enviado pelo proprietário.

## Conteúdo e publicação

Dados ficam em `src/features/`; traduções em `src/i18n/dictionaries/`. Não marcar conteúdo como aprovado sem revisão do proprietário. E-mail, LinkedIn e currículo ainda não foram fornecidos/validados. Demos não verificadas não são exibidas; ilustrações dos projetos são identificadas como arte conceitual.

Antes de qualquer publicação, configurar `SITE_URL` com a origem HTTPS real, aprovar perfil/textos/coleções, validar contatos e arquivo de CV, e executar:

```powershell
npm run release:check
```

Esse comando **falha intencionalmente no estado editorial atual**. Um build passando não autoriza publicação. Nunca publicar com `PORTFOLIO_CONTENT_PREVIEW=1`.

## Referências e decisões

- Pacote original: `paulo_soaf_obsidian_orbit_specs_pocs_v01/`.
- Relatório da continuação: `docs/qa/S00/REPORT.md`.
- Hero procedural, aceite e evidências: `docs/qa/S01/REPORT.md` e `docs/adr/ADR-009-progressive-hero-webgl.md`.
- Carrossel, catálogo e evidências S02: `docs/qa/S02/REPORT.md`, `docs/qa/S02/EDITORIAL-PENDING.md` e `docs/adr/ADR-010-cinematic-project-carousel.md`.
- Timeline, motion e evidências S03: `docs/qa/S03/REPORT.md`, `docs/qa/S03/EDITORIAL-PENDING.md` e `docs/adr/ADR-011-timeline-and-shared-motion.md`.
- Microinterações, hidratação lenta e evidências S03.5: `docs/qa/S03.5/REPORT.md` e `docs/adr/ADR-012-interaction-polish-and-stable-hydration.md`.
- Ponto exato de retomada e divisão Claude/Codex: `docs/HANDOFF.md`.
- Relatórios operacionais locais: `docs/report/` (ignorado pelo Git).
- Decisões da implementação: `docs/adr/`.
- Tema Dark preserva os tokens v0.1; Light é neutro com acento discreto.
- Fontes são baixadas pelo `next/font` durante o build e servidas localmente em runtime. Build novo exige acesso ao provedor de fontes.

Commit e push da S00 foram autorizados pelo proprietário após a validação local. S03 e S03.5 remotas foram confirmadas em `0ad2532` / `bd21d67`, com seus CIs concluídos; `main` continua na S00. A POC atual fica em `feat/creative-direction-recovery`, derivada de `bd21d67`. Não houve merge, push ou deploy nesta continuação. Aceite estético, performance mobile e gate editorial permanecem pendentes; S04/S05 seguem no roadmap, S06 depende de autorização específica.
