# 00 — Conceito, layout e roteiro de UX

## Promessa
**Portfólio que pode ser usado, desmontado e explorado.** A interface é uma narrativa editorial com objetos que respondem. O notebook tridimensional é uma peça funcional que acompanha seções e muda de papel conforme o visitante interage — não um segundo painel ocupando 50% de toda a viewport.

## Composição por breakpoint e scroll
- **Desktop ≥ 1280px**: Hero com narrativa à esquerda e notebook de ~42–52% da largura útil à direita, sem divisor ou colunas 50/50 fixas. Ao avançar pelo texto/projetos, reposicionar a câmera/notebook perto do projeto em foco; alternar lado e profundidade quando fizer sentido. Não atravessar conteúdos, não bloquear CTA, rodapé ou leitura. Só pinning pontual de baixo custo; scroll normal.
- **Tablet 768–1279px**: notebook ocupa uma área própria de cena no fluxo editorial, sobreposta visualmente por perspectiva mas sem sobrepor os controles de leitura. Controles adequados ao toque.
- **Mobile ≤ 767px**: notebook aparece abaixo/entre trechos de conteúdo. Para usar um site ou code, entrar no estado **FOCUS_SCREEN** com a tela projetada em painel 2D legível e notebook 3D ainda contextualizando a transição; fechar volta ao mundo 3D. Nada de iframe diminuto ilegível.
- **Sem WebGL/reduced motion/Save-Data**: desenho estático original ou still 2D com acesso completo a projetos, sites externos, código público autorizado, contato, idiomas e tema.

## Storyboard de ponta a ponta
1. **Abertura**: tipografia de engenharia + notebook 3D semiaberto flutuando em uma mesa/ambiente gráfico Obsidian Orbit. Curta animação de boot quando visível. CTA `Explorar notebook`, CTA `Ver projetos`.
2. **Aproximação**: pointer hover dá rotação leve; drag com alça/corpo gira o equipamento. A tampa pode ser aberta/fechada; o ângulo real do display altera a tela visível.
3. **Selecionar projeto**: clicar em NutriOpus ou Déborah Lima no catálogo *ativa* a tela, move/posiciona notebook ao lado do item e abre a aplicação **real** em contexto focado quando o embed é autorizado. Scroll, links e input usam HTML nativo.
4. **Retornar da página**: controle `×` fixado **na moldura do notebook/desktop nosso**, fora do iframe, retorna ao Desktop; o usuário também pode sair do foco e girar o aparelho.
5. **Selecionar componente do portfólio**: habilitar modo Inspecionar; elementos explicitamente mapeados ficam realçados; selecionar exibe o código verdadeiro **deste repositório**. Não expor código de sites/projetos externos.
6. **Explorar mini OS**: X no Code/Preview retorna ao sistema próprio; janelas funcionais: Projetos, Código, Sobre, Terminal curado, Jogo leve/experiência. Não executar shell Linux real.
7. **Brincar com a física**: mudar para `Manipular`, pegar notebook pela base, girar, arrastar e arremessar contra uma parede virtual; a simulação reage com corpo rígido, colisão e peças soltas/fraturas gráficas pré-fragmentadas. Tela externa descarrega/congela antes do impacto. `Restaurar` reconstrói imediatamente e devolve a experiência.
8. **Converter**: o conteúdo profissional e os CTAs permanecem semanticamente acessíveis, não escondidos no desktop virtual. O visitante não precisa completar interações para falar com o desenvolvedor.

## Linguagem visual
Conservar Obsidian Orbit v0.1: fundo `#090D11`, carvão, tipografia editorial e verde-água apenas pontual (`#65E6C3`). O notebook pode ser material metálico grafite, teclas discretamente iluminadas, tela brilhante com reflexos modestos e sombras de contato. Não converter o site inteiro em emulador de desktop; 3D físico é a assinatura, interfaces de projetos são a prova profissional.

## Modos e ações (distinções críticas)
- `ORBIT`: giro, zoom limitado, tampa, sem teclado/trackpad capturando eventos da página externa.
- `SCREEN`: teclado físico real digita normalmente no iframe/DOM focado; mousepad físico real rola; DOM acima da tela 3D recebe cliques.
- `TRACKPAD_UI`: trackpad desenhado no notebook gera comandos **para nosso mini OS** (cursor/scroll em apps próprios). Para site externo, somente integração cooperativa via `postMessage` ou foco/scroll nativo direto. Não afirmar controle pleno cross-origin por eventos sintéticos.
- `MANIPULATE`: controles 3D, sem iframe interativo ativo.
- `THROW`: simulação de corpo rígido liberado com impulso calculado; condição de quebra se energia exceder limiar.
- `BROKEN`: peças estáticas/dinâmicas limitadas, botões `Restaurar` e `Ver projetos`, sem embed ativo.
- `FOCUS_SCREEN`: UI 2D acessível vinculada visualmente ao laptop, necessária para conteúdo denso e mobile; foco teclado confiável.

## Não fazer
Sem tela dividida 50/50 permanente. Sem fake Linux anunciado como real. Sem screenshot chamado de site funcional. Sem copiar código alheio/privado. Sem atravessar CSP/XFO. Sem física ligada a cada frame em idle. Sem esconder página editorial atrás de Canvas. Sem usar o notebook destruído como bloqueador de acesso a projetos.
