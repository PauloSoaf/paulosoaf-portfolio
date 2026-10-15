# PROMPT MESTRE PARA CLAUDE/CODEX — Obsidian Workstation 3D

Você é Staff Creative Engineer, Tech Lead React/Next.js, especialista em Three.js/R3F, DOM 3D, física Rapier, UX interativa, acessibilidade, segurança de iframe e arquitetura de aplicações.

## Repositório e base
`PauloSoaf/paulosoaf-portfolio`, URL `https://github.com/PauloSoaf/paulosoaf-portfolio`.

A auditoria de 14/10/2026 encontrou como branch mais avançada `feat/creative-direction-recovery`, SHA `5c607eb17d29d536620e0cd2080f8202586441b3`, que já tem um único Canvas 3D acompanhando seções via portal e Core CreativeRuntime. **CONFIRME HEAD local/remoto antes de fazer qualquer escrita.** A `main` permanecia na S00. Leia `AGENTS.md` e respeite as regras Next 16 geradas.

## O que o proprietário quer — NÃO NEGOCIAR A INTENÇÃO

1. **Não quer a tela dividida fixamente ao meio**. O notebook fica **ao lado dos componentes** numa composição dinâmica, artística, interativa e integrada ao scroll; pode reposicionar-se, girar e acompanhar seções sem ocupar 50% constante.
2. Quer notebook **3D REAL** e explorável: girar, mexer, usar a tela, abrir/fechar tampa, usar as teclas e trackpad renderizados, pegar, arremessar contra parede virtual, sofrer impacto, **quebrar visualmente** e restaurar.
3. A tela do notebook é funcional: mini OS **nosso e leve**, com apps reais úteis, sem emular Linux completo. Um `×` no canto superior direito retorna de Preview/Code ao Desktop.
4. Projetos clicados na página abrem **sites verdadeiros dentro da tela do notebook**, navegáveis e com scroll: `https://www.nutriopus.com.br/` e `https://xn--advogadadborahlima-jwb.com.br/` (confirmar canonical). **Não substituir por screenshot fingindo browser real.**
5. O modo código exibe **somente código do próprio portfólio**, nunca código do NutriOpus, Déborah, clientes ou software corporativo.
6. O usuário precisa navegar por mouse/teclado físico diretamente nos sites abertos. Trackpad e teclas do notebook 3D controlam **nosso OS local** e só controlam site externo se houver ponte cooperativa autorizada; não falsear funcionamento cross-origin.

## Receba este ZIP como contrato
Leia todos os arquivos, especialmente:
- `README.md` (estado auditado e bloqueadores);
- `specs/00-escopo-e-ux.md`;
- `specs/01-requisitos-funcionais.md` (**20 RF**);
- `specs/02-requisitos-nao-funcionais.md` (**10 RNF**);
- `specs/03-arquitetura.md`;
- `specs/04-3d-fisica-controles.md`;
- `specs/05-browser-sites-reais.md`;
- `specs/06-code-mode-e-mini-os.md`;
- `specs/07-acessibilidade-seguranca.md`;
- `planning/01-roteiro-tecnico.md`;
- `planning/02-testes-criterios-de-aceite.md`;
- `planning/03-riscos-e-decisoes.md`;
- `research/10-referencias-web.md`;
- `research/10-referencias-github.md`;
- `examples/contracts.ts` (somente tipos ilustrativos).

## Fase que você deve executar AGORA
**P00 + P01**. Faça um **vertical slice/POC** funcional: notebook 3D ao lado de conteúdo, tampa e giro, tela DOM com mini desktop, primeiro iframe de fixture sob nosso controle com scroll/click, modo de foco 2D e botão X. Comece também P00 para embeddability dos dois domínios reais; só declare RF-006/007 possíveis após teste real e autorização. Não implementar física destrutiva, jogos, snippets completos nem redesign global antes de provar DOM+3D+scroll+foco. Criar branch `feat/workstation-notebook-poc` a partir do HEAD mais avançado, sem descartar código.

