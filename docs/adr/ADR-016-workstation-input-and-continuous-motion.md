# ADR-016 — Workstation: input próprio e movimento contínuo

Data: **15/10/2026**. Branch: `fix/workstation-input-scroll-motion`. Base auditada/retomada: **`3c395abeabed80004893fa30ac60fe4d0b9b1922`**. Escopo: hotfix P01.1 solicitado pelo proprietário, sobre a P01; preserva a arquitetura e a identidade v0.1.

## Evidência e decisão

A reprodução inicial em Chromium registrou a âncora do notebook com `y=-792,5` em About e `y=-3501,5` em Contact, sempre classificada como Work. Teclas/trackpad apenas bloqueavam o giro, sem ação. O diagnóstico visual e os retângulos brutos estão em `docs/report/Workstation/P01.1/baseline/`, ignorados. O tamanho/copy do Hero foram comparados visualmente antes/depois; não se redesenharam tokens, fonte, conteúdo comercial ou a landing de comparação.

Adotou-se um rig imperativo único, coordenado por `position.ts`. Posição, largura e três ângulos têm estado atual, alvo e velocidade. A solução analítica da mola criticamente amortecida usa delta time em segundos; deslocamento limita-se a 2.400 px/s e largura a 700 px/s. O delta de um frame fica limitado a 50 ms após pausas. Retomada, direção reversa e resize não zeram a posição. Reduced motion atualiza diretamente, sem perseguição espacial.

Há seis estações reservadas no HTML, com composições diferentes: Hero/Work à direita, About central, Expertise à esquerda, Services central e Contact à direita. Entre estações, a faixa externa e a saída da viewport protegem conteúdo de largura completa. O objeto não permanece sobre os textos durante toda a leitura e não há uma metade fixa da página. Marcadores das outras rotas têm `display:none`. Listeners de scroll/resize são passivos; não se altera `scrollTop` nem se intercepta wheel da página.

O RAF do rig só continua enquanto restar movimento/tecla a resolver. O Canvas usa `frameloop="never"` e `advance(seconds, false)` a partir desse RAF. Modelo/hinge atualizam em prioridade −3, teclas em −2, projeção em −1, e o GL renderiza na mesma chamada. As APIs e a ordem de prioridades foram conferidas no pacote instalado e na [documentação oficial R3F](https://r3f.docs.pmnd.rs/api/hooks). Outros runtimes editoriais conservam suas responsabilidades; não há um segundo RAF do notebook.

## Uma escala para WebGL e DOM

A cena possui viewport lógica fixa **800×620**, câmera ortográfica e `resize.offsetSize=true`. A escala CSS transforma a cena inteira, incluindo DOM. Canvas não redimensiona câmera/buffer a cada passo da trajetória. O raycast converte `clientX/clientY` pelo retângulo real do canvas escalado. O ensaio inicial sem `offsetSize` reproduziu digitação em teclas erradas; a correção preserva coordenadas lógicas e eventos reais.

Três cantos projetados do display definem a matriz afim da tela **800×458,5366**. O DOM mantém essa matriz em cache ao voltar do foco. A superfície não é mais desmontada ao sair da viewport; isso evita remontagem com projeção antiga e preserva o iframe durante o percurso. A interseção assíncrona continua guiando o carregamento progressivo, mas não decide se o frame atual deve projetar: o rig usa a posição que acabou de pintar. Um teste e a gravação tablet detectaram esse desencontro antes da correção. O último passo do damping também passa a fixar exatamente o alvo antes de declarar repouso.

Render e RAF param com aba oculta/foco e não renderizam GL fora da viewport. **Um site externo pode continuar executando seu próprio JS enquanto montado fora da viewport**; o parent não tem API para suspender isso com segurança. Fechar app/tampa, falha ou desmontagem elimina a superfície. Mudar para foco remonta o iframe, portanto a sessão interna não é preservada nesse caso. Não se promete pausa de CPU de site remoto.

## Teclado e ponteiro

`NotebookInputController` resolve a keycap real pelo `instanceId`, anima pressão/retorno e encaminha edições a uma porta do app ativo. Shift é alternância de uma tecla; Caps persiste; Backspace, Enter, Space, Tab/indentação e quatro setas possuem semântica local. Ctrl/Alt não executam atalhos de sistema. Digitação nativa continua no textarea real. Nenhum evento sintético de teclado ou `postMessage` sem cooperação é usado.

O pequeno app **Notas** é a superfície própria mínima autorizada pelo hotfix para comprovar input: texto, seleção, registro explícito, rolagem e arraste limitado da alça. Seu documento vive na instância do controlador, sem rede, localStorage ou conteúdo comercial inventado. Não antecipa window manager, terminal, Code ou jogos.

`NotebookPointerController` mantém x/y normalizados em [0,1], converte-os à tela projetada e consulta hit testing DOM real. Somente IDs explicitamente registrados ativam callbacks de controles próprios. Hover e cursor são visíveis; toque/clique ativa, duplo clique seleciona texto, movimento arrasta a alça quando apropriado. Wheel no mesh do trackpad rola apenas o painel próprio; dois dedos usam delta normalizado. Em touch, a captura explícita **Usar trackpad** evita disputar a rolagem nativa e tem saída visível. Screen, input e chassis mantêm prioridades separadas; blur/Escape/resize cancelam gestos.

Iframes são superfícies nativas opacas para o controlador, incluindo a fixture sandboxed. Teclas/trackpad virtuais não navegam, digitam nem rolam seu DOM. O feedback conduz à interação direta/foco. Nenhuma CSP, sandbox ou URL aprovada foi ampliada.

## Verificação e limites

[QA P01.1](../qa/Workstation/P01.1/REPORT.md) concentra execução, telemetria por frame, capturas, vídeos nativos, desempenho e pendências. O erro medido entre cantos WebGL e a matriz DOM é em pixels lógicos; não demonstra perfeição óptica em toda GPU/browser. Aceite estético, dispositivo físico, leitor de tela e domínio HTTPS continuam pendentes. Sem merge/deploy; não se declara o pacote inteiro concluído.
