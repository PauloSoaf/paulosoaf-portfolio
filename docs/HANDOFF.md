# Autoria e ponto de retomada — Claude → Codex

Data da continuação: 10/10/2026. Escopo: fundação S00 e sua validação. Este documento registra a divisão do trabalho; não representa aprovação editorial nem autorização de deploy.

## Marco exato da retomada

**Última ação do Claude no histórico fornecido:** escreveu `src/app/global-not-found.tsx` (78 linhas), após restaurar `dynamicParams = false` em `src/app/[locale]/layout.tsx` e remover sua tentativa de catch-all `[...rest]`/404 de segmento. O histórico termina às **10:38 AM**, conforme horário mostrado no próprio anexo, com a mensagem de limite semanal. Codex não recriou essas alterações: elas já estavam no diretório quando assumiu.

**Primeira ação do Codex:** leu o histórico anexado, inspecionou o diretório e o Git e retomou a verificação da S00. O repositório estava na branch `main`, sem commits; todos os arquivos de aplicação e especificação estavam untracked. Por isso, não existe commit anterior que permita separar os autores automaticamente por `git blame`.

**Estado constatado antes de qualquer alteração do Codex:**

- Base Next.js 16.3.8 / React 19.3.0 / TypeScript 5.9.3 / Tailwind 4.3.3 já implementada.
- Landing, header/footer, menu mobile, SVGs, conteúdo editorial, PT/EN/ES e Dark/Light já existentes.
- `src/app/global-not-found.tsx` e layout por idioma já continham a solução final deixada pelo Claude.
- `npm run lint` e `npm run typecheck` passaram.
- `npm test` falhou com `No test files found`; configurações de Vitest existiam, mas as suítes ainda não.
- Não havia README de desenvolvimento na raiz, workflow de CI nem configurações/suítes Playwright.

**Primeira alteração de código do Codex:** criação de `tests/unit/setup.ts`, `tests/unit/i18n.test.ts`, `tests/unit/content.test.ts`, `tests/unit/controls.test.tsx` e `tests/release/editorial.test.ts`, junto da correção do validador de datas em `src/features/content/validation.ts`. Esse é o marco entre inventário/diagnóstico e implementação da continuação.

## O que veio do Claude

A atribuição abaixo é baseada no histórico entregue pelo usuário e nos arquivos presentes no inventário inicial. O pacote de especificações/POCs é material fornecido pelo usuário, **não criação atribuída ao Claude ou ao Codex**. Arquivos de framework/dependências são gerados ou de terceiros.

| Área / arquivos existentes | Trabalho herdado |
|---|---|
| Configuração raiz: `package.json`, lockfile, `next.config.ts`, `tsconfig.json`, ESLint/PostCSS/Vitest, `.npmrc`, `.nvmrc`, `.gitignore` | Inicialização e configuração da aplicação e ferramentas. |
| `src/app/` | Layout raiz por idioma, landing, fontes, estilos, ícone e 404 global. |
| `src/components/layout/`, `src/components/ui/` | Logo, header/footer, disclosure mobile, links, ícones, troca de idioma e tema. |
| `src/components/hero/`, `src/components/projects/`, `src/components/sections/`, `src/components/editorial/` | Hero com SVG; grid de projetos; About linear; especialidades, serviços e contato; avisos de prévia. |
| `src/features/` | Modelos e candidatos editoriais, status/filtro de aprovação, validação de conteúdo e lógica do gate de publicação. |
| `src/i18n/`, `src/theme/`, `src/lib/`, `src/proxy.ts`, `src/styles/tokens.css` | Dicionários, rotas/metadados, negociação de idioma, cookies/bootstrap/store de tema, tokens e proxy. |
| `public/art/`, `scripts/derive-light-orb.mjs` | Integração das artes locais do pacote e variante Light. |
| `AGENTS.md`, `CLAUDE.md` | Instruções já existentes; bloco Next gerado pelo framework preservado. |

Os candidatos de conteúdo e as datas de verificação de repositórios foram herdados. Codex não os promoveu a `approved` e não afirma ter refeito a checagem remota de autoria/stack/links.

## O que o Codex modificou no trabalho herdado

| Arquivo | Alteração da continuação |
|---|---|
| `src/features/content/validation.ts` | Rejeição de datas inexistentes normalizadas pelo JavaScript, como `2026-02-30`. |
| `src/components/ui/LanguageSwitch.client.tsx` | Substituição da transição cliente por link nativo de documento, preservando cookie e âncora. Corrige perda dos atributos de tema/JS na troca de idioma. |
| `src/components/sections/ContactSection.tsx` | Grid mobile de uma coluna, wrap do cartão e quebra de texto; corrige overflow em espanhol a 360px. |
| `src/components/hero/HeroEditorial.tsx` | Quebra segura de palavras no título. O conteúdo/arte e estrutura base vieram do Claude. |
| `src/components/projects/ProjectCard.tsx` | Wrap nas linhas de categoria/contador e título/badge para fonte ampliada. |
| `src/components/sections/WorkSection.tsx`, `AboutSection.tsx`, `ExpertiseSection.tsx`, `ServicesSection.tsx` | Coluna mobile explícita; wrap de cabeçalhos quando necessário, mantendo conteúdo em zoom. |
| `src/components/ui/ButtonLink.tsx` | Limite de largura do botão ao contêiner. |
| `src/app/globals.css` | `overflow-wrap: anywhere` no corpo para reflow de texto ampliado. |
| `vitest.config.mts` | Limite de dois workers. |
| `package.json`, `package-lock.json` | playwright-core 1.63.0 fixado para alinhar os tipos com Playwright; `dev` alterado para porta 1010 após solicitação do usuário. |
| `src/lib/site-config.ts` | Origem local de fallback alterada de porta 3000 para 1010. |
| `.gitignore` | Nesta etapa de commit/push, adicionado `/docs/report/` para excluir relatórios locais. |

`src/app/global-not-found.tsx`, `src/app/[locale]/layout.tsx` e `next.config.ts` **não foram corrigidos pelo Codex nesta continuação**: a solução do Claude foi preservada e testada. As limitações observadas estão no ADR-005.

## O que o Codex criou

- `tests/unit/{setup.ts,i18n.test.ts,content.test.ts,controls.test.tsx,tokens.test.ts}`: suítes de conteúdo, idioma, tokens/contraste, preferências e teclado.
- `tests/release/editorial.test.ts`: torna executável a lógica de bloqueio editorial herdada; separado de `npm test`.
- `tests/e2e/foundation.spec.ts`, `playwright.config.ts`: testes Chromium/axe, JS desligado, 404, preferência de idioma/tema, mídia abortada, breakpoints, fonte 200% e filtro público.
- `tests/visual/foundation.spec.ts`, `playwright.visual.config.ts`: captura de seis combinações idioma/tema em desktop/mobile.
- `.github/workflows/ci.yml`: lint/typecheck/unit/build e E2E para prévia e produção sem drafts. Configuração preparada, sem execução remota prévia ao push.
- `scripts/inspect-layout.mjs`: diagnóstico de overflow por viewport, com locale e opção `zoom`.
- `README.md`: operação local, testes e gate de publicação.
- `docs/adr/ADR-005-locales-and-not-found.md`, `ADR-006-theme-and-editorial-content.md`, `ADR-008-security-headers.md`: registro de decisões herdadas e da continuação, com origem explicitada. A CSP descrita no ADR-008 foi implementada pelo Claude.
- `docs/qa/S00/REPORT.md` e 24 PNGs: relatório de requisitos/evidências, capturas de viewport/página inteira em 12 estados.
- Este `docs/HANDOFF.md`: atribuição versionada solicitada pelo usuário.
- `docs/report/CONTINUACAO-CODEX.md`: registro operacional local, **ignorado pelo Git**. A pasta inteira fica fora de commit/push.

## Verificação e limites

Codex executou lint/typecheck/build com sucesso, 25 testes unitários, 15 E2E de prévia, teste separado do filtro público, 12 cenários de captura e fonte a 200% nas seis combinações. Comparou as referências locais à implementação e registrou divergências de S00. O relatório técnico está em `docs/qa/S00/REPORT.md`.

