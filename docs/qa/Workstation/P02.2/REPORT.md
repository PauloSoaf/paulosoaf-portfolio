# Workstation P02.2 — sites imersivos e reação imediata

**21/10/2026 · Codex · `feat/workstation-playful-notebook`.** Retomada exata: `2fea4b80b2235adb77725e0310de4724e2e18587`, árvore limpa. Modelo, materiais e arquitetura da P02 **Claude** (`17ff916`) preservados. Esta continuação acrescenta somente os refinamentos pedidos na auditoria. [Autoria e fronteira](../../../HANDOFF.md) · [ADR-020](../../../adr/ADR-020-workstation-immersive-sites-and-contact-reaction.md) · [P02 Claude](../P02/REPORT.md) · [P02.1 Codex](../P02.1/REPORT.md).

## Comportamento entregue

NutriOpus e Déborah abrem pelo carrossel diretamente no display 3D, inclusive no mobile. O iframe ocupa os **800 × 458,5366 pixels lógicos** da área útil, sem toolbar, endereço, aviso, padding ou borda internos. É o website real, com seu próprio conteúdo, links e scroll. A projeção física conserva a proporção; não há Fullscreen API nem imagem substituta.

O × pertence ao portfólio, fora do iframe. Aparece na região superior direita por hover/foco; touch conserva a affordance visível. O alvo compensa a escala da projeção para aproximadamente 44px na pose utilizável. Opções oferecem ajuda, retry, link externo e foco 2D explícito. PT/EN/ES, Dark/Light e movimento reduzido permanecem. Um opt-in 3D não é desfeito automaticamente ao selecionar um projeto com movimento reduzido.

Tema, rotação, movimento, scroll, impacto e fechar/reabrir a tampa mantêm o mesmo iframe/documento. A transição **explícita** para o diálogo 2D ainda usa outra montagem, herdada da arquitetura, e pode recarregar o site. O trackpad virtual continua restrito aos apps próprios; em sites externos, entrada é nativa. Nenhuma proteção cross-origin foi contornada.

Contatos fortes iniciam `IMPACT`/estrelas/`x_x` no mesmo passo físico da colisão, enquanto o corpo ainda está no ar. Energia regula intensidade e duração; contatos leves não recebem a mesma reação. Há debounce de 120ms por parede e no máximo uma reação forte por voo. Oscilação pequena, torque e balanço da tampa acompanham a pancada. O iframe continua montado sob o efeito temporário.

A pausa imóvel de 1.250ms foi removida. O corpo assenta antes de levantar; a recuperação usa uma mola mais amortecida e um impulso menor, sem atribuição instantânea de posição. Nova pega interrompe a recuperação. O alvo da tampa continua pertencendo ao usuário. Não há loop novo em repouso. Modelo, materiais/HDR, solver `body.ts`, mola `hinge.ts`, trajetória, inércia, áudio, Terminal, Código, inspeção, teclado e trackpad são aproveitados.

A revisão da pega encontrou um defeito reproduzido em unitário: agarrar um corpo invertido podia saltar ~1,6rad no primeiro quadro por causa do limite absoluto do pêndulo. Voltas completas agora são normalizadas para a mesma pose e posições iniciais fora do intervalo retornam por uma restrição amortecida. O solver existente, seus subpassos, gravidade, colisões, atrito e limites de velocidade permanecem; o comportamento da pega que já começa dentro do intervalo não foi recalibrado.

## Validação técnica

**Refinamento funcional concluído; publicação ainda bloqueada por performance e revisão editorial.** Resultados finais em [metrics.json](metrics.json), [hidratação](hydration.json), [matriz visual](evidence.json), [manifesto online](live-evidence.json) e [galeria](GALLERY.md). Ambiente: Windows, Node 22.20, Next 16.3.8, React 19.3, Playwright 1.63, Chromium/SwiftShader. Nenhuma dependência foi acrescentada.

