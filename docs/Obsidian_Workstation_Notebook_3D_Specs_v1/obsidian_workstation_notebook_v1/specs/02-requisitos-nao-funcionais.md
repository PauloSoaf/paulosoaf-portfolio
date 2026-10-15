# 02 — Requisitos não funcionais: 10 RNFs

| ID | Categoria | Requisito / orçamento inicial | Validação |
|---|---|---|---|
| **RNF-001** | Performance | Manter LCP mobile p75 de campo ≤ 2,5s e CLS ≤ 0,1; comparar também com baseline S03.5/CreativeFollowup. Não reivindicar cumprimento sem amostra de campo. | Lighthouse + Web Vitals/CrUX quando disponível + aparelho físico; carga lazy. |
| **RNF-002** | Renderização 3D | Perfil adaptativo, mínimo aceitável alvo 30 FPS no mobile suportado e 60 FPS desktop em cena ativa; zero render contínuo com laptop em repouso. Esses são **targets**, não medições. | PerformanceMonitor, trace FPS real, GPU/CPU, frame demand/physics sleep. |
| **RNF-003** | Acessibilidade | WCAG 2.2 AA como meta, teclado real, foco visível, labels de modes/close/reset, ordem DOM coerente e alternativa integral 2D. | Playwright/axe + teclado, leitor de tela manual, touch, 200% zoom. |
| **RNF-004** | Segurança de incorporação | Iframes externos em allowlist exata com CSP restritiva, sandbox testado, políticas do domínio filho respeitadas; sem proxy que remova headers. | Revisão headers reais, testes de iframe e console. |
| **RNF-005** | Segurança de código | Somente snippets allowlisted do repositório de portfólio; bloquear path traversal, `.env`, certificados, segredos, código corporativo e fonte de sites externos. | Scanner e testes negativos no gerador; manifest auditável. |
| **RNF-006** | Resiliência | Context loss, iframe indisponível, WebGL ausente, requisição lenta, JS off, site remoto alterado e falha de worker/physics não podem apagar conteúdo ou bloquear contato. | Testes de falhas e graceful degradation. |
| **RNF-007** | Responsividade/UX | Em 360/390/768/1024/1440/1920, conteúdo legível e notebook manipulável; frame externo nunca minúsculo/impraticável, `FOCUS_SCREEN` acessível. | Visual, controle de overflow, viewport E2E e device real. |
| **RNF-008** | Manutenibilidade | Integração modular com arquitetura existente, typed unions de estado, funcionalidades isoladas, sem Client Component global; scripts determinísticos e ADRs. | Typecheck strict, lint, testes unit/E2E e revisão. |
| **RNF-009** | Governança de assets e privacidade | Malhas/texturas licenciadas ou autorais, permissões comerciais explícitas para imagens/sites; não armazenar dados do usuário dos iframes nem reproduzir sessões. | Checklist de licenças, asset inventory e revisão de logs/cookies. |
| **RNF-010** | Orçamento progressivo | Novo 3D/OS/editor/physics carrega somente quando necessário e é medido separado; preservar JS inicial alvo ≤ 180 KB gzip **quando tecnicamente viável**, com exceções justificadas/aceitas por medição. | bundle analyzer/chunk stats por modo, auditoria no relatório da sprint. |

## Regra de qualidade
Visuais de vídeo não substituem testes; testes verdes não substituem aceite artístico. Não prometer 60 FPS em GPU mobile desconhecida. A física deve pausar ao repouso e desmontar recursos após restore, sem vazamento de corpos rígidos ou listeners.
