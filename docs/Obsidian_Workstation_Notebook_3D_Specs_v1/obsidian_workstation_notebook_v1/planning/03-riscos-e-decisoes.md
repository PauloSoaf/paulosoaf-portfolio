# 03 — Riscos, dependências e decisões explícitas

| Risco | Probabilidade | Impacto | Mitigação / dono |
|---|---|---|---|
| Sites reais impedem embedding por XFO ou CSP frame-ancestors | Alta/incerta, **não verificada** | Crítico | Preflight e autorização de configuração nos próprios deploys; Gate G-EMBED antes da POC final |
| CSP atual `default-src 'self'` bloqueia iframe externos | Confirmado pelo código | Crítico | Adicionar `frame-src` estritamente allowlisted, preservar XFO/frame-ancestors do parent |
| Trackpad/teclado 3D não controlam DOM cross-origin como um navegador real | Limite de plataforma | Alto | Native DOM focus + mouse/teclado reais; bridge cooperativa por `postMessage` apenas se autorizada |
| HTML projetado na tela 3D fica distorcido, interceptado ou ilegível | Média | Alto | Comparar Drei Html vs DOM overlay 2D; `FOCUS_SCREEN` responsivo obrigatório |
| Física rouba gestos de sites ou scroll da página | Alta se acoplada | Alto | State machine por modo; hitboxes separadas; pointer capture somente ao manipular chassi |
| Fratura de mesh em runtime custa muito e quebra no mobile | Alta | Médio/alto | Fragmentos pré-construídos, instancing, limite de corpos, pause/restore |
| OS vira distração e tira foco de contratação | Média | Alto | CTAs fora do notebook, mini OS limitado, rota de saída clara; avaliação de visitantes |
| 3D + iframe + Monaco + Rapier aumenta LCP e RAM | Alta | Alto | Lazy por modo, load on intent, limite de DPR, não iniciar três bundles juntos |
| CSS3D iframe vazando por oclusão da tampa | Média | Médio | screen mounted só com tampa aberta, clipping/projeção, modo focus screen |
| Código privado ou de projetos comerciais vaza pelo Dev Mode | Média se geração improvisada | Crítico | Manifesto allowlist build time + scanning + aprovação por arquivo |
| Domínio de Déborah não resolve/redirect altera canonical | Não verificado | Alto | Confirmar IDN/punycode, TLS, final URL e permissão antes de marcar demo verificada |
| Modelos/teclas/metais de asset externo sem licença adequada | Média | Médio | Modelo próprio primeiro; licenças verificadas e atribuições registradas |
| Estado quebrado em reload/anchor i18n | Média | Médio | Restaurar estado seguro, não persistir navegação cross-origin, E2E |
| CI mostra green embora visual continue comum | Já observado anteriormente | Médio | Gate de vídeo real, review usuário, POC vertical antes de melhorias incrementais |

## Decisões para aprovar no P00
- **D01**: laptop dinâmico posicionado ao lado dos componentes, jamais split 50/50 fixo.
- **D02**: tela real DOM e browser real quando host permite; foco 2D no mobile.
- **D03**: Core code **somente portfólio**, extraído de SHA do build.
- **D04**: WorkbenchOS próprio, não kernel Linux nem shell arbitrário.
- **D05**: física é modo distinto da interação web; quebra virtual reversível.
- **D06**: aproveitar canvas/runtime companion já existente; feature flag para rollback.
- **D07**: sem aprovar `draft` automaticamente; conteúdo continua sujeito ao gate editorial.
- **D08**: RF-006 e RF-007 dependem de configuração/autorização nos sites filhos; sem simulação enganosa.

## Rollback
Feature flag desliga workstation e retorna ao Hero/Carrossel/Timeline anteriores sem alterar `project-data` aprovado. Não remover a escultura e a timeline antes de registrar vídeo e testes comparativos. Branch isolada sem merge automático.
