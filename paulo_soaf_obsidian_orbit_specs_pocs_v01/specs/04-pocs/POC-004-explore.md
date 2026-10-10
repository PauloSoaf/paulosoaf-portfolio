# POC-004: Explore Mode (opcional; pós-MVP)

Protótipo visual conceitual: `pocs/preview/poc-004-explore.html`; screenshot `assets/mockups/04-explore-desktop.png`. A interface HTML simula o universo navegável; não é mapa orbital 3D real.

## Hipótese
Uma exploração de projetos como pontos de um universo cria diferenciação e material compartilhável no LinkedIn, mas provavelmente tem ROI comercial menor que cases e CTAs. Construir apenas depois de validar MVP.

## Navegação
Botão opt-in `Explore Mode`, nunca iniciar automaticamente. Zona de mapa visual com 3 a 5 objetos representando cases, seleção abre informações e links regulares. Botão Sair e Escape, preserva foco. Recurso não essencial e sem conteúdo exclusivo.

## Arquitetura
Aproveitar R3F já instalado, carregar bundle isolado ao abrir, lazy asset loading, DPR adaptativo e fallback textual. Evitar sistemas de mundo aberto e física do Dr-Manaus em portfólio.

## Exit criteria
Sem queda relevante em indicadores de carregamento base, sem armadilhas de foco/scroll, UX útil teclado/touch, validação com usuários antes de priorizar.

## Aceite
AC-013 e qualidade comum do RNF-001 a 014.
