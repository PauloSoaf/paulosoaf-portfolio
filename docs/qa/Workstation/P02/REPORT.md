# Workstation P02 — notebook como interface

**18/10/2026** · Branch `feat/workstation-playful-notebook` · Base exata **`9b0031c`** (P01.2). [ADR-018](../../../adr/ADR-018-workstation-playful-notebook.md) · [Autoria e fronteira](../../../HANDOFF.md).

Abra **http://localhost:1010/pt** (o dev encaminha para `/pt/workstation-lab`).

## Como usar (sem botões)

| Gesto | Resultado |
|---|---|
| Passar o mouse | O notebook olha de leve para o cursor; um rótulo diz o que a peça faz |
| Clicar na tampa | Fecha com mola e “thunk”; clicar de novo abre e a tela faz boot |
| Arrastar a borda da tampa | Ajusta o ângulo |
| Arrastar a base | Pega o notebook; ele pendura e balança como pêndulo |
| Soltar em movimento | Arremesso: gira, quica, cai, fica tonto, levanta e volta sozinho |
| Shift/Alt + arrastar | Gira o notebook |
| Duplo clique na base | Redefine a posição |
| Teclas 3D / teclado físico | Digita no prompt do desktop, no Terminal ou nas Notas |
| Arrastar no trackpad 3D | Move o cursor da tela; toque clica; roda rola |
| Duplo clique na barra da janela ou ⤢ | Modo foco (tela 2D grande) |
| 🔊 no canto superior direito da tela | Mudo (persistente) |
| Clique direito / toque longo / Shift+F10 / Tab | Opções ocultas |
| Scroll muito rápido + parada brusca | Tomba no chão (para baixo) ou bate no teto (para cima) |
| Toque: arrastar na vertical sobre o notebook | Rola a página; na horizontal ou após segurar, pega o notebook |

Terminal: `ajuda`, `projetos`, `sobre`, `contato`, `tema`, `idioma en`, `abrir nutriopus`, `codigo rigid-body`, `inspecionar`, `pular`, `cair`, `girar`, `fechar`, `teclado`, `som`, `limpar`… e `sudo`.

## Evidências

| Arquivo | O que mostra |
|---|---|
| `dark-1440-hero.png`, `light-1440-hero.png` | Modelo novo (grafite/prata), nenhuma barra; prompt e mudo na tela |
| `dark-1440-work/about/expertise/contact.png` | Encaixes por seção, sem cobrir títulos/textos |
| `dark-1366x600-*.png`, `dark-1024x768-*.png`, `dark-390x844-*.png` | Ajuste a telas baixas, tablet e mobile, sempre dentro da viewport |
| `dark-1440-cursor-badge.png`, `dark-1440-hidden-menu.png` | Descoberta sem botões e opções ocultas |
| `dark-1440-swing-held.png` | Pendurado/balançando enquanto é carregado |
| `dark-1440-scroll-brake-dizzy.png` | Tombo após freada brusca de scroll |
| `dark-1440-lid-closed.png` | Tampa fechada por clique |
| `dark-1440-terminal.png`, `dark-1440-inspect.png` | Terminal curado; Código real + Inspecionar no herói |

Capturas em Chromium headless com SwiftShader (software): servem para composição e estado, não para medir fluidez em GPU.

## Verificação

| Item | Resultado |
|---|---|
| Lint, typecheck | PASS |
| Unitários | **160 / 18 arquivos** (25 de física/trajetória/rig, 12 de terminal/código/inspeção) |
| Builds | Preview + Workstation PASS; público PASS |
| E2E Workstation (servidor de produção 3300) | **30 PASS**, 2 de sites reais pulados por padrão (`QA_LIVE_EMBEDS=1`) |
| E2E geral (prévia) | **87 PASS**, 1 condicional de build público pulado |
| Gate de build público | PASS |
| Repouso | 0 quadros extras após assentar (E2E e unitário) |
| Render | 1 Canvas, 18 draw calls, ~21,1 mil triângulos |
| Bundle | Rapier removido (−1.644.937 B gzip sob gesto); maior chunk three/R3F 243.228 B gzip; índice de código 71.138 B gzip só ao abrir Código |
| CSP do laboratório | Sem `wasm-unsafe-eval`; iframes e `frame-ancestors` inalterados |

Os E2E cobrem:
- ausência de barra/botões fora da tela;
- tampa por clique e por arraste;
- menu oculto por mouse e teclado;
- clique atravessando ao redor da silhueta;
- tela DOM nativa (fixture);
- foco com o app Código e retorno de foco;
- mobile 2D, fallback sem WebGL, perda de contexto e carregamento diferido no mobile;
- axe no menu e no diálogo, e funcionamento sem JavaScript;
- cards de projeto, tema e idioma;
- teclas 3D → prompt → Terminal → tema e navegação;
- Notas, trackpad, Código + Inspecionar e mudo persistente;
- percurso por todas as seções em 1440/1920/768/390: dentro da viewport, preso ao conteúdo durante a leitura, voo sem teleporte após saltos, tela DOM alinhada à mesh física (<0,5 px);
- tombo por freada e ausência de tombo em leitura;
- pêndulo e arremesso com retorno;
- toque vertical × lateral;
- movimento reduzido e iluminação ausente.

## Limitações e pendências

- **Sensação física:** limiares de freada, gravidade, restituição e pêndulo foram calibrados com scroll sintético e SwiftShader. Precisam do teste do proprietário com mouse de roda, trackpad e celular reais.
- **Som:** WebAudio não é verificável em headless; só o estado do mudo é testado.
- **Não medidos nesta entrega:** Lighthouse, INP e ensaios de hidratação lenta.
- **Scripts antigos:** `qa-workstation*.mjs` e `profile-workstation*.mjs` documentam a P01.x e não se aplicam a esta interface.
- **Fora do escopo:** sites externos continuam controlados só pela interação nativa ou pelo foco. Não há fratura, jogos nem publicação. As dez pendências editoriais herdadas permanecem. Aceite estético pendente.
