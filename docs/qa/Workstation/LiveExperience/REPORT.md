# QA — Workstation Live Experience

23/10/2026 · Codex · branch `feat/workstation-live-projects-and-journey`.

Base exata: `eb6501683598438587e68ffaf952af942a19dec2`, árvore limpa em `fix/workstation-project-navigation-sync`. O snapshot P02 do Claude é `17ff916637674df95be03ed58ee44fd22e64981b`. Autoria detalhada em [HANDOFF](../../../HANDOFF.md) e decisões em [ADR-024](../../../adr/ADR-024-live-projects-and-notebook-journey.md).

## Entrega solicitada

| Pedido | Implementação |
| --- | --- |
| Identificar o aviso no body | Comparação entre abertura/reload limpos e injeção isolada de `cz-shortcut-listen`; nenhum suppress/filtro de console no body. |
| Voltar ao início pelo menu | Início/Home/Inicio em header, menu mobile e rodapé; âncora real `#home`, estado ativo por viewport e wordmark com navegação nativa repetida. |
| Executar projetos no notebook | Player sincronizado abre os sites reais de NutriOpus/Déborah Lima nos domínios já autorizados; nenhum `ProjectMedia` dentro do notebook. Outros cinco projetos mostram disponibilidade real e repositório, quando existente. |
| Trajetória sem card encoberto | Navegação à esquerda; portal move o único conjunto de artigos para a aplicação Journey. Conteúdo existente, IDs, teclado e fallback HTML preservados. |
| Retirar tags de rascunho | Apresentação dos badges draft removida, sem alteração dos status, filtros públicos ou gate editorial. |
| Notebook maior e sem cortes | Colunas assimétricas e containers mais amplos; silhueta limitada por slot e viewport; pose frontal estável para leitura; espaço reservado no mobile e proteção da área da trajetória. |

O notebook, materiais/HDR, atlas/legendas/teclado físico, solver, mola da tampa e áudio do Claude não receberam alterações nesta continuação. A inspeção de código conserva seu movimento deliberado; o movimento passivo do ponteiro é suspenso durante a leitura. Terminal, Notas, Código e manipulação física permanecem disponíveis.

## Evidências e resultados

**Concluído tecnicamente.** Lint/typecheck, **218 unitários / 25 arquivos**, builds preview/público; **73 cenários Workstation únicos**, **82 E2E gerais + um condicional público pulado** e **14/14 públicos**. Workstation e gerais foram validados em execuções complementares, discriminadas em [validation.json](validation.json); não se trata de uma única corrida completa sem falhas.

**36 capturas de geometria únicas** em 18 combinações de viewport/tema/DPR, de 360×800 a 3840×2160, incluindo áreas equivalentes a zoom de 125%/200%. Nenhuma sobreposição da coluna editorial, corte nos estados capturados, overflow horizontal, badge draft ou erro de execução. Uma única Canvas; erro máximo de alinhamento físico/DOM de **0.0082px**. A primeira matriz antecedeu apenas os ajustes de wordmark/inspeção e foco/entrada da trajetória, sem alteração da geometria; a captura final repetiu os tamanhos principais e acrescentou 360/1366/3840. Seis testes de rede/JS lentos, inclusive #about direto, mantiveram todos os deltas de altura/scroll em até 1px.

Diagnóstico: **zero erros** na primeira abertura e reload limpos; **um aviso correspondente ao atributo** em cada operação com a mutação simulada. A extensão real instalada pelo proprietário não foi identificada. Axe no Journey projetado: **zero violações**; itens incompletos exigem revisão manual e constam no JSON. Os dez bloqueios editoriais permanecem.

Evidências: [Projetos desktop](2119-dark-work.png), [trajetória desktop](2119-dark-about.png), [Light](2119-light-about.png), [mobile](390-dark-work.png), [mobile Light](390-light-about.png), [4K](3840-dark-work.png), [matriz completa](evidence.json) e [hidratação](hydration.json). Há 18 PNGs selecionados versionados; capturas adicionais, logs e traces ficam exclusivamente em docs/report/Workstation/LiveExperience, fora do Git.

As capturas usam Chromium/SwiftShader e dimensões CSS reais do viewport. A emulação de zoom usa área CSS e DPR equivalentes a um monitor 1920×1080 em 125% e 200%; não representa manipulação do menu visível de zoom do Chrome nem validação em todos os monitores físicos.

A captura 4K foi repetida após aguardar fontes, imagens visíveis e a introdução nativa do site externo, que ainda aparecia sem o título na primeira captura. Nenhuma animação externa foi removida ou finalizada artificialmente. As duas execuções e os resultados de geometria permanecem discriminados no manifesto.

Os testes usam mouse/teclado/wheel nativos, campos e botões reais dentro de um iframe controlado, e verificação separada dos dois sites online. O roteiro controlado verifica pausa durante leitura, persistência do texto e da instância do iframe na troca de tema, controles nos dois sentidos e fallback sem demo. Não foram submetidos formulários de autenticação ou dados pessoais aos sites reais.

