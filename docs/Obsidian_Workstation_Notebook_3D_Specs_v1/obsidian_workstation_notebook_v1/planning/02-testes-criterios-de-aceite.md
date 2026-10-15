# 02 — Estratégia de testes, evidências e Definition of Done

## Evidência por gate
| Gate | Teste funcional essencial | Prova visual/autorização |
|---|---|---|
| G00 | Verificar SHA, cookies, CSP pai + headers filhos, iframe no hostname-alvo | `EMBED-MATRIX` com logs/redirects/resultado e decisão do dono |
| G01 | Open/close lid; drag chassis 3D; foco DOM screen; modal 2D mobile | 2 vídeos sem manipulação de velocidade + capturas de states |
| G02 | `frameLocator` sites externos, scroll/clique; fallback quando iframe negado | Vídeo do **site real**, domínio exibido e console sem refusals; separar pass/fail |
| G03 | ID → arquivo real + SHA; ícones de inspect; negative secret tests | Comparar texto exibido ao arquivo do mesmo SHA; review do manifest |
| G04 | Arremessar, colisão forte/fraca, fracture, restore 10x, perda de foco durante gesto | Gravar impactos em desktop/mobile; zero corpos acumulados após reset |
| G05 | Apps OS abrindo/fechando; teclado físico/3D; trackpad OS; jogo pausa | Vídeo de clique de keycap/trackpad e rolagem em app próprio |
| G06 | Laptop acompanha seções sem tapar copy/CTAs; screenshot por breakpoint | Narrativa 1440x900 e 390x844; não permitir viewport permanentemente dividida |
| G07 | Regressão completa; Lighthouse/performance/GPU; revisão manual | Aceite estético do proprietário + pendências externas declaradas |

## Testes unitários e propriedades
1. Reducer/máquina de estado rejeita `THROW` em `SCREEN` enquanto foco no iframe, sem confirmação explícita.
2. `LID_CLOSE` desativa superfície interativa e `LID_OPEN` restaura no ângulo seguro.
3. `OPEN_SITE` só aceita IDs allowlisted e URL HTTPS validada; `javascript:`/`data:` são rejeitados.
4. Falha de embed não cai em screenshot fingindo site; abre fallback com explicação e link real.
5. `INSPECT` só aceita registry de componentes do portfólio; caminhos fora de raiz e privados são bloqueados.
6. Limite de impulso, normalização de amostras e limiar de `high impact`; propriedades monotônicas sem NaN/Infinity.
7. Hitbox de trackpad/teclas não ativa rotação do chassis ao mesmo tempo.
8. `RESTORE` é idempotente e descarta estado do iframe e rigid body.
9. `prefers-reduced-motion` é respeitado; apps/sites continuam acessíveis em HTML.
10. Em trocas de locale e theme, modo acessível, foco e IDs de projeto continuam estáveis quando apropriado.

## E2E de navegador (Playwright)
- **Site filho cooperativo**: hospedar `/workstation/embed-fixture` no próprio app (somente QA) com muito conteúdo rolável, inputs e links. Verificar scroll/click/autofocus num primeiro teste estável. Separar fixture da prova dos dois sites comerciais.
- **External frame**: para cada URL, em ambiente com rede/headers compatíveis, `page.frameLocator('iframe[data-project-site="nutriopus"]')`, clicar/rolar nativamente, checar conteúdo/URL e console. Capturar gravação real. Não depender só de event `load`.
- **CSP parental**: testar `frame-src` apenas das duas origens e redirecionamentos aprovados; hosts não autorizados devem falhar.
- **Hidratação**: rede 120ms, 180KB/s e CPU 4× conforme regressões existentes; âncoras `#work`, `#about` sem layout shift ao trocar escultura por notebook.
- **Hover/drag**: real pointer move e captura, desativar iframe durante chassis drag, retomar input ao entrar em `FOCUS_SCREEN`.
- **Throw/restauração**: E2E instrumentado com impacto determinístico em sandbox fixo (não depender de gesto aleatório); integração de pointer end-to-end com limiares.
- **Acessibilidade**: controle do laptop visível com Tab, acionável por Enter/Space; rótulos em idiomas; X acessível; foco retorna; snapshot reduced; zoom 200%; modais APG.
- **Perf**: em profile physics ativo + notebook parado, medir CPU/render frames; em preview carregada monitorar LCP/CLS/INP; ao sair da cena confirmar cancelamento de RAF e worker.

## Matriz visual mínima
| Viewport | Tema | Idiomas | States obrigatórios |
|---|---|---|---|
| 1440x900 | Dark + Light | PT, EN, ES | Hero, Work→site, Code, Desktop, tampa fechada, throw, broken, restored |
| 390x844 | Dark + Light | PT, EN, ES | Notebook compacto, FOCUS_SCREEN, frame scroll touch, OS, fallback, restore |
| 360, 768, 1024, 1920 | Dark + Light | pelo menos PT regressão, demais smoke | sobreposição/scroll, foco, legendas, performance |
| Reduced + Save-Data | ambos | PT | site/OS legíveis sem efeitos obrigatórios |

## Exemplo Playwright (orientativo, não executado)
```ts
// Um iframe 'load' pode ocorrer mesmo se recusado; adicione validação real + logs.
const browser = page.getByTestId('workstation-browser');
await expect(browser).toBeVisible();
const frame = page.frameLocator('iframe[data-project-site="nutriopus"]');
await expect(frame.locator('body')).toBeVisible(); // smoke; não garante site correto
// A asserção de conteúdo do site real exige seletor estável inspecionado ao vivo.
// Usar Playwright FrameLocator é capacidade do teste, NÃO permissão do JS da aplicação.
```

## Gate de release objetivo
- Todos RF P0 implementados ou **marcados bloqueados, e então release NÃO aprovada**. RF-006/007 não serão silenciosamente reduzidos a links externos.
- Todos RNFs críticos medidos e relatório de gaps com evidência; números de FPS/perf devem indicar ambiente real.
- `release:check` antigo passa com conteúdo validado e consentimentos, ou permanece bloqueado sem hack.
- CI da branch mais avançada passa; teste manual em hardware real, foco/screen reader, autorização visual do proprietário.
- Usuário real consegue: abrir site, rolar, sair pelo X, abrir Code (do próprio portfólio), voltar, girar/fechar, arremessar, quebrar, restaurar, entrar em contato. Não exige saber que há um site escondido em cada card.
