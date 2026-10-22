# ADR-023 — Fragmentos repetidos e reprodução de Projetos no notebook

Data: 22/10/2026. Implementação: Codex, a partir de `ca69c5d7734429de04b8246d4d9eb0ae0e1b2372`. Estado: implementado; evidências em [QA ProjectSync](../qa/Workstation/ProjectSync/REPORT.md).

## Problema

Next Link 16.3.8 não reposiciona a página quando o fragmento de destino já corresponde à URL. O visitante pode estar no Hero com `#work` ainda no endereço, recebendo o destaque de Projetos por `:target` e um clique que não o leva à seção. O notebook também permanecia no Desktop, sem acompanhar o carrossel aprovado.

## Decisão

Para um clique simples em âncora existente da mesma página/query, `PageLink` permite que o navegador siga o fragmento, inclusive repetido. Conserva Next Link nas transições de rota, os modificadores de clique e as âncoras do HTML sem JavaScript. O scroll continua nativo, com o offset CSS existente; não há interceptação de wheel, duração JavaScript de scroll ou escrita contínua do histórico.

`useVisibleSection` oferece uma assinatura compartilhada, com RAF somente em eventos de scroll/resize/layout. O marcador fica 24px abaixo do header. Sem seção nesse marcador, retorna `null`, inclusive no Hero. Um componente do header aplica `aria-current="location"`; `:target` permanece apenas como fallback sem esse acompanhamento. A URL não é reescrita pelo scroll spy.

O carrossel original continua dono do reducer e do relógio. Um provider recebe somente campos de apresentação do catálogo já filtrado e ordenado no servidor. A ponte `project-playback` publica seleção/estado/relógio e encaminha comandos aos controles originais. `ProjectsApp`, carregado com o sistema do notebook, usa a mesma assinatura de tempo: não cria intervalos ou um catálogo paralelo. O evento histórico `portfolio:project-change` permanece disponível.

A galeria abre no Desktop ao entrar em Projetos. Uma intenção explícita de navegação para Projetos escolhe a galeria mesmo após um aplicativo manual. Scroll passivo não encerra Notas, Terminal, Código ou um site; saindo da seção, somente a galeria automática volta ao Desktop. A abertura manual da galeria tem estado próprio e permanece disponível. O reducer preserva foco, manipulação e falha.

Visibilidade passa a ser a união do carrossel da página e da galeria aberta e visível no notebook. Isso permite reproduzir no telefone quando a estação fica abaixo do card e na abertura manual pelo Desktop enquanto a página permanece no Hero. A entrada automática continua restrita à seção Projetos pelo reducer; a assinatura de visibilidade não impõe essa restrição a um aplicativo aberto explicitamente. A galeria também observa a proteção de leitura; um notebook oculto por essa proteção não mantém o autoplay sozinho. Hover/foco suspendem o relógio compartilhado. Reduced motion desabilita autoplay e remove a transição da tela, mantendo a seleção manual e o foco 2D.

As imagens usam os componentes existentes e conservam a identificação de arte conceitual. A transição da nova tela requer clipping da mídia e controles em camada posicionada explícita: sem isso, a imagem animada interceptava cliques na projeção 3D, apesar do DOM conter os botões. A regressão usa cliques reais, sem `force` ou dispatch sintético.

## Consequências e limites

- Um único Canvas e a física/trajetória de Claude/P03 permanecem. O relógio atualiza o DOM e não requer um loop adicional de WebGL.
- Carregamento tardio da tela lê a seleção corrente, evitando perder o evento inicial do carrossel.
- Trocas automáticas não abrem iframes externos. O botão de explorar mantém a autorização editorial e os dois destinos já cadastrados.
- O build público continua sem rascunhos; a nova galeria só aparece quando existem projetos visíveis. Nenhuma aprovação editorial, case, métrica, URL ou captura de produto é inventada.
- O conteúdo e a navegação não dependem do 3D. A validação automática não substitui o aceite visual do proprietário ou uma nova medição de performance em hardware físico.
