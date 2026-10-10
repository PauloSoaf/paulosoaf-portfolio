# Qualidade, testes e regressão

## Pirâmide de testes
- Unit: validação de modelo editorial, locale dictionaries, utils, navegação circular do carrossel, estado play/pause, guard de links.
- Component: HeroFallback, CarouselControls, mobile menu, timeline, casos sem mídia.
- E2E: entrar `/pt`, navegar sections, selecionar 3 projetos, abrir case, alternar EN, acessar contato/CV; usar teclado e mobile viewport.
- A11y: axe-core e auditoria manual de foco, semântica, screen reader e reduced motion; axe não substitui auditoria manual.
- Visual: snapshots de `1440x900` e `390x844`; `assets/mockups/` são referência criativa, NÃO imagens douradas de regressão técnica (baseline final criado após aprovação do UI real).
- Performance: Lighthouse CI como alerta; Core Web Vitals em campo quando houver tráfego suficiente.

## Cenários críticos
1. Javascript indisponível → texto/links do site continuam legíveis.
2. WebGL indisponível e `webglcontextlost` → fallback sem crash.
3. Reduced motion → autoplay off e sem parallax.
4. Carrossel teclado → anteriores/próximos, pausa, anúncio sem excesso.
5. Touch drag → navegação sem clique acidental.
6. Rota inexistente → not found correta e link de retorno.
7. Projeto sem demo → CTA de demo ausente.
8. Tradução PT/EN → sem texto placeholder, canonical/hreflang.
9. Slow 3G/simulação CPU limitada → conteúdo carregado antes de WebGL.
10. Dispositivo com menos recursos → qualidade reduzida, sem perda de conteúdo.

## Pipeline mínimo
`npm ci` → `npm run lint` → `npm run typecheck` → `npm test` → `npm run build`; E2E Playwright em runner com browsers instalados. Nomes de scripts definidos na S00.

## Relatório de QA por sprint
Tabela `AC / Resultado(PASS,FAIL,NA) / Evidência / Observação`, com screenshots e comando de repro. Não esconder falhas. Não editar screenshots para parecerem aprovados.
