# ADR-017 — Workstation: tela em profundidade, gestos e arremesso

**15/10/2026** · `fix/workstation-visual-physics-continuity` · Base exata: **`349d7cfffdc47a13e9aeffbc8ee141c4ffa2e5d3`**. Continuação Codex delimitada no [HANDOFF](../HANDOFF.md). Pedido: cinco correções visuais e de manipulação sobre a P01.1, sem refazer a fundação.

## Defeito e composição da tela

A reprodução confirmou dois problemas que a matriz afim correta, sozinha, não detectava: o DOM ficava acima de toda a geometria e podia ultrapassar os limites do Canvas, enquanto o WebGL era recortado. Em determinados ângulos, a barra da janela aparecia separada do display ou sobre partes físicas que deveriam ocultá-la. As imagens anteriores estão na [QA P01.2](../qa/Workstation/P01.2/REPORT.md).

O DOM agora fica **abaixo** do Canvas transparente. Uma mesh na profundidade física do display escreve preto com alpha zero, `NoBlending`, `depthWrite` e `renderOrder=100`: abre a janela para o DOM somente onde o display passa no teste de profundidade. Chassi, tampa e bezel continuam opacos à frente. RGB preto/premultiplicado evita a mancha clara observada no primeiro ensaio. Frente/verso e cinco raycasts controlam a disponibilidade de input; uma tela parcialmente coberta não recebe cliques invisíveis. O modo de foco continua a alternativa legível em qualquer ângulo.

Canvas e DOM compartilham o mesmo recorte `overflow:hidden`. A câmera ortográfica enquadra os cantos dos dois volumes físicos, com margem, em vez de usar a grande caixa alinhada aos eixos do mundo. Inclinação e abertura da tampa participam do enquadramento. As três coordenadas do display real, lidas da `matrixWorld` da mesh **depois do render**, são registradas independentemente da âncora usada para projetar o DOM. Isso amplia a cobertura anterior, que verificava a consistência da fórmula mas não comprovava oclusão nem recorte.

Um único RAF continua coordenando mola/physics, pose, teclas, projeção e render. O Canvas fica visualmente acima, com `pointer-events:none`; o `eventSource` R3F é a cena comum. Eventos que atingem DOM nativo não iniciam raycast do chassi. O trackpad escolhe a superfície por raycast e usa captura nativa durante o gesto, inclusive ao cruzar a tela, liberando em up/cancel/lost capture/blur/Escape/resize.

## Modelo e legibilidade

O modelo continua procedural e autoral. Base/deck têm cantos mais suaves, materiais de grafite/metal e iluminação ambiente de estúdio gerada por `RoomEnvironment`/PMREM em 64px por face. Acrescentaram-se apoio de borracha, ventilação inferior e alça da tampa. Apoios, ventilação, portas, keycaps e legendas usam instancing quando repetidos.

A primeira versão gerava o ambiente no navegador e registrou Lighthouse desktop 72/TBT898,5ms. Para retirar esse trabalho da visita, `scripts/bake-workstation-environment.mjs` calcula antecipadamente o mesmo atlas RGBA16F/CubeUV: 336×256, gzip **112.750 bytes**, sem fotografia/HDR externo. O visitante apenas descompacta/upload a textura e prepara os shaders com `compileAsync` antes do primeiro frame. Keycaps já inicializam instanceColor para evitar uma segunda variante de shader logo depois. Nova medição desktop: **98/TBT118,5ms**; são amostras locais, não uma série de campo. O binário, parâmetros/proveniência e licença Three.js ficam em `public/art/workstation/`.

Falha do asset/formato/descompressão mantém iluminação direta e acesso à tela. Dados são reaproveitados em memória, mas cada cena cria/descarta a própria textura. A geração offline não roda no build nem na aplicação. O SSR/fallback fica visível enquanto textura/shaders se preparam, sem apresentar um primeiro frame com materiais diferentes. Dois unitários verificam o contrato do atlas e um E2E bloqueia sua requisição para testar a alternativa.

Cada tecla tem seu próprio quad/UV em um atlas 1024×1024, com letras claras maiores, proporção física preservada e material sem dependência da iluminação. As legendas acompanham a pressão da tecla; continuam sendo uma chamada de desenho, não 54 textos DOM. **Manipular → Ver teclado** oferece uma câmera mais alta. Em mobile, o teclado físico é pequeno por definição; a tela 2D e o teclado real permanecem disponíveis. Não se declara legibilidade universal em qualquer distância/ângulo.

## Propriedade da posição e física

O pedido atual autoriza arraste/arremesso. Acrescentou-se **Rapier 0.21.0**, importado dinamicamente somente ao iniciar um arraste elegível. O controlador leve permanece no bootstrap; WASM e mundo físico não carregam com a simples visualização do notebook. Redução de movimento não prepara física e solta sem voo.

