# ADR-014 — Contador compartilhado, entradas visíveis e escultura na página

- Data: 12/10/2026.
- Base exata: `922fd77a29549694eaed3bc00ac437b027df7360`, branch `feat/creative-direction-recovery`, árvore limpa na retomada.
- Escopo: três correções solicitadas pelo proprietário após a POC Recovery. Implementado para revisão visual; não aprova conteúdo nem publicação.

## Decisão

O proprietário pediu contador funcional de sete segundos até zero, entradas de scroll menos antecipadas e rápidas, objeto 3D acompanhando toda a página com variação de tamanho e componentes mais atraentes. Esta solicitação substitui o ritmo discreto anterior e amplia o percurso Hero → Work do ADR-013. Identidade, fontes, tokens v0.1, dados e arquitetura existentes são reaproveitados.

### Um relógio para indicador e troca de projeto

`createCarouselClock` mantém um deadline, publica o tempo restante a cada 100 ms e dispara a troca quando chega a zero. O indicador circular e o número usam essa mesma fonte; não existe uma animação de progresso independente da troca. A assinatura em `CarouselCountdown` evita renderizar os artigos dez vezes por segundo.

Hover, drag, foco, aba oculta, saída da viewport e pausa manual congelam o restante. Retomada continua esse restante; seleção manual reinicia em sete segundos. O foco conserva a política de exigir reprodução explícita. Reduced motion desativa autoplay e mostra um traço. O zero fica visível até o primeiro tick do próximo ciclo, sem acrescentar um segundo artificial à duração. Um token de geração invalida callbacks cancelados que já estavam na fila; os eventos de suspensão pausam imediatamente, antes do efeito React.

O indicador tem `role="timer"`, descrição traduzida e `aria-live="off"`, evitando anúncio a cada tick. A faixa de sete seletores reutiliza o catálogo real, `aria-pressed`, nomes PT/EN/ES e alvos de pelo menos 44 px. Sem JS, o catálogo servidor permanece completo.

### Ritmo de scroll

IntersectionObserver usa margem inferior de −18% e threshold 0,12. Entradas duram pelo menos 850 ms; editorial e profundidade, 1100 ms. Deslocamentos passam a 32–72 px, com inclinação/perspectiva específicas por preset e stagger limitado a 240 ms. Tokens de duração maiores ainda são respeitados. São escolhas de ritmo autorizadas neste pedido, sem alterar os tokens globais.

HTML e estilos de repouso continuam visíveis. Primeira dobra e chegada direta por âncora não esperam reveal. Entradas posteriores executam uma vez; foco/cancelamento/falha WAAPI deixam conteúdo legível. Reduced motion suspende esses efeitos. Não há captura de wheel ou mudança do fluxo para executar animações.

### Um canvas ao longo da landing

A escultura Recovery existente passa a um portal no `document.body`, com uma única instância de Three/R3F. O proxy SVG e a reserva de proporção permanecem no HTML do Hero; não se duplica a cena por seção. `classic` conserva a esfera dentro do Hero.

Um runtime de scroll passivo, com somente um rAF pendente, calcula a saída do Hero e o progresso entre Work, About, Expertise, Services, Contact e footer. Interpola posição e diâmetro por smoothstep. Diâmetros de referência desktop: 170/250/195/270/185/130 px; mobile/tablet aplicam fator 0,52 com mínimo de 104 px. O tamanho CSS muda o buffer de renderização; não fica um canvas gigante invisível renderizando atrás da miniatura. Progresso também altera orientação da cena real.

Desktop ≥1280 px reserva área lateral antes da hidratação. Mobile mantém uma miniatura compacta, transparente a ponteiros, com somente os controles de pausa/arte estática interativos; o drag horizontal fica na exploração do Hero. Alvos desses controles continuam com 44 px. Reduced motion conserva a posição no Hero e não carrega WebGL automaticamente.

O gate de carregamento observa o Hero; o gate de renderização observa a superfície real do portal. **Sair do Hero deixa de suspender a cena quando a miniatura continua visível**, por solicitação do proprietário. Pausa, aba oculta, superfície fora da viewport, falhas e arte estática continuam interrompendo frames/desmontando recursos. Entrada direta em `#contact` não inicializa Three automaticamente antes de visitar o Hero ou fazer opt-in. Save-Data, dispositivos limitados, lazy loading e qualidade adaptativa são preservados. Teste de chunk bloqueado instala a interceptação antes da navegação e espera hidratação, evitando cache/prefetch ou medir a âncora antes da estabilização.

### Componentes visuais próprios

Foram examinados [Uiverse](https://uiverse.io/), [botões animados](https://uiverse.io/ui/animated-buttons), [cards](https://uiverse.io/ui/card-components), [botão com seta](https://uiverse.io/marcelodolza/stupid-vampirebat-24) e [card com brilho](https://uiverse.io/05akalan57/thin-sloth-31). Servem como referência de comportamento. Não foi copiado código, imagem ou pacote.

Os cards existentes recebem luz radial ligada ao ponteiro, aro orbital, símbolos SVG autorais e emblemas de serviços. CTAs primários recebem passagem de luz e seta circular. Usam os tokens existentes e acento discreto. O runtime agrupa pointermove em um frame e limpa listeners/timers; efeitos de movimento respeitam reduced motion. Links, serviços, projetos e aprovações editoriais permanecem os mesmos.

## Validação e limites

Regressões cobrem deadline/zero, pausa/retomada, callback obsoleto, seleção real, entrada tardia ainda em movimento após 400 ms, identidade do único canvas em cinco seções, variação de dimensões, suspensão da superfície, teclado/touch, falhas e axe. Evidências usam vídeo nativo e contador com relógio real, sem retiming; E2E de deadline usa tempo controlado separadamente.

Hidratação lenta, Lighthouse, JS gzip, CPU e frames são registrados no [QA desta continuação](../qa/CreativeFollowup/REPORT.md). A cena visível pela página amplia o tempo de renderização; pausa/opt-out continuam acessíveis. Software rendering, amostra local e ausência de aparelho físico limitam conclusões de performance. Aprovação estética, conteúdo comercial e publicação continuam pendentes; S04/S06/Dev Mode não foram iniciados. Logs brutos ficam em `docs/report/CreativeFollowup/`, ignorados pelo Git.
