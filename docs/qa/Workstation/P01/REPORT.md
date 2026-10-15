# Obsidian Workstation — P00 + P01

Data: **14/10/2026**. Branch: **`feat/workstation-notebook-poc`**. Base exata: **`5c607eb17d29d536620e0cd2080f8202586441b3`**. Autoria/fronteira: [HANDOFF](../../../HANDOFF.md). Contrato recebido: [prompt do pacote](../../../Obsidian_Workstation_Notebook_3D_Specs_v1/obsidian_workstation_notebook_v1/agents/PROMPT-CLAUDE-CODEX.md).

**POC P01 funcional em Chromium local.** Notebook Three.js autoral, tela DOM projetada clicável, tampa, rotação/damping em três eixos, fixture com input/click/scroll nativos e modo de foco 2D desktop/mobile. As duas landings comerciais também foram navegadas de verdade na tela. P02–P07, domínio HTTPS de publicação e aceite artístico permanecem pendentes; esta entrega não declara os vinte RFs completos nem autoriza release.

Preview: **http://localhost:1010/pt/workstation-lab**, também EN/ES. Após o ajuste de entrada solicitado pelo proprietário, `next dev` encaminha `/pt`, `/en` e `/es` para a Workstation; a comparação anterior fica em `/pt?experience=recovery`. Nos builds otimizados, as raízes continuam na landing normal. Build otimizado da POC exige `PORTFOLIO_CONTENT_PREVIEW=1` e `EXPERIMENTAL_WORKSTATION=1`. Um build público normal retorna 404 no laboratório e fixture e preserva os filtros editoriais.

## O que foi implementado

- Modelo procedural original: base, chassi, tampa com pivô real, moldura/display, portas, teclas instanciadas com atlas de legendas e trackpad visível. Teclado/trackpad do modelo são hit targets preparados para P05; não executam comandos fictícios.
- Um Canvas substitui a escultura somente no laboratório. A cena usa as âncoras reservadas do Hero e Work, com posição e tamanho distintos, preservando as demais seções em largura editorial. Tablet/mobile mantêm o objeto no fluxo e oferecem foco plano legível. A coreografia por toda a página fica em P06.
- Reducer tipado, limites/validação de entradas, drag horizontal no corpo, três eixos por drag/controles, tampa 0°/108° e limite 135°, reset de pose, cancelamento e descarte. Tela/teclas/trackpad não iniciam giro. Gesto vertical conserva scroll nativo.
- Desktop próprio com Browser funcional e Code explicitamente identificado como placeholder P03. `×` sai do app e retorna ao Desktop. Foco usa diálogo nativo, saída explícita/Escape e restaura foco ao acionador. Seleção do app sobrevive à mudança de apresentação; iframe é remontado, sem conservar sessão oculta.
- Fixture local isolada com input, botão, resultado, links e conteúdo longo. NutriOpus e Déborah abrem URLs reais registradas, com domínio e link externo na moldura. Ações dos cards existentes abrem os sites no contexto do Work. Nenhum `draft`, `demo` ou conteúdo comercial foi aprovado.
- Scrollbar **nativa** personalizada, 14px, Dark/Light, thumb arredondado, acento discreto e fallback forced-colors. Nenhum wheel hijacking. Links de seção/idioma permanecem funcionais dentro do laboratório, inclusive em HTML sem JS.
- Reduced-motion, Save-Data, dispositivo limitado e falha de WebGL preservam a alternativa 2D. Mobile só inicia Three automaticamente quando **55%** da cena está visível; opt-in é imediato. Controles fixos fora da viewport ficam ocultos e a entrada HTML no fluxo permanece acessível.

## Prova de DOM e sites reais

Compararam-se Drei 10.7.9 `Html transform` e projeção afim própria. No ambiente testado, Drei deixou o wrapper vazio em desenvolvimento **e** build otimizado; não se diagnosticou sua causa interna. A projeção própria funcionou com tela e iframe reais. A dependência de ensaio foi removida; o lockfile final não ganhou bibliotecas. [ADR-015](../../../adr/ADR-015-workstation-dom-screen.md), [decisão/wireframes](../P00/ARCHITECTURE-DECISION.md), [comparação](../P00/dom-comparison.json), [Drei](../P00/compare-drei.png), [projeção](../P00/compare-projected.png).

