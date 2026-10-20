# ADR-018 — Workstation: o notebook como interface (sem barra), física própria e Código real

**18/10/2026** · `feat/workstation-playful-notebook` · Base exata **`9b0031c2a31c1b74a10e5d126d141fd0d87b2d1f`** (P01.2). Continuação Claude delimitada no [HANDOFF](../HANDOFF.md). [QA P02](../qa/Workstation/P02/REPORT.md).

## Contexto

O proprietário pediu um notebook moderno, bonito e muito interativo, **sem a barra de botões** abaixo dele: balançar de um lado para o outro, fechar a tampa clicando nela, digitar e usar o trackpad, acompanhar a página e — ao frear bruscamente um scroll rápido — bater no chão de forma cômica. Também apontou que, em alguns tamanhos de tela, o notebook e seus movimentos saíam da viewport. Respostas às decisões propostas: arremessado, ele volta sozinho; frear um scroll para cima faz bater no teto; o Rapier é substituído por um solver próprio; há som, com mudo no canto superior direito da tela do notebook. Pediu ainda preparar a exposição do código e mais interação com o resto da página.

## Decisões

### 1. Nenhum controle fora da tela do notebook

A barra (Focar, Fechar tampa, ←, →, ↶, ↺, Usar trackpad, Manipular, Seguir página), a dica textual e o “Explorar notebook” foram removidos. As ações viraram **gestos no próprio objeto** e **controles diegéticos** do mini OS (⤢ foco, × fechar, 🔊 mudo, todos na barra da janela da tela). Um rótulo junto ao cursor (`arraste · jogue`, `clique fecha · arraste ajusta`, `digite`, `deslize o cursor`) ensina sem botões.

A representação HTML exigida pela spec 07 continua existindo, mas **oculta**: um menu contextual (`role="menu"`, setas/Home/End/Esc) abre com clique direito, toque longo ou Shift+F10/tecla Menu, e um gatilho “Opções do notebook” fica visualmente oculto até receber foco por Tab. Fallback sem WebGL/movimento reduzido mantém “Focar tela”/“Ativar notebook 3D” somente sobre a imagem estática.

### 2. Palco em tela cheia, área de clique recortada pela silhueta

O Canvas deixou de ser uma caixa de 800×620 com `overflow:hidden` que se movia e encolhia o modelo ao girar. Agora um único Canvas fixo cobre a viewport, com câmera ortográfica em pixels (zoom 1) e `pointer-events:none`. O notebook se move dentro da cena. A cada quadro renderizado, a envoltória convexa projetada do chassi + tampa vira `clip-path` de uma camada de clique: **só a silhueta captura eventos**; ao redor, a página continua clicável (antes, a área transparente da caixa bloqueava conteúdo). A tela DOM segue sob o Canvas com o “buraco” alfa (ADR-017), agora projetada direto em pixels da viewport; sem DOM ativo, o display usa vidro escuro em vez de deixar a página aparecer.

### 3. Solver 2D próprio no lugar do Rapier

Um único corpo convexo contra quatro paredes não justificava 1,64 MB gzip de WASM nem `wasm-unsafe-eval`. `physics/body.ts` integra translação **e rotação** (o Rapier estava com rotação travada), impulsos por vértice com restituição/atrito, subpasso fixo de 1/240 s, correção de posição limitada (sem teleporte ao sair de uma borda) e repouso explícito. `stepHeld` faz o notebook segurado pendurar como pêndulo a partir do ponto de pega; sacudir o ponteiro o faz balançar, e pegar pela quina o inclina. A forma de colisão é a própria silhueta renderizada. A CSP do laboratório voltou a não ter `wasm-unsafe-eval`; a dependência foi removida.

### 4. Movimento: preso à página, com perturbações por cima

`MotionRig` mantém a trajetória das seções **exatamente presa ao conteúdo rolado** (o deslocamento causado pelo scroll é carregado direto, sem atraso de mola) e põe as perturbações numa mola subamortecida por cima: pseudo-força da aceleração do scroll (flutua ao arrancar, assenta ao parar), balanço lateral pela aceleração na tela, olhar sutil para o cursor, voo após saltos instantâneos de âncora. Mudanças de layout separam a parte do scroll (carregada) da parte do layout (animada).

**Tombo na freada.** `ScrollInertia` lê o scroll nativo (nunca escreve) e só reporta freada após uma fase rápida sustentada (≥2.300 px/s por ≥110 ms) que cai a 30% do pico em ≤180 ms. Leitura, PageDown, impulso de trackpad que decai sozinho e saltos de âncora não contam; navegação programática (âncoras, comandos do terminal, cards de projeto) suprime a detecção; há cooldown de 2,6 s. Freando para baixo, o notebook é lançado ao chão; para cima, bate no teto (header). O voo usa gravidade, quica, tomba, chacoalha a tampa (fecha só em quedas extremas), faz teclas pularem, levanta poeira, mostra `x_x` e estrelas, e então **levanta com um pulinho e volta sozinho**. Arremessos e “Soltar” seguem o mesmo ciclo.