| Verificação | Resultado final |
|---|---|
| Lint e typecheck | PASS |
| Unitários completos | **174 PASS / 19 arquivos**, incluindo 11 novas regressões |
| Build preview com laboratório | PASS |
| Workstation completa, `QA_LIVE_EMBEDS=1` | **46/46 PASS**, zero skip, falha ou flaky; execução única de 08:12–08:25 UTC em 21/10 |
| E2E gerais | **87 PASS + 1 skip condicional** do gate de build público; zero falha/flaky |
| Build público, flags de preview/laboratório desligadas | PASS |
| Gate público, em execução própria | **1/1 PASS**: filtros editoriais, locais, laboratório/fixture indisponíveis e CSP |
| Hidratação lenta | **6/6 PASS**, 390/1440px × topo/`#work`/`#about`; latência 120ms, 180.000B/s e CPU 4×; variações de altura/posição/scroll **zero** |
| Visual | **12/12 combinações**, PT/EN/ES × Dark/Light × 390/1440px; um Canvas, sem overflow/erros; erro máximo de alinhamento ≈0,0063px |
| Repouso | **0 frames adicionais** na janela de 600ms de ambos os perfis e em todas as 12 combinações visuais |
| `release:check` | **BLOCKED**, as mesmas dez pendências editoriais herdadas; nenhuma aprovação alterada |

O teste de reação registrou contato com o teto a 4.064,31px/s: contato e início da reação no **mesmo timestamp RAF (3.956,5ms)**. No relógio `performance.now()`, contato detectado em 3.997,7ms, reação em 3.999,6ms (**1,9ms**) e primeira submissão de render com estrelas em 4.002,9ms (**5,2ms após detecção**). Isso mede o código e a submissão de render, não o instante físico de apresentação da GPU. `IDLE → IMPACT → DIZZY → RECOVERING` e uma única reação forte foram observados. O retorno físico teve posições distintas e velocidade máxima medida de 77,34px/s; a asserção exige movimento real, além de continuidade/interrupção. Contatos simultâneos de canto são registrados como um pacote com todas as paredes, sem perder o teto quando uma lateral também toca no mesmo passo.

| Critério funcional | Evidência |
|---|---|
| Dois sites reais ocupam integralmente o display, sem barras | Duas navegações online desktop e mobile, HTTP 200, dimensões do iframe/root iguais (800 × 459px arredondados), cliques/scroll nativos |
| × por hover, foco e touch; PT/EN/ES | Regressões de mouse/teclado/touch, alvo projetado de ~44px, matriz multilíngue |
| Sem recarregar durante tema/pose/scroll/tampa/impacto | Identidade do iframe e epoch do documento preservados; testes de regressão e manifestos online |
| Contato imediato, fraco/forte, teto/chão/laterais | Unitários nos quatro limites, E2E com timestamps e vídeos nativos; teto no desktop, lateral no mobile, chão em ambos |
| Atordoamento finito, nova pega e retorno contínuo | Controlador unitário, E2E real de interrupção/retorno, estrelas e `x_x` visíveis no vídeo; duas poses invertidas cobertas |
| Reduced motion e fallback preservados | E2E de preferência reduzida/opt-in 3D, timeout e CSP bloqueada; ajuda/link/retry e foco 2D explícito |

### Histórico dos ensaios

As duas primeiras execuções completas tiveram 45 PASS e uma falha cada: gesto antigo de arremesso junto ao chão e preparação do carrossel durante entrada/autoplay. As entradas dos testes foram corrigidas sem relaxar limiares físicos ou usar force click. Uma terceira execução teve 46 PASS; a revisão posterior encontrou o defeito real da pega invertida. Duas regressões reproduziram a falha antes da correção pontual no solver. Após essa correção, a telemetria de canto e a medição mais rigorosa do retorno, foi executada a **quarta suíte completa, 46 PASS**, registrada acima. Unitários, build, matriz, vídeos, perfil e Lighthouse foram obtidos com a fonte final. Os gerais verificam a landing pública preservada; o gate público foi repetido no build final. Corridas/traces anteriores permanecem identificados em `docs/report/Workstation/P02.2/`; não foram somados para apresentar o resultado final como verde.

### Performance e limites de aceite

| Medição | Desktop | Mobile |
|---|---:|---:|
| Lighthouse 13.5 — performance | 99 | 88 |
| LCP Lighthouse | 666,6ms | **3.345,4ms**, acima de 2.500ms |
| TBT Lighthouse | 64,5ms | 232ms |
| CLS Lighthouse | 0,0003364 | 0 |
| Acessibilidade / boas práticas / SEO do laboratório | 100 / 100 / 60 | 100 / 100 / 60 |
| INP da visita local roteirizada | **424ms** | **208ms** |
| CPU média na chamada de render | 1,2116ms | 1,5752ms |

