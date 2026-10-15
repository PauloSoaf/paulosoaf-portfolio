# Workstation P01.2 — legibilidade, profundidade e manipulação

**15/10/2026** · Branch `fix/workstation-visual-physics-continuity` · Base exata **`349d7cfffdc47a13e9aeffbc8ee141c4ffa2e5d3`**. [Autoria e fronteira](../../../HANDOFF.md), [ADR-017](../../../adr/ADR-017-workstation-depth-gestures-and-viewport-physics.md).

Os cinco itens solicitados receberam implementação e validação funcional local. A tela agora respeita profundidade/recorte, o teclado tem legendas próprias maiores, o notebook ganhou materiais/detalhes, há arraste/arremesso real e o alvo do percurso é contínuo. Aceite artístico e metas de performance de publicação continuam pendentes; esta entrega não conclui Code, jogos, destruição ou todo o pacote.

Abra **http://localhost:1010/pt** e confirme **P01.2** na barra do laboratório. A comparação anterior da landing segue em `/pt?experience=recovery`. [Galeria de screenshots e vídeos](review.html), [métricas](metrics.json), [manifesto com dimensões/hashes](evidence-manifest.json).

## Uso

- Arraste a base para mover. Solte em movimento para arremessar; pare antes de soltar para deixá-lo no lugar.
- Alt + arraste gira. **Manipular → Girar** também escolhe giro por arraste.
- **Manipular → Tampa** permite ajustar a dobradiça por arraste; a alça superior e os botões de abrir/fechar também funcionam.
- **Manipular → Ver teclado** aproxima a visão superior, mantendo teclas e trackpad acionáveis.
- **Seguir página** retorna ao percurso e libera a física; reset restaura pose, tampa, câmera e ferramenta.
- No touch, selecione a ferramenta antes de manipular; o modo normal preserva o scroll vertical. Reduced motion não arremessa nem carrega Rapier.

## Defeitos reproduzidos e correções

| Pedido | Alteração verificável | Evidência |
|---|---|---|
| Teclado ilegível | Atlas 1024² com um quad/UV por tecla, texto maior/contraste e proporção física; a legenda acompanha a pressão. Câmera Ver teclado. | `*-keyboard-view.png`, entrada real por mesh nos três idiomas e visão ampliada |
| Qualidade do notebook | Grafite/metais, cantos suaves, ambiente de estúdio local, pés/ventilação inferior/alça. Repetições instanciadas. | `*-hero.png`, `*-closed.png`, `*-angle.png` |
| Tela fora do lugar no anexo | DOM abaixo do Canvas, janela alpha na profundidade do display, oclusão pelo chassi/tampa, recorte comum e enquadramento dos volumes reais. | Antes P01.1 vs `*-grazing.png`, `*-lid-half.png`; teste independente com `matrixWorld` do display |
| Arrastar/fechar/girar/jogar | Ferramentas separadas, gesto por captura, soltura por timestamps e Rapier lazy com colisões, CCD, gravidade/damping/repouso e retorno à página. | `*-drag.png`, `*-throw.png`, vídeos nativos, testes reais de mouse/touch |
| Percurso irregular | Curva contínua entre estações, largura/ângulos interpolados, cache de layout e uma única mola/RAF coordenando GL/DOM. | Quatro viewports, seis estações, reversão/wheel rápido/lento/resize e vídeos |

O erro antigo não era simplesmente a fórmula afim: o DOM podia ultrapassar a área do Canvas e desenhava à frente de toda a geometria. A validação antiga da consistência entre fórmula/âncora não comprovava isso. A P01.2 acrescenta oclusão e compara o DOM com a transformação da própria mesh física, incluindo uma pose próxima à imagem do proprietário.

## Verificação técnica

| Verificação | Resultado |
|---|---|
| Lint / typecheck / build otimizado preview | PASS, `npm run verify` |
| Unitários | **131 PASS / 17 arquivos**, incluindo dez novos casos de velocidade/stale/cap, mundo Rapier real, colisão/repouso, 30/60/120Hz, descarte assíncrono, redução, continuidade e formato/falha do atlas HDR |
| Suíte Workstation completa | **41 PASS** após o bake/shader warmup, incluindo os dois sites reais, PT/EN/ES, Dark/Light, touch, foco/axe, JS off, context loss e falha de asset/física |
| Regressões anteriores | **87 PASS**, com gate público separado |
| Build público e gate | **PASS**; três idiomas sem drafts, laboratório/fixture 404, XFO DENY e ausência de permissão WASM na CSP pública |
| Hidratação lenta da rota experimental | **6 PASS**: 390/1440 × topo/#work/#about, 120ms/180KB/s/CPU4×; deltas zero de altura, topos e scroll |
| Visuais | **118 PNG / 6 WebM**; quatro tamanhos, Dark/Light desktop/mobile, EN/ES, antes/depois, tampa/ângulos/arraste/arremesso, duas capturas finais do bake |
| CI remoto / publicação | Não executados |
| Gate editorial de publicação | **BLOQUEADO** pelas dez pendências herdadas; nenhuma validação foi desativada |

