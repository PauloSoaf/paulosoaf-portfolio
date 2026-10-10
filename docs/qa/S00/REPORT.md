# S00 — Continuação do trabalho do Claude

Data: 10/10/2026. Branch: `main`. Status: **fundação técnica validada; aceite visual/editorial e publicação pendentes**. Este relatório registra a entrega técnica anterior à autorização de commit/push. Naquele momento não havia commits e nenhum envio havia sido executado. A autorização posterior e a atribuição Claude/Codex estão registradas em `docs/HANDOFF.md`; o resultado operacional do envio fica em `docs/report/`, fora do Git. Nenhum deploy foi solicitado.

## Ponto de retomada e escopo

O histórico anexado terminava na página 404 global. O repositório já tinha Next.js 16.3.8, React 19.3.0, TypeScript 5.9.3, Tailwind 4.3.3, landing estática, coleções editoriais, três idiomas e dois temas. As configurações referenciavam testes inexistentes; faltavam CI, README e evidências. O primeiro `npm test` falhou com `No test files found`.

Esta continuação completa as verificações e infraestrutura de S00. WebGL, carrossel final, timeline interativa, cases, Explore Mode e Developer Inspector continuam fora desta sprint. Não foi atribuída aprovação a nenhum candidato.

## Alterações

| Arquivos | Resultado |
|---|---|
| `src/components/ui/LanguageSwitch.client.tsx` | Links nativos fazem navegação de documento, salvam preferência e preservam âncora. Corrige perda de `data-theme` e `data-js` na troca de idioma. |
| `src/components/sections/ContactSection.tsx` | Coluna mobile explicitamente limitada e cartão flexível, corrigindo overflow do espanhol a 360px. |
| `src/components/hero/HeroEditorial.tsx`, `src/components/projects/ProjectCard.tsx`, `src/components/sections/{Work,About,Expertise,Services}Section.tsx`, `src/components/ui/ButtonLink.tsx`, `src/app/globals.css` | Quebra de texto, grid de uma coluna e wrap nos cabeçalhos dos cartões; conteúdo permanece utilizável com fonte a 200%. |
| `src/features/content/validation.ts` | Rejeita dias inexistentes que `Date.parse` normalizava silenciosamente. |
| `package.json`, `package-lock.json` | playwright-core 1.63.0 alinhado a Playwright 1.63.0. `npm run dev` agora usa a porta 1010, conforme solicitação do usuário. |
| `src/lib/site-config.ts` | Origem local de fallback atualizada para `http://localhost:1010`; produção continua exigindo `SITE_URL`. |
| `tests/unit/`, `vitest.config.mts` | 25 testes, incluindo conteúdo, datas, idiomas, metadata, tokens/contraste, tema e menu por teclado. Dois workers para limitar consumo. |
| `tests/e2e/`, `playwright.config.ts` | Fluxos de navegador, sem JS, 404, persistência, acessibilidade axe, breakpoints, zoom e filtro de produção. |
| `tests/visual/`, `playwright.visual.config.ts` | Capturas de viewport e página inteira nas seis combinações de idioma/tema em desktop/mobile. |
| `tests/release/editorial.test.ts` | Gate editorial executável separado do gate técnico; bloqueia publicação sem aprovações. |
| `.github/workflows/ci.yml` | Pipeline de lint/typecheck/unit/build/E2E, incluindo builds de prévia e sem rascunhos. Configurado, ainda não executado no GitHub. |
| `README.md`, `docs/adr/`, `scripts/inspect-layout.mjs` | Instruções locais, decisões, limites e ferramenta de diagnóstico de overflow. |

## Requisitos e aceite

PASS indica verificação local dentro da S00, não conclusão do requisito de todas as sprints.

