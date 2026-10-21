# P02.2 — notebook após atualização de desenvolvimento

**21/10/2026 · Codex.** Retomada de `e35813e945039f64cc35589d950523db0423c520`, árvore limpa, branch `feat/workstation-playful-notebook`. Relato do proprietário: `rig.reaction.stage` indefinido e aviso de hidratação com `cz-shortcut-listen` no body. Nenhum código/modelo/física do Claude foi revertido.

## Diagnóstico e correção

`WorkstationOrchestrator` guarda `MotionRig` e os demais controladores imperativos em inicializadores de `useState`. O Fast Refresh preserva esses valores mesmo quando o módulo da classe muda. Assim, uma aba já aberta antes da P02.2 pode receber a cena nova com uma instância antiga de `MotionRig`, que ainda não tem `reaction`. O stack relatado e registrado no servidor é compatível com essa mistura; um carregamento novo funcionava.

A regressão local alterou temporariamente um inicializador de classe com a página aberta. Antes da correção, o valor da instância permaneceu `initial`; após a correção, passou a `updated` no **mesmo documento**, com cena `ready`, um Canvas e zero erros de execução. A fonte temporária foi restaurada integralmente em `finally`; não há propriedade de teste no produto.

Foi acrescentada somente a diretiva **`// @refresh reset`** ao componente que possui os controladores, com comentário explicando a fronteira. É o mecanismo documentado no guia instalado `node_modules/next/dist/docs/03-architecture/fast-refresh.md`. Os controladores são recriados juntos durante atualizações de código em desenvolvimento. Isso evita combinar objetos de versões diferentes, sem esconder o acesso inválido com optional chaining ou inventar um objeto parcial.

O custo é intencional: uma atualização de código nessa árvore pode reiniciar o mini OS e suas sessões em memória durante desenvolvimento. Tema, pose e interações normais não são atualizações de código; o comportamento de produção permanece igual. Modelo, materiais, gravidade, solver, trajetória e conteúdo não foram alterados.

## Aviso no body

`cz-shortcut-listen` não é emitido pelo layout, pelo HTML servido ou por outro arquivo do projeto. O aviso foi isolado em dois carregamentos, com JavaScript da aplicação retido até depois da leitura do body:

| Cenário | Aviso de hidratação | Notebook | Interação com Notas |
|---|---|---|---|
| Documento normal | Ausente | Ready, um Canvas, zero erros de execução | Funciona |
| Atributo externo inserido antes da hidratação | Presente, citando o mesmo atributo | Ready, um Canvas, zero erros de execução | Funciona |

A origem específica deve ser confirmada nas extensões/scripts do navegador do proprietário; o padrão é compatível com uma extensão como ColorZilla. A medida apropriada é desativar essa extensão para `localhost` e recarregar. Não foi adicionado o atributo ao HTML do servidor nem uma supressão ampla de hidratação ao body. A [documentação do React](https://react.dev/reference/react-dom/client/hydrateRoot#suppressing-unavoidable-hydration-mismatch-errors) trata supressão como escape hatch; os diagnósticos de divergências reais da aplicação continuam ativos.

## Reprodução

Com `npm run dev` em `localhost:1010`, execute sozinho:

```powershell
node scripts/qa-workstation-refresh.mjs
```

O roteiro usa navegador real e HMR, observa o código atualizado e o inicializador da classe, verifica identidade do documento, cena pronta, Canvas único e ausência de exceções. Instrumenta temporariamente `position.ts`, restaura em `finally` e preserva alterações concorrentes inesperadas. A cópia original e os resultados ficam em `docs/report/Workstation/P02.2/hotfix-refresh/`, ignorado. `--expect-stale` permite demonstrar a retenção anterior numa revisão sem a diretiva; não é o critério de sucesso da correção.

## Validação desta correção

| Verificação | Resultado |
|---|---|
| `npm run verify`, preview/laboratório habilitados | Lint, typecheck, **174 unitários / 19 arquivos** e build PASS |
| Regressão de atualização de classe com aba aberta | Valor antigo reproduzido antes; inicializador novo observado depois, mesmo documento, um Canvas, zero exceções |
| Isolamento do atributo no body | Normal sem aviso; injeção controlada com aviso; ambos com notebook e Notas funcionais |
| E2E selecionados no build otimizado | **8/8 PASS**, zero skip/flaky/falha, uma execução de 1,9min |

Os oito cenários verificam abertura do notebook, tampa, DOM/input/scroll na tela, app Código e retorno de foco, reduced motion/WebGL indisponível, os dois sites em display completo com documento preservado e fechamento touch. Comando:

```powershell
$env:PORTFOLIO_CONTENT_PREVIEW='1'
$env:EXPERIMENTAL_WORKSTATION='1'
npm run verify
$env:QA_MANAGE_SERVER='1'
$env:QA_WORKSTATION_TEST_REPORT='docs/report/Workstation/P02.2/hotfix-refresh/e2e.json'
npx playwright test --config playwright.workstation.config.ts notebook.spec.ts immersive-impact.spec.ts -g 'the notebook is the interface|clicking the lid|entire display|touch commercial|DOM on the 3D display|focus dialog shows|reduced motion and unavailable'
```

Resumo selecionado e hashes da fonte: [REFRESH-EVIDENCE.json](REFRESH-EVIDENCE.json). Logs completos continuam em `docs/report`. As métricas, vídeos e 46 cenários completos do [relatório original](REPORT.md) continuam identificados como a entrega P02.2 anterior; não foram regenerados nem atribuídos a esta correção de desenvolvimento. Performance/editorial e aceite em hardware físico continuam com os limites já documentados. Commit local próprio; sem push, merge ou deploy.
