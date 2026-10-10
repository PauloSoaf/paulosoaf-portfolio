# ADR-005 — Rotas estáticas por idioma e 404 global

Status: implementado na S00, sujeito à revisão visual/editorial. Data: 10/10/2026.

O layout raiz fica em `src/app/[locale]/layout.tsx`, com `generateStaticParams` para PT/EN/ES e `dynamicParams=false`. A raiz `/` negocia a preferência pelo proxy; URLs explícitas não são redirecionadas. A resposta de negociação usa `Vary` e `private, no-store`.

A 404 usa `global-not-found.tsx` com documento HTML completo, estilos, fontes e bootstrap de tema próprios. Essa convenção é experimental em Next 16.3.8 e é indicada pela documentação instalada para layouts raiz sob segmentos dinâmicos. A página não recebe o idioma da rota; apresenta três blocos identificados por `lang`, com retorno à home e aos projetos de cada idioma.

O histórico do Claude relatou problemas com um catch-all que chamava `notFound()`. Essa hipótese não é tratada como diagnóstico geral do framework. Na continuação, verificou-se a solução atual por HTTP 404 real e conteúdo/estilos/links utilizáveis sem JavaScript em `/xx`, `/pt/does-not-exist`, `/en/projects/unknown` e `/es/unknown`.

A troca de idioma usa links nativos com navegação de documento. Com JS, salva o cookie e acrescenta a âncora atual; sem JS, o link segue a home correspondente. A transição cliente anterior substituía atributos de `<html>` e perdia `data-theme`/`data-js`; o E2E reproduziu a falha. A navegação nativa executa o bootstrap antes do paint e preserva o tema salvo. Custo: recarrega o documento ao trocar idioma, adequado para esta landing estática.

O servidor registra `Internal: NoFallbackError` para o idioma inválido `/xx`, embora devolva a 404 completa corretamente. Manter como limitação do framework observada, sem ocultar o log. Cases ainda serão implementados em S04 e exigirão novos testes de slug/idioma.