| AC | RF/RNF | Resultado | Evidência / limite |
|---|---|---|---|
| AC-001 | RF-001, RNF-003 | PASS | Hero, nome/cargo e CTAs reais para `#work`/`#contact`; E2E nos três idiomas com JS desativado. |
| AC-005 | RF-007, RNF-003 | Parcial | Lista estática da trajetória é HTML; interação fica para S03. Sem auditoria com CSS desligado nesta continuação. |
| AC-006 | RF-008 | Pendente editorial | Sem e-mail/LinkedIn/CV aprovados. Avisos em prévia, links ausentes no build público; nenhuma ação falsa. |
| AC-007 / AC-017 | RF-009, RF-021, RNF-010 | PASS na home | `/pt`, `/en`, `/es`, `html lang`, títulos e links corretos. Cases ainda não existem. |
| AC-008 | RF-012, RNF-012 | PASS no DOM | Reduced motion deixa navegação funcional e scroll instantâneo. Não existe cena/autoplay nesta sprint. |
| AC-009 | RNF-004 | PASS | 360,390,768,1024,1440,1920px nas seis combinações sem scroll horizontal. |
| AC-011 | RNF-005 | PASS local / CI configurado | Lint, typecheck, unitários, builds e E2E. Runner remoto ainda não executado. |
| AC-012 | RF-018, RNF-002 | PASS | Enter abre menu, Tab alcança link, Escape fecha e retorna foco; link fecha menu. |
| AC-014 | RF-010, RNF-006, RNF-009 | Parcial | Validação estrutural e filtro de drafts testados. Aprovação editorial pendente; auditoria de produção limpa, alertas de desenvolvimento documentados. |
| AC-016 | RF-019, RF-020 | Parcial | Base de serviços/especialidades e candidatos editoriais preservada. Links herdados do Claude não foram revalidados remotamente nesta continuação. |
| AC-018 | RF-023, RF-025, RF-026 | PASS na S00 | Seis combinações da landing; cases/carrossel/cena fora do escopo. |
| AC-019 | RF-022, RF-024 | PASS | Cookie de tema persiste em troca de idioma e reload; raiz usa idioma salvo, `/es` explícito prevalece. |
| AC-020 | RNF-015 | Evidências para revisão | Paleta Dark idêntica ao JSON; imagens desktop/mobile inspecionadas, diferenças abaixo. Sem aceite visual do proprietário. |
| AC-021 | RNF-016 | Parcial | axe nos dois temas/três idiomas, teclado e foco do menu, fonte 200% nas seis combinações. Sem auditoria manual por leitor de tela ou dispositivo touch real. |
| AC-022 | RF-025, RNF-018 | PASS estrutural na home | Mesmas chaves, textos não vazios, `html lang`, metadata e hreflang. Traduções humanas/fatos/URLs de publicação aguardam revisão. |
| AC-023 | RF-011, RNF-003 | PASS na S00 | Home sem JS, links de idioma nativos, navegação com mídia abortada. Não há WebGL para simular context loss. |

RNF-017: bootstrap aplica o cookie de tema antes da hidratação; E2E não detectou erros de hidratação na troca/reload. Não houve medição de first paint em dispositivo real. RNF-019: toggle não remonta componentes; idioma recarrega o documento por decisão registrada no ADR-005. Estado de carrossel ainda não se aplica.

## Comandos e resultados

| Comando | Resultado |
|---|---|
| `npm run lint` | PASS, sem erros/avisos na última execução. |
| `npm run typecheck` | PASS. |
| `npm test` | PASS: 4 arquivos, 25 testes. |
| `PORTFOLIO_CONTENT_PREVIEW=1 npm run build` | PASS: home PT/EN/ES pré-renderizada, 404 e ícone estáticos, proxy da raiz. Em PowerShell, definir variável como no README. |
| `npm run test:e2e` | PASS: 15 testes, 1 skip condicionado ao build público. |
| `npx playwright test -g '200%'` | PASS adicional: fonte 200% em PT/EN/ES × Dark/Light, após ampliar o teste para ambos os temas. |
| `npm run qa:screenshots` | PASS: 12 cenários, 24 PNGs (viewport + página inteira). |
| `PORTFOLIO_CONTENT_PREVIEW=0 npm run build` | PASS. |
| `QA_EXPECT_PUBLIC_CONTENT=1 npx playwright test -g 'public build'` | PASS: não publica marcadores editoriais, cards draft ou links de contato não aprovados, nos três idiomas. |
| `npm run release:check` | BLOQUEADO como esperado: 10 pendências editoriais/origem, enumeradas abaixo. |
| `npm audit --omit=dev` | PASS: zero vulnerabilidades conhecidas nas dependências de produção. |
| `npm audit` | 5 entradas altas na cadeia do ESLint/braces. Ver ADR-008; sem downgrade ou `--force`. |
| `npm run dev` | Servidor mantido ativo em `http://localhost:1010`; `/pt` respondeu HTTP 200 com hero e banner de prévia. Substituiu o servidor antigo deste projeto na porta 3101. |