`release:check` permanece bloqueado por aprovações, contatos/CV e origem HTTPS ausentes; isso não impede commit/push, mas impede considerar o site pronto para publicação. A auditoria de produção não encontrou vulnerabilidades conhecidas; há cinco alertas altos na cadeia de ferramentas ESLint, documentados. Não houve revisão manual com leitor de tela, teste em dispositivo real, medição de Web Vitals em campo ou aceite visual do proprietário.

## Como interpretar o primeiro commit

O primeiro commit reúne **a base herdada do Claude, o pacote fornecido pelo usuário e as alterações do Codex**, pois não havia histórico prévio. Não foi fabricado um commit retroativo do Claude nem atribuição linha a linha. A separação acima identifica caminhos e operações comprovados pela conversa/inventário; não é um diff recuperado de um snapshot Git anterior.

O usuário autorizou explicitamente commit e push após a entrega técnica, mantendo `docs/report` fora do Git. Deploy não foi solicitado. Servidor local solicitado: `http://localhost:1010/pt`.

## Retomada S01 — marco exato e autoria

A solicitação seguinte retomou S01 a partir de `main`, HEAD `ea3cf243094ba524335c6e367467c8bbf6107574` (`ea3cf24`), com árvore limpa. Codex criou `feat/s01-hero-procedural` antes da implementação. Este é o marco Git preciso: o diff desta branch contra `ea3cf24` corresponde à S01. O trabalho Claude/Codex da S00 continua separado nas tabelas acima, sem atribuição retroativa adicional.

Antes das modificações, Codex leu README/AGENTS/CLAUDE/HANDOFF, roadmap, requisitos, matriz de aceite, sprint e POCs do pacote v0.1, guias locais desta versão Next, código reutilizável, mockups desktop/mobile e a POC original. A POC-001 também foi aberta no navegador; não contém canvas WebGL. Não foi usada referência v0.2.

**Primeira alteração S01:** dependências exatas Three.js/R3F e tipos no manifesto/lockfile. **Primeiro módulo de implementação S01:** `src/graphics/hero/quality.ts`, com perfis, clamp do ponteiro e funções determinísticas. O novo WebGL e os testes desta sprint são trabalho do Codex; o SVG, shell, identidade e textos continuam herdados, com as correções S00 já documentadas.

| Caminhos S01 | O que Codex fez |
|---|---|
| `src/graphics/hero/{quality.ts,shaders.ts,HeroScene.client.tsx}` | Geometria procedural, shader topográfico, órbitas/estrelas, parallax, câmera, perfis, pausa, descarte e diagnóstico CPU/GPU. |
| `src/components/hero/HeroArtBoundary.client.tsx` | Lazy import, SVG no HTML, gate de viewport/aba/device, controles multilíngues e recuperação de falhas GL/chunk/shader. |
| `src/components/hero/HeroVitals.client.tsx` | Web Vitals locais sem transmissão de analytics. |
| `src/components/hero/HeroEditorial.tsx` | Integração da ilha preservando Server Component/copy/links; clipping seguro e wash tablet. |
| `src/i18n/dictionaries/{pt,en,es}.ts` | Somente labels dos novos controles; nenhuma aprovação de conteúdo editorial. |
| `package.json`, `package-lock.json` | Three 0.186.1, R3F 9.8.1, tipos Three 0.186.0 e comando `qa:hero`. Porta 1010 preservada. |
| `tests/unit/hero-quality.test.ts`, `tests/e2e/hero.spec.ts` | Matemática/perfis e interações reais, pixels, pausa, temas, touch, falhas, descarte, teclado e acessibilidade. |
| `tests/visual/hero.spec.ts`, `playwright.hero-visual.config.ts`, `playwright.visual.config.ts` | Capturas próprias S01 nos seis viewports, PT/EN/ES e Dark/Light; S00 não é sobrescrita. |
| `scripts/profile-hero.mjs`, `scripts/summarize-hero-qa.mjs` | Medição de JS gzip, custo CPU, capacidade de query GPU, cadência, idle e vitals; resumo versionável sem logs brutos. |
| `docs/adr/ADR-009-progressive-hero-webgl.md`, `docs/qa/S01/`, `README.md`, este HANDOFF | Decisões, números/evidências, limites, aceite e operação. |

A comparação de performance usou um worktree temporário detached de `ea3cf24`, sem alterar `main`. Apenas o root de resolução Turbopack desse worktree foi ampliado para aceitar a junction das dependências; código da aplicação S00 permaneceu igual. Relatórios brutos, traces auxiliares e captura da POC ficam em `docs/report/S01/`, ignorados pelo Git. O resumo QA e as 36 evidências selecionadas ficam em `docs/qa/S01/`.

A autorização de push anterior aplicou-se à entrega S00. **A instrução atual da S01 exige autorização nova para push/deploy.** Não houve push ou deploy S01. S02–S05 permanecem no roadmap original; S06 exige autorização específica e Obsidian Dev Mode permanece no backlog. A revisão editorial e a aferição em aparelhos físicos continuam pendentes, conforme QA.

## Continuação S02 — marco e autoria

Em 10/10/2026, Codex recebeu a auditoria/prompt S02 anexada pelo proprietário. **Primeira ação:** leu esse anexo e conferiu status, branch e HEAD. A árvore estava limpa em `feat/s01-hero-procedural`, commit `758557ecc342875ce098f6912cc26d14bf3fc284`. `git ls-remote` confirmou esse mesmo commit remoto e `main` em `ea3cf243094ba524335c6e367467c8bbf6107574`. A disponibilidade da branch S01 no GitHub é um fato desta nova consulta; este registro não atribui a Codex um push realizado fora da continuação anterior.

Após ler instruções/specs, código herdado, documentação instalada do Next, mockups e POC-002, **primeira operação de versão:** criou `feat/s02-cinematic-projects` a partir da S01. **Primeira alteração de código S02:** estendeu `src/features/projects/project-types.ts`/`project-validation.ts` e criou `project-presentation.ts`. A base da S01 foi preservada; nenhum arquivo de `src/graphics/hero/` mudou.

| Origem | Trabalho e fronteira nesta sprint |
|---|---|
| Claude, herdado da S00 | Shell, tokens/tipografia, conteúdo original, filtros editoriais/release gate, `WorkSection`, `ProjectCard`, fallback inicial, dicionários e cinco candidatos/repositórios. Atribuição detalhada nas seções anteriores. |
| Codex, continuação anterior S00/S01 | Validação/regressões e Hero procedural em `758557e`, incluindo QA, ADR-009 e 36 capturas históricas. |
| Proprietário / pacote de referência | Auditoria/prompt S02, contexto de NutriOpus/Déborah Lima, ordem desejada, specs/POC/mockups v0.1. Não são criações editoriais atribuídas ao Codex. |
| Codex, implementação S02 | Ilha/controlador de carrossel, CSS de profundidade, Pointer Events/teclado/autoplay/ARIA, contexto de mídia, recuperação de imagens e artes abstratas distintas. Estendeu cards/seção/modelos/validador e labels PT/EN/ES; cadastrou os dois novos candidatos exclusivamente a partir do prompt, sem aprová-los ou confirmar stack. Corrigiu somente o fallback mono em `src/app/fonts.ts` após identificar CLS por troca de fonte; fonte final/tokens/cena do Hero foram preservados. |
| Codex, QA/documentação S02 | Testes unitários/E2E/visuais, 52 PNGs próprios, perfil/Lighthouse local e resumo de métricas, ADR-010, relatório/pendências, README e este marco. `qa:hero` ganhou apenas uma opção de diretório de saída para preservar S01; implementação visual do Hero permaneceu intacta. |

Novos candidatos começam `draft`, sem imagem real/GitHub/demo, com verificação de stack pendente. Os links/descrições originais continuam herdados; não foi feita nova auditoria remota de stack/licenças. Cases completos, timeline, Explore Mode e Dev Mode não foram implementados. Resultados e limitações em `docs/qa/S02/REPORT.md`; pendências em `docs/qa/S02/EDITORIAL-PENDING.md`. Logs brutos e a nova regressão do Hero ficam em `docs/report/S02/`, fora do Git. Nenhum merge, force-push, push ou deploy foi realizado nesta continuação.

