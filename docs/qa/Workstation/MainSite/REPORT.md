# Notebook como página principal e Projetos alinhados

**22/10/2026 · Codex · `feat/workstation-main-site-project-layout` · base limpa `cbb2b84fa16bc271c6a30ccbc435bcdbcd94f76b`.** [ADR-022](../../../adr/ADR-022-workstation-main-site-and-project-layout.md) · [Fronteira de autoria](../../../HANDOFF.md).

## Pedido e entrega

O notebook passa a ser a experiência principal em `/pt`, `/en` e `/es`, inclusive no build público. A faixa editorial acima da navegação e “Voltar para o portfólio” saem da apresentação. A rota antiga do laboratório redireciona para a principal; links salvos conservam idioma, query útil e hash, inclusive sem JavaScript. O parâmetro antigo `experience` não troca mais a interface.

Projetos troca a posição absoluta `top:440px` por uma grade compartilhada entre card e notebook. O título ocupa menos altura, a mídia é proporcional, o card preserva todos os textos/links e os controles/seletores permanecem no fluxo. De 1024px em diante, notebook e carrossel têm a mesma origem vertical; abaixo disso, o card vem antes da estação 3D. Não há corte por altura fixa, ocultação de texto nem scroll interno no card.

A primeira captura de 1440×900 na base encontrou o título em y=199,5–493px, o card até y=1216,875px e os controles começando em y=1256,875px. A captura intermediária já mostrou os controles em y=785,641px; o ajuste final de proporção/padding reduziu novamente a altura e permite ver o conjunto no desktop de 900px. A referência é a captura do proprietário e a geometria coletada antes das alterações; as capturas desta pasta documentam a entrega atual.

No mobile, uma cena previamente carregada também podia passar sobre o card durante a transição automática. A silhueta agora cede espaço de leitura enquanto cruza título/carrossel e reaparece na estação. É o mesmo Canvas, sem recarregar apps/iframes; `inert` e visibilidade liberam foco e cliques. Gestos manuais e apresentação intencional continuam visíveis. Não é recorte da malha/tela.

## Conteúdo e escopo preservados

Retirar a faixa não aprova o conteúdo. A lista filtrada no servidor governa carrossel, botões do notebook, fallback sem JS e comandos do Terminal. Sem projetos aprovados, o notebook público mantém Terminal, Código e Notas; o browser de teste e os projetos em revisão não aparecem. A fixture continua 404 no build público. O preview mantém badges nos itens e `noindex`; os gates de publicação continuam ativos.

A CSP libera os dois domínios fornecidos pelo proprietário somente nas páginas principais. Outras páginas mantêm `frame-src 'self'`; não há relaxamento de sandbox, `frame-ancestors`, WebAssembly ou permissões do dispositivo.

**Claude, preservado:** snapshot P02 `17ff916637674df95be03ed58ee44fd22e64981b`, modelo/material/atlas, teclado, tampa, solver, Canvas e DOM projetado, Terminal, Código e inspeção. **Codex anterior:** P02.1/P02.2, Fast Refresh, setas e P03 até `cbb2b84`. **Codex nesta continuação:** rotas/página principal, retirada das duas faixas, CSS de Projetos, proteção de leitura mobile, acesso editorial do notebook/Terminal, atualização dos testes, capturas e documentação. Não há diff no modelo, atlas, geometria do teclado, solver, tampa, reconhecedor circular ou composições P03. Não houve avanço de sprint, jogo, destruição, publicação, push ou merge.

## Validação

| Verificação | Resultado |
|---|---|
| Lint, typecheck e build otimizado de preview | PASS |
| Unitários completos | **209 PASS / 24 arquivos** |
| E2E gerais, execução final isolada | **75 PASS + um condicional do build público**, sem falhas |
| Workstation completa, execução isolada com sites reais habilitados | **77/77 PASS**, sem skip/falha/flaky, 21,6 minutos |
| Hidratação lenta | **6/6 PASS**: 390/1440px × topo/`#work`/`#about`; deltas de altura/posição/scroll **zero**, sem erros |
| Projetos após o ajuste do breakpoint | **21/21 PASS**, incluindo WebGL em 1024/1037px; sem skip/falha/flaky |
| Build público e gate funcional próprio | **Build PASS; 7/7 E2E PASS**: três idiomas, redirects, CSP, filtros do desktop e rejeição real de comando de projeto pendente no Terminal |
| Matriz visual revisada | **14 combinações; 36 PNGs**, PT/EN/ES × Dark/Light × desktop/mobile, mais 2880px e duas janelas no breakpoint; zero erros de execução/console |
| Alinhamento DOM/tela física nas capturas | Erro máximo **0,00694px** |
| Gate de publicação editorial | **Bloqueado por dez pendências herdadas**, sem aprovações automáticas |