### Auditoria de código obrigatória
1. Ler `src/app/[locale]/page.tsx`, `src/components/hero/HeroEditorial.tsx`, `src/features/creative/CreativeRuntime.client.tsx`, `src/features/creative/companion.ts`, `src/components/hero/HeroArtBoundary.client.tsx`, `src/graphics/hero/HeroScene.client.tsx`, `src/features/projects/project-data.ts`, `src/components/carousel/ProjectCarousel.client.tsx`, `src/features/content/visibility.ts`, `src/theme/theme-client.ts`, `next.config.ts`.
2. Descrever como aproveitar o Portal/Canvas existente. Não criar segundo Canvas global sem prova técnica e justificativa.
3. Comparar 2 alternativas de tela interativa: Drei `<Html transform>` vs camada DOM 2D projetada por matriz; testar clique/scroll/focus e oclusão no Chrome/Firefox/WebKit quando possível.
4. Verificar `frame-src` da CSP pai; **hoje não existe**, `default-src 'self'` bloqueará domínios externos. Verificar XFO/frame-ancestors nas respostas filhas, canonical/redirects e cookies. A infraestrutura dos domínios pode precisar de ajuste; não suprimir headers do servidor filho com proxy.
5. Confirmar compatibilidade das novas bibliotecas com versões travadas de Next/React/R3F/Three. Não atualizar o projeto inteiro sem motivo.

### Implementação POC
- Uma máquina de estados tipada controla `DESKTOP`, `PREVIEW`, `CODE` (stub autorizado do próprio portfólio), `FOCUS_SCREEN`, `MANIPULATE`, `BROKEN` (estado placeholder sem simular física completa agora).
- O notebook 3D procedural tem base, tampa pivot, moldura, teclado e trackpad visíveis. O teclado/trackpad devem ser *hit targets* preparados para etapas futuras, não elementos enganosos declarados como funcionais antes de conectar comportamentos.
- Um app Browser controlado aceita primeiro fixture rolável local; garantir foco de iframe e botão X persistente fora do frame.
- Projeto selecionado provoca mudança de estado e animação de aproximação do notebook no contexto do Work.
- Projeto comercial externo deve ter status **não-verificado/bloqueado** enquanto não confirmado; se possível testar no mesmo ciclo, registrar screenshots/console e permiti-lo com CSP específica.
- Mobile: não renderizar iframe minúsculo no modelo; botão Focar abre camada plana legível associada ao notebook, com ESC/back.
- Preservar tokens Dark/Light Obsidian Orbit e i18n PT/EN/ES, SSR e CTA. Sem CSS decorativo que bloqueia pointer.

### Critérios de entrega da POC
- Vídeo real: notebook ao lado do Hero/Work, abertura/fechamento, rotação, clique em desktop na tela, scroll real de fixture, X saindo do browser, tela focada mobile, fallback com JS/WebGL indisponíveis.
- Verificação separada para os 2 sites reais em `EMBED-MATRIX`, marcando `PASS/FAIL/UNKNOWN` e explicando headers/console; não inferir status de um `onload`.
- Unitários da máquina de estado/hitbox; E2E de pointer/keyboard/iframe; lint/typecheck/test/build/e2e antigos.
- Capturas desktop 1440x900 e mobile 390x844, PT/EN/ES Dark/Light, reduced motion; medir regressão LCP/CLS/INP e bundle de lazy scene.
- ADR da estratégia DOM e iframe, relatório `docs/qa/Workstation/P01/REPORT.md`, lista de bloqueadores reais.

## Continuação aprovada como backlog P02–P07
Após aceite da POC, seguir `planning/01-roteiro-tecnico.md`: sites live embeddable → source snippets somente portfolio → física destrutiva/reversível → teclado/trackpad/mini game → composição ao longo da página → hardening. Não antecipar P04 apenas para fazer vídeo de arremesso quando Browser DOM ainda estiver quebrado.

## Semântica de 'funcional'
- O site externo real precisa estar disponível via HTTPS, ser realmente iframe-embeddable e rolar/clicar dentro da tela; não usar clone/print como atalho.
- O trackpad 3D é útil para **nosso mini OS**; browser cross-origin só mediante colaboração ou input nativo direto.
- Arremessar é **jogo físico virtual**, com parede da cena, simulação e reset; não janela arrastável de 2D simulando queda.
- Code Mode exibe código real de componentes do portfólio e links SHA, com allowlist e sem segredos; não incluir código NutriOpus/Déborah.
- `X` próprio sempre disponível (overlay fora do iframe) mesmo com browser travado.

## Controle de versão
Não executar push, merge nem deploy sem autorização. Antes de concluir, informar SHA local, branch, arquivos modificados, testes, vídeos e decisões bloqueadas. Não marcar RF-006/007 concluídos sem evidência. **Se houver impedimento real no site remoto, avançar com a POC interna e reportar com precisão.**
