# Creative Direction Recovery — POC integrada

Data: 11/10/2026. Branch: `feat/creative-direction-recovery`. Base exata: `bd21d677df571286d192618b0aba79437145dee3` (S03.5).

**Estado: POC implementada e testada para revisão estética; aceite do proprietário pendente.** A performance mobile continua exigindo trabalho antes de publicação. S04/S06/Dev Mode não foram iniciados e o conteúdo editorial não foi aprovado automaticamente.

## Ver antes de avaliar

- [Página de revisão com três versões e seletor desktop/mobile](review.html).
- [Depois — desktop Dark](videos/after-pt-dark-1440.webm), [mobile Dark](videos/after-pt-dark-390.webm), [desktop Light](videos/after-pt-light-1440.webm), [mobile Light](videos/after-pt-light-390.webm).
- Antes: [S03 desktop](videos/before-s03-1440.webm), [S03 mobile](videos/before-s03-390.webm), [S03.5 desktop](videos/before-s03-5-1440.webm), [S03.5 mobile](videos/before-s03-5-390.webm).
- Execução local: `http://localhost:1010/pt`; comparação funcional: `http://localhost:1010/pt?experience=classic`. EN/ES e temas continuam disponíveis.
- [Métricas](metrics.json), [metadados e hashes dos vídeos](video-metadata.json), [decisão arquitetural](../../adr/ADR-013-creative-direction-recovery.md), [fronteira Claude/Codex](../../HANDOFF.md#creative-direction-recovery--fronteira-exata-e-autoria).

Os oito WebM são gravações nativas Playwright em tempo real, sem retiming ou frames artificiais. Desktop é 1440×900; mobile, 390×844 com touch habilitado. O depois demonstra drag mouse/touch e navegação completa Hero/Work/About/Expertise/Services/Contact. Scroll de navegação é wheel; E2E também verifica swipe vertical por eventos touch reais do Chromium. Não representa certificação em telefone físico.

Os vídeos históricos foram gravados **antes da alteração da aplicação**. S03 foi construída com webpack em worktree detached; S03.5 foi gravada no dev existente. Os vídeos depois usam build otimizado da POC. Essa comparação avalia composição e comportamento, sem equiparar bundlers/carregamento como benchmark. As primeiras imagens podem registrar o SVG enquanto WebGL carrega; o depois aguarda estado real `ready` para os PNGs. A duração dos percursos é diferente e não foi normalizada.

## Diagnóstico e mudança perceptível

| Navegação comum | S03 / S03.5 | POC Recovery |
|---|---|---|
| Abertura | Mesma composição editorial e esfera; os controles concentram a mudança S03.5. | Texto coreografado já na primeira dobra e escultura aberta, maior e mais iluminada. |
| Sem hover | Objeto assenta e interrompe os frames. | Fitas e partículas se movem independentemente, com pausa disponível. |
| Hero → Work | Saída pequena, sem alterar claramente a composição. | Plano espacial desce/reduz, câmera muda pitch/zoom e copy desloca; horizonte conecta a chegada do Work. |
| Projetos | Cards de 62% / até 790 px, mídia acima do texto. | Vitrines de 80% / até 1040 px em duas colunas no desktop amplo, com arte conceitual em perspectiva. |
| About | Seleção funcional e entrada curta. | Profundidade contínua pelo scroll, inclinação dos painéis e entrada lateral em perspectiva por capítulo. |

Foram examinados os mockups v0.1 Hero/Work desktop/mobile e timeline. Mudanças de escala, composição, iluminação e ritmo são intencionais, autorizadas pelo prompt Recovery. Tokens Dark/Light e as três fontes não mudaram. Não foi usada v0.2. O acento 3D é um pequeno núcleo/marcos; a tipografia mantém a ênfase original.

A direção do Dr-Manaus foi examinada em documentação, provider e vídeo de galáxia locais como referência de escala e camadas. A geometria é própria, sem copiar assets/motor. Não foram fabricadas capturas de NutriOpus/Déborah Lima ou telas de produto. A identificação “arte conceitual — não é captura do projeto” permanece visível; capturas reais autorizadas continuam dependentes da S04.

## Funcionalidades e critérios demonstrados

| Critério da POC | Evidência / resultado |
|---|---|
| Abertura distinta | Coreografia de texto e entrada real de 68%→100%; vídeos e PNGs depois. Conteúdo permanece legível desde o HTML. |
| Cena espacial real | Três fitas procedurais abertas, shader próprio, partículas determinísticas e rotações independentes. E2E compara pixels em repouso e após drag. |
| Duas assinaturas de scroll | Hero/câmera/Work e About/painéis; E2E mede transformações reais, pixels e seleção. Eventos scroll passivos, sem wheel hijacking. |
| Mouse, touch, teclado e pausa | Drag/inércia e setas de exploração; pausa suspende frames; swipe vertical mantém navegação; tabs About preservam prioridade manual. |
| Progressive enhancement | SVG servidor, reserva de espaço, gates low-memory/Save-Data, falhas GL/shader/chunk e descarte de canvases. Sem JS/CSS, conteúdo semântico completo. |
| Reduced motion | Sem abertura, parallax, profundidade animada, autoplay ou WebGL automático; opt-in manual 3D permanece estático. |
| Responsividade/i18n/temas | E2E em 360/390/768/1024/1440/1920 e zoom textual 200%; capturas PT/EN/ES, Dark/Light desktop/mobile, sem overflow. |
| Hidratação lenta | JS retido, rede com 120 ms e CPU 4×, entrada direta em `#about`; geometria e scroll conferidos antes/depois. |
| Performance | Custos reais relatados abaixo. LCP mobile ainda não atende 2,5 s; não foi declarado aprovado. |
| Aceite estético | **Pendente do proprietário.** Testes verdes não decidem o impacto visual. |

Uma regressão detectou a faixa decorativa interceptando o clique de pausa após aumentar a arte. A correção tornou a faixa transparente a ponteiros e reposicionou os controles. Não foram usados cliques forçados para contornar o defeito. O runtime dev também foi reiniciado após parar de hidratar; execução otimizada e novo smoke confirmam os componentes reais.

## Arquivos e validação

- Cena: `RecoverySculpture.client.tsx`, `HeroScene.client.tsx`, `HeroArtBoundary.client.tsx`, `HeroFallback.tsx`.
- Composição/runtime: `creative.css`, `features/creative/`, `HeroEditorial.tsx`, `SectionHeading.tsx`, `ProjectCard.tsx`, landing e import CSS; bootstrap contém somente a escolha classic/recovery.
- QA: unitários `creative.test.ts`, E2E `creative.spec.ts`, regressões Hero/polish, suíte visual/config Recovery e scripts de gravação/perfis/resumo. Nenhuma dependência foi acrescentada.
- Docs: ADR-013, HANDOFF, README, este relatório, métricas, revisão HTML e evidências. Logs/experimentos/perfis completos em `docs/report/CreativeRecovery/`, **fora do Git**.

Lint/typecheck e builds de prévia/público passaram. Unitários: **74 em 11 arquivos**. E2E final de prévia: **82 passaram**, com um skip condicional reservado ao build público; o teste público adicional também passou, verificando os três idiomas. As regressões existentes executam a experiência Recovery padrão; comparação classic tem um teste adicional, sem esconder regressões usando a versão anterior. Suíte visual completa: **14 cenários passaram**, incluindo os dois estados reduced motion. Após o ajuste do carregamento, todos os 82 E2E e os sete cenários mobile foram reexecutados e passaram; PNGs/vídeos mobile correspondem ao ajuste final. Há **64 PNGs e oito WebM** selecionados; todos os vídeos foram decodificados para verificar dimensões, duração e hashes.

Dados, status editoriais, dicionários, contatos, links verificados, metadata e controlador/autoplay do carrossel foram preservados. O arquivo `docs/HANDOFF.md` identifica exatamente a base herdada do Claude e os incrementos Codex. Branches históricas não foram integradas; não houve merge, push ou deploy.

## Performance e limites de consolidação

Resumo rastreável em [metrics.json](metrics.json). Lighthouse 13.5.0, Chromium 153/SwiftShader, build otimizado em servidor local 3300, throttling `simulate`; uma amostra final isolada por condição, sem warnings. As experiências e amostras anteriores de diagnóstico não foram escolhidas pelo melhor score. Valores de laboratório não são p75 de campo.

| Condição final | Performance | LCP | CLS | TBT |
|---|---:|---:|---:|---:|
| Prévia desktop | 100 | 660 ms | 0,003738 | 16,5 ms |
| Prévia mobile | 80 | 3.264 ms | 0 | 494,5 ms |
| Público desktop | 100 | 611 ms | 0,003738 | 12 ms |
| Público mobile | 81 | 3.013 ms | 0 | 506,5 ms |

Acessibilidade e boas práticas: 100 nas quatro amostras. SEO: 63 na prévia por `noindex` deliberado, 100 no público. **LCP mobile não atende 2,5 s e TBT piorou em relação à S03.5.** O público S03.5 tinha 2.945 ms / 117 ms de TBT / score 94. Não foi declarado avanço de performance ou aptidão para publicação.

A nova cena entra automaticamente com apenas 18% da arte visível no mobile, enquanto a S03.5 usava 90%. Three/R3F e a inicialização WebGL agora participam mais cedo do carregamento normal nesse perfil. O diagnóstico encontrou long tasks tanto no bootstrap React quanto no chunk lazy 3D. Agendamento mobile após 1200 ms e idle callback preserva a janela de abertura e melhorou uma amostra intermediária de 83 para 86, mas **a amostra final foi 80**: a mudança não resolveu o custo de inicialização. Não se usou um atraso longo para esconder o 3D do Lighthouse. Essa regressão permanece explícita e bloqueia considerar a direção tecnicamente consolidada para lançamento.

| Orçamento / runtime | Medição |
|---|---|
| JS inicial externo | 158.508 bytes gzip; +674 bytes / 0,43% vs S03.5; abaixo do alvo 180 kB. HTML/Flight/CSS não entram nessa soma. |
| Chunk lazy Three/R3F/Hero | 246.204 bytes gzip; +1.064 bytes / 0,43% vs S03.5. |
| Cena mobile / desktop | 6 draw calls, 6 geometrias; 1.936 / 3.472 triângulos; DPR do perfil 1. E2E separado confirma limites 1 / 1,25 / 1,5 em DPR alto. |
| CPU de `gl.render` após aquecimento | 0,258 ms mobile / 0,279 ms desktop em SwiftShader; exclui os cinco primeiros frames e não representa tempo de GPU. |
| Ambiente visível, janela 500 ms | 15 frames mobile / 23 desktop; agendamento alvo 30 / 45 Hz. Interação e assentamento solicitam frames adicionais. |
| Fora da tela, janela 500 ms | **0 frames** em ambos os perfis. Pausa/aba oculta também cobertas nos E2E. |
| GPU | Timer query indisponível no renderer de software; nenhuma estimativa fabricada. |
| Carregamento automático sem throttling | Conteúdo pintado em 200 / 192 ms; primeiro frame 3D em 1.965 / 1.088 ms (mobile / desktop). Mede navegação normal, separada do perfil reduced→3D. |
| INP de navegação com Save-Data | Prévia 64 / 88 ms; público 16 / 32 ms (mobile / desktop); CLS 0 e nenhum canvas/overflow/animação running no repouso. |
| INP do perfil com WebGL | 32 / 40 ms; CLS 0,006072 / 0,004183. Sequência reduzida de controles, distinta da navegação completa; não equiparar amostras. |

O rAF observado foi aproximadamente 60 Hz, p95 16,8 ms, em ambos os perfis. Isso é cadência de eventos do browser, não FPS certificado de GPU/telefone. Não houve aferição em aparelho físico, leitor de tela ou tráfego publicado. Software rendering e amostras únicas limitam a interpretação; a regressão medida continua registrada.

Hidratação: nos quatro cenários 390/1440 × início/`#about`, com rede 120 ms, 180 kB/s, CPU 4× e JS retido por 800 ms após fontes, a diferença de **altura, topo About, topo Expertise e scroll foi zero**. PNGs [antes](screenshots/after-hydration-about-before-js.png) / [depois](screenshots/after-hydration-about-after-js.png) mostram o teste desktop ancorado.

`release:check` falhou com as dez pendências esperadas: origem HTTPS, perfil, textos PT/EN/ES, projetos, trajetória, especialidades, serviços, email, LinkedIn e CV. Os gates não foram relaxados. Aprovação estética, performance mobile e conteúdo comercial permanecem pendentes.

## Reprodução

```powershell
$env:PORTFOLIO_CONTENT_PREVIEW='1'
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run qa:creative
node scripts/summarize-recovery-videos.mjs
npm run start -- --port 3300
```

Em outro terminal, com browser QA/Lighthouse executados sequencialmente:

```powershell
$env:QA_ORIGIN='http://127.0.0.1:3300'
$env:QA_HERO_OUTPUT_DIR='docs/report/CreativeRecovery'
$env:QA_MOTION_OUTPUT_DIR='docs/report/CreativeRecovery'
$env:QA_HYDRATION_OUTPUT_DIR='docs/report/CreativeRecovery'
$env:QA_HYDRATION_SCREENSHOT_DIR='docs/qa/CreativeRecovery/screenshots'
$env:QA_POLISH_PROFILE='1'
node scripts/profile-hydration.mjs
node scripts/profile-motion.mjs
node scripts/profile-hero.mjs
node scripts/profile-creative-load.mjs
$env:CHROME_PATH=(node -p "require('playwright').chromium.executablePath()")
npm exec --yes --package=lighthouse@13.5.0 -- lighthouse http://127.0.0.1:3300/pt --preset=desktop --only-categories=performance,accessibility,best-practices,seo --chrome-flags='--headless --enable-unsafe-swiftshader' --output=json --output-path=docs/report/CreativeRecovery/lighthouse-preview-desktop.json --quiet
npm exec --yes --package=lighthouse@13.5.0 -- lighthouse http://127.0.0.1:3300/pt --only-categories=performance,accessibility,best-practices,seo --chrome-flags='--headless --enable-unsafe-swiftshader' --output=json --output-path=docs/report/CreativeRecovery/lighthouse-preview-mobile.json --quiet
```

Encerre 3300 antes de reconstruir com `PORTFOLIO_CONTENT_PREVIEW=0`. Execute `QA_EXPECT_PUBLIC_CONTENT=1 npx playwright test -g 'public build'`, reinicie 3300 e rode o perfil motion com `QA_PUBLIC_SAMPLE=1`. Lighthouse público usa os mesmos comandos e nomes `lighthouse-public-{desktop,mobile}.json`. Por último, `node scripts/summarize-creative-qa.mjs` consolida os números. Logs e perfis brutos continuam em `docs/report`, ignorados.

Para repetir os vídeos históricos, sirva cada HEAD original em checkout isolado e use `node scripts/record-recovery-baselines.mjs <origin> <before-s03|before-s03-5>`. Não execute o recorder sobre o código atual e chame o resultado de baseline. A página HTML de revisão usa arquivos relativos e abre localmente, com seletor desktop/mobile validado no browser.

## Decisões reservadas ao proprietário

Revisar a silhueta das fitas, o brilho metálico neutro, sua escala no Hero, o ritmo Hero → Work, a abertura em duas linhas no desktop amplo, a dimensão das vitrines e a profundidade dos capítulos. A comparação classic e os vídeos históricos permitem decidir concretamente. Também permanecem pendentes imagens reais autorizadas, contatos/CV e conteúdo comercial, sem inventar empresas, cargos ou métricas.
