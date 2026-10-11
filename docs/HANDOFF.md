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
