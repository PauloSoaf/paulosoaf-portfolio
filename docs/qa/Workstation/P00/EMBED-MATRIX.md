# P00 — Matriz de incorporação real

Verificação: **14/10/2026**, ambiente Windows/Chromium. Base local/remota Recovery `5c607eb17d29d536620e0cd2080f8202586441b3`; `main` remota `ea3cf243094ba524335c6e367467c8bbf6107574`. A única alteração inicial era a pasta de especificações fornecida pelo proprietário. Branch da entrega: `feat/workstation-notebook-poc`.

| Verificação | NutriOpus | Déborah Lima |
|---|---|---|
| URL fornecida | `https://www.nutriopus.com.br/` | `https://xn--advogadadborahlima-jwb.com.br/` |
| GET/redirect | 200 direto | 308 para **`https://www.xn--advogadadborahlima-jwb.com.br/`**, depois 200 |
| HTTPS no navegador | PASS local, sem ignorar erros de certificado | PASS local, sem ignorar erros de certificado |
| XFO / CSP frame-ancestors do filho | Não enviados na resposta HTML inspecionada | Não enviados na resposta HTML inspecionada |
| Título/documento real | NutriOpus / Plataforma para Nutricionistas | Déborah Lima / Advogada em Manaus |
| Wheel nativo P00 | PASS: 0 → 660 px | PASS: 0 → 660 px |
| Clique real P00 | Recursos → scroll 713 px | Logotipo → URL `#topo` |
| Teste integrado no notebook P01 | PASS: wheel 0 → 650 px, link Recursos e X | PASS: wheel 0 → 650 px, logotipo e X |
| Console de recusa de frame | Nenhuma recusa no ensaio aprovado | Nenhuma recusa no ensaio aprovado |
| Sessão | Landing pública anônima; sem autenticação/formulários; zero cookies no ensaio P00 | Landing pública anônima; sem autenticação/formulários; zero cookies no ensaio P00 |
| Origem HTTPS pública do portfólio | **UNKNOWN: ainda não publicada/testada** | **UNKNOWN: ainda não publicada/testada** |
| RF-006 / RF-007 como requisito de release | **Pendente** de revalidação e aceite da fase P02/publicação | **Pendente** de revalidação e aceite da fase P02/publicação |

O teste intermediário detectou corretamente o bloqueio parental do endereço `www` de Déborah quando só o apex estava autorizado. O registro final usa a URL efetiva diretamente, sem wildcard. O HTML filho declara canonical `https://advogadadeborahlima.com.br`, mas esse host retornou `ENOTFOUND` na auditoria; ele **não** é a URL final do redirect observado e não foi usado como destino. A divergência deve ser revisada na infraestrutura/conteúdo do site filho por seu responsável.

## Política aplicada

O portfólio mantém `frame-ancestors 'none'` e XFO DENY. A exceção de `frame-src` permite somente `self`, `https://www.nutriopus.com.br` e `https://www.xn--advogadadborahlima-jwb.com.br` **na rota de laboratório habilitada**. A fixture tem exceção própria SAMEORIGIN / `frame-ancestors 'self'`. A landing pública continua com `frame-src 'self'`.

Iframe externo usa `sandbox="allow-scripts allow-same-origin"`, sem forms/popups/top navigation, permissões de câmera/microfone/geolocalização negadas e referrer limitado. Não foi testada uma sessão autenticada, fluxo de formulários, popup ou todas as rotas dos sites; esses fluxos não são implicitamente aprovados por uma landing rolar. A autorização de usar os dois endereços na POC vem do pedido e pacote do proprietário; a autorização para publicar o portfólio permanece separada.

`onload` não determinou PASS. Houve inspeção GET, documento real, título, wheel, clique, console e vídeos. A automação consegue inspecionar o frame como ferramenta de QA; a aplicação não lê o DOM remoto. Nenhum proxy, clone, screenshot interativo ou postMessage inexistente foi usado.

## Evidências e reprodução

- [Resultados integrados, políticas e hashes](../P01/live-embed-results.json).
- [NutriOpus — vídeo real](../P01/videos/live-nutriopus.webm), [scroll](../P01/screenshots/live-nutriopus-scroll.png), [clique](../P01/screenshots/live-nutriopus-click.png).
- [Déborah — vídeo real](../P01/videos/live-deborah.webm), [scroll](../P01/screenshots/live-deborah-scroll.png), [clique](../P01/screenshots/live-deborah-click.png).
- GET/redirects sanitizados: [resumo P00](embed-audit.json). Os logs e ensaios intermediários permanecem em `docs/report/Workstation/P00/`, ignorados.

Com laboratório otimizado em 3300: `node scripts/record-workstation-live.mjs` e `$env:QA_LIVE_EMBEDS='1'; npm run test:workstation`. Estes ensaios dependem da rede e política atual dos filhos; reexecutar antes de aprovar P02/publicação. Firefox/WebKit não estavam instalados; as tentativas de download do Firefox esgotaram mirrors por timeout. Nenhum PASS foi atribuído a navegadores não executados.