A tampa é uma mola com batentes (`physics/hinge.ts`): abre com leve overshoot, fecha com “thunk”, fica rígida enquanto é arrastada e recebe impulsos dos impactos.

### 5. Trajetória responsiva

`trajectory.ts` passou a trabalhar com o centro do notebook e a viewport livre (abaixo do header e, no laboratório, da barra marcada `data-workstation-ceiling`). A largura é ajustada à largura e à altura disponíveis a partir da silhueta medida; o centro horizontal é limitado para manter a silhueta inteira na tela. A “faixa externa”, que de propósito levava o notebook para fora da viewport entre seções, foi removida. Entre estações ele faz *easing* no espaço do documento, de um encaixe ao outro: fica junto do espaço reservado da seção perto das chegadas e só “voa” no meio da transição, com no máximo ~22% da silhueta fora da área livre. Um encaixe lateral do herói (desktop) é mantido acima da dobra em telas baixas; encaixes no fluxo (tablet/mobile) continuam entrando pela borda.

### 6. Modelo

Geometria procedural refeita com `ExtrudeGeometry` de retângulos arredondados (raio grande em planta, bisel fino), alumínio PBR grafite (Dark) / prata (Light), dobradiça única, teclas pretas com legendas finas na Inter do site, trackpad de vidro com borda sutil, grades de alto-falante instanciadas, entalhe frontal, LED, marca orbital na tampa e sombra de contato. As dimensões do display (3,28 × 1,88) foram preservadas para a projeção DOM. 18 draw calls / ~21 mil triângulos.

### 7. Terminal, Código e interação com a página

O desktop ganhou um prompt sempre disponível e o app **Terminal** com comandos curados (`commands.ts`: mapa fixo, `Object.hasOwn`, sem eval/shell/rede, entrada ≤160 caracteres). Os comandos navegam pela página (seções, tema, idioma), abrem apps/sites/código e mexem no notebook (pular, cair, girar, fechar, teclado, reset). `sudo` e `rm` são piadas.

O app **Código** mostra a fonte real deste repositório, conforme a spec 06: `scripts/generate-workstation-code.mjs` publica só um manifesto explícito (31 arquivos), valida `realpath`/symlink/`..`/raiz/extensão/tamanho, procura padrões de segredo e **falha** em qualquer violação. Registra SHA, sha256 por arquivo e link do GitHub apenas para arquivos limpos. O JSON gerado é ignorado pelo Git, recriado em `predev/prebuild/pretypecheck/pretest` e carregado como chunk separado só quando o app abre. O realce de sintaxe é próprio e sem dependência. **Inspecionar** destaca componentes registrados da página e, ao clicar, abre o arquivo correspondente enquanto o notebook “olha” para o elemento.

Com a página: o notebook olha para o cursor; quedas fazem títulos e cards próximos tremerem; em voo ou carregado, ele “esbarra” no conteúdo por onde passa (animações WAAPI aditivas, sem alterar layout, foco ou ordem de leitura; desligadas em movimento reduzido).

### 8. Som

Foley sintetizado em WebAudio (`audio/notebook-sound.ts`), sem arquivos: tecla, tampa, baque, *boing* no teto, parede, assobio, pulinho, boot e “toc” de esbarrão. O contexto só nasce num gesto real. O mudo fica no canto superior direito da tela e persiste no `localStorage` (com `try/catch`).

## Consequências

- Acessibilidade: o menu oculto, o gatilho por Tab, o anúncio `role=status` (tampa, queda) e o retorno de foco ao fechar o modo foco substituem os botões visíveis. Movimento reduzido não arremessa, não tomba, não balança e abre/fecha a tampa sem animação.
- Performance: zero quadros em repouso, verificado por teste. `data-*` só é gravado quando muda. O bundle perdeu o Rapier (1,64 MB gzip sob gesto). O índice de código (71 KB gzip) só carrega com o app Código. No mobile, o WebGL só carrega quando um encaixe está ≥55% visível.
- Os limiares de freada e as constantes físicas foram calibrados em Chromium/SwiftShader e por testes sintéticos. A sensação em mouse/trackpad/toque reais precisa da avaliação do proprietário.
- Os scripts históricos `qa-workstation*.mjs` e `profile-workstation*.mjs` reproduzem as evidências P01.x e miram a interface antiga.
