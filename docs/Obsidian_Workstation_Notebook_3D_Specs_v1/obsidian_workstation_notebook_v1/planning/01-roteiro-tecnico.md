# Planejamento técnico: implementação em 8 fases, sem big bang

## Política de branch/integração
- Base mais avançada **verificada** `feat/creative-direction-recovery` SHA `5c607eb...`; confirmar HEAD e working tree local antes de começar. Main ainda na S00. Criar branch `feat/workstation-notebook-poc` da base exata, não da `main` antiga.
- Não fazer merge/push/deploy sem autorização. Não apagar a experiência antiga. Feature flag local `EXPERIMENTAL_WORKSTATION=1` ou rota `/[locale]/workstation-lab` de acesso controlado; proteger release gate atual.
- Não manter Canvas da escultura antiga e do laptop ao mesmo tempo em produção. Reusar runtime/portal e trocar scene variant por flag durante a POC.

## P00 — Preflight técnico (Gate de decisão)
**Tasks**: T00-01 auditar Scene/CreativeRuntime/HeroArtBoundary e URLs em `project-data`; T00-02 inspeção de CSP atual; T00-03 verificar redirects, headers, frame policies e autorização de NutriOpus e Déborah (G-EMBED); T00-04 provar iframe real na origem desejada com wheel/click/campo de teste; T00-05 desenhar 2 wireframes não fixos desktop/mobile; T00-06 capturar baseline S03.5/Recovery e perfil Lighthouse. **Entregável:** `docs/qa/Workstation/P00/EMBED-MATRIX.md` com status `pass/fail/unknown` por site; `ARCHITECTURE-DECISION.md`. Proibido alegar sucesso se o teste remoto não passou.

## P01 — Máquina 3D + DOM vivo (a POC vertical mais importante)
**Tasks**: T01-01 chassis procedural autoral; T01-02 hinge open/close; T01-03 camera orbit/drag do corpo; T01-04 tela DOM alinhada via `<Html transform>` e protótipo 2D overlay alternativo; T01-05 botão Focar tela e X; T01-06 testar input/scroll dentro de **site próprio de laboratório** com origem controlada; T01-07 fluxo de teclado/mobile e reduced. **Gate G01:** click no DOM 3D, open/close lid, focus screen 390 e 1440 com evidência em vídeo. Se a tela DOM não for clicável em cena, parar e reavaliar estratégia de projeção antes de física.

## P02 — Desktop e navegador reais
**Tasks**: T02-01 Desktop/Panels; T02-02 Projects real + Browser; T02-03 registro de sites e validação de URLs; T02-04 `frame-src` explícito e sandbox adequado; T02-05 NutriOpus live/scroll; T02-06 Déborah live/scroll; T02-07 estado blocked/unreachable; T02-08 links externos legítimos. **Gate G02:** browser real no notebook para ambos, se servidores autorizarem; caso contrário, marcar RF-006/007 bloqueados e **não** substituir por fake. Avançar em P03 enquanto aguarda acesso sem falsear aceite.

## P03 — Code Explorer do portfólio
**Tasks**: T03-01 IDs explicitamente registrados; T03-02 build-time snippet allowlist; T03-03 teste de vazamento/path traversal; T03-04 tela Code read-only e highlighting lazy; T03-05 vínculo click/focus de Hero e ThemeToggle → snippet real + arquivo no SHA publicado; T03-06 Code close X → Desktop e FOCUS_SCREEN. **Gate G03:** snippets correspondem ao código da branch auditada, sem conteúdo privado/external.

## P04 — Física expressiva e restaurável
**Tasks**: T04-01 avaliar `@react-three/rapier` compatível com R3F 9/React 19/Three 0.186; T04-02 kinematic→dynamic; T04-03 arremesso por gesto e parede collider; T04-04 limiar de impacto; T04-05 fragments prefab e efeitos curtos; T04-06 reset seguro; T04-07 desmontar frame e capturas ao lançar; T04-08 testes de colisão/limites. **Gate G04:** 3 impactos leves não quebram; impacto forte quebra; reset 10 vezes sem corpos persistentes/erros.

## P05 — Keyboard, trackpad e jogos curados
**Tasks**: T05-01 mesh keycaps + mapa de comandos permitidos; T05-02 trackpad local com move/click/scroll do OS; T05-03 keyboard focus nativo sobre Browser; T05-04 app Terminal curado; T05-05 mini jogo real com pausa/quit; T05-06 UX de cross-origin documentada. **Gate G05:** usuário consegue operar desktop sem trackpad físico se preferir; teclado externo/DOM mantidos; não alegar controle de iframe externo por trackpad virtual.

## P06 — Storytelling integrado, responsividade e direção visual
**Tasks**: T06-01 desacoplar velha escultura e migrar poses da `companion.ts`; T06-02 marcos de scroll e projeto selecionado; T06-03 câmera/transições Hero/Work/About; T06-04 desktop com notebook ao lado dos componentes, sem split fixo; T06-05 mobile focus screen; T06-06 materiais, luzes, sombra e microinterações; T06-07 integração de idioma, tema e CTAs; T06-08 regressão motion/scroll antigo. **Gate G06:** vídeo página inteira, conteúdo legível e notebook claramente tridimensional/manipulável.

## P07 — Hardening, revisão e eventual release
**Tasks**: T07-01 testes globais + visual/e2e/physics; T07-02 QA iframe em domínio de produção; T07-03 perf GPU/CPU/LCP/CLS/INP com dispositivos; T07-04 segurança/cookies/CSP; T07-05 revisão de licença do modelo; T07-06 conteúdo editorial legal e aprovação; T07-07 feature flag/rollback; T07-08 revisão visual com proprietário; T07-09 preparar PRs pequenos de integração. **Gate G07:** todos P0 concluídos, P1 aprovados/pendências registradas; não publicar previews de draft nem dados pessoais.

## Ordem e dependências
P00 → P01 → P02 / P03 → P04 → P05 → P06 → P07. A parte de browser real deve ser testada **antes** do refinamento gráfico final. P03 pode continuar independente de iframe negado. P04 começa quando input HTML versus drag 3D estiver estável. A física nunca pode quebrar o acesso básico a projetos.

## Decisões com maior retorno de custo
1. Usar mesh procedural primeiro, asset GLB apenas depois de validar UX.
2. Um único Canvas global, física lazy ativada durante manipulação/impacto.
3. DOM projetado com modo de foco 2D para websites densos.
4. Mini OS próprio, não emular Linux.
5. Snippet estático no build, nunca fetch de GitHub por click.
6. Começar com 1 app interno e 1 iframe próprio para provar interação; só então avançar aos dois domínios reais.

## Comandos existentes (não inventar scripts novos como já criados)
```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```
Scripts adicionais de QA devem ser criados pela implementação (ex.: `qa:workstation`) e documentados. Usar `PORTFOLIO_CONTENT_PREVIEW=1` somente em build local de prévia; gate público continua rígido.
