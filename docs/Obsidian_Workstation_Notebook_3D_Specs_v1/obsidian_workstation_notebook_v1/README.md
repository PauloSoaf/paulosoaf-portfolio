# OBSIDIAN WORKSTATION — Notebook 3D vivo
**Pacote de especificações v1.0 | 14/10/2026 | PauloSoaf/paulosoaf-portfolio**

## Direção aprovada pelo proprietário
O notebook **não** ocupa uma metade fixa da viewport. Ele convive **ao lado dos componentes editoriais**, desloca-se, aproxima-se, muda pose/escala ao longo do scroll e permite manipulação 3D. É um objeto físico e o centro funcional da experiência, não um mockup nem um elemento decorativo.

Dentro da tela há um sistema operacional web **autoral e leve** com modo Desktop, Preview real de sites e Code somente do **próprio portfólio**. É possível abrir/fechar tampa, girar, arrastar, erguer, arremessar na parede e quebrar o notebook em uma simulação gráfica reversível, com um botão **Restaurar notebook**. Trackpad e teclado são controles interativos reais da interface do nosso sistema; páginas externas continuam sujeitas às regras do navegador.

Os sites que o usuário exige navegar **de verdade e com scroll na tela do notebook** são `https://www.nutriopus.com.br/` e `https://xn--advogadadborahlima-jwb.com.br/` (domínio informado em conversa; validar canonical, redirect, certificado e autorização). **Não simular sites com prints dizendo ser sites reais**.

## O que existe no ZIP
- `specs/00-escopo-e-ux.md` — narrativa, fluxo visual e interação; sem split-screen fixo.
- `specs/01-requisitos-funcionais.md` — **20 RF** numerados RF-001 a RF-020.
- `specs/02-requisitos-nao-funcionais.md` — **10 RNF** numerados RNF-001 a RNF-010.
- `specs/03-arquitetura.md` — componentes, integração com o código auditado, estados e diagramas.
- `specs/04-3d-fisica-controles.md` — dobradiça, teclado, trackpad, arremesso, colisão, dano e reset.
- `specs/05-browser-sites-reais.md` — embed real, CSP, testes, limites legais de cross-origin e fallbacks transparentes.
- `specs/06-code-mode-e-mini-os.md` — source map seguro do portfólio e mini desktop sem executar código arbitrário.
- `specs/07-acessibilidade-seguranca.md` — DOM, focus, sensores/ponteiros, policies e segurança.
- `planning/01-roteiro-tecnico.md` — execução em fases, dependências, tarefas, estimativas relativas e gates.
- `planning/02-testes-criterios-de-aceite.md` — QA reproduzível, testes de navegador, física e prova visual.
- `planning/03-riscos-e-decisoes.md` — matriz de risco, ADRs e escolhas reversíveis.
- `research/10-referencias-web.md` — **10 fontes web** oficiais verificadas e aplicadas à tarefa.
- `research/10-referencias-github.md` — **10 repositórios GitHub** verificados via API e aplicados à tarefa.
- `agents/PROMPT-CLAUDE-CODEX.md` — prompt de execução pronto para enviar.
- `examples/contracts.ts` — contratos de TypeScript **ilustrativos**; não são código existente nem uma implementação funcional.

## Código efetivamente auditado
- Repositório: https://github.com/PauloSoaf/paulosoaf-portfolio
- Branch-base mais avançada em 14/10/2026: `feat/creative-direction-recovery`
- HEAD: `5c607eb17d29d536620e0cd2080f8202586441b3` (contador + escultura 3D percorrendo a página).
- Branch `main`: `ea3cf243094ba524335c6e367467c8bbf6107574` (somente S00).
- Stack confirmada: Next 16.3.8, React 19.3.0, TS 5.9.3, Three 0.186.1, R3F 9.8.1, Tailwind 4.3.3; **sem Drei nem Rapier instalados** na base auditada.
- Não houve edição ou push no repo. Este ZIP é **planejamento, não patch**.

## Bloqueador crítico
O usuário solicita sites vivos navegáveis DENTRO do notebook. Não foi possível verificar hoje o status HTTP/headers dos dois domínios; acesso DNS externo não estava disponível no ambiente de inspeção. Não alegar que embed funciona até ver prova Chromium. Há dois lados da autorização: **CSP `frame-src` da página pai** (hoje ausente => `default-src 'self'` bloqueia externo) e **`frame-ancestors`/`X-Frame-Options` do site filho** (precisa permitir o domínio público do portfólio). Cross-origin também impede o controle do DOM externo pelo trackpad virtual sem cooperação. Ler `specs/05-browser-sites-reais.md` ANTES da POC.

## Critério de sucesso
Visitante vê o notebook 3D ao lado do conteúdo, abre NutriOpus real dentro de sua tela e rola/clica nesse site, volta ao nosso desktop, inspeciona código **do portfólio**, gira/fecha/arremessa/restaura o aparelho, tudo sem perder acesso ao conteúdo e CTAs. Se incorporação real estiver bloqueada, **não declarar requisito concluído**; registrar bloqueio e oferecer ação explícita de abrir o domínio real em nova aba enquanto a autorização é resolvida.

## Princípio de implementação
POC mínima vertical antes de refazer a home: 1 notebook 3D com tampa + 1 tela DOM clicável + 1 site de teste sob controle nosso + 1 binding de código + 1 impacto/restore. Depois ligar os dois domínios reais e testar suas políticas. Não implementar mini Linux antes de provar 3D↔DOM↔iframe↔física.