[Resumo verificável](validation.json) · [Fontes, hashes, geometria e capturas](evidence.json). Os registros distinguem os 77 cenários da rodada completa e os 21 casos de Projetos repetidos na árvore final. A única diferença de fonte do produto após a rodada completa é a escolha da largura CSS na proteção de leitura, validada pelo caso extra. Relatórios brutos e o HTML completo ficam em `docs/report/Workstation/MainSite/`, ignorado pelo Git.

## Evidências visuais

| Tela | Dark | Light |
|---|---|---|
| PT · Projetos desktop 1440px | [Captura](screenshots/pt-dark-1440-projects.png) | [Captura](screenshots/pt-light-1440-projects.png) |
| PT · Projetos 2880px | [Captura](screenshots/pt-dark-2880-projects.png) | [Captura](screenshots/pt-light-2880-projects.png) |
| PT · Card mobile legível | [Captura](screenshots/pt-dark-390-project-card.png) | [Captura](screenshots/pt-light-390-project-card.png) |
| PT · Notebook na estação mobile | [Captura](screenshots/pt-dark-390-notebook.png) | [Captura](screenshots/pt-light-390-notebook.png) |
| EN · Projetos desktop | [Captura](screenshots/en-dark-1440-projects.png) | [Captura](screenshots/en-light-1440-projects.png) |
| EN · Card mobile | [Captura](screenshots/en-dark-390-project-card.png) | [Captura](screenshots/en-light-390-project-card.png) |
| ES · Projetos desktop | [Captura](screenshots/es-dark-1440-projects.png) | [Captura](screenshots/es-light-1440-projects.png) |
| ES · Card mobile | [Captura](screenshots/es-dark-390-project-card.png) | [Captura](screenshots/es-light-390-project-card.png) |

Regressões extras com foco real no estágio: [1024px](screenshots/pt-dark-1024-scrollbar.png), [1037px](screenshots/pt-dark-1037-scrollbar.png). As seis fotos das estações mobile foram reenquadradas com scroll nativo ao centro da área reservada; são novas capturas do mesmo build de produto, com hashes conferidos, sem alterar pose, relógio ou estado do rig para a fotografia. O roteiro permanente usa esse enquadramento. A chegada à seção e os cards continuam documentados separadamente.

## Critérios atendidos

- Uma experiência principal, sem barra de laboratório, retorno à landing antiga ou faixa editorial acima da navegação.
- URLs canônicas e bookmarks antigos funcionais em três idiomas, com e sem JavaScript; CSP restrita aos hosts autorizados.
- Todos os projetos selecionáveis, card ativo integral no estágio, controles no fluxo e alinhamento real com o notebook; contador, drag, teclado e autoplay preservados.
- Leitura mobile com cena previamente carregada sem obstrução; clique real abre o projeto mantendo o mesmo Canvas; estação visível nas duas colunas a partir do breakpoint CSS.
- PT/EN/ES, Dark/Light, fallback de GPU/rede, redução de movimento, foco e filtros editoriais preservados.
- Modelo/atlas/teclado/física do Claude conservados e autoria da continuação registrada, com arquivos brutos fora do Git.

Os testes históricos da escultura e de `?experience=classic` foram conservados em `tests/legacy`, fora da suíte do produto atual. Não são contabilizados como testes executados do notebook. As regressões gerais de navegação, temas, motion, carrossel, conteúdo e acessibilidade continuam em `tests/e2e`; os cenários físicos e os novos testes de enquadramento/entrada real estão em `tests/workstation`.

### O que a validação encontrou

A primeira execução completa da Workstation teve **72 PASS / cinco falhas**. Não é apresentada como rodada verde. Os registros e traces foram preservados em `docs/report/Workstation/MainSite/initial-failures` e nos arquivos `workstation-e2e-initial.*`.

- Em 768px, o host com scrollbar mede 754px. O preenchimento de telefone podia produzir uma silhueta maior que a estação e a proteção de leitura mantinha o notebook oculto nesse ponto. A estação Work passou a considerar sua própria largura/altura e a extensão renderizada, com 2% de respiro. Três regressões geométricas cobrem o limite; as demais estações preservam o cálculo anterior.
- O duplo toque era enviado como dois cliques com consultas entre eles. O trace mostrou um dos envios levando 384ms; o controlador reconhece duplo clique em 350ms. O teste usa agora um duplo clique nativo, registra os `pointerup` e confere os timestamps, sem alterar o limite do produto.
- A espera de repouso de 12s em 1920px foi substituída pelo helper de 45s já utilizado na suíte. O driver registrado era o rig ainda convergindo no SwiftShader; não foram alteradas constantes físicas nem limiares das asserções de movimento.
- Retirar as faixas tornou a estação do hero mais visível no primeiro fold. O teste de carregamento adiado passou a estabelecer e medir um peek real de 25%, depois mostrar a estação; conserva o limiar de 55% e o atraso reais do produto.
- O teste novo de alinhamento em 2880px podia medir o card durante uma troca automática de projeto. Agora o foco real no estágio suspende o autoplay e a asserção aguarda a transição finita. O contador e sua rotação de sete segundos não foram modificados.