## Diagnóstico da hidratação

O código e o HTML normal do portfólio não adicionam `cz-shortcut-listen` ao body. A investigação compara primeira abertura e reload sem extensões com a adição apenas desse atributo ao DOM no início do documento. O diff é compatível com modificação do DOM por extensão; não identifica uma versão antiga do notebook nem comprova qual extensão está instalada no navegador do proprietário. O [React](https://react.dev/reference/react-dom/client/hydrateRoot) exige equivalência na hidratação, e o [Next.js](https://nextjs.org/docs/messages/react-hydration-error) documenta alterações de HTML por extensões como causa possível. Execute `node scripts/diagnose-workstation-hydration.mjs` com `next dev` em `QA_ORIGIN` (padrão 1010); os dados medidos ficam em `validation.json`.

## Histórico de investigação

A primeira rodada específica teve 9/12 PASS. Foram corrigidos o slot mobile insuficiente, que fazia o modelo encostar no título seguinte e ativava a ocultação, e a saída duplicada na incorporação aninhada.

A rodada ampliada teve 69/73 PASS antes das correções dos roteiros. O cálculo antigo de limite horizontal usava `chassis × 1,08`, incompatível com a nova pose frontal; passou a medir os limites da silhueta realmente renderizada. Uma tentativa de acelerar a entrada de leitura com eventos CDP enfileirados gerou um pico observado de **6469px/s** no tablet, acionando corretamente a freada. O roteiro conservou o wheel nativo com acknowledgement e 90ms de espera, sem tolerância maior ou alteração das constantes físicas. A queda por freada usa documento externo controlado para isolar o solver dos scripts/GC de terceiros; sua entrada já era uma trajetória sintética de scroll, não um aceite de hardware. O clique no tema reutiliza o helper de coordenadas nativas existente, pois o auto-scroll de locator em header sticky muda a seção e encerra corretamente a aplicação automática. NutriOpus foi observado navegando para Recursos por scroll sem mudar o hash; o teste exige o deslocamento real em vez de um fragmento inexistente. Os artefatos anteriores foram conservados; as reexecuções são discriminadas na consolidação.

Nos E2E gerais, as expectativas antigas do primeiro item do menu e do modo mobile foram atualizadas para Início e as novas tabs acessíveis. A rodada seguinte passou em 81 cenários e pulou o condicional público; restou uma corrida no teste opt-in de scroll. A instrumentação manteve constantes a posição documental do About e a altura do carrossel: o teste emitia uma segunda rolagem enquanto a navegação inicial ou o foco nativo no botão abaixo da dobra ainda rolava a página. O roteiro agora aguarda essas operações terminarem antes de centralizar o capítulo, conservando o limite de 1px e os asserts de seleção. Cinco repetições consecutivas passaram. Logs das tentativas anteriores, inclusive as que falharam, permanecem em `docs/report`.

## Reprodução

```powershell
$env:PORTFOLIO_CONTENT_PREVIEW='1'
$env:EXPERIMENTAL_WORKSTATION='1'
npm run verify
npm run start -- --hostname 127.0.0.1 --port 3300
```

Em outro terminal, configure `QA_ORIGIN=http://127.0.0.1:3300`, `QA_LIVE_EMBEDS=1` e `QA_WORKSTATION_TEST_REPORT=docs/report/Workstation/LiveExperience/workstation-e2e.json`. Execute `npx playwright test --config playwright.workstation.config.ts` ou selecione os arquivos afetados: `hydration`, `input-motion`, `notebook`, `project-layout`, `project-sync` e `live-experience`. Para capturas: `node scripts/qa-workstation-live-experience.mjs`. `QA_LIVE_OUTPUT` e `QA_LIVE_WIDTHS` permitem outra pasta e recortes explícitos da matriz, sem sobrescrever evidências anteriores. O índice do Código agora inclui 46 arquivos próprios.

## Limites

- Aprovação editorial e os dez bloqueios de publicação anteriores permanecem independentes desta entrega. Retirar badges não aprova conteúdo.
- Os sites externos podem alterar sua disponibilidade, CSP, cookies, navegação ou política de incorporação. Foco 2D, ajuda/retry e link externo continuam disponíveis. Um evento `load` sozinho não é considerado prova de incorporação funcional.
- Não há nova medição Lighthouse/INP, aceite artístico ou certificação manual completa de acessibilidade/hardware nesta etapa. As verificações automatizadas e os trajetos de teclado descritos não substituem essas avaliações.
- A troca explícita de projeto, retry ou entrada/saída do diálogo 2D pode recriar o documento externo. Tema, relógio e pose não devem recriá-lo.

Não houve merge, push ou deploy. `localhost:1010` permanece o endereço de desenvolvimento.
