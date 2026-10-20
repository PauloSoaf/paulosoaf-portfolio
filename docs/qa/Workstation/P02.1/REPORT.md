# Workstation P02.1 — auditoria e correções da continuação Codex

**20/10/2026 · `feat/workstation-playful-notebook`.** A entrega P02 recebida do **Claude** foi validada e preservada, antes de qualquer edição, no commit local **`17ff916637674df95be03ed58ee44fd22e64981b`**. [Fronteira e autoria](../../../HANDOFF.md) · [ADR-019](../../../adr/ADR-019-workstation-p02-continuation.md) · [Entrega original Claude](../P02/REPORT.md).

O modelo, materiais, legendas, composição, física própria, gestos, Terminal, Código, inspeção e áudio da P02 foram aproveitados. **Modelo e CSS do notebook não têm diff em relação a `17ff916`.** Nenhuma constante física foi recalibrada; não foram restaurados barra externa, Rapier ou WASM. Não houve push, merge ou deploy. Esta auditoria não aprova publicação nem substitui o aceite artístico.

## Correções e pendências resolvidas

| Item | Resultado da continuação Codex |
|---|---|
| Fonte local exibida como commit limpo | Corrigida a perda da primeira coluna do porcelain do Git. NUL delimita caminhos; staged/unstaged/untracked são reconhecidos. Git e arquivos usam o mesmo root. Um repositório temporário real verifica os casos. |
| Links de commits ainda locais | Só aparecem para fonte limpa e commit conhecido em `origin` ou identificado pelo provedor do build. SHA/hash e fonte local continuam disponíveis sem inventar uma URL publicada. |
| Fidelidade do Código | Os 31 arquivos e seus SHA-256 são comparados aos bytes reais do repositório; removida uma asserção tautológica. Allowlist, scanner e bloqueios de caminhos continuam ativos. |
| Custo inicial dos apps | Tela/Notas/Terminal/Código carregam sob demanda. Loading localizado e boundary de erro mantêm o portfólio navegável se o chunk falhar. |
| Primeira tecla após carregamento adiado | A primeira versão da otimização Codex perdeu uma tecla no E2E existente. `ready` agora aguarda os bindings da tela; o teste original passou sem reduzir sua exigência. |
| Freada com quadros espaçados | Reproduzida em unitário uma parada instantânea descartada com quadros de 200ms. Corrigido o instante do cruzamento de 30% pelo mesmo filtro exponencial. Preservados 2.300px/s, 110ms, 180ms, cooldown e supressão. Ambos os sentidos e desaceleração gradual passam em 16/50/125/200ms. |
| Hidratação lenta | Seis combinações de 390/1440px × topo/`#work`/`#about`, rede 120ms/180KB/s e CPU 4×. **Delta zero** na altura da timeline, posições das seções e scroll. Sem Save-Data artificial nesse ensaio; inclui início adiado de WebGL quando elegível. |
| Scripts antigos | Novos roteiros P02 usam pixels da viewport, gestos e tela/menu internos. P01.x e evidências Claude permanecem intactos. |
| Evidências visuais | 12 combinações PT/EN/ES × Dark/Light × desktop/mobile; 64 PNGs da matriz, quatro PNGs de hidratação e dois WebM nativos. |

O diagnóstico também confirmou que o arremesso volta ao repouso. A espera inicial do profiler era curta para o relógio de uma simulação com delta limitado no SwiftShader. O roteiro passou a aguardar estados reais; o solver não foi alterado. Para capturas estáticas, o roteiro espera o boot CSS terminar. Após ações assíncronas, espera dois quadros antes de reutilizar pontos projetados; isso corrigiu uma captura mobile que tentava pegar a base com a projeção anterior da tampa.

## Validação técnica

