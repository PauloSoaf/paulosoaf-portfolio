# Paulo Soaf — Obsidian Orbit

Portfólio em Next.js App Router, React e TypeScript. A fundação S00 contém landing renderizada no servidor, arte SVG local, navegação acessível, PT-BR/EN/ES e temas Dark/Light. WebGL, carrossel e timeline interativa pertencem às próximas sprints.

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
```

Playwright inicia e encerra seu próprio servidor em `127.0.0.1:3200`; deixe essa porta livre. Os testes cobrem páginas sem JS, 404, teclado, mídia indisponível, reduced motion, responsividade, acessibilidade automatizada e persistência. Capturas ficam em `docs/qa/S00/`; relatório interativo em `playwright-report/`.

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
- Ponto exato de retomada e divisão Claude/Codex: `docs/HANDOFF.md`.
- Relatórios operacionais locais: `docs/report/` (ignorado pelo Git).
- Decisões da implementação: `docs/adr/`.
- Tema Dark preserva os tokens v0.1; Light é neutro com acento discreto.
- Fontes são baixadas pelo `next/font` durante o build e servidas localmente em runtime. Build novo exige acesso ao provedor de fontes.

Commit e push foram autorizados pelo proprietário após a validação local. Deploy continua condicionado ao gate editorial e a autorização específica.
