# Índice mestre de especificações

Status: DRAFT FOR IMPLEMENTATION | 10/10/2026. Decisões registradas são baselines propostas para Claude; ajustes só por ADR/registro de mudança.

| Categoria | Documento | Finalidade |
|---|---|---|
| Produto | `00-product/vision.md` | Visão, prioridades, limites |
| Produto | `00-product/personas-and-journeys.md` | Recrutador, gestor de TI, cliente de site |
| Produto | `00-product/goals-and-kpis.md` | Conversões e objetivos mensuráveis |
| Produto | `00-product/content-policy.md` | Fatos, privacidade, fontes, publicação |
| Design | `01-design/design-system.md` | Tokens, tipografia, gride, cores |
| Design | `01-design/screen-states.md` | Estados por tela e acessibilidade |
| Design | `01-design/motion-and-interaction.md` | Motion tokens e transições |
| Design | `01-design/responsive.md` | Estratégia responsive/mobile |
| Design | `01-design/moodboard-and-assets.md` | Mapas de mockups e SVGs |
| Requisitos | `02-requirements/functional.md` | RF-001... |
| Requisitos | `02-requirements/non-functional.md` | RNF-001... |
| Requisitos | `02-requirements/acceptance-matrix.md` | Critérios AC rastreáveis |
| Requisitos | `02-requirements/information-architecture.md` | Seções e rotas |
| Arquitetura | `03-architecture/architecture.md` | Estrutura Next/R3F |
| Arquitetura | `03-architecture/rendering-strategy.md` | SSR, progressive enhancement, GPU |
| Arquitetura | `03-architecture/data-model.md` | Conteúdo tipado, validação |
| Arquitetura | `03-architecture/testing.md` | Estratégia de regressão |
| Arquitetura | `03-architecture/adr/` | Decisões arquiteturais |
| POC | `04-pocs/POC-001-hero.md` | Hero com universo procedural |
| POC | `04-pocs/POC-002-carousel.md` | Carrossel cinematográfico |
| POC | `04-pocs/POC-003-timeline.md` | About interativo |
| POC | `04-pocs/POC-004-explore.md` | Explore Mode opcional |
| Entrega | `05-delivery/roadmap.md` | Ordem, dependências, riscos |
| Entrega | `05-delivery/S00..S06` | Plano de sprints e tarefas |
| Entrega | `05-delivery/definition-of-done.md` | Gate comum de qualidade |
| Entrega | `05-delivery/backlog-future.md` | Backlog futuro não agendado e IDs reservados |
| POC | `04-pocs/POC-006-developer-inspector.md` | Developer Inspector (futuro, não autorizado) |
| Futuro | `07-future/FEATURE-FUTURE-001-obsidian-dev-mode.md` | Obsidian Dev Mode (aprovado conceitualmente) |

## Convenções
- RF=Requisito Funcional. RNF=Não Funcional. AC=Critério de Aceite. POC=Prova de Conceito. ADR=Registro de Decisão Arquitetural.
- Prioridade P0 bloqueia MVP. P1 deve constar do MVP/primeiro pós-MVP. P2 opcional.
- Estados básicos: idle, loading, ready, interacting, paused/reduced-motion, fallback/error.
- Os valores sugeridos como metas (por exemplo performance) exigem medições reais após implementação.
- Assets são propriedade do pacote conceitual; não confundir com screenshots reais dos sistemas listados.