| Estado espacial | Responsabilidade |
|---|---|
| `FOLLOW` | Curva da página e mola crítica controlam posição/tamanho/orientação. |
| `DRAG` | Ponteiro controla a posição diretamente; o corpo preparado é cinemático. |
| `FLYING` | Rapier integra velocidade/gravidade e resolve colisões até dormir. |
| `FREE` | Notebook permanece onde foi deixado; controles ficam numa barra dentro da viewport. |

**Seguir página** devolve o controle ao percurso e libera mundo/event queue. Reset também restaura pose/tampa/câmera/ferramenta. Resize retorna a `FOLLOW`, porque limites e dimensões mudaram. Foco/aba oculta/blur/Escape cancelam gestos/voo; desmontagem invalida inicializações assíncronas e libera recursos. Falha do chunk/WASM mantém arraste sem voo, tela 2D e navegação funcionando.

A simulação tem **um corpo rígido 3D com translação restrita a X/Y**, rotação travada e quatro paredes virtuais. É uma física planar de viewport; o giro visual continua sob controle do visitante. O collider é um envelope conservador simplificado, não uma colisão por tecla. Há espaço superior/inferior para navegação e controles. Não se implementou queda para dentro da página, fragmentação, dano, fratura, som de impacto ou jogo.

Conversão: 100px/m; massa 1,4; gravidade 4,2m/s² para baixo; restituição 0,58; atrito 0,5; damping linear 1,35; CCD. Passo fixo 1/120s com acumulador limitado a 50ms evita instabilidade após pausas. A velocidade usa timestamps reais dos últimos até 150ms de movimento, descarta amostras inválidas/soltura após pausa e limita o módulo a 2.200px/s. Uma pausa antes de soltar deixa o notebook parado. Não há loop físico em repouso.

## Gestos e percurso

Mouse: arrastar a base move; soltar em movimento arremessa; Alt ou botão direito + arraste gira. O menu separa **Mover**, **Girar** e **Tampa**; arrastar a alça superior ajusta a dobradiça e clicar na tampa abre/fecha. Os botões acessíveis herdados continuam oferecendo giro, tampa, foco e reset sem exigir arraste. Em touch, a manipulação exige escolha explícita da ferramenta, com saída em Seguir página/reset; o modo normal preserva `pan-y`.

O caminho deixou de trocar o alvo por proximidade de âncora. `trajectory.ts` interpola posição lateral, largura e ângulos com uma curva quintic entre centros das estações; a ordenada permanece coerente com o scroll nativo. Isso elimina descontinuidades de alvo nas mudanças de capítulo. Uma faixa externa ainda protege os painéis de largura completa, podendo levar o notebook temporariamente para fora da viewport. O objeto não cobre permanentemente os textos e não há divisão fixa da landing. O cache dos retângulos documentais é invalidado por ResizeObserver/resize, sem ler todas as estações a cada scroll.

Os limites herdados de 2.400px/s de translação e 700px/s de largura continuam no acompanhamento. Arraste manual segue o ponteiro diretamente. Os estados espaciais não criam um segundo RAF nem acrescentam atualizações React por frame.

## Segurança, validação e limites

Somente a CSP do laboratório ganha **`wasm-unsafe-eval`**, necessária para instanciar WASM sem permitir eval geral no build otimizado. A landing pública mantém a política anterior; hosts/sandbox de iframe continuam iguais. Não há proxy, acesso ao DOM cross-origin, novos projetos ou aprovação editorial.

Referências primárias conferidas: [tipos de corpo Rapier](https://rapier.rs/docs/user_guides/javascript/rigid_body_type/), [posições/corpos cinemáticos](https://rapier.rs/docs/user_guides/javascript/rigid_body_position/), [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html), [PMREM](https://threejs.org/docs/pages/PMREMGenerator.html), [DataTexture](https://threejs.org/docs/pages/DataTexture.html), [ordem de frame R3F](https://r3f.docs.pmnd.rs/api/hooks). APIs de PMREM, captura e Rapier também foram verificadas nas fontes/tipos instalados. Guias da versão Next instalada foram lidos antes das alterações.

[QA P01.2](../qa/Workstation/P01.2/REPORT.md) registra resultados, falhas iniciais/correções, vídeos nativos, matrizes, recursos carregados e limitações. SwiftShader não prova os targets 30/60 FPS em GPU física; axe não substitui leitor de tela. Aceite artístico, performance mobile de publicação, HTTPS e conteúdo comercial continuam pendentes. `docs/report/` permanece ignorado. Sem push, merge ou deploy.