O JavaScript inicial medido soma **184.056B gzip**, contra orçamento de 180.000B (**+4.056B**), e 182.949B da P02.1 (+1.107B). Cena/OS carregados sob demanda: 259.742B; abrir Código: mais 77.716B; arremessar: **zero chunk adicional**. HDR: 112.750B; cena: 18 draw calls / 21.146 triângulos. Os perfis de visita local usam Save-Data para separar bootstrap/carga 3D e não equivalem ao throttling do Lighthouse ou ao p75 em campo. O INP local não atinge 200ms; nenhuma meta foi relaxada. Tempos CPU não são FPS nem duração da GPU. O SEO 60 refere-se à rota de laboratório e não representa aprovação de SEO para publicação.

São amostras locais únicas, sujeitas a variação, e não aprovam performance mobile, hardware físico ou estética. A alteração funcional P02.2 pode ser revisada separadamente; LCP/INP/orçamento e pendências editoriais continuam no roadmap de publicação.

### Evidências visuais

**76 PNGs e dois WebM originais**, listados na [galeria](GALLERY.md): 54 capturas da matriz, 20 dos ensaios online e dois quadros decodificados dos próprios vídeos. [Desktop, 150,44s](videos/pt-live-1440-websites-impact.webm) inclui teto; [mobile, 86,16s](videos/pt-live-390-websites-impact.webm) inclui lateral. Ambos mostram os dois websites, navegação real, fechamento e arremesso ao chão/recuperação. Hashes, dimensões e fontes testadas estão nos manifestos.

O [quadro de atordoamento](screenshots/pt-live-1440-video-dizzy.png) mostra estrelas e `x_x` sobre o NutriOpus real durante o movimento. O [quadro mobile carregado](screenshots/pt-live-390-video-ready.png) complementa a captura inicial feita durante o fade de entrada do próprio site. Os dois quadros foram decodificados sem retoques/overlays; método, seek e hashes constam em [video-frames.json](video-frames.json). O seek do vídeo não é usado como timestamp de contato. Os WebM permanecem originais, sem aceleração ou interpolação.

## Sites reais e falhas

