# ADR-009 — Hero WebGL progressivo (S01)

Status: implementado na branch `feat/s01-hero-procedural`, a partir de `ea3cf24`. Autoria desta implementação: Codex. Fundação, conteúdo, tokens e fallback: herdados conforme `docs/HANDOFF.md`.

## Decisão

`HeroEditorial` permanece Server Component. Texto, links e SVG local chegam no HTML. `HeroArtBoundary.client.tsx` é uma ilha decorativa; `next/dynamic` com `ssr: false` carrega `HeroScene.client.tsx` e Three/R3F em chunks separados. O primeiro pedido ocorre 350 ms depois de a arte entrar na viewport, com a aba visível. Reduced motion e Save-Data/dispositivo com até dois núcleos ou 2 GB conservam SVG; o visitante pode optar explicitamente por um render 3D estático ou de menor qualidade.

O host reserva explicitamente a proporção original 820:760, independentemente da carga/decodificação do SVG. Fallback e canvas ocupam esse mesmo espaço; o SVG só perde opacidade após o primeiro frame. Não há carregamento remoto de modelos/texturas nem dados editoriais dentro da cena. Erro de importação, criação do renderer, compilação de shader ou perda de contexto desmonta o canvas e restaura o SVG. O botão permite uma nova tentativa; navegação continua em links nativos.

Em mobile com ponteiro coarse, o carregamento automático exige 90% da arte visível. A navegação natural até a esfera satisfaz esse limiar; opt-in pelo botão continua imediato. Isso evita inicializar Three enquanto texto/CTAs ocupam a primeira dobra. A pausa após carregar usa qualquer interseção, sem reativar o download. A decisão veio da comparação Lighthouse com S00: o primeiro experimento automático a 1% de interseção aumentava TBT mobile de 110 ms para 440 ms. Números finais estão no relatório QA, sem esconder esse experimento.

## Cena e movimento

Esfera deformada por funções determinísticas, shader próprio com campos topográficos e luz calculada, três linhas orbitais numa única geometria, estrelas sem aleatoriedade de runtime e dois marcadores. O grafite azul-petróleo predomina; o verde-água ilumina pontos e uma região discreta do contorno. Não usamos pós-processamento, sombras, vídeo, engine externo ou SVG para simular o 3D ativo.

Rotação do ponteiro limitada a ±0,10 rad, interpolada em refs, sem estado React por frame. Pointer events passivos no hero; canvas decorativo sem captura de input. Touch/coarse não produz parallax. Câmera ortográfica adapta zoom às dimensões reais da arte. A breve entrada converge e encerra o loop; não há rotação perpétua. A cena rende sob demanda, pausando fora da viewport, em aba oculta, por botão ou reduced motion. Uma atualização estática ainda pode ocorrer para tema, câmera ou qualidade.

| Perfil | DPR máximo | Segmentos da esfera | Segmentos por órbita | Estrelas |
|---|---:|---:|---:|---:|
| Mobile / dispositivo limitado | 1 | 40 | 96 | 40 |
| Tablet (640–1023 px) | 1,25 | 56 | 128 | 64 |
| Desktop (≥1024 px) | 1,5 | 72 | 160 | 90 |

Após 30 amostras úteis, média de submissão CPU superior a 18 ms reduz para o perfil mobile durante a montagem. Isso é uma heurística de custo CPU, não uma estimativa de FPS/GPU. Geometrias próprias recebem `dispose()` no cleanup; R3F descarta materiais e o renderer ao desmontar. Não montamos canvases simultâneos no retry.

## Instrumentação e alternativas

`useReportWebVitals` registra medidas em `performance`, sem cookies de analytics, identificadores ou envio a terceiros. As medidas são locais; p75 de campo depende de publicação e coleta posterior autorizada. O marco `portfolio:hero-first-frame` marca o primeiro render.

`?heroDebug=1` habilita atributos de diagnóstico: frames, rotação, draw calls, triângulos, geometrias, DPR, renderer e custo CPU. Quando o browser expõe `EXT_disjoint_timer_query_webgl2`, queries assíncronas medem GPU sem bloqueio; resultados disjoint são descartados. Ausência da extensão é registrada explicitamente. O diagnóstico não aparece na interface de visitantes e não ativa transmissão de dados.

Seguimos o [render sob demanda do R3F](https://r3f.docs.pmnd.rs/advanced/scaling-performance) e as [opções de Canvas](https://r3f.docs.pmnd.rs/api/canvas). O fallback do Canvas é `null`: o SVG já está no servidor. Renderizar nele um componente cujo effect anunciasse falha também disparava em browsers compatíveis; o ErrorBoundary cobre falhas reais de criação.

Não adicionamos Drei, física ou pós-processamento, pois a POC-001 não precisa desses custos. Os shaders usam iluminação própria em lugar de luzes Three separadas, mantendo rim/difuso em uma passagem. O tablet preserva a arte translúcida atrás do texto e wash de contraste; `overflow-clip` evita que foco/scroll de filhos decorativos desloque o conteúdo horizontalmente. Os controles ficam acima da assinatura no tablet.

## Validação

Ver `docs/qa/S01/REPORT.md` para números, screenshots, critérios de aceite e limitações. Perfis de software em Chromium não substituem medição de FPS em aparelhos físicos. S02–S05 seguem no roadmap; S06 e Obsidian Dev Mode não fazem parte desta alteração.
