# Workstation P03 — giro, apresentação e sites bem enquadrados

**21/10/2026 · Codex · `feat/workstation-cinematic-spin-fit` · base limpa `6dedb39cfa4ba8c8f9b96e3a0e1714ffddf4d272`.** [Autoria e fronteira com Claude](../../../HANDOFF.md) · [ADR-021](../../../adr/ADR-021-workstation-spin-reading-and-site-fit.md) · [P02.2 anterior](../P02.2/REPORT.md).

**Refinamento funcional validado. Publicação continua bloqueada por revisão editorial e metas de performance.** A execução final completa passou; capturas e manifestos são evidências técnicas, sem aprovação estética/editorial automática. Ambiente: Windows, Node 22.20, Next 16.3.8, React 19.3, Playwright 1.63, Chromium/SwiftShader. Nenhuma dependência nova.

## Resultados finais

| Verificação | Resultado |
|---|---|
| Lint e typecheck | PASS |
| Unitários completos | **198 PASS / 22 arquivos**, incluindo 17 regressões novas de física/apresentação/enquadramento |
| Build preview e build público | PASS |
| Workstation completa, um worker, `QA_LIVE_EMBEDS=1` | **57/57 PASS**, zero skip/falha/flaky; uma execução final de 20:39–20:57 UTC em 21/10 |
| E2E gerais, executados separadamente | **87 PASS + 1 skip condicional** do build público, zero falha/flaky |
| Gate público em build próprio | **1/1 PASS**: filtros editoriais, idiomas, CSP, laboratório/fixture indisponíveis |
| Hidratação lenta | **6/6 PASS**, 390/1440px × topo/`#work`/`#about`; deltas de altura, posição e scroll **zero**; sem erros |
| Matriz visual | **12/12**, PT/EN/ES × Dark/Light × 390/1440px; sem overflow/erros; erro máximo de alinhamento <0,008px |
| Evidências selecionadas | **81 PNGs e dois WebM originais**, com dimensões/hashes; quatro visitas aos sites reais nos dois dispositivos |
| Repouso | **Zero frames adicionais em 600ms**, nos dois perfis e nas 12 combinações visuais; um Canvas |
| Código verdadeiro | **37 fontes**, hashes conferidos contra os arquivos; links GitHub condicionados a publicação real |
| Gate editorial `release:check` | **BLOCKED**, dez pendências herdadas; nenhuma aprovação alterada |

O gesto nativo produziu variação angular de **11,886rad no mouse** e **7,803rad no touch** enquanto segurado, superando o antigo limite do pêndulo. Velocidades angulares na soltura: **7,229 / 7,160rad/s**. Os ensaios também verificam dissipação, nova pega, retorno e repouso. São observações da visita gravada, não uma promessa de valores fixos por gesto. Os dois websites retornaram HTTP 200, aceitaram roda/cliques nativos e conservaram o mesmo documento após tema, rotação manual e retomada da pose.

## Performance e limites de publicação

| Medida | Desktop | Mobile |
|---|---|---|
| Lighthouse 13.5 — performance | **98** | **92** |
| LCP Lighthouse | **0,668s** | **3,243s** |
| CLS Lighthouse | 0,00034 | 0 |
| TBT Lighthouse | 105ms | 119,5ms |
| Acessibilidade / boas práticas automatizadas | 100 / 100 | 100 / 100 |
| INP da visita local com interações | **448ms** | **224ms** |
| JavaScript inicial medido, gzip | **185.523B** | **185.523B** |
| Draw calls / triângulos do perfil | 18 / 21.146 | 18 / 21.146 |

São amostras de laboratório em SwiftShader, sem os outros roteiros de navegador concorrentes. INP local não equivale ao p75 de usuários reais. O LCP mobile ainda supera a meta de **2,5s**; INP também requer acompanhamento/otimização. JavaScript inicial excede **180.000B em 5.523B**. Comparado aos 184.056B da P02.2, esta P03 acrescenta **1.467B (~0,8%)**; o custo de cena/código continua adiado. O guia é renderizado no servidor e não acrescenta um controlador de cliente.

Lighthouse do laboratório registra SEO **60**, com falha em `is-crawlable`: a rota é deliberadamente `noindex`. SITE_URL e editorial também seguem pendentes no gate de publicação. Esse ensaio não certifica o SEO da landing pública. O build público foi validado pelo seu gate, sem expor o laboratório. As medições completas estão em [metrics.json](metrics.json); hardware físico, acessibilidade com pessoas e aceite estético continuam pendentes.

## Comportamento entregue

