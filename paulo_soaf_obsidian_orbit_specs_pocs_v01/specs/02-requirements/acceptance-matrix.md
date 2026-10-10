# Critérios de aceite rastreáveis

| AC | RF/RNF | Validação |
|---|---|---|
| AC-001 | RF-001 RNF-003 | JS desligado: texto do hero, CTA projetos e contato visíveis e clicáveis. |
| AC-002 | RF-003 RNF-014 | Canvas carrega após conteúdo; falha GL exibe SVG sem quebrar site. |
| AC-003 | RF-004 RF-005 | Controles anterior/próximo/pausar funcionam; foco interrompe autoplay; drag não abre link sem intenção. |
| AC-004 | RF-006 RF-010 | Cada case tem contribuições e links aprovados; nenhuma demo fictícia. |
| AC-005 | RF-007 RNF-003 | Timeline linear legível com CSS/JS desativados e eventos navegáveis por teclado. |
| AC-006 | RF-008 | E-mail/LinkedIn/CV aprovados; links válidos; não há `#` simulando ação. |
| AC-007 | RF-009 RNF-010 | Rotas PT/EN traduzidas, metadata localizada, idioma correto no HTML. |
| AC-008 | RF-012 RNF-012 | Reduced motion remove parallax/autoplay/cena animada, não remove informação. |
| AC-009 | RNF-004 | Viewports 360,390,768,1024,1440 testadas sem scroll horizontal indesejado. |
| AC-010 | RNF-001 | Lighthouse laboratório e Web Vitals instrumentados; metas medidas e relatadas sem alegar resultado sem medição. |
| AC-011 | RNF-005 | CI lint+typecheck+test+build; regressão de navegação e cases. |
| AC-012 | RF-018 RNF-002 | Mobile menu abre/fecha, Escape retorna foco, keyboard navigation completa. |
| AC-013 | RF-016 | Explore Mode não é obrigatório para acessar cases; sai com botão/Escape e fallback lista. |
| AC-014 | RNF-006 RNF-009 | Revisão de conteúdo e segredos no build; nenhuma informação corporativa restrita. |
| AC-015 | RF-013 RNF-007 | Se media/objeto ativo falha, navegação de projetos permanece funcional; nenhum vazamento de WebGL. |
| AC-016 | RF-019 RF-020 | Serviços, stack e repo links verificados são compreensíveis e coerentes. |

## Gates para revisão
- Design QA visual: screenshot `desktop/mobile` comparado aos `assets/mockups/`; anotar diferenças intencionais.
- Funcional: evidências dos ACs implementados na sprint, incluindo falha de mídia e teclado.
- Técnico: comandos executados, versão de dependências, métricas antes/depois quando aplicável.
