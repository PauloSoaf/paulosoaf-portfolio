# Arquitetura proposta

## Stack
- Next.js App Router + React + TypeScript strict.
- Tailwind CSS para utilidades; CSS custom properties como fonte única de tokens.
- Three.js e `@react-three/fiber` para a cena hero; `@react-three/drei` apenas componentes necessários.
- Motion para interações DOM simples; GSAP somente se prova de conceito demonstrar necessidade concreta de timeline complexa.
- Dados editoriais tipados em TS/JSON/MDX estático, validados antes do build. Sem CMS ou DB na V1.
- Vitest + Testing Library para lógica/componentes, Playwright para fluxos críticos, axe para acessibilidade (ferramentas equivalentes justificáveis por ADR).

## Compatibilidade
Verificar versões estáveis e peer dependencies ANTES de instalar. Referência R3F: v9 compatível com React 19; não utilizar versão alpha sem ADR. Congelar lockfile. Não assumir números exatos de Next/React em outubro de 2026 sem verificar.

## Estrutura sugerida
```text
src/
  app/
    [locale]/
      layout.tsx
      page.tsx
      projects/[slug]/page.tsx
      not-found.tsx
    globals.css
  components/
    layout/ SiteHeader.tsx, SiteFooter.tsx
    hero/ HeroEditorial.tsx, HeroArtBoundary.client.tsx, HeroFallback.tsx
    carousel/ ProjectCarousel.client.tsx, ProjectSlide.tsx, CarouselControls.tsx
    experience/ ExperienceTimeline.client.tsx, ExperienceList.tsx
    sections/ ExpertiseSection.tsx, ServicesSection.tsx, ContactSection.tsx
    ui/ Button.tsx, SectionHeading.tsx, LanguageSwitch.tsx
  features/
    projects/ project-data.ts, project-types.ts, project-validation.ts
    experience/ experience-data.ts
    contact/ contact-links.ts
  graphics/
    hero/ HeroScene.tsx, ProceduralOrb.tsx, SceneLights.tsx
    shared/ WebGLBoundary.tsx, QualityProfile.ts
  i18n/ dictionaries/{pt,en}.ts, config.ts
  lib/ metadata.ts, site-config.ts, analytics.ts
  styles/ tokens.css, motion.css
  tests/ unit/, e2e/, visual/
public/
  art/, projects/, cv/, og/
```

## Fronteiras
- Servidor: layout, conteúdo, seções e cases, metadata, geração de rotas estáticas.
- Cliente: menu mobile, toggle de idioma se necessário, carrossel, timeline ativa, hero Canvas.
- Canvas isolado em `dynamic()` ou lazy loading; evitar `'use client'` no layout global inteiro.
- R3F componente decorativo com `aria-hidden=true`; conteúdo equivalente disponível no DOM.
- Dados de contato e projetos versionados; validar URLs/dados no CI.

## Fluxo de renderização
`Request → HTML semântico pre-renderizado → CSS/texto e SVG de fallback → hydrate ilhas interativas → detectar WebGL/visibilidade/reduced-motion → lazy mount WebGL → degradar se contexto perdido`.

## Sem backend por padrão
Não implementar API própria, auth, Supabase ou banco por estética. Usar `mailto` e links para começar. Se contato exigir formulário, ADR posterior com mitigação de spam/privacidade.