| Verificação | Resultado |
|---|---|
| Lint / typecheck | PASS, inclusive no `npm run verify` final |
| Unitários | **163 PASS / 18 arquivos** |
| Build preview + Workstation | PASS |
| Build público + gate de exclusão de rascunhos/laboratório/fixture | PASS |
| E2E gerais | **87 PASS**, um cenário condicional de build público pulado; esse cenário passou separadamente no build público |
| E2E Workstation | **38 cenários únicos validados**, dois testes de domínio externo pulados |
| QA visual | **12/12**, sem erro JavaScript, um Canvas, sem overflow horizontal |
| Repouso | Zero quadros extras em 600ms nos perfis desktop/mobile e nas 12 capturas finais |
| Tela DOM × mesh real | Máximo **0,00626px** nas observações finais da matriz; regressão temporal <0,5px nos quatro percursos 390/768/1440/1920 |
| Rotação direta | Shift + arraste muda as coordenadas físicas da tela em >20px, preserva Notas e não arremessa |
| Acessibilidade automatizada | Menu, diálogo, conteúdo, temas, fallback, foco, teclado e reduced motion cobertos; leitura manual permanece pendente |
| Gate editorial | **BLOQUEADO**, mesmas dez pendências herdadas; nenhuma aprovação foi alterada |

**Histórico de execução:** a primeira suíte completa registrou 36 PASS, uma falha de freada e dois skips. A investigação produziu a regressão unitária e a correção descritas acima. Freada/reduced motion passaram novamente após a correção; a nova rotação passou separadamente. A consolidação contém 38 PASS únicos + dois skips, **não é apresentada como uma única suíte completa verde**. [metrics.json](metrics.json) guarda contagens, métodos e estatísticas das execuções; traces, falhas iniciais e relatórios completos estão em `docs/report/Workstation/P02.1/`, ignorado pelo Git.

Os ensaios preservam as exigências de queda, impacto e retorno. A entrada sintética de freada confirma três amostras rápidas efetivas antes da parada e as anexa ao relatório, sem alterar relógio/estado do rig. O limite total do cenário acomoda os round trips de wheel no SwiftShader; limites das asserções de slam/impactos/retorno permanecem 4/20/30s. A redução de movimento continua sem queda. Os dois sites externos **não foram revalidados ao vivo nesta auditoria**.

Durante o teste geral de URL desconhecida, o servidor Next registrou `NoFallbackError`; a resposta 404 estilizada e seus links passaram. A dependência não foi modificada.

## Performance medida

Windows, Node **22.20.0**, Chromium/Playwright **1.63.0**, SwiftShader, Lighthouse **13.5.0**, origem local e contextos novos. Lighthouse usa carregamento normal, sem Save-Data; são amostras únicas com a simulação padrão da ferramenta. Não são p75 de campo ou FPS de GPU física.

| Amostra final | Performance | LCP | TBT | CLS |
|---|---:|---:|---:|---:|
| Workstation desktop | **99** | **752ms** | **102ms** | 0,000336 |
| Workstation mobile | **90** | **3.272ms** | **156ms** | 0 |
| Controle atual `/pt` mobile | **83** | **3.254ms** | **381,5ms** | 0 |

A11y e boas práticas: 100 nas três amostras. SEO: 60 no laboratório e 63 no controle de prévia; noindex e pendências editoriais/origem continuam. O LCP mobile **não atingiu 2,5s**, inclusive no controle. Antes das alterações, as amostras P02 mediram 97/89 desktop/mobile, LCP 688/3.315ms e TBT 135,5/182ms. Os arquivos iniciais foram preservados; pequenas diferenças entre corridas não comprovam ganho sustentado.