As doze combinações PT/EN/ES × Dark/Light × desktop/mobile registraram **650px de scroll nativo** dentro da fixture, um Canvas, zero pageerrors e zero overflow horizontal. O E2E também digitou, clicou, confirmou o resultado e verificou que rolar na tela não gira o objeto nem rola a página principal. Touch foi exercitado com eventos nativos do Chromium.

NutriOpus e Déborah: GET/redirect, documento correto, clique e wheel reais em Chromium. Cada ensaio integrado registrou **0 → 650px**, retorno pelo `×` e nenhum erro de console. Déborah exige o host final com `www`; seu canonical HTML divergente não foi usado como redirect. A aplicação não lê o DOM cross-origin e não usa `onload` como comprovação. [Matriz completa, políticas e pendências](../P00/EMBED-MATRIX.md), [resultados integrados](live-embed-results.json).

## Validação técnica

| Verificação | Resultado |
|---|---|
| Lint / typecheck | PASS |
| Unitários | **115 PASS**, 14 arquivos; estado, IDs inválidos/NaN, foco, tampa, limites, reset e hit targets |
| Build otimizado de preview e público | PASS |
| E2E Workstation em preview otimizado | **14 PASS**, incluindo dois sites online, context loss/retry, carregamento progressivo mobile e hit targets reais |
| Regressões herdadas | **87 cenários distintos cobertos**: execução global e reexecução dos sete casos de reflow/touch após sincronização; um caso público é condicionado ao build público |
| Gate E2E público | **PASS** nos três idiomas: ausência de drafts/contatos não aprovados, laboratório/fixture 404 e XFO DENY |
| Axe/teclado | Diálogo sem violações automatizadas; Enter, Escape, retorno de foco, navegação e X testados |
| Hidratação lenta do laboratório | **6 cenários**, 390/1440 × topo/#work/#about; latência 120ms, 180KB/s, CPU4×, JS retido 800ms após fontes |
| Estabilidade da hidratação | Altura da timeline sem mudança; maior delta de topo/scroll **1px** no #about mobile, dentro da tolerância declarada |
| Visual | **89 PNGs P01**, duas comparações P00 e **6 WebM nativos**, dimensões/duração/SHA-256 verificados |

Os testes herdados conservaram as mesmas asserções de comportamento. O clock agora instala uma época explícita e pausa em instante futuro; o reflow aguarda a largura mínima após resize; o teste touch aguarda pose **exatamente** estável antes de comparar igualdade. Isso evita medir o resize ou fim do damping como se fossem uma nova interação.

## Performance medida

Windows, Chromium/SwiftShader, Lighthouse **13.5.0**, laboratório local. Não são métricas de campo/p75 ou promessa de GPU/FPS. A execução compartilhada e diferenças entre corridas limitam a comparação. Perfil de JS usa Save-Data para separar bootstrap e import lazy; o teste Lighthouse final usa carregamento automático normal.

| Amostra | Performance LH | LCP | CLS | TBT |
|---|---:|---:|---:|---:|
| Landing de controle atual, preview mobile | 81 | 3177ms | 0 | 472,5ms |
| Workstation, preview mobile | **92** | **3224ms** | **0** | **123,5ms** |
| Workstation, preview desktop | **100** | **648ms** | **0,00069** | **39ms** |

A primeira corrida mobile da POC foi **66 / LCP3453ms / TBT1330ms**: a cena iniciava com apenas um pequeno fragmento visível. O gate de **55%** corrigiu esse carregamento prematuro; o novo E2E exige ausência de Canvas no primeiro peek e presença real após centralizar o objeto. Essa correção não valida a meta de LCP ≤2,5s: ela **continua pendente**. A11y e boas práticas Lighthouse: 100. SEO do laboratório: 60, com noindex intencional; SEO/publicação deve ser validado no fluxo público da S05/P07.

JS inicial: **166.070 bytes gzip**, cerca de +5,8KB/+3,6% contra os 160.275 do relatório `5c607eb`, abaixo de 180KB. Cena lazy: **248.617 bytes gzip**; física/editor não foram adicionados. Perfil do notebook: **17 draw calls / 8000 triângulos**, zero novos frames em 600ms de repouso nos dois tamanhos. Média CPU de `gl.render`, incluindo inicialização: aproximadamente **1,48ms mobile / 1,62ms desktop**. INP da sequência local: **64ms mobile / 304ms desktop**; a amostra desktop excede 200ms e exige investigação de inicialização/interação em P07, sem aprovação de performance. Não são p75 nem medição de GPU. A landing de controle sem interações não forneceu amostra INP comparável. CLS **0,000153 mobile / 0 desktop**, abaixo de 0,1. Dados em [metrics.json](metrics.json).

