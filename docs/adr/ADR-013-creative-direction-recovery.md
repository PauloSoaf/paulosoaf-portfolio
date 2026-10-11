# ADR-013 — Escultura espacial e narrativa de scroll

- Data: 11/10/2026
- Estado: POC implementada para revisão estética do proprietário; não autoriza publicação.
- Base: `bd21d677df571286d192618b0aba79437145dee3`, S03.5.
- Escopo: solicitação Creative Direction Recovery; S04/S06/Dev Mode permanecem no roadmap.

## Problema e decisão

A comparação gravada da S03 com S03.5 mostrou pouca alteração da composição durante a navegação comum. A nova solicitação permite alterar escala e ritmo, preservando os tokens, fontes, conteúdo e arquitetura v0.1. A implementação começa por uma POC Hero → Work dentro da landing existente.

A esfera anterior permanece na comparação `?experience=classic`. A experiência padrão usa três fitas abertas, deformadas proceduralmente, com centro negativo, shader metálico neutro, pontos determinísticos e pequenos marcos espaciais. Cada camada gira independentemente. O acento continua limitado ao núcleo e pequenos detalhes da cena. Os textos mantêm os tokens de ênfase originais.

Three/R3F continuam lazy e isolados no Client Component; títulos, CTAs, artes de fallback e projetos continuam no HTML do servidor. Não foram adicionadas dependências. O SVG de fallback é arte vetorial própria, não screenshot ou imagem de produto.

## Comportamento

1. A abertura tipográfica dura 850–950 ms, com atrasos de até 230 ms. Opacidade mínima de 72%, CTAs funcionais desde o HTML, sem loader. Sem JS/reduced motion não há coreografia.
2. A escultura entra de 68% a 100% em 850 ms. Renderização ambiente usa invalidação limitada a 30 Hz mobile / 45 Hz tablet/desktop; interação e assentamento podem solicitar frames adicionais. Essa frequência é de agendamento, não certificação de FPS.
3. Visibilidade observa a superfície real transformada. Touch mobile permite o carregamento quando 18% da arte está visível, após uma janela de 1200 ms para a abertura, seguida de idle callback com timeout de 1000 ms. Desktop usa 350 ms antes do idle callback. Opt-in é imediato; browsers sem idle callback usam a mesma janela. Save-Data/dispositivo limitado/reduced motion continuam exigindo opt-in. Fora da viewport, aba oculta, pausa e arte estática suspendem o loop.
4. O scroll real move o plano da escultura, altera zoom/pitch/posição da câmera e desloca a coluna editorial. O horizonte do Work responde à chegada. Nenhum evento wheel é interceptado, nenhuma seção fica presa.
5. Work usa vitrines de duas colunas em desktop ≥1280 px, 80% da área / máximo 1040 px, mantendo a mesma geometria do fallback nativo antes da hidratação. Cards mobile permanecem verticais. Arte de conceito é identificada explicitamente e recebe profundidade gráfica própria, sem inventar telas comerciais.
6. About usa inclinação e deslocamento contínuos por progresso local, mais uma entrada lateral em perspectiva ao mudar capítulo. Não transforma o fluxo que reserva a altura dos painéis. Seleção manual/teclado continua prioritária; acompanhar scroll desktop continua opcional.

O pequeno runtime de scroll agrupa eventos passivos em um único requestAnimationFrame pendente. Cancela trabalho em cleanup/reduced motion/aba oculta. Não há loop de scroll no repouso. As transformações não mudam a geometria que estabiliza a hidratação.

## Comparação, custo e limites

O bootstrap decide a comparação antes da primeira pintura, sem cookie persistente ou alteração de metadata. `classic` reaproveita o mesmo código funcional atual; os vídeos históricos S03/S03.5 são a evidência das versões exatas anteriores. O modo comparativo não contorna filtros editoriais.

Seis draw calls; perfis mobile/tablet/desktop têm 1.936/2.704/3.472 triângulos. DPR mantém os limites 1/1,25/1,5. Geometrias e timers são descartados ao trocar qualidade/desmontar. GPU timer só é registrado quando disponível. Gzip, Lighthouse, CPU e frames reais estão no [QA](../qa/CreativeRecovery/REPORT.md).

A direção espacial do [Dr-Manaus](https://github.com/PauloSoaf/Dr-Manaus) foi examinada no código/documentação/vídeo locais como referência de camadas e escala. Nenhum asset ou motor foi copiado. Mockups v0.1 continuam referência de identidade; composição e proporções diferem intencionalmente por autorização desta solicitação.

Regressões verificam pixels reais, arraste mouse/toque, câmera pelo scroll, pausa/offscreen, comparação, teclado, falhas GL e hidratação lenta. Testes verdes não representam aprovação estética. Dados comerciais, contatos, métricas de campo, aparelhos físicos e leitura assistiva manual continuam pendentes.
