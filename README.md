# Paulo Soaf — Obsidian Orbit

Portfólio em Next.js App Router, React e TypeScript, com a identidade Obsidian Orbit v0.1. A fundação S00 contém landing renderizada no servidor, navegação acessível, PT-BR/EN/ES e temas Dark/Light. A S01 acrescenta um hero procedural real em Three.js/React Three Fiber, carregado progressivamente sobre o SVG local. A S02 acrescenta o carrossel cinematográfico e os candidatos comerciais NutriOpus/Déborah Lima. Timeline e cases continuam no roadmap S03/S04.

## Desenvolvimento

Requer Node.js 22.13+ (a versão principal está em `.nvmrc`).

```powershell
npm ci
npm run dev
```

Abra http://localhost:1010/pt. `npm run dev` usa a porta 1010. `/en` e `/es` têm textos e metadata próprios. A raiz escolhe idioma pelo cookie, depois `Accept-Language`, depois português. Uma URL com idioma sempre prevalece sobre preferências.

`next dev` mostra candidatos editoriais com avisos. Produção filtra coleções por `status: "approved"`. Perfil e textos da interface ainda exigem aprovação, verificada pelo gate de publicação.

## Verificação

```powershell
npm run verify
npx playwright install chromium
```

Para testar a composição completa de candidatos em um build otimizado local:

```powershell
$env:PORTFOLIO_CONTENT_PREVIEW = '1'
npm run build
npm run test:e2e
npm run qa:screenshots
npm run qa:hero
npm run qa:carousel
```

Playwright inicia e encerra seu próprio servidor em `127.0.0.1:3200`; deixe essa porta livre. Os testes cobrem páginas sem JS, 404, teclado, mídia indisponível, reduced motion, responsividade, acessibilidade automatizada e persistência. A S01 também testa pixels e parallax reais, pausa, tema, touch, falha de chunk/criação WebGL e perda de contexto com recuperação. Capturas S00 ficam em `docs/qa/S00/`; `qa:hero` produz 36 capturas S01 em `docs/qa/S01/screenshots/`, sem sobrescrever a evidência anterior. Relatório interativo em `playwright-report/`.

O hero preserva SVG em reduced motion, Save-Data e dispositivos limitados; “Ativar arte 3D” oferece opt-in. Em mobile com toque, a ativação automática espera 90% da arte visível para preservar a primeira dobra de texto/CTAs. Os controles permitem pausa e retorno à arte estática. A cena não captura scroll/touch e não renderiza continuamente quando está parada. `?heroDebug=1` expõe diagnóstico no DOM; Web Vitals ficam no painel Performance local, sem envio de analytics.

O carrossel aprimora artigos renderizados no servidor: sem JS, todo o catálogo visível permanece acessível. Com JS, oferece profundidade desktop, swipe/drag, setas no estágio focado, anterior/próximo e autoplay de 7 segundos. Hover/drag/aba oculta/viewport suspendem; foco encerra o autoplay até reprodução explícita. Pausa manual persiste e reduced motion desativa rotação automática/transições. Apenas o ativo recebe foco; imagens do ativo e vizinhos carregam seletivamente, com proporção estável e fallback conceitual identificado.

`featuredOrder` configura destaque, sem excluir os secundários. Projetos privados não exigem GitHub; novos candidatos têm stack pendente e nenhuma demo/captura real aprovada. Produção mantém o fallback GitHub enquanto não houver projetos aprovados. Não existem rotas ou botões fictícios de case; S04 continua responsável pelos estudos de caso.

`qa:carousel` salva 52 PNGs próprios em `docs/qa/S02/screenshots/` (36 combinações e 16 slides adicionais). Para guardar nova regressão do Hero sem sobrescrever S01, execute `$env:QA_HERO_SCREENSHOT_DIR='docs/report/S02/hero-regression'` antes de `npm run qa:hero`. O diretório operacional continua ignorado pelo Git. Métricas do carrossel: produção local na porta 3202, depois `node scripts/profile-carousel.mjs`; resultados brutos ficam em `docs/report/S02/`. `QA_PUBLIC_SAMPLE=1` separa o perfil do build público. `npm run qa:carousel:summary` resume os dois perfis e quatro Lighthouse atuais, preservando diagnósticos históricos quando os logs antigos não estiverem no clone. Procedimento, limites e números em `docs/qa/S02/REPORT.md`.

Para repetir o perfil de chunks/CPU/cadência, inicie um build de produção com `npm run start -- --port 3202` e, em outro terminal, execute:

```powershell
$env:QA_ORIGIN = 'http://127.0.0.1:3202'
node scripts/profile-hero.mjs
```

Os resultados brutos ficam em `docs/report/S01/`, fora do Git. O procedimento Lighthouse e os limites da medição constam no relatório S01. `npm run qa:hero:summary` gera `docs/qa/S01/metrics.json` a partir do perfil e dos dois relatórios Lighthouse finais, conservando a comparação histórica quando os logs antigos estiverem ausentes.

Para verificar o build público sem rascunhos:

```powershell
$env:PORTFOLIO_CONTENT_PREVIEW = '0'
npm run build
$env:QA_EXPECT_PUBLIC_CONTENT = '1'
npx playwright test -g 'public build'
```

O workflow `.github/workflows/ci.yml` executa lint, typecheck, testes, build de prévia e E2E. A configuração está preparada; sua execução no GitHub depende de o repositório ser enviado pelo proprietário.

## Conteúdo e publicação

Dados ficam em `src/features/`; traduções em `src/i18n/dictionaries/`. Não marcar conteúdo como aprovado sem revisão do proprietário. E-mail, LinkedIn e currículo ainda não foram fornecidos/validados. Demos não verificadas não são exibidas; ilustrações dos projetos são identificadas como arte conceitual.

Antes de qualquer publicação, configurar `SITE_URL` com a origem HTTPS real, aprovar perfil/textos/coleções, validar contatos e arquivo de CV, e executar:

```powershell
npm run release:check
```

Esse comando **falha intencionalmente no estado editorial atual**. Um build passando não autoriza publicação. Nunca publicar com `PORTFOLIO_CONTENT_PREVIEW=1`.

## Referências e decisões

- Pacote original: `paulo_soaf_obsidian_orbit_specs_pocs_v01/`.
- Relatório da continuação: `docs/qa/S00/REPORT.md`.
- Hero procedural, aceite e evidências: `docs/qa/S01/REPORT.md` e `docs/adr/ADR-009-progressive-hero-webgl.md`.
- Carrossel, catálogo e evidências S02: `docs/qa/S02/REPORT.md`, `docs/qa/S02/EDITORIAL-PENDING.md` e `docs/adr/ADR-010-cinematic-project-carousel.md`.
- Ponto exato de retomada e divisão Claude/Codex: `docs/HANDOFF.md`.
- Relatórios operacionais locais: `docs/report/` (ignorado pelo Git).
- Decisões da implementação: `docs/adr/`.
- Tema Dark preserva os tokens v0.1; Light é neutro com acento discreto.
- Fontes são baixadas pelo `next/font` durante o build e servidas localmente em runtime. Build novo exige acesso ao provedor de fontes.

Commit e push da S00 foram autorizados pelo proprietário após a validação local. A branch S01 remota foi confirmada em `758557e` na retomada S02; `main` continua na S00. A S02 fica numa branch derivada da S01. Não houve merge, push ou deploy nesta continuação S02. O gate editorial permanece pendente.