## Critérios e limites

| Escopo | Situação |
|---|---|
| RF-001/002/003/004/005 | P01 local comprovada: geometria, rotação, tampa, DOM e foco legível |
| RF-008/009 | Seleção dos dois cards, X, foco/retorno e link externo comprovados; expansão do browser é P02 |
| RF-006/007 | PASS técnico **local**; requisito de release pendente de origem HTTPS/aceite P02 |
| RF-019/020 | Idiomas/temas e alternativas exercitados na POC; hardening completo segue P07 |
| RF-010/011 | P03: sem snippets/inspect implementados; stub não expõe código externo ou privado |
| RF-012/013/014 | Desktop mínimo nesta POC; window manager, apps, teclado/trackpad funcionais e jogo seguem P05 |
| RF-015/016/017 | Física, quebra e restauração após impacto seguem P04; reset atual redefine pose/falha gráfica |
| RF-018 | Hero→Work comprovado; composição completa ao longo da página segue P06 |
| RNF-001/002/003 | LCP alvo, GPU/aparelho físico, FPS ativo, leitor de tela e revisão manual/zoom de browser permanecem pendentes |
| RNF-004/006/007/008/009/010 | Controles de segurança, fallback/context loss, seis larguras, modularidade, recursos autorais e orçamento inicial exercitados localmente; revisão de release não inferida |
| RNF-005 | Nenhuma fonte publicada pelo stub; pipeline seguro é P03 |

**`release:check` continua bloqueado por dez pendências herdadas**: SITE_URL HTTPS, perfil, textos PT/EN/ES, mínimo de três projetos aprovados (zero hoje), trajetória, especialidades, serviços, email, LinkedIn e CV. Nenhuma validação foi desligada. Firefox/WebKit não foram executados; navegador/dispositivo físico e aceite estético dependem de validação futura. Os testes de sites cobrem landings públicas anônimas, sem formulários, autenticação ou todas as rotas.

## Evidências e reprodução

[Galeria local de capturas e vídeos](review.html), [resultados visuais](visual-results.json), [metadata dos vídeos](video-metadata.json), [métricas/hidratação](metrics.json).

Vídeos principais: [desktop Dark](videos/pt-dark-1440.webm), [desktop Light](videos/pt-light-1440.webm), [mobile Dark](videos/pt-dark-390.webm), [mobile Light](videos/pt-light-390.webm), [NutriOpus real](videos/live-nutriopus.webm), [Déborah real](videos/live-deborah.webm). Capturas: [notebook desktop](screenshots/pt-dark-1440-notebook.png), [ao lado do Work](screenshots/pt-dark-1440-work.png), [mobile Light](screenshots/pt-light-390-notebook.png), [foco mobile](screenshots/pt-dark-390-focus.png).

```powershell
$env:PORTFOLIO_CONTENT_PREVIEW='1'
$env:EXPERIMENTAL_WORKSTATION='1'
npm run build
npm run start -- --port 3300
# Em outro terminal, com o servidor acima ativo:
$env:QA_LIVE_EMBEDS='1'
npm run test:workstation
npm run qa:workstation
node scripts/record-workstation-live.mjs
node scripts/profile-workstation.mjs
# Hidratação do laboratório:
$env:QA_ORIGIN='http://127.0.0.1:3300'
$env:QA_HYDRATION_PAGE_PATH='/pt/workstation-lab'
$env:QA_HYDRATION_HASHES=',#work,#about'
$env:QA_HYDRATION_OUTPUT_DIR='docs/report/Workstation/hydration'
$env:QA_HYDRATION_SCREENSHOT_DIR='docs/qa/Workstation/P01/screenshots'
node scripts/profile-hydration.mjs
$env:QA_CREATIVE_OUTPUT_DIR='docs/qa/Workstation/P01'
node scripts/summarize-recovery-videos.mjs
node scripts/summarize-workstation-qa.mjs
```

Relatórios Lighthouse completos, logs, cache e ensaios intermediários ficam em **`docs/report/Workstation/`, ignorados pelo Git**. O pacote recebido e os resumos/evidências selecionadas ficam em `docs`. Commit local; nenhum merge, push ou deploy desta continuação. Próxima etapa do pacote depende do aceite da POC, conforme prompt fornecido.
