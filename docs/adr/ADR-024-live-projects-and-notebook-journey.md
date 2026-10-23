# ADR-024 — Projetos reais, trajetória e composição responsiva

Data: 23/10/2026. Autoria: Codex. Base exata: `eb6501683598438587e68ffaf952af942a19dec2`, árvore limpa, branch inicial `fix/workstation-project-navigation-sync`. Continuação na branch `feat/workstation-live-projects-and-journey`.

## Problema e decisão

O proprietário solicitou Início na navegação, sites reais no player sincronizado, detalhes da trajetória dentro do notebook, retirada dos selos de rascunho e escala legível nas resoluções maiores. O notebook e o controlador compartilhado de sete segundos existentes são reaproveitados.

- `home` é uma âncora real do Hero, incluída no menu desktop/mobile e no rodapé. A medição passiva da seção inclui essa âncora. O fragmento da URL continua sendo destino, sem determinar o destaque da navegação.
- `ProjectsApp` usa `CommercialPreview`, extraído da implementação anterior. NutriOpus e Déborah Lima abrem documentos reais nos dois domínios já autorizados. Não são imagens, proxies ou reproduções dos sites. Nenhum domínio foi adicionado à CSP. Projetos sem demonstração verificada mostram sua descrição e repositório, quando disponível.
- O player continua com uma seleção e um relógio, compartilhados com o carrossel da página. Hover/foco suspendem a contagem; foco nativo dentro do iframe interrompe a reprodução até reinício explícito. A instância do documento não é recriada por ticks do relógio, pose ou tema. A troca de projeto e a entrada/saída do diálogo 2D podem recriar o iframe.
- A trajetória mantém sua navegação e os artigos renderizados pelo servidor. Um portal move o único conjunto de artigos para a aplicação `JOURNEY`. Seleção por clique/setas continua vinculada aos mesmos IDs de tab/painel. Sem WebGL, os artigos permanecem no espaço de leitura HTML; sem JavaScript, todos continuam disponíveis em sequência. O slot mantém dimensões antes/depois da hidratação.
- `SYNC_SECTION` troca aplicações automáticas entre Projetos, Trajetória e Desktop. Scroll passivo preserva aplicações abertas manualmente e foco/manipulação. Cliques explícitos nas seções escolhem o conteúdo correspondente.
- Projetos e About usam a largura disponível, com coluna editorial menor à esquerda e slot maior à direita. A silhueta é limitada tanto pelo slot quanto pelo viewport livre abaixo do cabeçalho. A proporção depende de largura **e altura**, incluindo mudanças de layout provocadas por zoom. O ponteiro não inclina o notebook durante a leitura nessas duas seções. Arrastar, girar, tampa e física existentes continuam disponíveis. No mobile, o notebook cede a área da navegação da trajetória, assim como já fazia com o carrossel.
- A retirada de `StatusBadge` para `draft` é apenas visual. Não altera status dos dados, aprovação, filtros públicos ou o gate editorial.

## Diagnóstico do aviso no body

O diff recebido identifica somente `cz-shortcut-listen="true"`, ausente do HTML e do código do portfólio. Ele é compatível com mutação do DOM por extensão antes da hidratação; não demonstra um bundle antigo. A investigação compara primeira abertura e reload em contexto limpo com as mesmas operações após adicionar **apenas** esse atributo no início do documento, como faria uma extensão. Resultados no [QA](../qa/Workstation/LiveExperience/REPORT.md).

Não foi aplicado `suppressHydrationWarning` no body nem filtro de console. React exige equivalência entre servidor e cliente; suprimir o body esconderia também defeitos reais. A documentação do [React](https://react.dev/reference/react-dom/client/hydrateRoot) explica essa equivalência, e o [Next.js](https://nextjs.org/docs/messages/react-hydration-error) lista extensões que modificam HTML como causa possível. A extensão instalada no navegador do proprietário não foi inspecionada; a atribuição a uma extensão específica permanece hipótese.

## Autoria e limites

O modelo/material/legendas/teclado do Claude, HDR, solver de corpos, mola da tampa, áudio, Terminal e Código foram preservados. Codex é responsável pelas mudanças desta ADR; `HANDOFF.md` registra as fronteiras anteriores. Não há aprovação editorial, novos projetos ou demonstrações inventadas, destruição, S06 ou deploy. A incorporação depende dos sites externos, que podem mudar sua política ou disponibilidade. Fallback honesto, retry, foco 2D e link externo continuam disponíveis.
