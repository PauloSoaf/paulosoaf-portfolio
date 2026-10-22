# Projetos: navegação e carrossel na tela do notebook

22/10/2026 · Codex · branch `fix/workstation-project-navigation-sync`.

## Fronteira e autoria

Esta continuação começa na árvore limpa do commit **`ca69c5d7734429de04b8246d4d9eb0ae0e1b2372`**, depois da unificação documentada em [MainSite](../MainSite/REPORT.md). O pedido do proprietário é corrigir Projetos destacado enquanto o Hero está visível, o clique que não navega quando `#work` já está na URL e a reprodução automática do carrossel dentro do notebook.

Claude permanece autor da P02 no snapshot `17ff916637674df95be03ed58ee44fd22e64981b`, incluindo modelo/material/atlas, teclado, tampa, solver, Canvas e tela DOM projetada, aplicações e controles originais. Codex anterior responde pelas continuações P02.1/P02.2/P03 e pela página principal até `ca69c5d`. **Codex nesta etapa** implementa o acompanhamento da seção visível, o tratamento de fragmentos repetidos, a ponte de reprodução e a aplicação Projetos no notebook, suas regressões e estas evidências. O proprietário mantém autoria do conteúdo e o aceite editorial/visual.

## Causa reproduzida

Na base, em 1440×900, `/pt` começa com `scrollY=0` e Projetos em `y=901`. O primeiro clique leva a `scrollY=813`, Projetos em `y=88`, URL `/pt#work`. Depois de voltar ao Hero pelo scroll, mantendo o fragmento, o segundo clique permanece em `scrollY=0`. Uma abertura em `/pt#work` seguida de retorno ao Hero reproduz o mesmo problema já no primeiro clique. O destaque vinha de CSS `:target`, independente da posição real.

## Implementação

- Âncoras da página atual usam o comportamento nativo do navegador, inclusive para fragmentos repetidos, conservando histórico, offsets do header e modificadores de clique. Links para outras páginas continuam com Next Link; o HTML sem JavaScript mantém suas âncoras.
- Uma assinatura compartilhada e passiva mede as seções pelo scroll, resize e mudanças de layout. O Hero não recebe Projetos como seção padrão. `aria-current="location"` acompanha a seção presente; a URL continua servindo como destino e histórico.
- A aplicação Projetos abre automaticamente ao entrar na seção com o Desktop aberto. Um clique explícito em Projetos escolhe a galeria mesmo após outro aplicativo. Scroll passivo conserva Notas, Terminal, Código e sites abertos manualmente. A galeria automática volta ao Desktop ao sair; uma galeria aberta manualmente permanece disponível.
- A tela projetada usa o mesmo catálogo filtrado e ordenado, seleção, intenção de reprodução e relógio de **7 segundos** do carrossel original. Não existe um segundo timer. Seleção na página atualiza o notebook; anterior/próximo/pausa no notebook comandam o carrossel da página.
- Quando apenas a estação mobile está visível, sua galeria mantém o relógio ativo. A abertura manual pelo Desktop também reproduz enquanto a página permanece no Hero. Hover/foco na galeria suspendem a rotação. Aba oculta, pausa explícita e movimento reduzido conservam suas restrições. As trocas têm entrada de 480ms; reduced motion remove a animação e a reprodução automática.
- Nenhum iframe externo é carregado por uma troca automática. A abertura dos dois sites continua uma ação explícita, sujeita à política editorial existente. Arte conceitual continua identificada; rascunhos não são aprovados por esta alteração.
- O mesmo Canvas, modelo, solver, reconhecedor de giro, trajetória, tampa e proteção de leitura mobile são preservados. A tela 2D recebe os mesmos controles e traduções.

## Validação