## Continuação S03 ampliada — marco exato e autoria

Codex leu os dois anexos de auditoria/extensão S03 e verificou árvore limpa em `feat/s02-cinematic-projects`, HEAD `66c8ff0fae0b275b1b2d86bfcd70b29a8da80852`. `git ls-remote` confirmou a S02 remota nesse commit e `main` ainda em `ea3cf24`. A API pública do GitHub confirmou [CI S02 concluído com sucesso](https://github.com/PauloSoaf/paulosoaf-portfolio/actions/runs/38098111251). A existência remota é uma consulta desta retomada, sem atribuir a Codex um push realizado fora da entrega anterior.

**Primeira operação de versão:** criou `feat/s03-interactive-timeline-motion` da S02. Após leitura das instruções, docs instalados Next, specs/POC/mockup e código, **primeira alteração de implementação:** criou `src/features/motion/motion-engine.ts`, `MotionRuntime.client.tsx`, `JourneyTimeline.client.tsx` e estilos de movimento/timeline. O diff contra `66c8ff0` é a fronteira precisa desta continuação.

| Origem | Trabalho S03 e fronteira |
|---|---|
| Claude, fundação herdada | Shell, tokens/tipografia, seções estáticas, capítulos e grupos temáticos, textos/editorial; atribuição S00 detalhada acima. |
| Codex, continuação S00–S02 | Testes/fundação auditada, Hero real e carrossel em `66c8ff0`, com evidências/ADRs anteriores preservados. |
| Proprietário | Auditoria, autorização explícita da extensão Motion System na S03 e referência v0.1. Aprovação de dados/estética continua reservada ao proprietário. |
| Codex, S03 | Timeline progressiva/tabs/teclado/progresso/acompanhamento opcional/mobile, engine WAAPI/observadores/cleanup/stagger/parallax de ornamentos, integração nos componentes servidor e labels PT/EN/ES. Nenhum arquivo de `src/graphics/hero/` mudou; HeroEditorial só marca o grid decorativo. `ProjectCarousel`/controlador/CSS S02 não foram modificados. |
| Codex, QA/docs S03 | Testes de lifecycle/timeline/interações, capturas/vídeos reais, perfis/Lighthouse, ADR-011, relatório, pendências e README. Testes de relógio da S02 isolam hidratação antes de instalar fake clock; teste adicional usa sete segundos nativos. Suítes visuais S00/S02 ganham saída opcional para não sobrescrever evidências. Gate E2E público passa a conferir explicitamente a ausência de timeline/artigos de trajetória draft. ESLint/TS ignoram cache/logs operacionais em `docs/report`. |

Os dados `journey-data.ts`, Expertise/Services, status e filtros editoriais foram preservados integralmente. A aprovação T03-01 continua pendente; não foram inventadas datas/cargos/empresas. Logs/cache/regressões anteriores ficam em `docs/report/S03/`, ignorados; QA selecionada fica em `docs/qa/S03/`. Não houve merge, push ou deploy nesta continuação. S04/S05 seguem no roadmap; S06/Dev Mode não iniciados.

## Continuação S03.5 — marco exato e autoria

Em 11/10/2026, Codex retomou a auditoria/prompt S03.5 fornecida pelo proprietário. Primeira ação: leitura do anexo e verificação da árvore limpa, branch `feat/s03-interactive-timeline-motion` e HEAD `0ad2532814677035435367a7aa5f7ed7c62445a0`. `git ls-remote` confirmou esse commit remoto e `main` ainda em `ea3cf24`; API GitHub confirmou CI `38109153478` completed/success nesse HEAD. A disponibilidade remota não é atribuída a um push desta sessão.

Primeira operação de versão: `git switch -c feat/s03-5-interaction-polish`, a partir da S03. Após as leituras obrigatórias, mockups v0.1 e reprodução do deslocamento, primeira escrita operacional: `docs/report/S03.5/baseline.cjs`, ignorado. Primeira alteração de aplicação: `src/theme/theme-client.ts`, substituindo supressão imediata por transição iniciada pelo usuário. Essas fronteiras permitem distinguir código herdado do trabalho desta continuação.

| Origem | Trabalho / responsabilidade |
|---|---|
| Claude, herdado da S00 | Fundação, arquitetura, tokens/composição/tipografia, shell, conteúdo inicial e gates conforme atribuição das seções anteriores. Nada foi reatribuído nesta sprint. |
| Codex, continuações S01/S02/S03 | Cena real, carrossel/controlador, catálogo candidato, timeline/Motion System e QA históricos nos commits `758557e`, `66c8ff0`, `0ad2532`. Essas implementações foram reaproveitadas. |
| Proprietário / pacote original | Auditoria S03.5, pedido de teste de JS/rede lentos/âncora e direção Obsidian Orbit v0.1. Conteúdo comercial e experiência em empresas citadas continuam dependentes de revisão, sem aprovação presumida. |
| Codex, aplicação S03.5 | Tema/ícones/superfícies, classes de microinteração e pressão touch com cleanup; refinamentos de header/cards/CTAs/controles; exploração/inércia/entrada/saída do Hero e equivalentes de teclado; geometria pré-hidratação e navegação nativa de fallback da timeline/carrossel; atualização de acompanhamento por centro/scroll e uso da última entrada de visibilidade. Reducer/autoplay/catálogo/gates preservados. |
| Codex, testes/evidências S03.5 | Regressões unitárias e E2E, teste com JS retido/rede 120 ms/CPU 4×, falha permanente de módulos, mouse/teclado/touch real, temas/reload/FOUC/repetição, capturas e vídeos reais. Saídas configuráveis de perfis/S03 para conservar evidências anteriores. |
| Codex, documentação S03.5 | `ADR-012`, `docs/qa/S03.5/REPORT.md`, métricas/evidências selecionadas, scripts de reprodução, README e este registro. Logs/relatório operacional em `docs/report/S03.5` e atualização do log de continuação ficam fora do Git. |

Somente labels de exploração foram acrescentados aos três dicionários; dados, aprovações, contatos e links reais permanecem herdados. A S03.5 não autoriza S04/S06/Dev Mode nem integração automática das branches. Commit local conforme autorização anterior; instrução atual proíbe merge/push/deploy sem nova autorização, portanto não executados. Consulte o QA para resultados e limitações finais.

## Creative Direction Recovery — fronteira exata e autoria

Em 11/10/2026, Codex recebeu a auditoria de `bd21d67` e o novo prompt Creative Direction Recovery. A primeira ação foi ler o anexo e conferir branch/HEAD/árvore limpa: `feat/s03-5-interaction-polish`, `bd21d677df571286d192618b0aba79437145dee3`, igual ao upstream. O CI remoto `38168586596` estava aprovado. A existência do commit remoto não é atribuída a um push desta sessão.

Primeira operação de versão: criação de `feat/creative-direction-recovery` diretamente desse HEAD. Antes da aplicação, foram lidas as instruções/guias Next instalados e referências v0.1; foram gravadas navegações completas desktop/mobile da S03 e S03.5. S03 foi executada num worktree detached de `0ad2532`, dentro do diretório operacional ignorado, com build webpack; branches históricas não foram alteradas. Mockups e material local Dr-Manaus foram examinados. Esses vídeos comparam experiência, não performance entre bundlers.

Primeira escrita operacional: `docs/report/CreativeRecovery/record-before.cjs`, ignorada. **Primeira alteração de aplicação:** criação de `src/features/creative/experience.ts` e `src/graphics/hero/RecoverySculpture.client.tsx`, seguida da integração em `HeroScene.client.tsx`, `HeroArtBoundary.client.tsx` e bootstrap do tema. O diff contra `bd21d677df571286d192618b0aba79437145dee3` delimita integralmente este novo trabalho.

| Origem | Responsabilidade nesta continuação |
|---|---|
| Claude, S00 herdada | Shell, arquitetura inicial, identidade/tokens/fontes, textos e gates conforme inventário acima. Nada foi retroativamente reatribuído. |
| Codex, S00–S03.5 herdadas | Fundação auditada, Three/R3F progressivo, carrossel/controlador, timeline/motion, temas/microinterações e estabilidade de hidratação nos commits históricos documentados acima. |
| Proprietário | Auditoria, autorização para alterar composição/escala/ritmo, referência Dr-Manaus. Aceite estético e aprovações comerciais permanecem reservados ao proprietário. |
| Codex, Recovery — cena | Nova geometria/shader/partículas/rotações independentes, movimento ambiente controlado, câmera pelo scroll, nova arte SVG, comparação classic, observação da superfície e carregamento mobile com 18% de visibilidade. |
| Codex, Recovery — composição | `creative.css`, classes Hero/SectionHeading/ProjectCard, wrapper Hero→Work, runtime passivo de scroll, vitrines ampliadas e profundidade About. Tokens, dicionários, dados, URLs aprovadas e controlador do carrossel não foram alterados. |
| Codex, Recovery — QA/docs | Novos unitários/E2E/capturas/vídeos, atualização das regressões para SVG novo/ambiente com pausa, perfis de hidratação e frames offscreen, resumo de métricas, ADR-013, relatório QA, README e este registro. |

A primeira POC integrada foi executada e gravada em produção antes da consolidação das novas regressões. As evidências preliminares ficam em `docs/report/CreativeRecovery/poc-initial/`; as finais e os vídeos históricos selecionados ficam em `docs/qa/CreativeRecovery/`. Houve reinício do servidor dev 1010 após o runtime de desenvolvimento parar de hidratar; o smoke voltou a confirmar Hero real/carrossel ativo. Uma regressão detectou a faixa decorativa interceptando o botão de pausa após a mudança de proporções; foi corrigida na aplicação, mantendo o clique real no teste.

`docs/report/` continua ignorado e fora do commit. Commit local conforme autorização anterior. Não houve merge, push ou deploy desta continuação. S04/S06/Dev Mode não foram iniciados. Resultados e limites finais: [QA Recovery](qa/CreativeRecovery/REPORT.md), [ADR-013](adr/ADR-013-creative-direction-recovery.md).

Fechamento técnico da POC: lint/typecheck/74 unitários/builds de prévia e público passaram; 82 E2E de prévia + gate público adicional; 14 cenários visuais e sete mobile reexecutados após ajuste de carregamento; 64 PNGs/oito WebM com metadata/hashes. Hidratação lenta em quatro cenários manteve altura/topos/scroll. Localhost 1010 confirmou Recovery ready, Work enhanced, timeline desktop, tema Light e comparação classic funcional, sem pageerrors. Performance mobile **regrediu** no Lighthouse (público 81, LCP 3.013 ms, TBT 506,5 ms); não foi considerada consolidada para lançamento. Aceite estético, performance mobile e dez pendências do release gate continuam explícitos no QA.

## Continuação do contador, scroll e 3D — fronteira exata e autoria

Em **12/10/2026**, o proprietário pediu contador funcional 7→0, entradas de scroll mais visíveis/tardias e escultura variando de tamanho por toda a página, com componentes inspirados em Uiverse. Primeira ação: leitura das instruções/contexto e verificação de branch/HEAD/status. Base limpa: **`922fd77a29549694eaed3bc00ac437b027df7360`**, branch **`feat/creative-direction-recovery`**. A branch foi mantida para refinar a mesma POC; não houve merge de branches históricas. Documentação instalada do Next foi lida antes do código.

**Primeira alteração de aplicação:** criação de `src/features/projects/carousel-clock.ts` e `src/components/carousel/CarouselCountdown.client.tsx`, integração do relógio no carrossel e calibração de `src/features/motion/motion-engine.ts`. O portal/progresso global e os componentes visuais vieram depois. O diff contra `922fd77` identifica exatamente esta continuação. A data segue o contexto atualizado fornecido pelo proprietário, sem corrigir retroativamente as datas dos relatórios anteriores.

| Origem | Fronteira nesta continuação |
|---|---|
| Claude, S00 herdada | Arquitetura, shell, identidade/tokens/fontes, conteúdo original e validação editorial conforme tabelas anteriores. Nada foi reatribuído. |
| Codex, S01–S03.5 e Recovery anteriores | Three/R3F, escultura Recovery, carrossel/reducer, timeline, movimento, microinterações, SVGs e QA em `758557e`, `66c8ff0`, `0ad2532`, `bd21d67`, `922fd77`. Foram reaproveitados. |
| Proprietário | Os três pedidos atuais, referência Uiverse e autorização persistente para commit local. Não houve aprovação presumida de cases/contatos nem solicitação de S06. |
| Codex, contador/carrossel | Deadline compartilhado, indicador circular 7→0, pausa/retomada com restante preservado, proteção contra callback cancelado já enfileirado, pausa síncrona nos eventos e seleção direta dos projetos existentes. Labels PT/EN/ES adicionadas; dados/reducer preservados. |
| Codex, movimento/3D | Reveals 850/1100 ms com margem −18% e deslocamento maior; um canvas Recovery em portal, posição/diâmetro por seções e orientação real, área lateral desktop/miniatura mobile; observação da superfície real, pausa/descarte e fallback preservados. |
| Codex, componentes | Cards com spotlight, símbolos SVG próprios, emblemas de serviços, brilho/seta nos CTAs. Uiverse consultado como referência de comportamento; nenhum código/asset foi copiado. URLs/textos editoriais permanecem herdados. |
| Codex, QA/docs | Regressões de tempo/pausa/seleção/reveal/canvas/suspensão/axe; gravação nativa do contador desktop/mobile, novas capturas/vídeos e perfis, resumo próprio, ADR-014, README, relatório e este marco. |

O teste de chunk bloqueado passou a interceptar antes da navegação e esperar hidratação; a versão anterior permitia cache/prefetch ou deslocava a página antes da estabilização. O teste de tema rápido passou a esperar o término da rolagem nativa causada pelo clique anterior no carrossel antes de medir; diagnósticos separados comprovaram a origem do deslocamento. A regressão do relógio detectou callbacks já cancelados que podiam retomar um ciclo; a correção foi feita na aplicação e coberta por unitário. Capturas também motivaram reduzir a opacidade da miniatura mobile para preservar a leitura.

Evidências atuais ficam em [QA desta continuação](qa/CreativeFollowup/REPORT.md), sem sobrescrever as anteriores. Logs/scripts operacionais/perfis brutos ficam em `docs/report/CreativeFollowup/`, **ignorados pelo Git**. [ADR-014](adr/ADR-014-visible-motion-and-page-companion.md) registra as decisões e os desvios autorizados. Não houve push, merge ou deploy; S04/S06/Dev Mode não foram iniciados. Os resultados finais e limites de performance/aceite estão no QA.

Fechamento: lint/typecheck/79 unitários e builds prévia/público passaram; 87 E2E completos de prévia + gate público nos três idiomas, sete reduced reexecutados após guarda final; 14 cenários visuais + sete mobile reexecutados; 66 PNGs/seis vídeos nativos com hashes/dimensões/duração. Contador nativo registrou 7→0/troca em 7005/6999 ms desde o primeiro sete observado. Hidratação lenta: deltas zero nas quatro condições. Localhost 1010 confirmou PT/EN/ES, tema Light e mesmo canvas variando por cinco seções, sem pageerrors. JS inicial 160.275 bytes gzip; miniatura visível 16/23 frames por espera de 500 ms, pausa zero. Lighthouse público desktop 100, mobile 87 / LCP 2956 ms / TBT 343 ms; meta LCP 2,5 s e dez bloqueios editoriais continuam pendentes. Não foi presumido aceite estético ou aptidão para lançamento.

## Obsidian Workstation P00/P01 — fronteira exata e autoria

Em **14/10/2026**, o proprietário pediu personalização do scroll e execução do pacote extraído em `docs/Obsidian_Workstation_Notebook_3D_Specs_v1/`. Primeira ação: leitura do contexto e verificação de status, branch e HEAD. Base local **`feat/creative-direction-recovery` / `5c607eb17d29d536620e0cd2080f8202586441b3`**; a única alteração era o pacote **não rastreado fornecido pelo proprietário**. `git ls-remote` confirmou Recovery nesse SHA e `main` em `ea3cf24`. Não se atribui a Codex um push feito fora desta sessão.

O prompt do pacote manda executar **P00 + P01 agora** e cria-se **`feat/workstation-notebook-poc` diretamente de `5c607eb`**. Foram lidos instruções, specs/planejamento/pesquisa/contratos, código auditado, guias Next instalados e referências oficiais. Primeira mudança de aplicação desta continuação: personalização nativa em `src/styles/scrollbar.css` e import global; em seguida a nova feature `src/features/workstation/` (config/labels/registro/reducer/modelo/cena/tela/orquestrador). Experimentos/logs de incorporação começaram em `docs/report/Workstation/P00/`, ignorados. O diff contra **`5c607eb`** delimita todo o trabalho novo.

| Origem | Responsabilidade e fronteira |
|---|---|
| Claude, fundação S00 herdada | Arquitetura inicial, shell, identidade/tokens/fontes, textos e gates nas tabelas anteriores. Nenhuma parte foi reatribuída nesta entrega. |
| Codex, continuações anteriores | Hero Three/R3F, carrossel/relógio, timeline/MotionRuntime, tema, escultura/portal/companion e evidências até `5c607eb`. Reutilizados; a landing normal continua disponível. |
| Proprietário / pacote | Intenção do notebook, vinte RFs/dez RNFs, URLs comerciais, fases e prompt. O pacote foi recebido como documentação, sem autoria de implementação atribuída ao seu autor. Pedido explícito de personalizar rolagem e autorização persistente de commit local. |
| Codex, P00 | GET/DNS/redirects/políticas, prova de navegação anônima dos dois iframes, teste das duas estratégias DOM, wireframes/ADR e identificação do canonical divergente de Déborah. Nenhum servidor remoto foi modificado. |
| Codex, P01 | Notebook procedural original com materiais/atlas/teclas instanciadas, pivô real, giro e damping em três eixos, estados/hit targets, tela DOM externa projetada, desktop/browser/Code stub, fixture isolada, diálogo de foco, acessibilidade e integrações Hero/Work/tema/idiomas. Um Canvas substitui a escultura somente na rota experimental. |
| Codex, integração/rolagem | `LandingContent` compartilhado mantém Server Components e filtros; `PageLink` conserva âncoras no laboratório; ação do projeto abre site registrado. CSP com exceções restritas de laboratório/fixture; scrollbar nativa Dark/Light e forced-colors. Controles fora da viewport ficam ocultos, com entrada HTML no fluxo. |
| Codex, QA/docs | Unitários de estado/hit target, E2E de input/iframe/touch/teclado/tema/fallback, matriz visual/vídeos/perfis, ADR-015, README, relatórios P00/P01 e este marco. Drei foi instalado somente para o ensaio, rejeitado após tela vazia em dev/build e removido; lockfile final não ganhou dependências. |

Três ajustes de sincronização reforçam os testes herdados: clock do contador parte de época explícita e pausa em instante futuro; medida de reflow aguarda a mesma largura mínima após resize; teste touch aguarda pose exatamente estável antes de exigir igualdade estrita. Não se enfraqueceu o comportamento esperado para mascarar oscilação. O gap mobile do carrossel caiu de 8 para 6px para acomodar a barra nativa sem reduzir alvos de 44px.

As primeiras provas detectaram montagem vazia com Drei, ponto de chegada incompleto ao centralizar Work, controles fixos fora da viewport e ordem de montagem do DOM após o primeiro frame. Correções foram feitas na aplicação, com testes reais. A aplicação não interpreta `iframe.onload` como permissão e não usa código de sites externos. `verified-local` limita-se ao ensaio de 14/10/2026; RF-006/007 de release aguardam domínio HTTPS/aceite. Code/P03, física/P04 e apps/P05 permanecem explícitos no backlog.

Evidências novas em [Workstation P01](qa/Workstation/P01/REPORT.md), preservando as históricas. O pacote original recebido permanece em `docs`; operações, scripts de ensaio e logs brutos em **`docs/report/Workstation/` permanecem fora do Git**. Nenhum conteúdo editorial foi aprovado. Commit local conforme autorização persistente; **nenhum push, merge ou deploy nesta continuação**. Resultados finais e limitações estão no relatório P01.

Fechamento: lint/typecheck, 115 unitários, builds preview/público, 14 E2E Workstation e gate público passaram; 87 regressões herdadas distintas cobertas pela execução global e reexecuções direcionadas, sem enfraquecer asserções. Matriz de 89 PNGs P01, duas comparações P00 e seis vídeos nativos verificados. Hidratação lenta em seis condições manteve altura da timeline e teve delta máximo de 1px em âncora mobile. Ambos os sites reais rolaram 650px e responderam a clique/X. Localhost 1010 confirmou PT/EN/ES HTTP200, um Canvas real, troca de tema preservando-o e landing normal com carrossel enhanced, sem pageerrors. A revisão final também bloqueou propagação do raycast de teclado/trackpad ao chassi subjacente; teste E2E usa os alvos reais, além da classificação unitária.

JS inicial 166.070 bytes gzip; cena lazy 248.617; repouso zero frames/600ms. Gate mobile de 55% visível corrigiu carregamento prematuro: Lighthouse 66→92, TBT1330→123,5ms; LCP3224ms ainda acima da meta. Desktop100/LCP648ms; INP do perfil local 64/304ms, com desktop acima de 200ms e investigação pendente. Dez pendências editoriais continuam bloqueando `release:check`; origem HTTPS, browser/hardware físico e aceite artístico permanecem pendentes. O SHA exato de fechamento é registrado no log operacional ignorado `docs/report/CONTINUACAO-CODEX.md` após o commit; o pai `5c607eb` identifica a fronteira sem circularidade de autorreferência no Git.

### Ajuste da entrada local após P01

Após o proprietário informar que `localhost:1010/pt` ainda mostrava a experiência anterior, Codex retomou de `c3c2b1d6f7ed950c5ad1f46141efb8db9b294f29`, com árvore limpa. O mesmo servidor já executava o código novo; a página raiz preservava deliberadamente a landing anterior e a POC estava apenas em `/pt/workstation-lab`. A primeira mudança foi `src/app/[locale]/page.tsx`: somente em `next dev`, os três idiomas agora encaminham para a Workstation. `?experience=recovery` e `?experience=classic` preservam as comparações explícitas; o link de retorno do laboratório aponta para a primeira. Build público, CSP e gates permanecem como documentados na P01. README atualizado; sem push/merge/deploy.

## Workstation P01.1 — fronteira exata e autoria

Em **15/10/2026**, o proprietário enviou a auditoria do notebook em `3c395ab` e confirmou que os prompts ChessInReact anteriores foram enviados por engano. Nenhuma implementação desse outro projeto integra esta continuação. Primeira ação: leitura do anexo, branch/HEAD/status e instruções. Base limpa **`feat/workstation-notebook-poc` / `3c395abeabed80004893fa30ac60fe4d0b9b1922`**. Criou-se `fix/workstation-input-scroll-motion` a partir desse SHA, sem reescrever histórico.

Após ler specs originais, ADR-015, QA P01 e guias Next instalados, a reprodução Chromium registrou o objeto fora da viewport após Work. Primeira escrita operacional: capturas/retângulos em `docs/report/Workstation/P01.1/baseline`, ignorados. **Primeira alteração de aplicação: substituição de `src/features/workstation/orchestrator/position.ts` pelo rig com estado/velocidade/mola**, seguida dos marcadores por seção. Esse ponto e o diff contra `3c395ab` delimitam o trabalho novo.

| Origem | Responsabilidade nesta continuação |
|---|---|
| Claude, S00 herdada | Arquitetura inicial, shell, identidade/tokens/fontes, textos e gates, conforme marcos anteriores. Nenhuma autoria foi reatribuída. |
| Codex, trabalho herdado | S01–S03.5, Recovery, contador/scroll e P00/P01 até `3c395ab`, incluindo modelo procedural, tela afim, reducer, CSP, fixture e embeds reais. Reaproveitados. |
| Proprietário | Auditoria/hotfix, prioridade de escala/input/percurso e autorização para tratar esses itens antes das próximas fases. Não houve aprovação editorial nem estética presumida. |
| Codex, P01.1 — movimento/render | Rig com mola criticamente amortecida/delta time/limites, seis estações com composições locais, maior enquadramento, viewport lógica fixa, raycast escalado, um RAF manual do notebook, ordem modelo→projeção→GL, cache da matriz e preservação de iframe no percurso. |
| Codex, P01.1 — input | Layout das teclas compartilhado com mapeamento real por instância/animação, controlador de texto, Shift/Caps/edição/setas, Notas própria em memória, cursor normalizado, callbacks allowlisted, hover/clique/duplo/arraste/wheel/dois dedos e modo touch explícito com saída. Sem controle sintético de sites externos. |
| Codex, P01.1 — QA/docs | Novos unitários/E2E, instrumentação temporal e regressões de projeção, vídeos nativos em quatro tamanhos, Dark/Light desktop/mobile, perfis/hidratação, ADR-016, QA P01.1, README e este marco. |

As primeiras regressões detectaram o retorno da tela com matriz antiga, diferença de dimensão lógica no Canvas escalado e resíduo de damping após repouso; foram corrigidos na aplicação. As asserções de pose/interação herdadas continuam estritas. Coordenadas dos testes de mesh agora aplicam a escala real da cena. Resultados atuais e limitações ficam em [QA P01.1](qa/Workstation/P01.1/REPORT.md), preservando P01 e evidências anteriores. `docs/report/` continua ignorado e fora do Git. Commit local conforme autorização persistente; sem push, merge ou deploy. Code, física destrutiva, jogos e aprovação comercial continuam fora deste hotfix.

Fechamento funcional: lint/typecheck, **121 unitários**, builds preview/público e **121 cenários E2E distintos** (87 herdados + 33 Workstation + gate público). A suíte completa de 32 passou com servidor gerenciado; a revisão visual motivou a regressão tablet 768/1024 e quatro reexecuções após corrigir a reserva proporcional. Seis ensaios de hidratação lenta tiveram deltas zero depois de separar a rolagem nativa inicial da liberação de JS. **78 PNGs / oito WebM** nativos, seis percursos com velocidade ≤2.400px/s, erro de projeção <0,001px lógico e idle zero. Dois embeds reais rolaram 650px e responderam a clique/X. A suíte determinística agora faz parte do workflow; não houve execução remota deste hotfix.

JS inicial171.152 gzip, lazy250.144, 17calls/8.000tri, CPU GL1,81/1,78ms e INP local88/192ms. Lighthouse99desktop/82mobile; controle atual84mobile. LCPmobile3292ms e diferença contra a pontuação histórica P01 continuam explícitos, sem declarar performance/release aprovados. O `release:check` confirmou dez pendências editoriais herdadas. Localhost1010 preservado na Workstation nos três idiomas; comparação Recovery funcional. SHA final registrado no log operacional ignorado após o commit, preservando a fronteira `3c395ab` neste documento.

## Workstation P01.2 — cinco correções solicitadas e nova fronteira

Em **15/10/2026**, após a crítica do proprietário sobre legibilidade, qualidade do notebook, tela solta em ângulos, falta de manipulação/arremesso e percurso irregular, Codex retomou da árvore limpa **`fix/workstation-input-scroll-motion` / `349d7cfffdc47a13e9aeffbc8ee141c4ffa2e5d3`**. Criou a branch **`fix/workstation-visual-physics-continuity`**, diretamente desse commit, preservando os pais. Esse SHA é a fronteira exata para revisar o trabalho novo com `git diff 349d7cf..HEAD`.

Primeiras ações: inspecionar branch/status e implementação, reler instruções/guias Next e especificações físicas, reproduzir e capturar o modelo anterior em Chromium. As primeiras correções de aplicação alteraram a composição entre display/Canvas em `LaptopModel.client.tsx`, `WorkstationScene.client.tsx` e `workstation.css`; as capturas de diagnóstico ficaram em `docs/report/Workstation/P01.2`, ignoradas. O novo atlas por tecla, curva de trajetória e controlador/mundo físico foram implementados em seguida. Não se recriou a fundação nem se atribuiu ao Claude o notebook já feito nas continuações anteriores.

| Origem | Fronteira e responsabilidade |
|---|---|
| Claude, fundação S00 | Shell, arquitetura, identidade/tokens/fontes, textos e gates herdados, conforme o inventário inicial deste documento. Reaproveitados; autoria preservada. |
| Codex, antes de `349d7cf` | S01–S03.5/Recovery e Workstation P00/P01/P01.1: modelo procedural, projeção afim, apps/fixture/embeds, input/Notas/trackpad, seis estações e mola/RAF. Nada disso é apresentado como criação desta P01.2. |
| Proprietário | Cinco defeitos/prioridades e autorização explícita para mover, fechar, girar e arremessar o notebook; pacote de especificações herdado. Não se presume aceite artístico ou aprovação editorial. |
| Codex, P01.2 — visual/tela | Legendas instanciadas individuais em atlas 1024², contraste/tamanho/proporção, câmera Ver teclado, grafite/metais/IBL local, detalhes de base/tampa, pés/ventilação instanciados. DOM abaixo do Canvas, abertura alpha na profundidade do display, oclusão física, recorte comum e enquadramento por volumes reais. |
| Codex, P01.2 — gestos/física | Ferramentas Mover/Girar/Tampa, Alt + arraste, alça/click da tampa, arraste e soltura por timestamps, Rapier 0.21.0 lazy com corpo planar/CCD/paredes/repouso, barra acessível de controles e Seguir página. Reduced motion/falha de módulo/cancelamento/resize/desmontagem tratados. Não há fratura, jogos ou simulação livre em seis graus. |
| Codex, P01.2 — percurso/input | Alvo contínuo entre estações, interpolação de largura/ângulos, cache de layout, captura nativa do trackpad após picking 3D e liberação dos gestos ao cancelar. RAF/mola/input existentes são mantidos. |
| Codex, P01.2 — QA/docs | Oito novos unitários e sete E2E, comparação independente com a mesh física, screenshots/vídeos nativos em quatro tamanhos/Dark/Light, perfis separados do bootstrap/3D/física, ADR-017, QA P01.2, scripts de reprodução e README/HANDOFF. |

A matriz afim anterior era consistente, mas os testes não comprovavam a oclusão nem o recorte. O diagnóstico novo encontrou a tela acima de todo o WebGL e fora da área do Canvas, explicando a barra separada do modelo. A validação agora compara cantos físicos independentes e inclui o ângulo do anexo. A iluminação inicial em 256px foi reduzida para 64px por face; testes de carregamento usam janela explícita de 15s e aguardam repouso real em vez de um sleep fixo após giro. Captura do trackpad foi corrigida na aplicação. Resultados/falhas iniciais e limites estão na [QA P01.2](qa/Workstation/P01.2/REPORT.md).

Na revisão final, Codex encurtou a orientação mobile para evitar sobreposição com a legenda e refez suas capturas/vídeos. O perfil desktop encontrou custo excessivo de preparação da iluminação. A continuação acrescentou **bake offline do mesmo ambiente**, binário HDR gzip/proveniência/licença, carregador validado/fallback e `compileAsync`, eliminando geração PMREM durante a visita. Desktop passou de 72/TBT898,5ms na primeira amostra para 98/TBT118,5ms na seguinte. Esses arquivos/script, dois unitários e um E2E de asset também são autoria desta P01.2, sem reatribuir o modelo-base. A mudança não é aprovação de performance de campo.

`docs/report/` continua fora do Git. A única ampliação da CSP é `wasm-unsafe-eval` na rota experimental; a landing pública e as permissões de iframe permanecem restritas. Nada foi aprovado editorialmente. Commit local autorizado; **sem push, merge ou deploy nesta continuação**. Física destrutiva, Code real, demais apps e publicação seguem no roadmap; a execução atual não declara essas fases concluídas.

Fechamento P01.2: **131 unitários / 17 arquivos**, **41 E2E Workstation**, **87 regressões gerais** e **um gate público** passaram, totalizando **129 cenários E2E distintos**. Lint/typecheck e builds preview/público passaram. Seis condições de hidratação lenta mantiveram deltas zero. **118 PNGs / seis WebM** nativos documentam antes/depois, quatro tamanhos, Dark/Light, idiomas e gestos; a comparação de um recorte 640×550 entre PMREM runtime e atlas pronto teve diferença RGB zero. Localhost1010 confirmou o encaminhamento para P01.2, um Canvas, ambiente baked e zero pageerrors desktop/mobile.

JS inicial173.085 gzip, cena lazy252.556, ambiente112.750 gzip e física1.644.937 gzip sob gesto explícito. Cena20calls/9.366tri, idle zero após repouso/liberação do mundo; Lighthouse98desktop/92mobile e controle81mobile. LCPmobile3199ms e INP localdesktop240ms continuam pendentes para publicação. Dez bloqueios editoriais permanecem. O SHA final do commit é acrescentado ao log operacional ignorado após o fechamento; o pai `349d7cf` mantém a fronteira de autoria sem autorreferência circular.

## Workstation P02 — notebook como interface (continuação Claude)

Em **18/10/2026**, a pedido do proprietário (notebook moderno, sem barra de opções, balançar, fechar a tampa clicando, teclado/trackpad, acompanhar a página, tombo cômico na freada do scroll, adaptação a todos os tamanhos, som com mudo e preparação do código exposto), **Claude** retomou da árvore limpa **`fix/workstation-visual-physics-continuity` / `9b0031c2a31c1b74a10e5d126d141fd0d87b2d1f`** e criou **`feat/workstation-playful-notebook`** a partir desse commit. Esse SHA é a fronteira exata: `git diff 9b0031c..HEAD` contém somente esta continuação.

Antes de alterar código: leitura da branch, do histórico local Codex (`~/.codex/sessions`) e da auditoria anexa, de todo `src/features/workstation`, das specs 00/04/06/07, de ADR-017 e da QA P01.2, além dos guias Next instalados. Um plano foi aprovado pelo proprietário com quatro decisões: retorno automático, batida no teto, solver próprio e som com mudo na tela.

| Origem | Fronteira e responsabilidade |
|---|---|
| Claude, fundação S00 | Inalterada; autoria conforme o início deste documento. |
| Codex, até `9b0031c` | S01–S03.5/Recovery e Workstation P00–P01.2: base do modelo procedural, projeção afim + abertura alfa, reducer, fixture/embeds/CSP, Notas, controladores de teclado/trackpad, ambiente HDR baked, estações por seção. Reaproveitados e evoluídos; nada disso é reatribuído. |
| Proprietário | Pedido, prioridades e respostas às decisões; nenhuma aprovação editorial ou estética presumida. |
| Claude, P02 — interface/a11y | Remoção da barra/dica/legenda; gestos diretos; rótulo do cursor; menu oculto (`role=menu`, clique direito/toque longo/Shift+F10/gatilho por Tab); anúncios; retorno de foco do diálogo; mudo na tela. |
| Claude, P02 — render/física | Canvas em tela cheia em pixels; camada de clique recortada pela silhueta; vidro escuro sem DOM; solver 2D com rotação, pêndulo, voo, repouso; inércia/freada do scroll; mola da tampa; rig preso ao conteúdo; trajetória responsiva; reações cômicas; som WebAudio; remoção do Rapier e de `wasm-unsafe-eval`. |
| Claude, P02 — modelo | Geometria arredondada com bisel, materiais, teclas/legendas na Inter, trackpad de vidro, grades, LED, sombra de contato, estrelas. |
| Claude, P02 — Terminal/Código/página | Comandos curados e sessão compartilhada; gerador allowlisted do índice de código com validação de caminho/segredo/SHA; app Código com realce próprio; Inspecionar; tremor/esbarrões na página. |
| Claude, P02 — QA/docs | 25 + 12 unitários novos, duas suítes E2E Workstation reescritas (30 cenários), 19 capturas, ADR-018, QA P02, README e esta seção. |

Durante a validação, os testes revelaram e motivaram as seguintes correções na aplicação:
- caret desalinhado entre tecla 3D e digitação física;
- ordem do prompt que reabria o Terminal por cima do Código;
- falso tombo em fling de trackpad (passou a medir a brusquidão da freada);
- RAF infinito por resíduo exponencial da inércia;
- carregamento do deslocamento ao mudar o layout;
- foco perdido ao fechar o diálogo, porque o Chrome fecha nativamente no Esc e o botão de origem desmonta;
- notebook cobrindo o link da barra do laboratório.

Premissas antigas dos testes foram reescritas, não relaxadas: a pose agora muda ao olhar para o cursor, e o voo após um salto instantâneo é intencional. A tolerância da “flutuação” inercial e a espera de dois quadros após saltos estão comentadas nos testes. `docs/report/` continua fora do Git. Sem push, merge ou deploy.

Fechamento P02: lint/typecheck; **160 unitários / 18 arquivos**; builds preview e público; **30 E2E Workstation** em servidor de produção (+2 de rede pulados); **87 E2E gerais** (+1 condicional); gate público. Não medidos nesta entrega: Lighthouse, INP, hidratação lenta e vídeos. A sensação física em dispositivos reais e o aceite estético dependem do proprietário. Dez bloqueios editoriais herdados permanecem.

## Workstation P02.1 — auditoria e pendências (continuação Codex)

**20/10/2026.** Pedido: “não desfaça o trabalho do Claude; só analise e resolva pendências”. Branch preservada: `feat/workstation-playful-notebook`.

**Fronteira exata:** Codex recebeu o HEAD `9b0031c2a31c1b74a10e5d126d141fd0d87b2d1f` com a P02 do Claude ainda sem commit. Antes de editar, leu o handoff/ADR-018/QA P02 e validou lint, typecheck e **160 testes**. Preservou integralmente a entrega recebida no commit local **`17ff916637674df95be03ed58ee44fd22e64981b`**, mensagem `feat: make the Workstation notebook the interface (P02)`, com autoria Claude explicitada no corpo do commit. Esse snapshot não inclui alterações da continuação Codex. O histórico anterior e a atribuição acima permanecem válidos.

**Claude:** toda a P02 descrita na seção anterior, inclusive modelo/material/teclas, física própria e trajetória, interações sem barra, Terminal/Código/inspeção, áudio, testes e suas 19 capturas. **Codex após `17ff916`:** correção da detecção de fonte local/links do gerador; carregamento dos apps sob demanda com loading/fallback e sincronização dos bindings; diagnósticos de repouso; regressões de fonte e hidratação lenta; novos roteiros P02 de QA/perfil e evidências, medições e documentação em P02.1. **Proprietário:** direção visual, conteúdo e aceite manual; nada promovido a aprovado.

O profiler inicialmente atingiu timeout esperando a retomada depois de arremessar. A instrumentação confirmou repouso: no SwiftShader, a simulação com delta limitado pode levar mais tempo de relógio. A espera do roteiro foi ajustada; **nenhuma constante física foi recalibrada**. A primeira versão do carregamento adiado perdeu a primeira tecla no E2E existente; o sinal `ready` passou a aguardar os bindings, sem enfraquecer o teste.

Também foi confirmado e corrigido **por Codex** um defeito do detector de freada: com quadros de 200ms, ele descartava uma parada instantânea por comparar o instante da amostra com a janela de 180ms. Agora calcula o cruzamento dentro do quadro pelo mesmo filtro exponencial. Uma regressão falhou antes e passou após a correção; ambos os sentidos e desaceleração gradual são cobertos em quatro cadências. Limiares e constantes físicas do Claude foram preservados. O E2E registra a fase rápida observada; seu limite total acomoda os round trips de wheel no SwiftShader, mantendo os limites das asserções de queda/impacto/retorno.

Resultados finais, reprodução, evidências e pendências remanescentes: [QA P02.1](qa/Workstation/P02.1/REPORT.md). Decisões: [ADR-019](adr/ADR-019-workstation-p02-continuation.md). `docs/report/` e o índice gerado continuam fora do Git. Sem push, merge ou deploy nesta continuação.

Fechamento P02.1: lint/typecheck; **163 unitários**; builds preview e público; gate público PASS; **87 E2E gerais**; **38 cenários Workstation únicos validados + dois de rede pulados**, consolidados da suíte inicial e reexecuções dos casos afetados (não uma única execução completa verde). **68 PNGs / dois WebM nativos**, 12 combinações visuais, seis ensaios de hidratação com deltas zero. Lighthouse 99 desktop / 90 mobile; LCP mobile 3,272s e INP local 360/216ms permanecem acima das metas. Hardware, aceite artístico e os dez bloqueios editoriais seguem abertos. Modelo, CSS do notebook e constantes físicas do Claude preservados.

## Workstation P02.2 — sites imersivos e reação no contato (Codex)

**21/10/2026. Fronteira exata:** HEAD inicial `2fea4b80b2235adb77725e0310de4724e2e18587`, árvore limpa, branch `feat/workstation-playful-notebook`, sincronizada com sua ref `origin` no início. A auditoria anexada pediu refinamentos pontuais e preservação da P02 do Claude. Nenhum histórico foi reescrito.

**Claude permanece autor** do modelo/material/legendas, solver planar, pêndulo, voo, inércia, mola da tampa, Canvas, trajetória, menu, Terminal, Código, inspeção, foley, reações da página e primeira versão das estrelas. **Codex P02.1** permanece responsável pelas correções e validações descritas acima. **Codex a partir de `2fea4b8`** implementa exclusivamente esta continuação:

- apresentação imersiva dos dois sites comerciais reais no display físico, sem toolbar/endereço/rodapé; saída e opções reveladas por hover/foco, visíveis no touch e traduzidas;
- abertura pelo carrossel no 3D mobile, preservando alternativas explícitas/acessíveis de foco e fallback;
- montagem persistente do iframe durante tema, pose, scroll, impacto e fechamento da tampa; ajuda honesta, retry e link externo quando o domínio falha ou bloqueia;
- controlador finito `ImpactReaction`, feedback no contato forte, intensidade proporcional, debounce, estrelas imediatas, torque/impulso da tampa, oscilação e recuperação; proteção do alvo da tampa e interrupção por nova pega;
- diagnósticos de tempo/estado, regressões unitárias/E2E, roteiro de vídeos online, nova evidência e documentação P02.2; inclusão da tela e do controlador na allowlist do Código real.

`LaptopModel`, materiais/HDR, `physics/hinge.ts`, `trajectory.ts`, `scroll-inertia.ts`, áudio e reações da página não têm diff. O solver próprio continua sendo o do Claude: há somente uma correção Codex no limite angular da pega invertida, descrita abaixo. Gravidade, subpassos, colisões, atrito e limites de velocidade não foram recalibrados. Ajustes de tempo/amortecimento estão enumerados em [ADR-020](adr/ADR-020-workstation-immersive-sites-and-contact-reaction.md). Não há Rapier, novo Canvas, jogos, destruição ou aprovação editorial.

Na validação, um teste inicialmente chamou uma queda curta de pancada forte; o limiar foi mantido e o gesto corrigido. O primeiro roteiro online selecionou o skip link visualmente oculto de Déborah; passou a selecionar um link de navegação utilizável. A tentativa inicial de arremesso soltava o objeto quase no chão, com round trips longos no SwiftShader, e corretamente não gerava atordoamento forte. A primeira suíte completa confirmou a mesma entrada inválida no cenário antigo de pêndulo/arremesso (45 PASS, uma falha). A investigação confirmou o ciclo físico; roteiro e regressão levantam o notebook e usam eventos nativos CDP ordenados, sem timestamps fabricados ou alteração do relógio/solver. Balanço, voo, impacto e retorno continuam exigidos. Logs diagnósticos temporários foram retirados do produto.

A segunda suíte completa passou no arremesso e teve uma falha na preparação antiga do cenário do carrossel (45 PASS, uma falha): tentava clicar durante entrada/autoplay e os retries de scrollIntoView deslocavam o alvo. A regressão aguarda o assentamento e a animação nativa terminar, seleciona NutriOpus e então clica, sem force click ou alteração do autoplay do produto. O cenário passou isoladamente e motivou nova execução completa; as duas primeiras corridas/traces foram preservadas no relatório operacional.

A terceira suíte teve 46/46 PASS e os gerais 87 PASS + um condicional. A revisão da continuidade encontrou então um defeito real na pega de poses invertidas: o clamp absoluto podia saltar ~1,6rad em um quadro. **Codex** acrescentou duas regressões que falharam antes e corrigiu somente esse limite no solver existente, com retomada amortecida e normalização de voltas equivalentes. A medição de velocidade do retorno também passou a exigir vários quadros do retorno físico completo, para não aceitar zero em uma fase visual curta. Esses refinamentos são revalidados na entrega final; a execução anterior permanece identificada no raw.

Resultados, comandos, limitações, arquivos/evidências e situação remota: [QA P02.2](qa/Workstation/P02.2/REPORT.md). Relatórios operacionais e tentativas iniciais permanecem em `docs/report/`, fora do Git. Sem push, merge ou deploy nesta continuação.

**Fechamento P02.2:** lint/typecheck, **174 unitários / 19 arquivos**, builds preview e público; **46/46 Workstation em uma única execução final**, sem skip/falha/flaky, incluindo rede real; **87 E2E gerais + um condicional**, gate público separado **1 PASS**. Seis ensaios de hidratação lenta com deltas zero; 12 combinações PT/EN/ES × Dark/Light × desktop/mobile; **76 PNGs / dois WebM nativos**. A reação começou no mesmo passo físico, 1,9ms após a detecção medida e submissão do primeiro render em 5,2ms; os vídeos mostram estrelas/`x_x` sobre website real. Telemetria agora conserva todos os contatos de canto. Repouso: zero frames adicionais.

Lighthouse final: **99 desktop / 88 mobile**, LCP mobile **3,345s**; INP local **424/208ms**, sem equivalência a p75 de campo. JavaScript inicial **184.056B gzip**, 4.056B acima do orçamento. Performance mobile, hardware/aceite artístico e as dez pendências editoriais continuam abertos. Consulta remota de 21/10 às 08:38 UTC confirmou HEAD `2fea4b8` e CI cancelado; resultados locais não são atribuídos ao CI. A entrega recebe commit local próprio, sem push/merge/deploy e sem reescrever o snapshot Claude.

## P02.2 — hotfix de desenvolvimento após relato do proprietário

**21/10/2026, Codex, base exata `e35813e945039f64cc35589d950523db0423c520`, árvore limpa.** O proprietário relatou `rig.reaction.stage` indefinido e divergência no body por `cz-shortcut-listen`. A instância de classe guardada em `useState` podia sobreviver ao Fast Refresh enquanto a cena já carregava o contrato novo. Uma alteração controlada do inicializador reproduziu a retenção na mesma aba. Codex acrescentou `// @refresh reset` no dono dos controladores e uma regressão de HMR real, `scripts/qa-workstation-refresh.mjs`; fonte temporária de teste é restaurada, nenhuma propriedade de probe permanece no produto. A cena passou a recriar o controlador, com um Canvas e sem exceções.

O atributo no body foi isolado como alteração externa ao HTML da aplicação: sua inserção anterior à hidratação reproduz o aviso, mas o notebook/Notas continuam funcionais. O layout não foi alterado para mascarar divergências. Orientação: conferir/desativar a extensão que injeta o atributo em localhost. Nenhuma parte do modelo/material/física/OS do Claude ou do refinamento P02.2 foi revertida. [Diagnóstico, reprodução e resultados próprios](qa/Workstation/P02.2/HOTFIX-REFRESH.md); evidências anteriores permanecem separadas. `docs/report` continua ignorado; sem push, merge ou deploy nesta correção.

Fechamento do hotfix: `npm run verify` PASS (lint/typecheck/**174 unitários**, build preview), regressão HMR real PASS na mesma aba, isolamento com/sem atributo externo PASS, **8/8 E2E selecionados PASS** no build otimizado. Não é uma nova execução dos 46 cenários anteriores nem uma nova medição de performance. O reset se limita ao ciclo de atualização de código em desenvolvimento; não substitui a persistência normal da tela entre tema/pose/interações.