Total sem contar reexecuções: **131 unitários e 129 cenários E2E distintos** (87 regressões + 41 Workstation + gate público). Builds preview/público e a suíte completa final foram executados após o carregador de iluminação pronto.

Os oito novos E2E verificam gesto de arraste, pausa antes da soltura, voo/colisão/repouso, Seguir página/liberação do mundo, giro e tampa distintos, ângulos extremos, teclas na câmera ampliada, Escape/resize, touch explícito, CSP/lazy, falha do chunk físico, reduced motion com opt-in 3D e falha do asset de iluminação. Após a primeira suíte completa, o teste angular ganhou a pose do anexo e passou novamente. As quatro regressões de trajetória também usam cantos físicos independentes.

A primeira rodada expôs captura instável do trackpad e esperas curtas sob SwiftShader concorrente. A aplicação passou a capturar o gesto nativamente; a iluminação PMREM caiu de 256 para 64px/face. Os testes aguardam carregamento com timeout explícito de 15s e repouso, substituindo o sleep fixo de 1s após giro. Não se relaxaram valor digitado, colisões, limites de percurso ou preservação de iframe.

## Evidência visual e movimento

Screenshots e vídeos representam a aplicação real, em Chromium/Windows/SwiftShader, com relógio e reprodução nativos. Foram inspecionados teclado, pose rasante, tampa parcial, desktop/mobile Dark/Light e composições das seções. Os arquivos `before-p01.1-*` preservam a reprodução anterior; não são imagens de uma versão hipotética.

As seis gravações de percurso foram feitas antes de trocar a geração do ambiente pelo atlas pronto. A geometria, pose e dados de iluminação são os mesmos. Duas capturas `baked-final-*`, já com o carregador final em `localhost:1010/pt`, confirmam a versão servida, `studio=baked`, um Canvas e zero pageerrors. No recorte 640×550 do modelo desktop estabilizado, a comparação do antes/depois do bake teve **diferença RGB zero**. O custo de carregamento novo é medido separadamente nos perfis finais; os vídeos anteriores não são usados para alegar seu tempo de inicialização.

| Gravação | Amostras | Maior velocidade em acompanhamento | Idle / 600ms |
|---|---:|---:|---:|
| Desktop Dark 1440 | 673 | 1.801,8px/s | 0 |
| Desktop Light 1440 | 685 | 1.801,8px/s | 0 |
| Desktop amplo 1920 | 743 | 2.400px/s | 0 |
| Tablet 768 | 726 | 2.400px/s | 0 |
| Mobile Dark 390 | 691 | 2.146,7px/s | 0 |
| Mobile Light 390 | 665 | 1.737,9px/s | 0 |

As quatro gravações iniciais de desktop/tablet guardam consistência da âncora (<0,001px), explicitamente rotulada nas métricas. Essa medida não é apresentada como prova independente. As duas gravações mobile refeitas comparam a mesh física, máximo **0,177421px lógico**. A comparação independente também é feita nas regressões temporais nos quatro tamanhos e no teste angular, com limite **<0,25px lógico**; a separação de 0,001 unidade entre plano/âncora e arredondamento CSS explicam erro não nulo. O script atual usa a mesh nas novas gravações. Logs e amostras brutas ficam em `docs/report/Workstation/P01.2`, ignorados.

O limite de 2.400px/s aplica-se ao acompanhamento da página, não ao arraste direto do ponteiro. As estações ainda reservam espaço editorial e a faixa externa pode retirar o objeto temporariamente da viewport durante trânsito. Não há scroll hijacking, metade fixa da página ou notebook permanente sobre todos os parágrafos.

## Performance e escopo físico

Windows, Chromium/SwiftShader e Lighthouse **13.5.0**, origem local. Save-Data isola bootstrap/lazy nos perfis; Lighthouse usa carregamento normal. Não é amostra p75 de campo/GPU física.

| Amostra final | Performance | LCP | TBT | CLS |
|---|---:|---:|---:|---:|
| Workstation desktop | **98** | **682ms** | **118,5ms** | 0,00130 |
| Workstation mobile | **92** | **3.199ms** | **71ms** | 0 |
| Controle atual mobile | **81** | **3.284ms** | **431,5ms** | 0 |

A11y/boas práticas: 100 nas três corridas. SEO do laboratório: 60, com noindex intencional. **LCP mobile continua acima de 2,5s; performance de publicação não está aprovada.** As pontuações não são uma série controlada de campo nem prova universal de ausência de regressão.