Os testes usam Chromium instalado no ambiente. Firefox/Safari, leitor de tela e dispositivos reais não foram avaliados. O build registra aviso de API experimental `globalNotFound`; requisições de rotas inválidas registram `Internal: NoFallbackError`, apesar de retornarem HTML completo e status 404 correto. Documentado no ADR-005.

## Capturas e comparação visual

Todas as imagens são de build otimizado em **prévia editorial**, com candidatos identificados como rascunhos. Não são screenshots de uma versão autorizada para publicação.

| Idioma | Desktop Dark | Mobile Dark | Desktop Light | Mobile Light |
|---|---|---|---|---|
| PT | [viewport](pt-dark-desktop-viewport.png) · [página](pt-dark-desktop.png) | [viewport](pt-dark-mobile-viewport.png) · [página](pt-dark-mobile.png) | [viewport](pt-light-desktop-viewport.png) · [página](pt-light-desktop.png) | [viewport](pt-light-mobile-viewport.png) · [página](pt-light-mobile.png) |
| EN | [viewport](en-dark-desktop-viewport.png) · [página](en-dark-desktop.png) | [viewport](en-dark-mobile-viewport.png) · [página](en-dark-mobile.png) | [viewport](en-light-desktop-viewport.png) · [página](en-light-desktop.png) | [viewport](en-light-mobile-viewport.png) · [página](en-light-mobile.png) |
| ES | [viewport](es-dark-desktop-viewport.png) · [página](es-dark-desktop.png) | [viewport](es-dark-mobile-viewport.png) · [página](es-dark-mobile.png) | [viewport](es-light-desktop-viewport.png) · [página](es-light-desktop.png) | [viewport](es-light-mobile-viewport.png) · [página](es-light-mobile.png) |

Desktop: 1440×900; mobile: 390×844. Página inteira conserva a largura da viewport e cresce conforme o conteúdo.

Referências locais inspecionadas: `pocs/preview/index.html`, `01-hero-desktop.png`, `05-hero-mobile.png`, `02-projects-desktop.png`, `03-timeline-desktop.png` e `06-projects-mobile.png`. A comparação é conceitual, conforme `testing.md`; não há baseline aprovado para comparação pixel a pixel.

Diferenças intencionais, sujeitas à revisão visual:

- Copy localizada, nome/cargo explícitos e CTA de contato substituem a mistura de inglês/português e CTA de trajetória da POC. Altura e quebra do título variam com a tradução.
- Header de aplicação e banner editorial ocupam espaço adicional; controles de teste/parallax da POC não aparecem. Arte permanece SVG estático na S00.
- Projetos aparecem em grid com cinco candidatos em prévia. O card central cinematográfico e controles virão em S02; produção não mostra drafts.
- About usa três cartões lineares; rail e painel interativo pertencem à S03.
- Serviços, especialidades e contato entram na ordem da arquitetura de informação. Avisos de contato são exclusivamente editoriais.
- Light usa superfícies neutras e arte de planeta grafite. Nenhuma superfície grande recebeu fundo verde saturado. Paleta Dark e órbitas foram preservadas.
- Layouts e badges quebram linhas quando necessário, inclusive no zoom, sem esconder a informação para eliminar overflow.

## Pendências e próximo passo

O gate de publicação exige `SITE_URL` HTTPS real, perfil aprovado, textos PT/EN/ES revisados, no mínimo três projetos aprovados, trajetória/especialidades/serviços aprovados e contatos e-mail/LinkedIn/CV validados. Os dez bloqueios foram reportados pelo teste, sem inventar valores.

A S00 está pronta para revisão visual da fundação. O aceite visual do proprietário não foi presumido. Commit/push foram autorizados posteriormente à entrega técnica, com divisão de trabalho registrada em `docs/HANDOFF.md`. S01 será a próxima sprint após o gate visual: hero procedural progressivo, com fallback e orçamento medido. Não antecipar Explore Mode/Developer Inspector.

Sem medições de Lighthouse/Web Vitals em campo, FPS/GPU ou garantia de conformidade WCAG completa. ADR-005, ADR-006 e ADR-008 descrevem as decisões e limitações da implementação atual.
