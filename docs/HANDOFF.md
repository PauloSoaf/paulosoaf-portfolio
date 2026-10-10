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