Na suíte geral, seletores antigos de status passaram a ser limitados ao carrossel, pois o notebook também tem avisos acessíveis; a animação da timeline passou a ser medida com seu painel efetivamente no viewport. O teste unitário que cria repositório/processos Git recebeu timeout específico de 15s após exceder 5s no Windows; suas asserções de fontes locais/publicadas permanecem intactas.

Depois da rodada verde de 77 cenários, a conferência adicional reproduziu um limite diferente em **1024 e 1037px**: a largura útil do host era 1010/1023px, e a proteção de leitura ocultava o notebook apesar de haver duas colunas CSS. A decisão passa a usar `innerWidth`; a largura útil continua governando o fitting físico. Um caso extra com WebGL verifica as duas janelas. A árvore recompilada repete todos os 21 casos de Projetos, incluindo essa regressão. Os manifestos distinguem a rodada completa do ajuste pontual posterior.

## Arquivos e reprodução

Os arquivos de produto desta entrega se concentram nestes pontos:

| Área | Arquivos |
|---|---|
| Página e compatibilidade | `src/app/[locale]/page.tsx`, `src/app/[locale]/workstation-lab/page.tsx`, `src/app/[locale]/layout.tsx`, `src/components/layout/LandingContent.tsx` |
| Navegação e apresentação inicial | `src/components/ui/PageLink.client.tsx`, `src/theme/theme-script.ts`, `src/styles/workstation.css` |
| Encaixe e leitura | `orchestrator/trajectory.ts`, `orchestrator/position.ts`, novo `orchestrator/content-clearance.ts`, sob `src/features/workstation/` |
| Acesso editorial | `sites.ts`, `config.ts`, `orchestrator/WorkstationOrchestrator.client.tsx`, `screen/WorkbenchScreen.client.tsx`, `terminal/commands.ts`, `terminal/session.ts`, sob `src/features/workstation/` |
| Política e fonte real | `next.config.ts`, `scripts/generate-workstation-code.mjs` |
| Regressões/evidências | `tests/e2e/main-site.spec.ts`, `tests/workstation/project-layout.spec.ts`, `tests/unit/workstation-content-clearance.test.ts`, `tests/unit/workstation-public-access.test.ts`, testes existentes adaptados, `tests/legacy/`, `scripts/lib/workstation-p02.mjs`, `scripts/qa-workstation-main-site.mjs`, `playwright.workstation.config.ts` |
| Documentação | `README.md`, `docs/HANDOFF.md`, ADR-022, este relatório e sua galeria/manifesto |

### Comandos

```powershell
$env:PORTFOLIO_CONTENT_PREVIEW='1'
$env:EXPERIMENTAL_WORKSTATION='1'
npm run verify
$env:PLAYWRIGHT_JSON_OUTPUT_FILE='docs/report/Workstation/MainSite/general-e2e.json'
npx playwright test --reporter=list,json
$env:QA_MANAGE_SERVER='1'
$env:QA_LIVE_EMBEDS='1'
$env:QA_WORKSTATION_TEST_REPORT='docs/report/Workstation/MainSite/workstation-e2e.json'
$env:QA_WORKSTATION_ARROWS_OUTPUT='docs/report/Workstation/MainSite/arrow-cluster'
npm run test:workstation
```

Com um servidor otimizado de preview isolado em 3300:

```powershell
$env:QA_ORIGIN='http://127.0.0.1:3300'
node scripts/qa-workstation-main-site.mjs
```

O script captura sequencialmente PT/EN/ES, Dark/Light, 1440×900 e 390×844, mais PT em 2880×1800; recusa índice de Código desatualizado e registra geometria, erros e hashes das 38 fontes. Não executar suítes físicas/capturas em paralelo no SwiftShader.

## Limitações

Os limites editoriais e de performance registrados na [P03](../P03/REPORT.md) continuam abertos. Esta continuação não mede novamente Lighthouse, INP de campo ou performance em hardware físico e não atribui resultados ao CI remoto. Validação estética final pertence ao proprietário. O foco 2D acessível e os fallbacks de baixo desempenho permanecem disponíveis.
