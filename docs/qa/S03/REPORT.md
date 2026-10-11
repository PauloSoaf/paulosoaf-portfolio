# S03 — Trajetória interativa e experiência de scroll

Data: 10/10/2026. Branch `feat/s03-interactive-timeline-motion`, base `66c8ff0fae0b275b1b2d86bfcd70b29a8da80852`, conferida local/remota com árvore limpa. `main` permanece na S00. [CI S02](https://github.com/PauloSoaf/paulosoaf-portfolio/actions/runs/38098111251) confirmado `completed/success` antes da implementação. Sem merge, push ou deploy nesta continuação.

## Entrega e fronteira

Timeline desktop com linha vertical, tabs selecionáveis, detalhe associado, progresso, Up/Down/Home/End, wrap e foco preservado. Acompanhamento por scroll é opt-in; seleção manual tem prioridade. Mobile mantém todos os artigos empilhados e destaca o capítulo em evidência sem sticky. HTML/no-JS é uma lista completa. Reservar a altura máxima do painel evita salto durante seleção. Listas 0/1 e reordenação/remoção são suportadas.

Motion System compartilhado e pequeno, sem bibliotecas novas: revelações por visibilidade/WAAPI, entradas individuais/sequenciais, stagger por grupo, movimentos horizontais, escala discreta, linhas/progresso e parallax decorativo de ±14 px. Conteúdo já na viewport/âncora/reload permanece imediatamente disponível. Entradas posteriores executam uma vez por nó; falha/ausência de animação não esconde conteúdo. Reduced motion desativa os efeitos e sincronização; seleção/links permanecem funcionais. Scroll nativo, sem captura wheel, sem loop rAF permanente nem atualização React por pixel.

Hero preserva Three/R3F, texto e CTAs; só o grid decorativo recebe marcação. Work revela uma camada externa, sem conflitantes transforms dos slides, remount ou reinício de autoplay. Expertise revela cards em sequência; Services usa entradas horizontais escalonadas; Contact encerra com profundidade/entrada de canais existentes. Seções recebem linhas orbitais discretas. Dark/Light e PT/EN/ES mantêm tokens aprovados.

Todos os três capítulos temáticos continuam `draft`, com os mesmos textos e tags. Não foram inventados períodos/cargos/empresas ou aprovadas coleções. S04 cases, navegação entre cases, Explore Mode e Dev Mode não foram implementados. [Pendências editoriais](EDITORIAL-PENDING.md), [ADR-011](../../adr/ADR-011-timeline-and-shared-motion.md) e [autoria/retomada Claude/Codex](../../HANDOFF.md).

| Arquivos / área | Trabalho Codex S03 |
|---|---|
| `src/features/motion/motion-engine.ts`, `MotionRuntime.client.tsx` | WAAPI tipada, observer compartilhado, discovery dinâmico, cancelamento/pausa/cleanup e parallax por evento. |
| `JourneyTimeline.client.tsx`, `src/styles/timeline.css` | Ilha progressiva desktop/mobile, tabs, seleção por ID, linha/progresso, sincronização opcional e detalhes. |
| `Section`, `SectionHeading`, About/Expertise/Services/Contact | Conteúdo servidor reaproveitado e marcações por coreografia. |
| `HeroEditorial`, `src/app/[locale]/page.tsx`, `globals.css`, `motion.css` | Runtime único, imports CSS e marcação somente do grid ornamental do Hero. |
| `src/i18n/dictionaries/{pt,en,es}.ts` | Labels de navegação, posição e acompanhamento; conteúdo editorial herdado intacto. |
| `tests/unit/{motion,timeline}.test.*`, `tests/e2e/timeline-motion.spec.ts` | Ciclo de vida, dados/seleção, motion e interações/falhas/scroll/teclado reais. |
| `tests/e2e/carousel.spec.ts` | Instala relógio virtual após hidratação e inicia novo timeout via controle real; lógica do produto S02 intacta. |
| `tests/visual/*`, `playwright.timeline-visual.config.ts` | Suíte S03 e saída opcional S00/S02 para preservar evidências históricas. |
| `scripts/{profile-motion,summarize-motion-qa}.mjs`, `package.json` | Perfil e resumo reproduzíveis; comandos de QA, sem dependências novas. |
| `eslint.config.mjs`, `tsconfig.json` | Ignora arquivos gerados/cache operacional em `docs/report`, sem excluir código da aplicação. |
| `README`, `HANDOFF`, `ADR-011`, `docs/qa/S03/` | Operação, autoria, rastreabilidade, decisões/evidências e limites. |

## Verificação

| Verificação | Resultado |
|---|---|
| Lint / typecheck / build prévia | Passaram; sem warnings de lint. Build otimizado gera PT/EN/ES. |
| Unitários | 60 passaram em oito arquivos, incluindo 13 novos casos de lifecycle/timeline. |
| E2E S00/S01/S02/S03 | 61 passaram + um skip condicional no build de prévia; teste adicional de tema/idioma real passou separadamente. Total validado: 62. |
| Autoplay S02 | Timer nativo de sete segundos passou; dez repetições focadas de timer/aba oculta com relógio virtual passaram sem retries locais. |
| QA S03 | 38 cenários passaram: 52 PNGs e dois WebM gerados. |
| QA Hero / carrossel | 36 cenários de cada suíte passaram, em saídas próprias ignoradas (36 PNGs Hero / 52 PNGs Work). |
| QA S00 | 12 cenários passaram, 24 PNGs novos em saída própria ignorada. |
| Gate público | Build otimizado e teste PT/EN/ES passaram; conferência final inclui ausência explícita da timeline/artigos candidatos. |
| `release:check` | Falhou conforme esperado com os dez bloqueadores herdados de origem HTTPS, conteúdo aprovado e contatos/CV. Nenhum gate foi enfraquecido. |

O novo E2E verifica seleção real/tags/texto, Up/Down/Home/End/Tab, inert de painéis inativos, lista mobile exposta, scroll nos dois sentidos e opt-in desktop. Também comprova keyframes/duração efetivos, execução única, retorno à seção, parallax limitado, âncoras/reload, WAAPI lançando erro, alvo dinâmico/foco/remoção, no-JS/no-CSS, axe, seis viewports, fonte 200% e troca real de tema/idioma sem pageerror. A troca de idioma preserva tema/âncora e reinicia seleção na nova página, conforme navegação nativa anterior.

Unitários verificam cleanup/desconexão, cancelamento por saída/remoção/foco/reduced, pausa/resume por visibilidade da aba, API ausente/falha e conversão de segundos computados para milissegundos. Um primeiro teste real detectou animação de 0,28 ms por unidade normalizada; parser e regressão foram corrigidos para 280 ms. A suíte antiga de autoplay também revelou instabilidade de scheduling ao instalar fake clock durante hidratação: isolou-se o relógio após o commit e criou-se timeout pelo controle do produto. Não foram adicionados retries locais nem alterado o controlador do carrossel.

Play da S02 mantém a política anterior: reprodução solicitada fica suspensa enquanto foco/hover permanecer no carrossel; ao sair, retoma. Esse comportamento, seu estado textual e avanço real foram testados. Não foi presumido um bug ou reaberta a S02 para mudar a política de foco.

| Critério / tarefa | Evidência e limite |
|---|---|
| AC-005 / RF-007 / T03-02,03,04 | Lista sem JS/CSS, tabs verticais/teclado/painel desktop e mobile linear. |
| AC-008 / T03-05 | Reduced motion remove reveal/parallax/sincronização sem remover conteúdo/seleção. |
| AC-009 | 360/390/768/1024/1440/1920, Dark/Light, PT/EN/ES e zoom 200% sem overflow. |
| AC-014 / T03-01 | Dados/status/filtros preservados; nenhum período/empregador/segredo introduzido. Aprovação editorial continua pendente do proprietário. |
| AC-016 / RF-019 / T03-06 | Grupos de Expertise e serviços existentes reaproveitados, labels/links funcionais; verificação/aprovação editorial de stacks e ofertas continua pendente. |
| Extensão Motion / RNF-003/012/014 | HTML visível, ilha pequena, nativo/sem wheel hijacking, API failure, lifecycle, entradas reais e nenhuma nova cena WebGL. |
| RNF-001 | Laboratório/budget registrados abaixo; p75 e hardware físico não certificados. |

## Referência visual e evidências

Examinados [mockup original](../../../paulo_soaf_obsidian_orbit_specs_pocs_v01/assets/mockups/03-timeline-desktop.png), POC-003 aberta no Chromium, specs S03/motion/design/states/rendering e DOD v0.1. Seleção do segundo marco da POC mudou o detalhe original. Não foi usada direção v0.2.

Conservados composição editorial, rail esquerda/painel direita, título dominante, tokens e verde-água pontual. Desvios justificados: labels PT/EN/ES, badges de rascunho, títulos reais dos capítulos herdados em vez de títulos/períodos não confirmados da POC, altura reservada, controle explícito de acompanhamento, mobile integral sem sticky e ornamentos discretos autorizados pela extensão.

Capturas da seção About usam `screenshot.style` para ocultar o header fixo **apenas na captura**, evitando costura sobre conteúdo; as sequências de viewport mostram o header real. Navegação real continua testada. Desktop/mobile Dark/Light, estados selecionados e variantes compactas foram examinados. Aceite estético final permanece do proprietário.

As sequências de quatro PNGs mostram initial/entering/intermediate/final. Intermediate pausa **a animação WAAPI nativa** em 140 ms para repetir/comparar o estado computado; não injeta uma aparência CSS inventada. Os [vídeos desktop](videos/scroll-1440.webm) e [mobile](videos/scroll-390.webm) vêm de uma execução **separada sem alteração de tempo/frames**, com scroll nativo, seleção de capítulos e passagens entre seções. Screenshots isolados não são usados para alegar fluidez.

| Idioma / tema | 360 | 390 | 768 | 1024 | 1440 | 1920 |
|---|---|---|---|---|---|---|
| PT dark | [PNG](screenshots/pt-dark-360.png) | [PNG](screenshots/pt-dark-390.png) | [PNG](screenshots/pt-dark-768.png) | [PNG](screenshots/pt-dark-1024.png) | [PNG](screenshots/pt-dark-1440.png) | [PNG](screenshots/pt-dark-1920.png) |
| PT light | [PNG](screenshots/pt-light-360.png) | [PNG](screenshots/pt-light-390.png) | [PNG](screenshots/pt-light-768.png) | [PNG](screenshots/pt-light-1024.png) | [PNG](screenshots/pt-light-1440.png) | [PNG](screenshots/pt-light-1920.png) |
| EN dark | [PNG](screenshots/en-dark-360.png) | [PNG](screenshots/en-dark-390.png) | [PNG](screenshots/en-dark-768.png) | [PNG](screenshots/en-dark-1024.png) | [PNG](screenshots/en-dark-1440.png) | [PNG](screenshots/en-dark-1920.png) |
| EN light | [PNG](screenshots/en-light-360.png) | [PNG](screenshots/en-light-390.png) | [PNG](screenshots/en-light-768.png) | [PNG](screenshots/en-light-1024.png) | [PNG](screenshots/en-light-1440.png) | [PNG](screenshots/en-light-1920.png) |
| ES dark | [PNG](screenshots/es-dark-360.png) | [PNG](screenshots/es-dark-390.png) | [PNG](screenshots/es-dark-768.png) | [PNG](screenshots/es-dark-1024.png) | [PNG](screenshots/es-dark-1440.png) | [PNG](screenshots/es-dark-1920.png) |
| ES light | [PNG](screenshots/es-light-360.png) | [PNG](screenshots/es-light-390.png) | [PNG](screenshots/es-light-768.png) | [PNG](screenshots/es-light-1024.png) | [PNG](screenshots/es-light-1440.png) | [PNG](screenshots/es-light-1920.png) |

| PT adicional | Dark | Light |
|---|---|---|
| Desktop capítulo 2 | [PNG](screenshots/pt-dark-1440-chapter-2.png) | [PNG](screenshots/pt-light-1440-chapter-2.png) |
| Desktop capítulo 3 | [PNG](screenshots/pt-dark-1440-chapter-3.png) | [PNG](screenshots/pt-light-1440-chapter-3.png) |
| Reduced motion 390 | [PNG](screenshots/pt-dark-390-reduced.png) | [PNG](screenshots/pt-light-390-reduced.png) |
| Reduced motion 1440 | [PNG](screenshots/pt-dark-1440-reduced.png) | [PNG](screenshots/pt-light-1440-reduced.png) |

| Motion real (PT Dark) | Inicial | Entrada | Intermediário | Final |
|---|---|---|---|---|
| 390 | [PNG](screenshots/motion-390-initial.png) | [PNG](screenshots/motion-390-entering.png) | [PNG](screenshots/motion-390-intermediate.png) | [PNG](screenshots/motion-390-final.png) |
| 1440 | [PNG](screenshots/motion-1440-initial.png) | [PNG](screenshots/motion-1440-entering.png) | [PNG](screenshots/motion-1440-intermediate.png) | [PNG](screenshots/motion-1440-final.png) |


## Performance e repetição

Resumo versionado: [metrics.json](metrics.json). Perfis/Lighthouse brutos, captura POC, logs/cache e regressões S00/S01/S02 ficam em `docs/report/S03/`, ignorados; evidências anteriores não foram sobrescritas. Amostras atuais devem ser comparadas com S02 histórica sem afirmar p75 ou regressão estatística por uma rodada.

| Amostra final | Performance / acessibilidade / boas práticas / SEO | LCP | CLS | TBT |
|---|---|---|---|---|
| Prévia desktop | 100 / 100 / 100 / 63 | 681 ms | 0,00040 | 2,5 ms |
| Prévia mobile | 92 / 100 / 100 / 63 | 3.184 ms | 0 | 132 ms |
| Público desktop | 100 / 100 / 100 / 100 | 594 ms | 0,00040 | 2,5 ms |
| Público mobile | 95 / 100 / 100 / 100 | 2.779 ms | 0 | 108 ms |

Windows/Chromium 153/Lighthouse 13.5.0 com throttling `simulate`; uma amostra por cenário, sem executar outras suítes de browser durante Lighthouse. Prévia é `noindex`, portanto SEO 63 é intencional. Datas completas UTC constam no JSON (rodada na noite local de 10/10/2026).

JS inicial: **157.083 bytes gzip** nas duas larguras/prévia/público, versus 154.711 na S02: **+2.372 bytes / 1,53%**, abaixo do orçamento de 180 KB. São scripts externos Next únicos antes de rolar, sem HTML/Flight inline nem garantia de transferência idêntica em CDN. Save-Data preserva SVG para isolar o custo sem WebGL, mantendo o novo motion ativo; a S02 usou reduced motion para esse orçamento, uma diferença de condição explicitada no resumo. Nenhuma dependência foi adicionada.

Perfil com input real: na prévia, Next de Work em ambas larguras e seleção de tabs desktop; no público sem candidatos, link real “Voltar ao topo”. INP local: **32 ms mobile / 24 ms desktop** na prévia; **16 ms** em ambas larguras no público. CLS 0 nessas quatro amostras. Foram registradas 31/39 animações de entrada na prévia e 22 no público, durações reais de 280/550 ms, máximo uma execução por alvo de reveal; ao terminar, zero animações running, zero canvas e zero overflow. A animação de troca manual de detalhe é independente da entrada única, como previsto. Logs/perfis completos permanecem ignorados. LCP do perfil mobile de prévia não foi emitido naquela sessão; comparação de LCP usa os relatórios Lighthouse acima.

O **LCP mobile continua acima da meta de 2,5 s**: público 2,779 s versus 2,904 s na S02 histórica; prévia 3,184 s versus 3,178 s. Score mobile público foi 95 versus 94, desktop permaneceu 100; preview permaneceu 92. Isso não demonstra resolução da meta nem regressão estatística por uma rodada. Não foram medidos p75 em campo, FPS/GPU de aparelhos físicos ou acessibilidade manual integral; RNF-001 e otimização final S05 permanecem pendentes. Os vídeos/keyframes comprovam movimento executado, sem certificar fluidez em todo hardware.

Para repetir:

```powershell
$env:PORTFOLIO_CONTENT_PREVIEW='1'
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run qa:timeline
$env:QA_FOUNDATION_SCREENSHOT_DIR='docs/report/S03/foundation-regression'
npm run qa:screenshots
$env:QA_HERO_SCREENSHOT_DIR='docs/report/S03/hero-regression'
npm run qa:hero
$env:QA_CAROUSEL_SCREENSHOT_DIR='docs/report/S03/carousel-regression'
npm run qa:carousel
npm run start -- --port 3202
```

Em outro terminal:

```powershell
$env:QA_ORIGIN='http://127.0.0.1:3202'
node scripts/profile-motion.mjs
$env:CHROME_PATH=(node -p "require('playwright').chromium.executablePath()")
npm exec --yes --package=lighthouse@13.5.0 -- lighthouse http://127.0.0.1:3202/pt --preset=desktop --only-categories=performance,accessibility,best-practices,seo --chrome-flags='--headless --enable-unsafe-swiftshader' --output=json --output-path=docs/report/S03/lighthouse-preview-desktop.json --quiet
npm exec --yes --package=lighthouse@13.5.0 -- lighthouse http://127.0.0.1:3202/pt --only-categories=performance,accessibility,best-practices,seo --chrome-flags='--headless --enable-unsafe-swiftshader' --output=json --output-path=docs/report/S03/lighthouse-preview-mobile.json --quiet
```

Encerrar produção 3202 antes de rebuild; build com `PORTFOLIO_CONTENT_PREVIEW=0`, executar `QA_EXPECT_PUBLIC_CONTENT=1 npx playwright test -g 'public build'`, iniciar novamente 3202. Perfil com `QA_PUBLIC_SAMPLE=1` e Lighthouse para `lighthouse-public-{desktop,mobile}.json`; `npm run qa:motion:summary` exige dois perfis e quatro relatórios atuais. Manter medições isoladas de outras suítes/browser ativos. Save-Data isola JS sem WebGL no perfil, mantendo motion; Lighthouse usa suas condições próprias. Produção não publica a timeline candidata enquanto nenhum capítulo estiver aprovado.

Smoke final em `http://localhost:1010/pt#about`: HTTP 200, seleção real de `creative-engineering`, entrada de Expertise `finished` e zero pageerror. Os 59 links locais deste relatório existem; 52 PNGs têm as larguras corretas e os dois vídeos decodificam em 390×844/1440×900, 8,64 s cada. Dev permanece ativo na porta 1010; o servidor QA 3202 foi encerrado.

A S03 ampliada está tecnicamente implementada e validada localmente no escopo descrito. S04 é a próxima sprint; aprovação visual/editorial T03-01, aparelhos/leitores de tela/browsers físicos, p75 e otimização final S05 permanecem pendentes. Sem merge/push/deploy nesta entrega; S06/Dev Mode não iniciados.