URLs preservadas: [NutriOpus](https://www.nutriopus.com.br/) e [Déborah Lima](https://www.xn--advogadadborahlima-jwb.com.br/). Os dois responderam HTTP 200 sem X-Frame-Options/frame-ancestors restritivo nos cabeçalhos consultados em 21/10/2026. A prova de uso depende também da navegação no navegador; cabeçalhos isolados não substituem esse teste.

O timeout de 15s e `onError` oferecem saída honesta quando o carregamento falha. Um domínio que bloqueia a incorporação pode emitir load mesmo sem conteúdo utilizável: **a aplicação não inspeciona o documento externo**. Nesse caso, as opções do site mantêm ajuda/link/retry acessíveis. A regressão controla separadamente resposta externa sintética, request sem resposta e `frame-ancestors 'none'`; esses testes não são apresentados como validação online.

## Arquivos da continuação Codex

| Arquivo/grupo | Alteração |
|---|---|
| `screen/WorkbenchScreen.client.tsx`, `labels.ts`, `src/styles/workstation.css` | Apresentação imersiva, saída/opções/falhas traduzidas, alvo de touch, efeito finito sem glitch de cor |
| `orchestrator/WorkstationOrchestrator.client.tsx` | Abertura comercial no 3D mobile/opt-in reduzido, montagem persistente da tela, remoção do timer visual antigo |
| `orchestrator/position.ts`, novo `physics/impact-reaction.ts` | Contato imediato, envelope proporcional, debounce, torque, recuperação e diagnósticos |
| `physics/body.ts` | Correção pontual da descontinuidade angular ao iniciar uma pega fora do intervalo do pêndulo |
| `scene/WorkstationScene.client.tsx` | Estrelas ligadas ao contato, fade/tamanho proporcionais, registro do primeiro render, escala do alvo de saída |
| `scripts/generate-workstation-code.mjs` | Allowlist de 33 fontes reais: acrescenta tela e controlador |
| `tests/unit/workstation-impact.test.ts` | Onze regressões novas de contato/energia/continuidade/interrupção/reduced motion, incluindo duas poses de pega que falhavam antes da correção e contatos simultâneos de canto |
| `tests/workstation/immersive-impact.spec.ts`, `notebook.spec.ts`, `input-motion.spec.ts` | Seis cenários novos, tampa persistente/invisível e gesto de arremesso corrigido para levantar o objeto antes da soltura |
| `scripts/qa-workstation-p022.mjs`, `qa-workstation-p02.mjs`, `playwright.workstation.config.ts` | Vídeos online, destinos separados de raw/matriz, screenshot no impacto e JSON da suíte atual |
| `README.md`, `docs/HANDOFF.md`, ADR-020 e esta pasta | Comportamento, autoria exata, decisões, resultados e evidências |

Os caminhos sem prefixo nessa tabela pertencem a `src/features/workstation/`. Modelo/materiais, hinge, trajetória, inércia, áudio e reações da página não têm diff; a exceção pontual no solver é descrita acima.

## Reprodução

Prévia otimizada, em um terminal:

```powershell
$env:PORTFOLIO_CONTENT_PREVIEW='1'
$env:EXPERIMENTAL_WORKSTATION='1'
npm run verify
npm run start -- --hostname 127.0.0.1 --port 3300
```

Em outro terminal, sem executar ensaios GPU/performance simultaneamente:

```powershell
$env:QA_LIVE_EMBEDS='1'
npm run test:workstation
$env:PORTFOLIO_CONTENT_PREVIEW='1'
$env:EXPERIMENTAL_WORKSTATION='1'
$env:PLAYWRIGHT_JSON_OUTPUT_FILE='docs/report/Workstation/P02.2/general-e2e.json'
npx playwright test --reporter=list,html,json
$env:QA_WORKSTATION_OUTPUT='docs/qa/Workstation/P02.2'
node scripts/qa-workstation-p022.mjs
$env:QA_WORKSTATION_OUTPUT='docs/qa/Workstation/P02.2'
$env:QA_WORKSTATION_RAW='docs/report/Workstation/P02.2/matrix-recordings'
$env:QA_WORKSTATION_RECORD='0'
node scripts/qa-workstation-p02.mjs
$env:QA_WORKSTATION_PROFILE_OUTPUT='docs/report/Workstation/P02.2/performance'
npm run profile:workstation
```

`QA_WORKSTATION_WIDTHS=1440` ou `390` permite regravar um cenário online, preservando o outro no manifesto. O roteiro exige os websites reais: não contém route interception, proxies ou screenshots usados como sites. Os vídeos são os WebM originais do Playwright, sem retiming/interpolação, com duração/dimensões/hash no manifesto. O arremesso usa eventos nativos CDP ordenados e timestamps reais; o roteiro levanta o objeto antes da soltura para não confundir contato leve junto ao chão com pancada forte.

Lighthouse (contextos separados do perfil e vídeos):

```powershell
$env:CHROME_PATH=(node -e "process.stdout.write(require('playwright').chromium.executablePath())")
$lhFlags='--headless=new --enable-unsafe-swiftshader'
npx --yes lighthouse@13.5.0 http://127.0.0.1:3300/pt/workstation-lab --quiet --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=docs/report/Workstation/P02.2/performance/lighthouse-mobile.json "--chrome-flags=$lhFlags"
npx --yes lighthouse@13.5.0 http://127.0.0.1:3300/pt/workstation-lab --quiet --preset=desktop --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=docs/report/Workstation/P02.2/performance/lighthouse-desktop.json "--chrome-flags=$lhFlags"
```

Gate público, após encerrar o servidor de prévia:

```powershell
$env:PORTFOLIO_CONTENT_PREVIEW='0'
$env:EXPERIMENTAL_WORKSTATION='0'
npm run build
$env:QA_EXPECT_PUBLIC_CONTENT='1'
npx playwright test -g 'public build'
```

Desenvolvimento final: **http://localhost:1010/pt**, que encaminha para o laboratório. Relatórios completos, logs, traces e tentativas diagnósticas ficam em `docs/report/`, ignorado pelo Git. Fonte/hash do app Código e evidências selecionadas identificam a versão testada; nenhuma aprovação editorial foi alterada.

## Limites que continuam

- SwiftShader/headless valida comportamento e composição; não comprova FPS, som percebido, trackpad/roda/GPU/celular físicos ou aceite artístico. Submissão do primeiro render não mede a apresentação física da GPU.
- A política dos sites externos pode mudar; o futuro domínio HTTPS do portfólio requer nova validação de incorporação.
- LCP/INP e orçamento de publicação continuam sujeitos às metas e medições registradas, sem relaxamento de critérios. O perfil de laboratório não é p75 de campo.
- `release:check` conserva as dez pendências editoriais herdadas. Jogos, destruição, S04/S05 e Explore Mode não foram antecipados.
- Estado remoto consultado em **21/10/2026 às 08:38 UTC**: HEAD da branch ainda `2fea4b8`; o [CI remoto desse commit](https://github.com/PauloSoaf/paulosoaf-portfolio/actions/runs/39551673568) permaneceu **cancelado**. As suítes completas foram reexecutadas localmente; sem novo push, este refinamento não tem execução remota. Sem push, merge ou deploy nesta continuação.
