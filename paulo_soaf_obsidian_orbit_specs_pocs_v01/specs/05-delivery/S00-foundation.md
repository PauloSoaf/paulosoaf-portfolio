# S00: Fundação do projeto e design system

**Objetivo:** criar repo executável, base responsiva Obsidian Orbit, sem iniciar WebGL definitivo.

## Tasks
- T00-01 Inicializar Next.js estável/App Router, TS strict, Tailwind, scripts `dev/build/lint/typecheck/test`; confirmar peer dependencies.
- T00-02 Criar tokens globais de `assets/design-tokens.json`, fontes/config com fallbacks, layout responsivo.
- T00-03 Implementar SiteHeader, menu mobile, skip-link, SiteFooter, CTAs reais ou bloqueio editorial visível em ambiente de desenvolvimento.
- T00-04 Hero SSR com texto e arte SVG fallback. CTAs apontam para work/contact existentes.
- T00-05 Criar estrutura de conteúdo tipado e validação de `approved` para produção; casos candidatos como drafts.
- T00-06 Preparar locale PT/EN, páginas base/metadata e links internos.
- T00-07 Configurar CI + lint/typecheck/test/build, README de desenvolvimento e screenshot QA desktop/mobile.
- T00-08 Registrar versão instalada e diferenças justificadas frente à POC.

## DoD
AC-001, AC-006 (se conteúdo aprovado), AC-009, AC-011, AC-012, AC-014. Rota renderizada com JS desativado; sem secrets/placeholder público; layout 360 e 1440 sem overflow.

## Excluir deliberadamente
Canvas 3D real, carrossel final, motion agressivo, integração analytics, Explore Mode.
