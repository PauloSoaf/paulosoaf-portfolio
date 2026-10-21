# ADR-021 — Giro por gesto, poses de leitura e enquadramento dos sites

**21/10/2026 · Codex · P03 · `feat/workstation-cinematic-spin-fit`.** Base limpa: `6dedb39cfa4ba8c8f9b96e3a0e1714ffddf4d272`. [Autoria](../HANDOFF.md) · [QA e evidências](../qa/Workstation/P03/REPORT.md).

## Contexto e decisão

A P02 do Claude já possui modelo, materiais, teclado, tampa, DOM projetado, física planar, Terminal, Código e um único Canvas. Esses componentes são preservados. O pedido P03 exige giro livre reconhecido pelo gesto, apresentação legível dos sites e descoberta opcional, sem antecipar jogos, dano ou reconstrução do sistema.

O diagnóstico anterior à alteração registrou o limite de ±1,2 rad do pêndulo durante o movimento circular. O iframe de 800px também recortava o controle “Criar conta” de NutriOpus: sua borda direita chegava a 854,27px. Déborah permanecia no layout estreito, sem o retrato ao lado do título.

### Giro no corpo existente

`SpinIntent` reconhece curvatura consistente, tangente, direção e estabilidade do raio em coordenadas nativas. Exige três arcos coerentes, deslocamento e giro acumulado; rejeita movimento linear, um único canto, jitter, amostras inválidas e energia antiga após uma pausa. Amostras agrupadas de `PointerEvent.getCoalescedEvents()` são aproveitadas. O reconhecedor não possui timer ou loop.

Somente após reconhecer o círculo, `stepHeld` recebe velocidade angular dirigida. Nesse ramo a rotação não fica presa ao limite do pêndulo. Amortecimento exponencial aproxima a velocidade do gesto. Usa os subpassos existentes de 1/240s e tempo real limitado a 200ms para manter a velocidade perceptível em quadros espaçados. O pêndulo comum conserva seu orçamento de 50ms. A soltura transfere momento ao mesmo corpo; o solver de voo, colisões, gravidade, atrito e limite angular existentes permanecem. Nova pega zera a velocidade angular e mantém a pose equivalente, sem salto. Movimento reduzido desativa o reconhecedor.

### Apresentação contextual finita

`presentationTarget` compõe o caminho já existente com um escalar amortecido para `preview` ou `code`. Mantém o capítulo e limita tamanho/posição à viewport; não altera scroll ou câmera. A pose de site compensa a tampa de 108° e a inclinação da cena para colocar o display de frente. A pose de Código conserva uma pequena perspectiva. Abrir conteúdo também abre a tampa e interrompe voo anterior sem teletransportar a posição.

Fechar retorna ao caminho contextual. Pegar, girar manualmente ou usar as ações físicas suspende a apresentação; “Apresentar conteúdo” permite retomá-la explicitamente. A orientação manual é preservada para o retorno. As alterações de pose/tema não mudam a chave ou `src` do iframe. O foco 2D explícito mantém a montagem separada herdada e pode recarregar o documento.

### Viewport lógico por site

Auditoria online comparou 800, 1024, 1200 e 1280px. NutriOpus usa **1024px**, o menor tamanho medido que acomoda a navegação. Déborah usa **1200px**, preservando o hero em duas colunas com retrato. Uma transformação uniforme enquadra esse viewport no display, com altura proporcional. Sem offsets negativos, crop, barras próprias, imagem substituta ou proxy de cliques. O próprio navegador resolve entrada através das duas transformações. O modo 2D continua responsivo nativo, escala 1.

`ResizeObserver` observa a área lógica sem transformação, ignora tamanhos nulos e alterações menores que 0,05px. Não cria RAF. Os controles de saída/ajuda permanecem fora da escala interna do site. A revisão das capturas identificou sobreposição da navbar por esses controles, especialmente no touch: agora ocupam o canto inferior direito, preservando 44px e o comportamento de hover/foco/touch. O teste confere `elementFromPoint` no topo para exigir que o próprio iframe receba o clique. URLs, sandbox, CSP e políticas cross-origin são preservados; o site externo ainda pode alterar seu layout ou bloquear incorporação no futuro.

### Descoberta sem aumentar o bootstrap do cliente

Um Server Component transmite dicas PT/EN/ES pelo slot `discovery`. O popover HTML nativo é opcional, não modal, não aparece automaticamente e funciona sem JS. Sua camada superior evita o recorte do Hero e a sobreposição do Canvas. Escape, clique externo e botão fecham o painel. Os links levam às seções reais; currículo só aparece com URL e aprovação editorial. O estado atual mostra “Currículo em revisão”. Nenhum contato, experiência ou aprovação foi inventado.

## Consequências e limites

Nenhuma dependência nova; um Canvas, renderização sob demanda e controllers anteriores são mantidos. O índice do app Código inclui os quatro arquivos reais adicionais, totalizando 37 fontes. Não foi acrescentado loop permanente. O guia melhora descoberta, mas não substitui revisão humana de estética, usabilidade e acessibilidade nem aprova conteúdo comercial. Métricas e limitações de publicação constam do relatório de QA.

Fontes primárias: [R3F — renderização sob demanda](https://r3f.docs.pmnd.rs/advanced/scaling-performance) e [MDN — popover](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover). Foram lidos os guias da versão instalada do Next.js antes das alterações de componentes.
