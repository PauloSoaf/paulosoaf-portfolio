# 04 — Modelo, dobradiça, física, keyboard e trackpad

## Modelo 3D
Começar com mesh **procedural autoral** (base/teclado/display trackpad/portas/detalhes) para POC sem risco de licença. Substituir por GLB otimizado quando o design estiver aprovado. A geometria deve ter pivôs consistentes: `root`, `base`, `lidHinge`, `displayPlane`, `trackpadPlane`, `keyboardLayout`, `colliders`, `hitTargets`. Unidades aproximadas em metros, z-up/ y-up consistente com o runtime. O notebook deve existir em posição/escala legíveis nas seções sem permanecer rigidamente alinhado a metade da viewport.

### Dobradiça
- Ângulo físico lógico entre fechado 0° e aberto ~130–140°, ajustado ao modelo; repouso ~108°.
- Em modo interativo, `spring`/interpolação amortecida no pivot; abrir/fechar via clique/drag em handle acessível e teclas/tab.
- Durante arremesso, dobradiça com joint/restrição e limite de torque; colisões não devem abrir/fechar violentamente com flicker.
- Fechar tampa pausa/desativa interatividade do DOM Screen e põe OS em sleep, mas pode preservar a seleção para retorno.

### Física de objetos
`@react-three/rapier` é candidato (não está instalado hoje). Fase normal: notebook `kinematic`/controlado, manipulações suaves. Ao arremessar: converter para `dynamic`, aplicar velocidade/impulso limitados com massa e inércia coerentes. Câmera e host não seguem teleport instantâneo; parede/mesa têm colliders fixos. Após sleep: reposicionar por gesto ou restaurar. Fase broken: destruir fisicamente apenas representação visual (mesh fragments), nunca danificar a página ou produzir payloads infinitos.

### Pegar e arremessar
1. Entrar no modo `MANIPULATE` por alça/base explícita ou botão; `SCREEN` desativa o gesto para não roubar clique do iframe.
2. Ao pointerdown no chassis, capturar ponteiro sobre Canvas; usar raycast/plano do mundo para projetar coordenadas e conservar profundidade.
3. Durante move, anotar os últimos N pontos com timestamps monotônicos; ignorar amostras inválidas/NaN e limitar velocidade.
4. Pointerup calcula velocidade média dos últimos 80–150ms; aplica `linvel`/impulse proporcional (cap configurável). Não usar `event.movementX` bruto como Newton.
5. Colisões via callbacks Rapier medem magnitude/energia relativa ao contato, com debounce e limiar. Impactos pequenos geram vibração/som opcional; impactos fortes entram `BROKEN`.
6. Ao quebrar: pause/unmount do DOM/iframe, substituir assembly íntegro por até ~12–24 fragments instanciados em perfil desktop, ~6–10 mobile, por tempo limitado; `Restaurar` limpa geometrias/rigid bodies e reinstala.
7. Cancelar captura em `pointercancel`, Escape, perda de foco, resize, troca de rota/tema e montagem/desmontagem.

### Colisões/deformação
Priorizar um evento **cinematográfico e reversível**: rachadura procedural ou decal, tampa solta, algumas teclas saltando, tela desligando, transição para fragmentos pré-desenhados. Não gerar CSG/fratura complexa em runtime; custo e artefatos visuais altos. Colisão forte não altera HTML principal nem armazenamento persistente. Fisicamente impossível arremessar a máquina **contra uma parede real**; a parede é um objeto/collider virtual na cena.

### Teclado funcional do laptop
- Teclas 3D com labels precisas; hit target por raycast e mesh instances; feedback de keycap press + som opcional. Ao clicar uma tecla, enviar comando **do mini OS local**: navegar abas, digitar em um input local via estado controlado quando autorizado, Backspace, Enter, Esc, setas, Space.
- Não alegar que `KeyboardEvent` artificial em iframe externo equivale ao teclado humano; eventos sintéticos não são trusted e cross-origin limita controle. Para digitar no NutriOpus/Déborah, usar **teclado real do usuário diretamente no iframe focado**.
- Prever botão `Usar teclado físico` com foco, para acessibilidade; não exigir clicar cada keycap virtual.

### Trackpad funcional
- Área mesh hit test com gesto 1 dedo move cursor do OS **próprio**, clique, duplo clique; 2 dedos rolam painel local com delta normalizado (telas touch podem empregar gesto alternativo). Implementar `TrackpadController` separado e eventos de alto nível tipados.
- A rolagem de **site externo** deve ser **nativa dentro do iframe**, com mouse/trackpad físico ou touch. Controle via trackpad 3D só é possível com colaboração do site remoto, por `postMessage` e script permitido sob domínio de controle; não prometer rolagem cross-origin sem cooperação.
- Sempre possuir botão `Focar tela` para interação direta; detectar mode lock para que girar o laptop não roube um gesto dentro do navegador.

### Qualidade/performance
Perfil low/medium/high, `frameloop=demand` na cena quieta, loop fixo Rapier apenas quando há simulação ativa, sleeping, offscreen pausa, instancing fragmentos, DPR por hardware, sombras limitadas, nenhum postprocessing obrigatório. Qualidade degradada ainda mostra teclado/lid/screen legíveis. Medir CPU/GPU real e memória, não converter draw calls em promessa de FPS.

### Instrumentação/contratos
`collision.impulse`, `impact.velocity`, `notebook.lidAngle`, `notebook.pose`, `physics.activeBodies`, `physics.steps`, `screen.focused`, `webgl.framesInIdle`, `restore.duration`; instrumentação somente de desenvolvimento, não trafegar dados de navegação de usuário no iframe.
