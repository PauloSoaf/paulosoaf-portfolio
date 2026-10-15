# 05 — Sites reais no notebook: execução e restrições comprováveis

## O requisito exato
Quando o visitante selecionar **NutriOpus** ou **Déborah Lima**, o notebook deve mostrar o site **real online**, navegável e rolável, e não uma captura, clone, vídeo ou placeholder se passando pelo site. Não basta abrir URL em nova aba para marcar a funcionalidade completa, mas oferecer nova aba como contingência honesta quando embed falhar.

## Endereços conhecidos, não validados em runtime
- NutriOpus: `https://www.nutriopus.com.br/` (informado pelo usuário em conversa).
- Déborah Lima: `https://xn--advogadadborahlima-jwb.com.br/` (domínio em punycode informado pelo usuário; **confirmar se é o mesmo site canônico e se há redirect**).
- **Estado de verificação em 14/10/2026: NÃO VERIFICADO**. `curl` do ambiente falhou por DNS indisponível para ambos; o browser de pesquisa também não conseguiu abrir. Assim, **não é lícito afirmar que esses sites permitem iframe, que respondem HTTP 200 ou que funcionam com scroll dentro da moldura**. Esta confirmação é Gate G-EMBED (bloqueante).

## Camadas de autorização obrigatórias
1. **Página pai (`paulosoaf-portfolio`)**: `next.config.ts` contém `default-src 'self'` e não possui `frame-src`; pela CSP, a incorporação de domínios externos será bloqueada. Adicionar `frame-src https://www.nutriopus.com.br https://xn--advogadadborahlima-jwb.com.br` (ajustar ao canonical/CDN reais) **somente se os domínios forem aprovados** e preservar todas as demais políticas. A diretiva `frame-ancestors 'none'` atual protege o portfólio contra ser incorporado por terceiros; **não** confundi-la com `frame-src`.
2. **Páginas filhas**: verificar `Content-Security-Policy: frame-ancestors ...`, `X-Frame-Options`, redirects e autenticação. Se filho envia DENY/SAMEORIGIN incompatível, ele não permite embed. `iframe` `onLoad` não significa sucesso; uma navegação bloqueada pode disparar load com página de erro.
3. **Cross-origin**: o parent não pode ler DOM, injetar wheel/click/key/scroll nem obter `scrollTop` de site externo livremente. `postMessage` somente com código cooperativo no projeto filho, `event.origin`, `source` e schema checados; não inventar bridge inexistente.
4. **Cookies e auth**: terceira parte pode ter cookies bloqueados, login e recursos quebrados. Preferir mostrar landing pública/demonstração anônima, não dados de pacientes, casos legais ou sessão autenticada.
5. **Sandbox**: definir tokens mínimos após testes de comportamento real; `allow-scripts allow-same-origin` numa página **externa de origem diferente** deve passar por auditoria. Cuidado especial se usar subdomínio mesmo-site/same-origin. Impedir navegação top arbitrária, popups não autorizados, permissões de microfone/câmera/geolocalização e links maliciosos.

## Procedimento Gate G-EMBED (em ambiente com rede)
### Preflight de resposta
```bash
curl -L -sS -D - -o /dev/null https://www.nutriopus.com.br/ | grep -Ei 'HTTP/|location:|content-security-policy:|x-frame-options:|cross-origin|set-cookie:'
curl -L -sS -D - -o /dev/null https://xn--advogadadborahlima-jwb.com.br/ | grep -Ei 'HTTP/|location:|content-security-policy:|x-frame-options:|cross-origin|set-cookie:'
```
Usar **GET real com redirects**, não só HEAD; verificar todas as rotas/redirecionamentos e cabeçalhos reais em `network`/DevTools do navegador; não confiar em `curl` isolado para provar renderização.

### Teste de navegador
- Criar rota **restrita a dev/preview** `/workstation/embed-lab` com host idêntico ao futuro portfólio e CSP correta.
- Inserir iframe com src exata e abrir Chromium via Playwright.
- Checar `page.on('console')`, `page.on('pageerror')`, `response`/network e ausência de mensagem `Refused to frame`; realizar `frameLocator(...)` + clique/scroll ou URL interna controlada e capturar vídeo + screenshot.
- Se a página filha for cross-origin, Playwright de teste consegue inspecionar o frame como automação de navegador, **mas o JavaScript da nossa aplicação não tem essa permissão**. Não confundir capacidades.
- Medir scroll nativo com mouse apontando **dentro** do iframe e verificar alteração visível de conteúdo; testar teclado/tab e voltar pelo nosso `×` fora do frame.
- Testar CSP no deploy HTTPS alvo (a política pode mudar do localhost).

### Quando falhar
**Não remover XFO/frame-ancestors via proxy, não re-hospedar cópia do site sem autorização, não usar screenshot com rótulo de navegação real.** Caminhos legítimos:
A. Se sites forem administrados por você, configurar explicitamente `frame-ancestors https://SEU-DOMINIO-PORTFOLIO` na infraestrutura filha e remover XFO incompatível, respeitando riscos de clickjacking; testar regressão de autenticação/segurança.
B. Para sites com código autorizado, criar uma **rota pública de preview embeddable** própria e segura, somente com dados fictícios/sem credenciais, hospedada pela própria aplicação; redirecionar o notebook a ela, sem alegar ser a landing de produção quando não for.
C. Para terceiros sem permissão, manter prévia não interativa **claramente identificada** e botão `Abrir site real` em nova aba, mas manter RF-006/007 pendente.

## Estados visuais explícitos
`idle`, `checking`, `loading`, `interactive-verified`, `blocked-by-policy`, `unreachable`, `requires-auth`, `external-only`. **Não** detectar `interactive-verified` somente por onload; status confiável vem de teste pré-publicação por domínio, ou cooperação explícita em runtime. Tratar alteração futura do site remoto com revalidação periódica antes de releases (sem automação monitorando dados pessoais).

## Native scroll versus trackpad 3D
A URL pode ser percorrida com **mouse/trackpad físico** do visitante e touch quando o iframe recebe os eventos diretamente. Um trackpad **desenhado como malha 3D** não tem acesso confiável à rolagem do site cross-origin e não consegue criar trusted pointer events. Para nossa UI e mini OS o trackpad virtual funciona; para websites reais, a experiência padrão confiável é: botão `Focar tela`, iframe DOM com pointer-events habilitados, scroll/teclado nativos. Com colaboração nos dois sites, documentar protocolo opcional `postMessage({type:'WORKSTATION_SCROLL', deltaY})`, com whitelist e versão; não obrigatório para POC sem autorização.

## Segurança operacional
`referrerPolicy="strict-origin-when-cross-origin"`, `loading="lazy"`, allowlist de hosts e `sandbox` de permissões mínimas. Sanitizar query/path; nunca oferecer navegador de URL arbitrária; bloquear javascript/data/blob inseridos por usuário. Dentro do portfólio não capturar teclas do iframe, não gravar telas de sessões privadas. Site de saúde: não abrir dados sensíveis de pacientes. Site de advocacia: não reproduzir mensagens/casos jurídicos reais.
