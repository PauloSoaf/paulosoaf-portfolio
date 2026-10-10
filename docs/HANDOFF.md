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
