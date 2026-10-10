# ADR-010 — Carrossel cinematográfico e catálogo comercial (S02)

Status: implementado por Codex na branch `feat/s02-cinematic-projects`, criada a partir de `758557ecc342875ce098f6912cc26d14bf3fc284`. Referências: S02-carousel, POC-002 e identidade Obsidian Orbit **v0.1**. Não houve mudança nos tokens.

## Conteúdo no servidor, interação numa ilha

`WorkSection` continua no servidor, recebendo somente projetos filtrados por `visibleItems`. Ordena uma cópia pelo `featuredOrder`, mantendo todos os candidatos secundários ao final. Reutiliza `ProjectCard` como conteúdo de cada slide, sem enviar catálogo completo, notas editoriais ou dicionário completo para o controlador. O título, resumo, stack e ações continuam no HTML. Sem JS, todos os artigos ficam numa lista visual linear/grid e os controles de rotação não existem.

`ProjectCarousel.client.tsx` promove esse HTML após hidratação, detectada por `useSyncExternalStore` com snapshots servidor/cliente coerentes. O reducer puro mantém seleção por slug; `selectedIndex` é derivado da lista atual. Assim, reordenar não troca silenciosamente o projeto e remover o selecionado retorna ao primeiro. Listas vazia/única não iniciam timers. Observadores/listeners são montados na ilha já hidratada e encerrados no cleanup. O nó montado é acompanhado por callback ref/estado: uma leitura nullable única de `host.current` falhou intermitentemente na hidratação, deixando a seção sem observação; o diagnóstico confirmou ausência de entradas nativas. Um timeout de 7 segundos por ciclo é cancelado quando deixa de ser elegível; não existe intervalo global.

O estágio usa grid com todos os slides na mesma célula, reservando a altura do maior conteúdo. Transições modificam `transform` e `opacity`; vizinhos usam escala 0,79 e perspectiva discreta desktop. Mobile remove `rotateY`, usa largura 92% e conserva uma faixa de continuidade. A seção não captura wheel nem scroll. O movimento é interrompível, sem fila de animações ou biblioteca adicional. CSS/DOM substituem a POC, sem canvas por projeto.

## Acessibilidade e gestos

Seguimos o [padrão básico WAI/APG](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) e o [tutorial WAI](https://www.w3.org/WAI/tutorials/carousels/). O controle de reprodução vem primeiro no DOM/Tab, embora anterior/próximo apareçam primeiro visualmente como na POC. O nome do botão descreve sua próxima ação; não combinamos label variável com `aria-pressed`. Slides inativos usam `aria-hidden` e `inert`, impedindo que links invisíveis recebam foco. Setas atuam somente quando o estágio está focado; links conservam seu comportamento nativo.

Autoplay exige `isPlaying`, visibilidade da seção/aba e ausência de hover/foco/drag/reduced motion. Entrada de foco **encerra a intenção de autoplay até um pedido explícito de reprodução**, mesmo quando o foco sai. Essa regra WAI é mais conservadora que a retomada por blur na POC. Hover/viewport/aba apenas suspendem uma intenção previamente ativa. Pausa manual nunca se desfaz automaticamente. Reduced motion remove transições e impede reprodução automática. Um `role=status` anuncia somente mudanças iniciadas pelo usuário.

Pointer Events aceitam mouse e touch, com limiar de 40 px e `touch-action: pan-y pinch-zoom`. Pressionar suspende rotação; movimento vertical abandona o gesto e deixa o navegador rolar. Captura horizontal permite terminar fora do card. A perda de captura implícita de um filho touch é ignorada quando a captura passa ao estágio; perda do próprio estágio cancela. Clique decorrente de drag é suprimido, e um novo pointerdown libera o próximo clique intencional. Mudanças de catálogo encerram sessões pendentes.

## Mídia e ações

`ProjectMedia` reserva a mesma proporção antes/durante/depois do download. O contexto desacoplado do carrossel permite imagens somente do ativo e adjacentes após hidratação; no HTML sem JS todas ficam lazy. O ativo visível recebe carregamento eager/prioridade high. Falha restaura arte vetorial local por identidade: nutrição/dashboard abstrato, composição editorial, espaço, tabuleiro, telemetria, jogos e campo acadêmico. Imagens carregadas ocultam o fallback, evitando sobrepor ilustrações transparentes. Toda arte conceitual tem legenda explícita; não é captura de entrega.

O modelo acrescenta tipo, ordem, política de exposição do código, verificação de stack, identidade gráfica e disponibilidade futura do case. `image` continua opcional. `repository` e `demo` continuam opcionais e tipados como `VerifiedLink`; a presença de `demo` é a disponibilidade de aplicação pública, evitando booleanos contraditórios. Repositórios só aparecem se `sourceVisibility=public`. O validador rejeita código privado exposto, ordem inválida e case anunciado sem registro de rota. Nenhuma rota de case existe em S02 e nenhuma ação fictícia é renderizada; criação de cases pertence à S04.

NutriOpus e Déborah Lima são `draft`, com stack pendente, sem imagens reais, sem demo/repositório e sem métricas comerciais. O gate de aprovação exige stack confirmada além de desafio/contribuição. Os filtros/release gate anteriores não foram afrouxados. A origem dos novos dados é exclusivamente o prompt do proprietário, registrada no catálogo e no documento de pendências.

## Contrato opcional de cena

O host emite `portfolio:project-change`, evento DOM com `bubbles=true` e `detail={slug, selectedIndex}`, após hidratação/mudança de seleção. Não há assinatura do Hero, importação de Three, alteração de materiais ou dependência WebGL nesta sprint. Uma integração futura pode observar esse evento sem modificar a navegação.

## Correção de estabilidade descoberta no perfil

As primeiras amostras registraram CLS mobile 0,115 no Lighthouse público e 0,121 no perfil da prévia. Os logs de retângulos apontaram troca de fonte antes de qualquer interação: o fallback gerado para IBM Plex Mono usava Arial com `size-adjust:134.59%`. A largura proporcional fazia o selo do Hero ocupar duas linhas e o aviso editorial mais linhas; após a fonte real carregar, a altura diminuía e movia o conteúdo abaixo.

`src/app/fonts.ts` preserva IBM Plex Mono, seus pesos, `display=swap` e download deferred, mas usa `adjustFontFallback=false` e fallback local `Courier New, monospace`. Display/body e preloads anteriores permanecem. A API foi conferida em `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`. A mudança não redesenha o Hero nem muda sua cena ou fonte final. Um E2E bloqueia somente os WOFF2 mono e compara altura do selo/topo do título antes e depois da liberação. Amostras anteriores continuam nos diagnósticos, sem ocultar a regressão encontrada.

Resultados, evidências e limites de medição: [QA S02](../qa/S02/REPORT.md). Não foram implementadas S03/S04, Explore Mode ou Obsidian Dev Mode.
