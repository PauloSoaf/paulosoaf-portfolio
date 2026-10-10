# Roadmap e dependências

## Estratégia
Incremental e comercialmente útil desde a primeira entrega. Não construir game engine no portfólio. Publicar depois de S05; S06 opcional.

| Sprint | Escopo | POC principal | RFs |
|---|---|---|---|
| S00 | Fundação, tokens, conteúdo e shell | Referências locais | RF-001/002/010/019 |
| S01 | Hero WebGL progressivo | POC-001 | RF-001/003/011/012 |
| S02 | Carrossel cinematográfico | POC-002 | RF-004/005/013/017 |
| S03 | About & timeline | POC-003 | RF-007/019 |
| S04 | Case studies, serviços, contato, PT/EN | UX completa | RF-006/008/009/014/020 |
| S05 | QA, SEO, performance, deploy e lançamento | Gates | todos P0/P1 |
| S06 | Explore Mode opt-in | POC-004 | RF-016 |

## Dependências e bloqueadores
- S00 exige validar contatos, currículo, projetos e permissão de conteúdo.
- S01 depende do shell e art fallback de S00.
- S02 precisa de dados aprovados, pelo menos 3 cards reais.
- S03 precisa de experiências revisadas.
- S04 depende de seleção editorial final e tradução revisada.
- S05 depende do QA dos anteriores e estratégia de deploy definida.
- S06 depende de MVP estável e interesse real.

## Riscos classificados
R1: superengenharia do 3D (alto) → limite de escopo/performance.
R2: conteúdo corporativo não publicável (alto) → cases pessoais prioritários.
R3: visuais quebrados em mobile (alto) → QA de 360px por sprint.
R4: links/demo falsos ou quebrados (alto) → verificação pré-publicação.
R5: autoplay ruim para acessibilidade (médio) → pause/reduced motion/teclado.
R6: divergência entre IA e design (alto) → comparar snapshots e regras de tokens.

## Backlog futuro (fora do roadmap)
Itens aprovados conceitualmente, sem sprint e sem autorização de implementação, ficam em `backlog-future.md`
(ex.: `FEATURE-FUTURE-001` Obsidian Dev Mode / `POC-006`). Não alteram a ordem nem o escopo de S00–S06.