| Verificação | Resultado |
| --- | --- |
| `npm run verify`, repetido após o último ajuste | PASS: lint sem warnings, typecheck, **216 unitários / 25 arquivos**, build preview |
| E2E geral | **82 PASS + um condicional**, zero falhas/flaky |
| Workstation completa, um worker, sites reais habilitados | **85/85 PASS**, zero skips/flaky, 20,1 minutos |
| Projetos na árvore final, após o ajuste de abertura manual | **8/8 PASS**, zero skips/flaky |
| Build público sem preview/fixture experimental | PASS |
| E2E público de rotas, navegação e proteção editorial | **14/14 PASS**, incluindo ausência da galeria/dos sites quando não há projetos aprovados |
| Hidratação lenta: 390/1440 × início / `#work` / `#about` | **6/6 PASS**: todos os deltas de altura, posição e scroll foram **zero** |
| Matriz visual | **14 combinações, 37 PNGs**, zero erros de console/runtime; projeção com erro máximo **0,006939px** |
| Axe da nova galeria | **8 varreduras, zero violações automáticas** nos critérios WCAG 2 A/AA e 2.1 AA; contraste tem verificações incompletas, abaixo |
| `npm run release:check` | Bloqueado pelos **mesmos dez requisitos editoriais** anteriores |

**Precisão da última alteração:** depois da rodada completa de 85 casos, a revisão identificou que abrir Projetos manualmente no Desktop do notebook permanecia suspenso enquanto a página estava no Hero. Foi removida essa restrição de seção da assinatura de visibilidade de `ProjectsApp.client.tsx`; a entrada automática continua controlada pelo reducer da seção. Esse é o **único arquivo de produto alterado depois dos 85 PASS**. Em seguida foram executados novo verify, os oito cenários de Projetos (incluindo o novo caso de abertura manual no Hero), capturas, Axe e os 14 casos públicos. Não se afirma uma execução única de 86 casos. O [manifesto de validação](validation.json) registra os hashes antes/depois e das 21 fontes/testes modificados; o [manifesto visual](evidence.json) verifica os 44 arquivos do índice contra a árvore capturada.

Os testes de hidratação usam 120ms de latência, 180.000 bytes/s e CPU 4× mais lenta. A suíte completa também valida cliques reais nas quatro setas, digitação, trackpad, arraste/voo/giro, tampa, perda de contexto, foco, percurso entre seções em quatro larguras, idle, sites controlados e os dois sites externos reais. Não foram forçados cliques nem alterados os limiares físicos para obter aprovação.

**Acessibilidade:** o [resultado detalhado](accessibility.json) cobre os dois temas de PT/EN/ES no foco 2D mobile e os dois temas PT na projeção desktop. Axe não conseguiu concluir contraste em dez nós por varredura 2D e treze na projeção, devido às camadas/imagens/transformações. Isso permanece para inspeção manual; zero violações automáticas não é declaração de conformidade AA integral.

### Falhas encontradas durante o desenvolvimento

A primeira rodada dos sete casos teve seis falhas: uma real de stacking da mídia sobre os controles projetados; duas suposições incorretas do teste sobre o card estar fora da viewport só por centralizar a estação; três seletores excessivamente exatos que omitiam o ícone do botão de foco. O stacking foi corrigido com clipping e camada posicionada, sem forçar cliques. Os testes passaram a estabelecer a condição de scroll que pretendiam verificar e a selecionar o nome acessível completo.

A rodada seguinte teve uma falha real intermitente no mobile Dark: a notificação atrasada de saída do card pausava o relógio quando o notebook já mantinha `data-auto=true`. A decisão imperativa de pausar agora consulta a visibilidade corrente do companheiro. O unitário reproduz esse callback atrasado; os dois temas mobile avançaram em sete segundos na rodada final. Rodadas com falhas não são contadas como validação verde. Logs/traces originais foram conservados na pasta ignorada.

### Capturas de interação

[Seleção nas duas direções, desktop](screenshots/projects-synchronized-desktop.png) · [Só notebook visível, mobile Dark](screenshots/projects-synchronized-mobile-dark.png) · [Só notebook visível, mobile Light](screenshots/projects-synchronized-mobile-light.png).

As duas capturas mobile acima enquadram o stress de saída completa do card, já na transição visual para Sobre. A trajetória P03 foi conservada; esse teste prova a continuidade do relógio e não o aceite estético de todas as transições entre seções.

### Matriz visual final

PT/EN/ES × Dark/Light × 1440×900 e 390×844, mais PT Dark/Light em 2880×1800. São 34 imagens de Hero/Projetos/estação, somadas às três capturas de interação acima. A estação mobile foi enquadrada pelo scroll nativo ao centro, conservando espaço para o início de Sobre. As imagens foram conferidas contra a composição v0.1 e o problema de navegação do proprietário; não há adoção da v0.2.

