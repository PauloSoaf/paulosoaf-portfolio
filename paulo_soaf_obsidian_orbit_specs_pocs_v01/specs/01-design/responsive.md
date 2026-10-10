# Responsividade

Breakpoints são de conteúdo, não de dispositivo: compact `< 640px`, tablet `640–1023px`, wide `>= 1024px`; usar CSS container queries quando necessário.

| Componente | Desktop | Tablet | Mobile |
|---|---|---|---|
| Hero | tipografia à esquerda, arte 3D à direita, CTAs na dobra | arte atrás com overlay | copy acima da arte, CTA primeiro, 3D reduzido |
| Projetos | card central dominante + laterais | 1.4 cards visíveis | 1 card + controles/título claros |
| Timeline | layout duas colunas sticky limitado | duas colunas simples | lista vertical linear sem sticky |
| Header | links visíveis | navegação compactada | botão Menu e links acessíveis |
| Explore Mode | canvas limitado e opt-in | simplificado | opcional, preferir lista |

## Testes mínimos
360x800, 390x844, 768x1024, 1024x768, 1366x768, 1440x900, 1920x1080; orientação paisagem; zoom 200%; fonte aumentada; touch; teclado.

Garantias: sem rolagem horizontal involuntária, texto não cobre arte nem botões, sem hover-only features, safe-area respeitada, imagens responsivas com aspect-ratio e dimensions.
