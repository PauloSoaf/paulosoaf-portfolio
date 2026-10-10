# POC-006: Developer Inspector (Obsidian Dev Mode)

Status: **proposta — NÃO autorizada para implementação.** Feature: `FEATURE-FUTURE-001`
(`specs/07-future/FEATURE-FUTURE-001-obsidian-dev-mode.md`). Sem protótipo nem mockup neste pacote.

## Objetivo
Provar que é possível exibir, dentro do portfólio, o código real e a arquitetura dos componentes publicados sem
afetar o carregamento inicial, a acessibilidade, a cena 3D nem a segurança do repositório.

## Hipótese
Um inspector opt-in, alimentado por snapshots gerados no build a partir de uma allowlist, aumenta a credibilidade
técnica para P2 (tech lead/engenheiro) com custo zero para quem não o ativa.

## Condição de início
Gate da seção 2 da FEATURE-FUTURE-001: MVP (S05) concluído e estável, autorização explícita do proprietário,
repositório público (ou links omitidos), licença definida e lista de componentes montada sobre o código real.

## Escopo mínimo da POC
- Registro com 1 a 2 componentes **existentes** (ex.: sistema de temas da S00 e hero da S01, se já publicado).
- Gerador no build: allowlist, validação de caminho, varredura de segredos, falha segura, SHA no manifesto.
- Botão `</> Dev Mode`, destaque por hover/foco, seleção por teclado/toque, painel com as 4 abas.
- Carga sob demanda (import dinâmico + manifesto estático) e medição antes/depois.

## Modelo de estado (referência)
`isDevMode`, `hoveredId`, `selectedId`, `activeTab`, `activeFile`, `panelLayout` (`side | drawer | fullscreen`),
`reducedMotion`. Desligar o modo zera seleção e remove listeners.

## Casos de teste
Allowlist/path traversal/arquivo ausente/segredo (build falha); hash do código = arquivo no SHA; nenhuma
requisição externa ao inspecionar; teclado + Escape + retorno de foco; 360/768/1440 px; PT/EN/ES × Dark/Light;
canvas R3F e carrossel sem conflito de eventos; Web Vitals e JS inicial sem regressão com o modo desligado.

## Exit criteria
Sem regressão em RNF-001/002/014 e ACs vigentes; nenhum arquivo fora da allowlist publicado; recomendação
documentada (seguir, ajustar ou descartar) para o proprietário decidir a sprint de implementação.

## Aceite
AC-024 a AC-034 (FEATURE-FUTURE-001 §9) e regressão completa.
