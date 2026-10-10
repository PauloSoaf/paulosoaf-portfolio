# Design system: Obsidian Orbit v0.1

## Princípios
1. **Editorial first**: legibilidade antes de espetáculo.
2. **Depth with restraint**: 3D como assinatura visual, não como obstáculo.
3. **Evidence over decoration**: casos reais com hierarquia consistente.
4. **Controlled motion**: movimento com propósito e pausa acessível.
5. **Commerce without noise**: CTAs claros, sem popup invasivo.

## Paleta (tokens exportáveis)
| Token | HEX | Uso |
|---|---|---|
| `bg.base` | `#090D11` | Fundo principal |
| `bg.surface` | `#141B20` | Cards e navegação |
| `bg.elevated` | `#233038` | Superfícies elevadas |
| `fg.primary` | `#F2F6F4` | Títulos |
| `fg.secondary` | `#A9B6B9` | Corpo e metadados |
| `accent.primary` | `#65E6C3` | CTAs, foco e destaques |
| `accent.secondary` | `#8A9CFF` | Efeitos pontuais |
| `border.subtle` | `#2B383D` | Separadores |
| `status.error` | `#FF8B83` | Erros |

Texto + componentes interativos devem observar contraste WCAG 2.2 AA. Valores brutos são ponto de partida, conferir contraste por combinação.

## Tipografia
- Título: Space Grotesk (alternativa system sans). 700/650, tracking negativo moderado, comprimento de linha controlado.
- Corpo: Inter (alternativa system sans), 400/500, altura 1.55-1.7.
- Metadados: IBM Plex Mono, 10-13 px, uppercase seletivo com tracking leve.
- Desktop hero `clamp(3.4rem, 7.4vw, 7.5rem)`; mobile `clamp(2.8rem, 11vw, 4.4rem)`.
- Texto base ~16 px, mínimo legível; evitar texto essencial com 10 px na implementação real.

## Layout
- Content max-width 1320 px; largura fluida `min(100% - 48px, 1320px)` desktop e 20 px padding mobile.
- Grid de 12 colunas desktop, 6 tablet, 4 mobile; gaps responsivos 16/24/32.
- Header fixo com fundo translúcido apenas quando houver contraste suficiente; altura ~72px desktop/64px mobile.
- Espaçamento 4,8,12,16,24,32,48,64,96,128 px. Bordas 10/16/24px; os cards de projeto usam raios discretos.

## Componentes
`SiteHeader`, `LanguageSwitch`, `HeroEditorial`, `HeroCanvas`, `HeroFallback`, `SectionEyebrow`, `SectionHeading`, `ProjectCarousel`, `ProjectSlide`, `CarouselControls`, `ProjectCaseHero`, `Timeline`, `ExperienceCard`, `SkillGroups`, `ServicesSection`, `ContactCTA`, `SiteFooter`, `ErrorBoundary`, `ReducedMotionSwitch`.

## Botões
- Primário verde-claro sobre preto, conteúdo concreto (`Ver projetos`, `Entrar em contato`).
- Secundário transparente com borda legível.
- Foco visível 2px ou maior com offset; alvo interativo dimensionado conforme diretriz de acessibilidade.

## Arte e atmosfera
- Planeta/forma procedural geométrica, iluminação rim light verde-água e sombras profundas.
- Linhas orbitais discretas, ruído mínimo, detalhes topográficos e stars sintéticos com densidade controlada.
- Não usar paisagens espaciais genéricas como placeholder final. A arte SVG local é uma referência de composição e fallback.

## Tokens fonte
Ver `assets/design-tokens.json`, que a implementação pode converter em CSS variables; mudanças devem sincronizar documento, tokens e screenshots de referência.