Um movimento circular consistente sobre a base imprime giro ao corpo do notebook, ultrapassando o antigo limite de inclinação do pêndulo. A soltura mantém momento angular; o atrito existente dissipa energia. Nova pega interrompe o giro mantendo a pose equivalente. O arraste linear continua sendo arraste; cantos isolados e jitter não são tratados como círculos. Amostras agrupadas e quadros espaçados possuem regressão própria. Movimento reduzido desativa o giro físico.

Abrir NutriOpus/Déborah pelo carrossel ou desktop abre a tampa e aproxima o notebook de uma pose de leitura, com display frontal e tamanho limitado à viewport. Código usa uma pose de trabalho com pequena perspectiva. Fechar retorna ao caminho contextual. A transição é finita e não prende a rolagem. Gestos manuais assumem prioridade; “Apresentar conteúdo” retoma a apresentação explicitamente. O documento externo continua montado durante pose, tema e rotação manual.

NutriOpus agora possui viewport lógico de **1024px**; Déborah, **1200px**. O navegador enquadra cada um uniformemente no display, com altura proporcional. O primeiro preserva toda a navbar; o segundo recupera o hero com retrato em duas colunas. Não há imagem substituta, crop, proxy de entrada ou acesso cross-origin de produção. Os controles do portfólio ficam no canto **inferior direito**, para deixar a navbar livre, mantendo tamanho de toque e saída/ajuda. O foco 2D explícito continua nativo e pode remontar o iframe, limitação herdada.

“Como explorar o notebook” abre dicas opcionais PT/EN/ES, sem apresentação automática. Popover nativo, Escape, clique externo e fechamento explícito funcionam sem JavaScript. Perfil, projetos e contato possuem atalhos às seções existentes; currículo só vira link depois de aprovação e URL válida. O estado atual informa “Currículo em revisão”. Não foram inventados dados comerciais ou implementados jogos/dano/P04.

O modelo, os materiais, a tipografia do teclado e a arquitetura do Claude foram reaproveitados. Canvas único, renderização sob demanda, HMR reset, teclado, trackpad, áudio, Terminal, Código e inspeção permanecem. O app Código inclui os quatro arquivos reais adicionais: **37 fontes** com hashes. Nenhuma dependência nova.

## Evidência visual e reprodução

[Galeria HTML](review.html) · [Manifesto de imagens/vídeos](evidence-manifest.json) · [Captura online e fontes](cinematic-evidence.json) · [Matriz de idiomas/temas](evidence.json) · [Métricas](metrics.json) · [Hidratação](hydration.json).

Os arquivos `before-*` mostram a base anterior à implementação. Em 800px, a borda direita de “Criar conta” no NutriOpus chegava a **854,27px**, fora do display. A [auditoria dos tamanhos](site-fit-audit.json) compara 800/1024/1200/1280. O [diagnóstico inicial](baseline.json) registrou a limitação de ±1,2rad do movimento circular.

Os WebM são gravações originais desktop/mouse e mobile/touch em tempo nativo, com duração, dimensões e SHA-256. Os dois sites são remotos reais, com respostas HTTP registradas, roda/cliques nativos e prova de preservação do documento. Inspeção do DOM externo ocorre exclusivamente na automação do navegador; a aplicação não lê esse DOM. Fixtures sintéticas de regressão estão identificadas no teste e não servem como prova dos sites online. SwiftShader não substitui teste em GPU física.

```powershell
$env:PORTFOLIO_CONTENT_PREVIEW='1'
$env:EXPERIMENTAL_WORKSTATION='1'
npm run verify
$env:QA_ORIGIN='http://127.0.0.1:3300'
$env:QA_MANAGE_SERVER='1'
$env:QA_LIVE_EMBEDS='1'
$env:QA_WORKSTATION_TEST_REPORT='docs/report/Workstation/P03/workstation-e2e.json'
$env:QA_WORKSTATION_ARROWS_OUTPUT='docs/report/Workstation/P03/arrow-regression'
npm run test:workstation
$env:PLAYWRIGHT_JSON_OUTPUT_FILE='docs/report/Workstation/P03/general-e2e.json'
npm run test:e2e -- --reporter=list,json
```

Com prévia otimizada já ativa em `QA_ORIGIN`, fora da execução de testes:

```powershell
$env:QA_MANAGE_SERVER='0'
node scripts/qa-workstation-p03.mjs
$env:QA_WORKSTATION_OUTPUT='docs/qa/Workstation/P03'
$env:QA_WORKSTATION_RAW='docs/report/Workstation/P03/recordings'
$env:QA_WORKSTATION_RECORD='0'
node scripts/qa-workstation-p02.mjs
$env:QA_WORKSTATION_PROFILE_OUTPUT='docs/report/Workstation/P03/performance'
npm run profile:workstation
node scripts/summarize-workstation-p03.mjs
```

