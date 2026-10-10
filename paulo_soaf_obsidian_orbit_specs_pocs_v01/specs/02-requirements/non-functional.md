# Requisitos não funcionais (RNF)

| ID | Prioridade | Critério |
|---|---|---|
| RNF-001 | P0 | Core Web Vitals 'bom' como meta p75: LCP <= 2,5s; INP <= 200ms; CLS <= 0,1. Medir em campo após publicação. |
| RNF-002 | P0 | WCAG 2.2 AA como alvo; testes automatizados e manuais; pausa/carrossel, semântica e foco. |
| RNF-003 | P0 | Sem WebGL/JS, nomes, projetos, experiência, navegação e contato continuam visíveis e utilizáveis. |
| RNF-004 | P0 | Responsivo a partir de 360px, sem scroll horizontal e sem CTA coberto. |
| RNF-005 | P0 | TypeScript strict, lint, teste, typecheck e build obrigatórios em CI. |
| RNF-006 | P0 | Conteúdo/links em build pública aprovados e sem dados inventados; proteção à confidencialidade. |
| RNF-007 | P1 | Cena 3D adaptativa: DPR limitado, poucos draw calls, pausa fora da viewport, recursos descartados corretamente. |
| RNF-008 | P1 | Imagens locais com alt, dimensão, formatos otimizados, lazy-loading para abaixo da dobra. |
| RNF-009 | P0 | CSP adequada, dependências auditadas, nenhum segredo embutido no cliente. |
| RNF-010 | P1 | Internacionalização sem misturar idiomas, canonical/hreflang consistentes. |
| RNF-011 | P1 | Rastreabilidade de sprint, ADR e histórico de mudanças. |
| RNF-012 | P0 | Controle por teclado e suporte `prefers-reduced-motion` para animações não essenciais. |
| RNF-013 | P1 | O site pode fazer deploy estático sem necessidade de backend quando não usar features server-only. |
| RNF-014 | P1 | O primeiro HTML útil aparece antes do código/asset WebGL pesado; canvas em chunk separado. |

## Medidas complementares propostas (orçamento inicial, não garantia)
- JS inicial alvo <= 180 kB gzip **na rota principal excluindo WebGL lazy**; ajustar após testes reais, sem confundir com total de chunks baixados.
- Hero WebGL: meta de >= 50 FPS em desktop de referência e >= 30 FPS em mobile médio compatível. Medir em aparelhos reais, com fallback degradado.
- Não adicionar autoplay de vídeo na primeira dobra, salvo justificação e testes.
