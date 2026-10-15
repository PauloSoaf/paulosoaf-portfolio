# 01 — Requisitos funcionais: 20 RFs

| ID | Prioridade | Requisito testável | Critério de aceite / prova |
|---|---|---|---|
| **RF-001** | P0 | Renderizar notebook tridimensional autoral, integrado à home ao lado do conteúdo, não split-screen fixa. | 1440/1920, cena e texto convivem; sem sobreposição de CTAs; captura e vídeo reais. |
| **RF-002** | P0 | Rotacionar notebook em 3 eixos com limites de câmera e damping por drag/ponteiro. | Drag real muda transform da mesh; soltar mantém inércia e estabiliza. |
| **RF-003** | P0 | Abrir e fechar a tampa com dobradiça geométrica e limites mecânicos. | Tampa move em ângulo coerente 0°–135° aproximados; fechada não apresenta iframe clicável. |
| **RF-004** | P0 | Exibir tela HTML interativa corretamente ancorada/projetada sobre o display 3D. | Clique e foco reais chegam aos botões do mini OS; tela acompanha transform sem deslocamento excessivo. |
| **RF-005** | P0 | Possibilitar modo `FOCUS_SCREEN` legível com zoom/aproximação e retorno reversível. | Conteúdo fica usável em 390px, 1440px, teclado e toque; fechar preserva estado possível. |
| **RF-006** | P0 | Abrir **NutriOpus real** pela URL validada na tela do notebook, com scroll e navegação efetivos. | Navegação dentro de iframe permitido verificada em Chromium; senão registrar bloqueio e não aprovar RF. |
| **RF-007** | P0 | Abrir **website real Déborah Lima** no notebook, com scroll e navegação efetivos. | Canonical, certificado, frame policy e comportamento de navegação confirmados, sem simulação. |
| **RF-008** | P0 | Selecionar projetos a partir dos elementos existentes de Featured Work/filme e mudar o conteúdo exibido no notebook. | Clicar item altera estado, URL carregada e rótulo do modo; não depender de imagens estáticas. |
| **RF-009** | P0 | Oferecer controles de navegador próprios: fechar `×`, voltar ao desktop, voltar ao portfólio, abrir site em nova aba. | Sem fluxo sem saída; UI nativa fora do iframe e acessível no teclado. |
| **RF-010** | P0 | Oferecer modo Code somente para componentes **do próprio portfólio** com snippets reais extraídos do build e versão commit. | Uma seleção de Hero/ThemeToggle/ProjectCard exibe fonte verídica na versão publicada. |
| **RF-011** | P0 | Inspecionar apenas elementos explicitamente registrados no manifesto allowlist. | Hover/foco/click/teclado destacam IDs autorizados; privados e externos jamais geram código. |
| **RF-012** | P1 | Implementar mini desktop web autoral e leve, com janelas de apps Projects, Code, About/Contact, Terminal curado e mini jogo. | Apps abre/fecha/minimiza, navegação real e sem shell Linux arbitrário. |
| **RF-013** | P1 | Tornar teclado físico **da máquina 3D** interativo para ações locais do mini OS e feedback por tecla. | Clique 3D em tecla acionável executa comando permitido; teclado real continua a funcionar nas entradas. |
| **RF-014** | P1 | Tornar trackpad físico **da máquina 3D** interativo em apps internos: mover cursor/rolar/selecionar em controles próprios. | Gesto dispara scroll em app same-origin e navega desktop; limitações cross-origin documentadas. |
| **RF-015** | P1 | Permitir pegar, mover e arremessar notebook por gesto explícito de manipulação. | Arremesso aplica impulso/vetor mensurável e colisão com parede virtual; não atinge DOM real. |
| **RF-016** | P1 | Simular quebra reversível do laptop ao impacto suficientemente forte. | Acima de limiar validado muda estado, peças se separam/efeito visual; impacto leve não destrói. |
| **RF-017** | P0 | Disponibilizar `Restaurar notebook` após colisão/quebra e reset por teclado/touch. | Sem recarregar a página volta ao estado íntegro/boot; iframe/recursos sem vazamento. |
| **RF-018** | P0 | Sincronizar notebook/contexto com scroll e com a seção ativa, preservando navegação nativa. | Acompanha seção sem ocupar metade fixa, sem wheel hijacking, com anchors corretas. |
| **RF-019** | P0 | Preservar localizações PT/EN/ES, Dark/Light e preferências existentes em todas as janelas/apps. | Troca de tema/idioma durante desktop, preview, code, tombamento não perde funcionalidade. |
| **RF-020** | P0 | Suportar alternativas funcionais para falhas de WebGL, baixa capacidade, redução de movimento, bloqueio de iframe ou indisponibilidade de rede. | CTA e link externo real continuam disponíveis; bloqueios são sinalizados com transparência. |

## Regras de aceite dos RF-006/007
A abertura externa em nova aba **não satisfaz sozinha** o requisito de um site real embutido; é a contingência honesta quando o browser/servidor não autoriza. Os RFs ficam bloqueados até configurar os domínios sob controle/autorização e demonstrar navegação interna em build de teste. `iframe.onload` isolado **não é prova**.

## Relações
RF-001/002/003/004/005 antecedem RF-006/007. RF-015/016 depende de separar rigorosamente interações do iframe dos gestos do objeto. RF-010/011 depende do manifesto seguro do build. RF-019/020 atravessam todas as fases.
