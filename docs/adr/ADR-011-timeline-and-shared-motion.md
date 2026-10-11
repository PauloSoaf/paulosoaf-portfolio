# ADR-011 — Timeline e movimento compartilhado

Data: 10/10/2026. Status: implementado localmente na S03 ampliada, com aceite estético/editorial pendente.

## Contexto e fronteira

Base `66c8ff0` da S02. O proprietário autorizou timeline + Motion System entre as seções, preservando v0.1, scroll nativo e HTML útil sem JS. A direção visual da POC-003 foi examinada no mockup e aberta no Chromium; clique no segundo marco mudou o detalhe original. Seus períodos/empresas não são fatos aprovados. Os três capítulos temáticos herdados permanecem `draft`, sem alteração de texto ou criação de currículo fictício.

## Timeline

`AboutSection` continua servidor e passa conteúdo renderizado à ilha `JourneyTimeline`. SSR/no-JS/mobile usam uma lista ordenada completa. Desktop ≥64rem aprimora em tabs verticais à esquerda e painéis à direita; painel ativo exposto, demais `inert`/`aria-hidden`/`visibility:hidden`. A grid sobreposta reserva a altura máxima, evitando salto entre detalhes. Não duplica conteúdo de projeto nem transforma a landing em Client Component.

Seguindo [WAI Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), a seleção é imediata em clique/foco/setas Up/Down, com Home/End, wrap, roving tabindex, controles/painéis associados por IDs e painel no percurso Tab. Não há anúncio automático/live region durante scroll. Mobile preserva todos os artigos e headings na ordem de leitura, sem sticky.

Seleção é por ID; reordenação preserva a escolha e remoção volta ao primeiro. Lista vazia não cria widget; lista única não cria controle de acompanhamento. Desktop oferece sincronização **opt-in** por IntersectionObserver; escolha manual encerra o acompanhamento. No mobile, um observador destaca o capítulo em evidência sem esconder ou rolar conteúdo. Reduced motion suspende ambos; foco em conteúdo protege seleção. Callback ref acompanha o nó montado, evitando leitura única de ref durante hidratação.

## Movimento

`MotionRuntime` só instala comportamento no `main`; conteúdo e seções continuam servidor. `data-motion` tipa motivos rise/horizontal/depth/rule/settle. Uma implementação sem dependências anima por [WAAPI](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate), com tokens originais 280/550 ms, stagger limitado a 140 ms e easing aprovado. A API usa milissegundos; o parser aceita tokens computados tanto `280ms` como `0.28s`, normalizados pelo navegador. Um teste real detectou e corrigiu essa conversão.

Estado CSS/HTML padrão nunca recebe opacity 0, visibility hidden ou transform de reveal. Apenas um objeto Animation bem-sucedido adiciona estilos temporários com `fill:none`; cancelamento, API ausente/falha, no-JS e falha de hidratação deixam conteúdo visível. Na primeira dobra/chegada por âncora/reload no meio, os elementos já visíveis são ignorados para manter leitura e estabilidade. Entradas posteriores executam uma vez por nó; preferir reduced motion consome as entradas pendentes e as deixa disponíveis imediatamente.

Um IntersectionObserver global observa entradas/ornamentos. MutationObserver registra adições/remoções; cancelamento ao sair da viewport/remover elemento, pausa em aba oculta, cancelamento ao receber foco e cleanup completo no unmount. A timeline tem seu observador próprio somente quando sincronização está ativa. Não há re-render React por pixel de scroll.

Um único listener passivo de scroll agenda **um** rAF para ornamentos visíveis. Sem evento/resize/entrada de viewport não há loop; aba oculta/reduced motion cancelam o frame. Deslocamento decorativo limita-se a ±14 px em linhas orbitais e grid do Hero; nenhum texto/CTA da primeira dobra nem WebGL é alterado. Ornamentos são aria-hidden/pointer-events:none. Work anima uma camada externa, sem transformar slides nem reiniciar autoplay. Expertise usa rise escalonado, Services entradas horizontais e Contact profundidade + assentamento de canais; evita aplicar o mesmo movimento ao grupo e seus filhos.

## Regressões e limites

O botão Play da S02 foi verificado: solicita reprodução, mas foco/hover ainda suspendem timer; ao sair, volta a reproduzir. O estado textual informa suspensão. A política anterior foi conservada, sem refazer S02. Relógio virtual dos testes passa a ser instalado após hidratação/IntersectionObserver e um timeout novo é criado pelo controle real; há também teste com timer nativo de sete segundos. Não há retries locais para mascarar falhas.

O cache operacional ignorado de dev da S02 foi excluído explicitamente de ESLint/TypeScript. Isso conserva a validação do código fonte e impede que arquivos gerados movidos para `docs/report` sejam interpretados como código da aplicação.

Transição entre rotas/cases não entra: não existem cases S04. S06/Dev Mode não implementados. HTML/semântica, animações reais intermediárias, vídeos sem instrumentação, temas/idiomas, zoom, falhas, Hero/carrossel e vitals são verificados no relatório S03. Medição local não certifica p75, GPU física ou WCAG integral.
