# ADR-015 — Workstation P00/P01: notebook e tela DOM

Data: 14/10/2026. Base: `5c607eb17d29d536620e0cd2080f8202586441b3`. Branch: `feat/workstation-notebook-poc`.

## Decisão e escopo

Executar P00 + P01 do [prompt fornecido pelo proprietário](../Obsidian_Workstation_Notebook_3D_Specs_v1/obsidian_workstation_notebook_v1/agents/PROMPT-CLAUDE-CODEX.md). A landing anterior continua disponível. `/pt/workstation-lab`, `/en/workstation-lab` e `/es/workstation-lab` substituem somente a ilha da arte por notebook procedural. A rota existe em desenvolvimento ou no build com **ambas** `PORTFOLIO_CONTENT_PREVIEW=1` e `EXPERIMENTAL_WORKSTATION=1`; recebe noindex. Um build público normal responde 404 para laboratório e fixture. Física, jogo, teclado/trackpad virtual e manifesto de fontes permanecem P02–P07 conforme a ordem do pacote. Code é um stub identificado como P03, sem snippets fictícios.

## Um Canvas, posição por âncoras

O `HeroEditorial` recebe opcionalmente a ilha experimental, reaproveitando a árvore editorial Server Component (`LandingContent`), tokens, filtros, carrossel e MotionRuntime. Não monta `HeroArtBoundary`/escultura e notebook simultaneamente. O padrão do portal/body e amostragem passiva por rAF da `companion.ts` foi reaproveitado, com um controlador de posição específico para os retângulos reservados do Hero e Work. A câmera/assembly têm dono único na nova cena. Não se colocou o notebook dentro do controlador antigo, que possui orb, gestos e movimento ambiente próprios.

Desktop usa diferentes áreas do Hero e Work, sem reservar uma coluna global nas demais seções. Tablet/mobile usam a cena reservada no fluxo e foco plano para conteúdo denso. O notebook sai da viewport com a seção; a composição completa por toda a página é P06. Nenhum wheel é interceptado e os links de seção permanecem nativos, inclusive no laboratório sem JS. Troca de idioma navega para o mesmo laboratório e âncora, reiniciando uma sessão segura; troca de tema preserva o Canvas e app atuais.

## Comparação obrigatória das telas

| Alternativa testada | Resultado local | Decisão |
|---|---|---|
| Drei 10.7.9 `Html transform`, peers React ^19 / R3F ^9 / Three >=0.159 | Notebook renderizou, wrapper da tela permaneceu vazio em dev e build otimizado Chromium; em dev houve aviso de unmount síncrono de root. Nenhum DOM clicável. A causa interna não foi comprovada. | Rejeitada nesta POC, sem desligar StrictMode ou alterar versões do projeto. Dependência removida após o experimento. |
| DOM externo projetado pela matriz do display + câmera ortográfica | Desktop, input, clique e wheel funcionaram; a tela acompanha tampa e pose; foco permanece na árvore React/DOM da página. | Adotada. Nenhuma biblioteca nova necessária. |

As duas implementações foram executadas; `docs/report/Workstation/dom-comparison.json`, imagens e protótipo preservam o ensaio bruto fora do Git. Os resumos/evidências selecionadas ficam no QA. A [documentação do Html](https://drei.docs.pmnd.rs/misc/html) prevê projeção matrix3d e limitações de nitidez/oclusão; não se conclui que todo uso de Drei falha por este teste específico.

A câmera ortográfica transforma os três cantos do display em uma matriz CSS afim exata. Não se usa bounding box como aproximação de uma câmera em perspectiva. A camada DOM é criada **fora** do reconciliador R3F; a cena atualiza somente seu transform e visibilidade por refs. A mudança para perspectiva exigirá homografia/matrix3d e nova validação. Face traseira/tampa fechada/manipulação/foco/saída da viewport removem ou desativam a superfície. O foco abre `dialog.showModal()` com Escape, saída explícita e retorno ao acionador. A seleção do app é preservada; o iframe é remontado ao trocar apresentação ou fechar tampa, sem manter uma sessão invisível.

## Input e renderização

Reducer tipado valida IDs, ângulo finito/limites e três eixos. Rotação começa somente em chassis/tampa após limiar horizontal; teclado, trackpad e tela têm classificação separada. Gesto vertical permanece rolagem nativa. As teclas/trackpad do modelo são hit targets preparados, sem comandos falsamente funcionais. Mouse e teclado físicos usam o DOM/iframe diretamente. O trackpad virtual não acessa websites cross-origin.

Canvas usa `frameloop="demand"`, damping até repouso, DPR limitado e pausa offscreen/aba oculta. Reduced-motion/Save-Data não iniciam 3D automaticamente, mas preservam foco 2D e opt-in. Malhas, atlas das legendas e materiais são autorais e descartados ao desmontar. O perfil informa CPU de `gl.render`, frames e triângulos; isso não é medição de FPS/GPU ou aparelho físico. A estratégia segue o [render sob demanda do R3F](https://r3f.docs.pmnd.rs/advanced/scaling-performance).

A primeira corrida mobile detectou carga 3D prematura com apenas um peek do objeto. O carregamento automático passou a exigir 55% da cena visível no mobile (o render, depois de carregado, pode continuar enquanto a superfície estiver parcialmente visível). Novo E2E cobre o gate. A tela 2D não depende desse limiar. Lighthouse mobile melhorou de 66/TBT1330ms para 92/TBT123,5ms; LCP3,22s ainda não atinge a meta de 2,5s.

## Iframes e fronteira editorial

URLs do proprietário ficam num registro separado, sem aprovar `demo`, draft ou conteúdo comercial. O estado `verified-local` significa exclusivamente teste anônimo local de 14/10/2026. Não existe navegador de URL livre, proxy, acesso ao DOM filho pela aplicação ou ponte postMessage simulada. Sandbox externo permite somente scripts e mesma origem do **filho**, sem forms/popups/top navigation; links externos são ações explícitas da moldura. A fixture opaca permite apenas scripts.

A CSP global mantém `frame-ancestors 'none'`/XFO DENY e explicita `frame-src 'self'`. Somente o laboratório habilitado permite as duas origens finais exatas. Somente a fixture habilitada recebe `frame-ancestors 'self'`/SAMEORIGIN. GET/redirects e navegação real são separados do `onload`; a aplicação não apresenta onload como prova de autorização. [MDN frame-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-src) e [frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors) explicam as duas políticas independentes.

RF-006/007 ainda dependem de revalidação no futuro domínio HTTPS e aceite de publicação. O teste local não aprova o gate de release. Nenhum conteúdo editorial, contato, licença ou dado profissional foi aprovado nesta entrega.

## Rolagem solicitada pelo proprietário

Scrollbar nativa de 14px com thumb arredondado, cores dos tokens em Dark/Light e acento discreto ao hover. Padrões Firefox e pseudos WebKit têm regras distintas para evitar que `scrollbar-color` suprima os pseudos. Forced-colors conserva controles do sistema. Não há biblioteca de smooth scroll, interceptação de wheel ou substituição da navegação natural. O gutter motivou reduzir em 2px o gap dos controles mobile do carrossel, preservando espaço do botão textual e alvos de 44px.

## Validação e pendências

Resultados e arquivos: [P01 QA](../qa/Workstation/P01/REPORT.md), [matriz de incorporação](../qa/Workstation/P00/EMBED-MATRIX.md). Firefox/WebKit, leitor de tela manual, aparelho físico, domínio HTTPS e aceite artístico devem ser explicitamente registrados como não validados quando indisponíveis. P01 não conclui os vinte RFs do pacote inteiro.
