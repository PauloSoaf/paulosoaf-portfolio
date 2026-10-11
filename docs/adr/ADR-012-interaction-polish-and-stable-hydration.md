# ADR-012 — Microinterações e hidratação estável

Data: 11/10/2026. Escopo: S03.5, base `0ad2532`, branch `feat/s03-5-interaction-polish`.

## Decisão

Preservar a arquitetura servidor/ilhas da S00–S03 e Obsidian Orbit v0.1. Consultados os guias instalados do Next 16.3.8 de boundaries e lazy loading, design system, motion e addendum de temas. Nenhuma biblioteca nova, mudança de tokens-base, aprovação editorial, integração S04, S06 ou Dev Mode.

`applyTheme` continua atualizando imediatamente o atributo do documento, cookie, meta e assinantes. Somente a ação do usuário ativa transições CSS de 320 ms em superfícies, bordas e classes de foreground explícitas. Sol/Lua permanecem montados e transitam opacity/rotate/scale; o CSS responde diretamente ao atributo antes da hidratação. Um único timeout substituível limpa o marcador após 400 ms. Reduced motion dispensa o marcador. O bootstrap síncrono antes do primeiro paint permanece intacto. Não há remount de árvore/canvas.

View Transitions não foi adotada: a solução localizada entrega a transição sem capturar a página ou o canvas WebGL, mantendo menor complexidade e evitando armazenamento de snapshots. Não houve benchmark dessa API nem alegação de flicker comprovado nela. A nova regra substitui conscientemente a supressão global herdada, conforme autorização explícita da S03.5; não altera a proteção inicial contra FOUC.

O primeiro perfil detectou transições de cor ainda running após o prazo: animar `color` herdado e bordas `currentColor` em descendentes reiniciava alvos enquanto a cor do pai interpolava. A regra reseta durações por alvo e anima foreground/borda somente nas classes com cores próprias. Chromium ainda reiniciava algumas cores explícitas ao terminar a interpolação do pai. No cleanup de 400 ms, após remover o marcador e consultar os estilos finais, o runtime finaliza apenas `CSSTransition` de cor ainda running; transform, opacity e animações WAAPI de scroll/carrossel continuam independentes. Teste unitário verifica essa separação e E2E exige zero transições de cor running após cleanup nas seis combinações de tema/idioma. Perfis anteriores ao ajuste permanecem em diretório ignorado separado.

Classes compartilhadas `ui-cta`, `ui-control`, `ui-nav` e `ui-card` reutilizam 140/280 ms e os easings existentes. Elevação de CTA até 2 px, compressão até .975, setas até 3 px, foco/disabled e indicadores de âncora/idioma. Cards sem ação continuam listas, sem tabindex ou falsa semântica de botão. Sua elevação usa `translate`, independente do transform do reveal WAAPI. Header, Work, Timeline, Services e contatos existentes reutilizam esses padrões.

Em Chromium touch emulado, um touchStart real chegou ao link, mas `:active` permaneceu falso durante a pressão. O runtime compartilhado espelha exclusivamente pointerType touch em `data-ui-pressed`; listeners passivos, sem preventDefault/capture. Release/cancel fora do controle, blur, visibilidade e cleanup removem o estado. Mouse continua usando CSS. Testes cobrem o ciclo de vida e a pressão por CDP, incluindo scroll vertical.

## Hero e coreografia

Three/R3F, objeto procedural, shader, câmera, geometria, DPR e fallbacks foram reaproveitados. Cursor passa de ±.10 a ±.18 rad. Drag horizontal acumula exploração limitada a ±.60 rad, com projeção limitada de velocidade na soltura e damping exponencial existente de 7/s; botões equivalentes permitem exploração por teclado. Touch só captura após reconhecer intenção horizontal; gesto vertical, pinch, cancelamento, perda de capture e cleanup continuam nativos.

Entrada real da cena: até 850 ms, escala .94→1 e assentamento de rotação. Saída por scroll adiciona pitch até .08 rad, acionado por listener passivo enquanto ativa. Não movimenta texto/CTA. Os controles mobile de pausa usam ícone e o mesmo nome acessível completo para manter uma linha e evitar sobreposição do objeto; desktop conserva texto. A dica de exploração é traduzida.

Não foi acrescentado movimento ambiente contínuo: a entrada e a exploração tornam a cena perceptível com renderização sob demanda e zero frames adicionais no repouso medido. Visibilidade, aba, pausa, reduced motion, Save-Data/opt-in, contexto perdido e redução de qualidade permanecem. Custos/limites de laboratório estão no QA, sem certificar GPU física.

Títulos posteriores de seção usam motivo editorial próprio (24 px / 550 ms); profundidade de grupos .97 / 550 ms. Os demais motivos mantêm suas durações. Elementos já visíveis na primeira dobra/âncora não são ocultados ou reanimados; entrada da cena e microinterações fornecem presença sem comprometer leitura inicial.

## Hidratação

O teste na base confirmou timeline de 1.248→470,0625 px e, em `#about`, topo de 88,21875→−1.396,90625 px. O carrossel acima também encolhia. Corrigir somente a timeline não preservaria a âncora.

CSS apoiado no `data-js` já definido antes do paint reserva a geometria antes dos módulos React. Desktop com suporte a `:has` recebe navegação por links de fragmento e estágio sobreposto com altura máxima. Antes da hidratação, `:target` expõe qualquer capítulo por navegação nativa, inclusive se módulos falharem permanentemente. Após hidratação, os mesmos links recebem semântica de tabs, seleção/teclado e painéis inativos inert/aria-hidden. Um fragmento de capítulo escolhido antes da hidratação é preservado. Sem JavaScript, o atributo está ausente e todos os artigos ficam na lista completa; mobile continua linear. Browsers sem `:has` conservam o fallback linear e a melhoria React, mas não recebem essa garantia de geometria anterior aos módulos.

Carrossel antes da hidratação usa uma faixa horizontal nativa com a largura final dos cards e altura do maior, acessível por touch/teclado. Controles desabilitados e estado textual reservam espaço; CSS os oculta sem JS, mantendo o grid completo. Após hidratação, o estágio cinematográfico assume a mesma altura. O reducer, timers, política de foco/hover/autoplay, ARIA e catálogo não foram reconstruídos.

O callback de visibilidade do carrossel passa a considerar a entrada mais recente do lote, em vez da primeira. Uma regressão unitária reproduz lotes false→true e true→false. Acompanhamento da timeline compara centros e recalcula a escolha em um rAF por evento de scroll, apenas enquanto opt-in/mobile ativo: IntersectionObserver sozinho não informa deslocamentos dentro da mesma faixa de interseção. Foco e escolha manual continuam prioritários, reduced/cleanup removem listener/frame. Nenhum loop permanente.

## Evidências e limites

Suítes anteriores mantidas; resultados, comparação e métricas em [QA S03.5](../qa/S03.5/REPORT.md). PNGs de meio de tema pausam transições CSS nativas em 160 ms exclusivamente para captura determinística. Vídeos desktop/mobile usam tempo real sem pausa/injeção de estilos. Capturas de Work/About ocultam header somente para evitar costura na imagem; screenshots do Hero incluem header real. Nenhuma captura simula conteúdo/funcionalidade inexistente.

Aceite visual do proprietário, dados comerciais, leitor de tela/hardware/browsers físicos e metas de campo permanecem pendentes. Logs, traces e regressões históricas novas ficam em `docs/report/S03.5`, ignorados pelo Git; referências/evidências originais S00–S03 não são sobrescritas. Sem merge, push ou deploy.