| Enquadramento | Dark | Light |
| --- | --- | --- |
| Projetos desktop PT | [1440](screenshots/pt-dark-1440-projects.png) | [1440](screenshots/pt-light-1440-projects.png) |
| Estação mobile PT | [390](screenshots/pt-dark-390-notebook.png) | [390](screenshots/pt-light-390-notebook.png) |
| Projetos desktop EN | [1440](screenshots/en-dark-1440-projects.png) | [1440](screenshots/en-light-1440-projects.png) |
| Projetos desktop ES | [1440](screenshots/es-dark-1440-projects.png) | [1440](screenshots/es-light-1440-projects.png) |
| Projetos amplo PT | [2880](screenshots/pt-dark-2880-projects.png) | [2880](screenshots/pt-light-2880-projects.png) |

## Arquivos e reprodução

- `PageLink.client.tsx`, `SectionNavigation.client.tsx`, `visible-section.ts` e `interactions.css`: navegação nativa repetida e indicador da seção visível.
- `ProjectPlaybackProvider.client.tsx`, `project-playback.ts`, `LandingContent.tsx` e `ProjectCarousel.client.tsx`: catálogo de apresentação filtrado e ponte para a seleção/relógio originais.
- `ProjectsApp.client.tsx`, `WorkbenchScreen.client.tsx`, `workstation-machine.ts`, `WorkstationOrchestrator.client.tsx`, `labels.ts` e `workstation.css`: aplicativo, abertura automática/manual, controles físicos/DOM, traduções e transição.
- Gerador do índice: 44 arquivos reais, incluindo os seis novos pontos de código; conteúdo gerado continua ignorado.
- Regressões: `project-navigation.spec.ts`, `project-sync.spec.ts`, `project-playback.test.tsx`, casos adicionais do reducer e proteção do build público em `foundation.spec.ts`.
- README, HANDOFF, ADR-023, este relatório, manifests e imagens: documentação de Codex.

Preview: definir `PORTFOLIO_CONTENT_PREVIEW=1` e `EXPERIMENTAL_WORKSTATION=1`, executar `npm run verify` e `npx playwright test`. A suíte do notebook usa `QA_MANAGE_SERVER=1`, `QA_LIVE_EMBEDS=1`, `QA_WORKSTATION_TEST_REPORT=docs/report/Workstation/ProjectSync/reproduced.json` e `QA_WORKSTATION_ARROWS_OUTPUT=docs/report/Workstation/ProjectSync/arrows`, com `npx playwright test --config playwright.workstation.config.ts`. O arquivo `project-sync.spec.ts` permite repetir só os oito cenários novos.

Capturas: com um servidor de preview disponível, usar `QA_ORIGIN`, `QA_WORKSTATION_OUTPUT=docs/qa/Workstation/ProjectSync`, `QA_WIDTHS=1440,390,2880`, `QA_LOCALES=pt,en,es` e `node scripts/qa-workstation-main-site.mjs`. O padrão desse script aponta para o relatório histórico MainSite; fornecer o destino explicitamente conserva suas evidências.

Público: construir com as duas flags em `0`. `QA_EXPECT_PUBLIC_CONTENT=1` habilita a verificação editorial de `foundation.spec.ts`; os casos de `main-site.spec.ts` e `project-navigation.spec.ts` também se aplicam. A reprodução pública não aprova conteúdo.

## Limites e publicação

Os dez bloqueios de lançamento continuam: URL HTTPS definitiva, perfil, revisão dos textos PT/EN/ES, mínimo de três projetos aprovados (atualmente zero), trajetória, especialidades, serviços, email, LinkedIn e CV. Nenhum filtro foi desligado. Lighthouse/INP, hardware físico, leitores de tela e contraste manual não foram medidos/certificados nesta continuação; os limites anteriores permanecem. O aceite estético pertence ao proprietário, inclusive para trajetórias de outras seções preservadas da P03.

Commit local nesta branch, sem push, merge ou deploy. A porta do desenvolvimento permanece **1010**; os servidores de QA 3200/3300 foram encerrados.

Relatórios brutos, logs e traces: `docs/report/Workstation/ProjectSync/`, ignorado pelo Git.