O perfil interativo separado usa Save-Data apenas para isolar bootstrap, opt-in 3D e Código. Na visita automatizada, o hook existente `next/web-vitals` registrou **INP 360ms desktop / 216ms mobile**, ambos acima de 200ms; a sequência inclui ativação, arraste/arremesso, Código, foco e Notas. [Método e limites do INP de laboratório](https://web.dev/articles/inp). Não há aprovação de performance de publicação.

JS inicial **182.949 bytes gzip**, contra 186.966 na entrada: menos **4.017 bytes / 2,15%**. O orçamento estrito de 180.000 ainda excede em **2.949 bytes**, pendente. Cena + apps adiados: **259.156 bytes gzip**, antes 253.875; o custo foi deslocado para uso, não eliminado. Código: **72.006 bytes gzip** somente ao abrir. Arremessar não baixa JS adicional. Asset HDR: 112.750 bytes, preservado.

Render: **18 draw calls / 21.146 triângulos**, um Canvas. CPU média de `gl.render`: 0,918ms desktop / 1,648ms mobile; isso não mede GPU, FPS ou inicialização completa. Ativação até ready/repouso no perfil: 2.329/2.151ms, incluindo rede, automação e assentamento. Repouso: zero frames extras. Medições e eventos detalhados estão em [metrics.json](metrics.json).

## Evidências e reprodução

- [Galeria completa](GALLERY.md), [manifesto com estados/hashes dos vídeos e fontes](evidence.json), [hidratação numérica](hydration.json).
- [Vídeo desktop original — 93,68s](videos/pt-dark-1440-gestures.webm), [vídeo mobile original — 45,64s](videos/pt-dark-390-gestures.webm): rotação, tampa, carregar/arremessar, retorno, Terminal/Código, percurso e freada.
- [Hero Dark desktop](screenshots/pt-dark-1440-hero.png), [Hero Light desktop](screenshots/pt-light-1440-hero.png), [notebook Light mobile](screenshots/pt-light-390-hero.png), [Código em foco mobile](screenshots/pt-dark-390-code-focus.png).

Os WebM são os arquivos originais do Playwright, com dimensões/duração/SHA-256 registrados; sem aceleração, interpolação ou remontagem. Mouse/teclado/wheel são entradas do navegador; a freada identificada usa uma trajetória de scroll sintética. Capturas sem vídeo usam âncoras para chegar às seções. Não equivalem a avaliação com mouse/trackpad/celular físicos. As fontes da build são identificadas por `17ff916` + alterações locais e hashes individuais; o commit da continuação preserva esses arquivos, sem atribuí-los ao Claude.

```powershell
$env:PORTFOLIO_CONTENT_PREVIEW='1'
$env:EXPERIMENTAL_WORKSTATION='1'
npm run build
npm run start -- --hostname 127.0.0.1 --port 3300
```

Em outro terminal:

```powershell
npm run test:workstation
npm run qa:workstation
npm run profile:workstation
$env:CHROME_PATH=(node -e "process.stdout.write(require('playwright').chromium.executablePath())")
$lhFlags='--headless=new --enable-unsafe-swiftshader'
npx --yes lighthouse@13.5.0 http://127.0.0.1:3300/pt/workstation-lab --quiet --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=docs/report/Workstation/P02.1/performance/lighthouse-mobile.json "--chrome-flags=$lhFlags"
npx --yes lighthouse@13.5.0 http://127.0.0.1:3300/pt/workstation-lab --quiet --preset=desktop --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=docs/report/Workstation/P02.1/performance/lighthouse-desktop.json "--chrome-flags=$lhFlags"
npx --yes lighthouse@13.5.0 http://127.0.0.1:3300/pt --quiet --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=docs/report/Workstation/P02.1/performance/lighthouse-control-mobile.json "--chrome-flags=$lhFlags"
npm run qa:workstation:summary
```

`npm run qa:workstation:hydration` executa somente o ensaio lento. `QA_ORIGIN` altera a origem; `QA_WORKSTATION_CASES` filtra e atualiza casos preservando os demais; `QA_WORKSTATION_OUTPUT` e `QA_WORKSTATION_PROFILE_OUTPUT` alteram destinos. Uma execução completa nova de Workstation gera seu próprio JSON, aceito pelo consolidado. O resumo exige os relatórios Lighthouse e de testes, além das capturas/perfil. `npm run qa:workstation:p01` mantém o roteiro histórico.

Dev: **http://localhost:1010/pt**, com encaminhamento para o laboratório. Relatórios brutos e índice gerado permanecem ignorados; esta pasta contém só documentação e evidências selecionadas.

## Pendências que permanecem abertas

1. **Performance de publicação:** LCP mobile, INP e orçamento inicial ainda acima das metas; complementar com hardware e medições de campo quando houver publicação autorizada. Não relaxar os critérios para declarar PASS.
2. **Hardware e aceite manual:** sensação com roda/trackpad/touch, GPU, som percebido, leitor de tela e aceite artístico. Os limiares físicos do Claude não foram alterados com base em software rendering.
3. **Editorial:** origem HTTPS, perfil, textos PT/EN/ES, mínimo de projetos aprovados, trajetória, especialidades, serviços e contatos email/LinkedIn/CV. O gate continua falhando nas mesmas dez condições.
4. **Rede/publicação:** futura origem HTTPS, políticas dos sites filhos e autorização de publicação continuam próprias; sem novo aceite de incorporação nesta entrega.

Jogos, fratura/destruição, demais apps e Explore Mode continuam fora desta continuação. P02, P01.x e históricos preservados; S04/S05 e S06 seguem as autorizações já documentadas.