A primeira implementação gerava PMREM no navegador e marcou **72 desktop / TBT898,5ms**, embora os testes funcionais passassem. A investigação motivou o bake do mesmo ambiente e preparação assíncrona dos shaders; a corrida seguinte registrou 98/118,5ms. Os relatórios iniciais/finais foram preservados no diretório ignorado. O ambiente de estúdio passa a ser um asset HDR de **112.750 bytes gzip**, carregado com a cena, com parâmetros/licença/proveniência e gerador versionados; falha mantém iluminação direta. As imagens continuam usando os mesmos dados de iluminação; capturas finais validam o carregador novo.

JS inicial **173.085 bytes gzip**, +1.933/+1,13% sobre P01.1, abaixo de 180KB; cena lazy **252.556**, +2.412/+0,96%. **Rapier acrescenta 1.644.937 bytes gzip apenas no primeiro arraste elegível**: custo expressivo e separado do bootstrap/visualização. Os perfis registraram inicialização física em 645ms desktop / 562ms mobile; incluem automação, rede e WASM e não equivalem a INP. A cena manual ficou pronta/estável em 2.153/3.523ms em páginas novas sob SwiftShader, com fallback HTML/SVG disponível; não são promessas para dispositivo real.

Cena: **20 draw calls / 9.366 triângulos**, contra 17/8.000 na P01.1. Zero frames novos em 600ms de repouso nos percursos e no perfil após liberar o mundo. Média CPU de `gl.render` no perfil visual: 2,88ms desktop / 1,70ms mobile, sem equivalência com FPS/GPU ou custo total de inicialização. INP da sequência local: **240ms desktop / 200ms mobile**; desktop acima de 200ms permanece pendente, sem converter a sequência em p75. O perfil físico aguarda explicitamente `FOLLOW` e repouso antes da janela idle; uma primeira instrumentação havia contado a própria retomada da mola como repouso e foi corrigida, sem alterar o comportamento da aplicação.

A física é real, mas **planar**: um corpo 3D restringido a X/Y, rotação travada e quatro paredes virtuais, com collider conservador simplificado. O visitante controla o giro visual separadamente. Há margem para navegação/controles. Não se afirma colisão por tecla, dinâmica livre em seis graus, fratura/destruição ou cumprimento de toda a P04.

A importação de Rapier ocorre ao iniciar o primeiro arraste elegível; a simples visualização não carrega o WASM. Seguir página/resize/desmontagem liberam o mundo; pausa/foco/blur/Escape cancelam voo/gestos. Falha do módulo preserva posição manual e acesso à tela. O teste de falha bloqueia o chunk real e confirma que Notas e retorno à página continuam utilizáveis.

## Segurança e pendências

Somente a rota experimental permite `wasm-unsafe-eval`. A landing pública conserva a CSP anterior; iframe mantém allowlist/sandbox, sem novos domínios ou proxy. Teclado/trackpad virtuais continuam exclusivos dos apps próprios; sites externos usam mouse/teclado/touch nativos ou Focar tela. Ambos os sites passaram novamente nos E2E locais; isso não valida todo o conteúdo remoto nem a futura origem HTTPS.

O gate editorial continua bloqueado pelas **dez pendências herdadas**, incluindo origem HTTPS, perfil/textos, projetos/coleções e contatos. Nada foi promovido a aprovado. Leitor de tela, GPU/dispositivo físico, outros browsers, aceite estético e performance mobile de publicação permanecem pendentes. Esta QA não converte SwiftShader, screenshots ou testes verdes em promessa de 60 FPS.

P01/P01.1 e históricos preservados. [HANDOFF](../../../HANDOFF.md) separa fundação Claude, continuações Codex e especificações do proprietário. `docs/report/` não entra no commit. Sem push, merge ou deploy.

## Arquivos desta entrega

| Grupo | Arquivos principais |
|---|---|
| Modelo/tela | `src/features/workstation/models/{LaptopModel.client.tsx,key-legends.ts}`, `scene/{WorkstationScene.client.tsx,studio-environment.ts}` |
| Percurso/gestos | `orchestrator/{WorkstationOrchestrator.client.tsx,position.ts,trajectory.ts}`, `physics/{manipulation.ts,viewport-physics.ts}` |
| Interface/configuração | `src/styles/workstation.css`, `src/features/workstation/labels.ts`, `next.config.ts`, `package.json`/lockfile |
| Iluminação | `public/art/workstation/` — atlas gzip, parâmetros/hash, licença e README; `scripts/bake-workstation-environment.mjs` |
| Regressões | `tests/unit/workstation-{physics-trajectory,studio}.test.ts`, três arquivos em `tests/workstation/` e gate em `tests/e2e/foundation.spec.ts` |
| Reprodução/evidências | `scripts/{qa,profile,summarize}-workstation-physics.mjs`, esta pasta P01.2 com galeria/manifesto/métricas/118 PNGs/6 WebM |
| Autoria/decisões | `README.md`, `docs/HANDOFF.md`, `docs/adr/ADR-017-workstation-depth-gestures-and-viewport-physics.md` |