O último comando também exige os relatórios E2E geral, gate público e Lighthouse nos caminhos P03. As pastas operacionais, logs, traces e gravações brutas ficam em **`docs/report/Workstation/P03`**, ignorado pelo Git. Os arquivos versionados são os resultados selecionados para revisão.

## Histórico dos ensaios e limites

Os primeiros ensaios corrigiram um tipo opcional em `DOMStringMap`. A simulação unitária passou; o gesto nativo revelou que o filtro descartava arcos agrupados e o orçamento de 50ms desacelerava o giro em quadros espaçados. O ramo circular foi ajustado e ganhou teste comparando 60Hz/8Hz. Limites do solver comum não foram relaxados.

A automação também precisou de duas correções: os movimentos nativos são enviados em cadência de relógio real, sem aguardar cada confirmação DevTools, e a soltura é enviada antes da leitura de diagnóstico. Antes disso, a própria automação criava uma pausa que corretamente retirava energia do gesto. No menu sticky mobile, `locator.click` provocava auto-scroll ao topo; cliques nas coordenadas visíveis mantêm o scroll, agora exigido por asserção. Nenhum teste altera o relógio, grava propriedades do rig ou reduz os critérios de giro. Ensaios exploratórios e execuções interrompidas permanecem separados da execução final.

A revisão visual identificou ainda sobreposição da navbar pelos controles de saída/ajuda. O ajuste final os colocou na borda inferior. Regressões verificam que o topo é atingido no próprio iframe, e as capturas online são regravadas após esse ajuste.

Uma tentativa com dois workers, capturas online e E2E gerais simultâneos saturou o renderizador por software: o giro observado caiu abaixo do mínimo exigido. Essa execução foi interrompida e preservada como diagnóstico de contenção, sem baixar a asserção. Para a validação final, a configuração original de um worker é mantida e os roteiros de navegador são executados separadamente. As métricas de desempenho também são medidas fora dessas execuções.

A suíte anterior de setas usa a pasta P02.2 por padrão. As capturas regeneradas na execução foram guardadas em `docs/report/Workstation/P03/arrow-regression`, e os quatro PNGs gerais alterados foram restaurados à base, preservando a auditoria anterior. Os recortes do teclado continuaram idênticos. O comando acima usa a variável de saída já existente para isolar as próximas execuções; nenhuma asserção ou posição de tecla foi modificada.

Aceite estético pelo proprietário, usabilidade/acessibilidade com pessoas e validação em GPU/dispositivos físicos continuam pendentes. A possibilidade de incorporação depende também dos domínios externos, que podem alterar cabeçalhos/conteúdo. A leitura 3D em celular é uma miniatura; foco 2D e abertura externa continuam disponíveis. Os botões touch persistentes ocupam parte do canto inferior do conteúdo, preservando o topo.

O gate editorial permanece bloqueado por **dez pendências herdadas**: SITE_URL, perfil, textos PT/EN/ES, mínimo de três projetos aprovados, trajetória, especialidades, serviços, e-mail, LinkedIn e CV. Nenhum status foi alterado para contornar a validação. Resultados locais não são atribuídos ao CI remoto. Esta etapa recebe commit **local**; sem push, merge ou deploy.

## Arquivos e autoria

Todos os arquivos novos/alterados desta P03 pertencem a Codex, a partir da base indicada. O snapshot Claude `17ff916` e as correções anteriores estão descritos no HANDOFF.

| Área | Arquivos principais |
|---|---|
| Gesto e física | `physics/spin-intent.ts`, `physics/body.ts`, `orchestrator/position.ts`, `scene/WorkstationScene.client.tsx` |
| Poses e integração | `orchestrator/presentation.ts`, `orchestrator/WorkstationOrchestrator.client.tsx`, `labels.ts` |
| Sites | `sites.ts`, `screen/site-framing.ts`, `screen/WorkbenchScreen.client.tsx`, `styles/workstation.css` |
| Descoberta | `WorkstationDiscovery.tsx`, `components/layout/LandingContent.tsx`, metadados da página do laboratório |
| Código real | `scripts/generate-workstation-code.mjs` |
| Regressões | `tests/unit/workstation-spin.test.ts`, `tests/unit/workstation-presentation.test.ts`, `tests/workstation/cinematic.spec.ts`, ajuste de dimensões em `immersive-impact.spec.ts` |
| QA/documentação | scripts `qa-workstation-p03.mjs`, `lib/workstation-p03.mjs`, `summarize-workstation-p03.mjs`, ADR-021, README, HANDOFF e esta pasta |
