# 07 — Segurança, acessibilidade, privacidade e prevenção de falhas

## A11y física × interação real
- Notebook visual tridimensional tem uma **representação funcional HTML**: `Abrir notebook`, `Fechar tampa`, `Girar à esquerda/direita`, `Focar tela`, `Manipular`, `Arremessar`, `Restaurar`, `Voltar ao desktop` e `Abrir site real` quando aplicável. Não exigir manipulação pelo mouse para ver o conteúdo.
- O chassi pode ter raycast custom, mas o conteúdo da tela é DOM semanticamente correto. `aria-label`, `aria-live` somente para mudanças importantes (quebrou/restaurou), não anunciar cada frame/física.
- Foco estável: ao abrir janela, focar título/primeiro controle conforme padrão; ao fechar com X, devolver foco ao acionador. `FocusScreen` no mobile se comporta como dialog acessível (se modal real) com Escape, restaurar foco e impedir foco em fundo inacessível. Respeitar orientação WAI-ARIA APG.
- A posição do laptop na página não altera ordem lógica DOM; áreas decorativas `aria-hidden` e nunca interceptam links. Sem JS, a home tradicional mantém projetos e links.
- Reduced-motion: notebook em pose ilustrativa fixa, modo screen e sites reais acessíveis, sem arremesso físico forçado; se usuário deliberadamente acionar quebra, usar feedback não animado com reset.
- Não simular teclado na tela de um iframe cross-origin; instruir a clicar diretamente no campo do site e usar teclado físico, evitando interceptação global.

## Fronteiras de confiança
1. `parent portfolio` permite iframe somente para duas origens autorizadas por `frame-src`, mantendo `frame-ancestors 'none'` para não ser incorporado por terceiros.
2. `child origin` impõe seus próprios headers e cookies; só embutir com permissão do dono e disponibilidade técnica. Não remover proteção por proxy.
3. OS local não executa código digitado, comandos externos, scripts arbitrários, páginas não whitelist, download automático ou top navigation sem gesto.
4. Code Snippet pipeline lê fonte local do portfólio apenas; revisão de segurança antes de publicar cada novo caminho.
5. `postMessage` cooperativo só com origin/sender exatos e schema validado; demais mensagens descartadas.
6. Ao quebrar/desligar, iframes externos são desmontados/ocultados de input; nenhum listener global captura teclas de autenticação, dados médicos ou jurídicos.

## Encerramento e limpeza
Physics worker/World, geometria, materiais, texturas, listeners, RAF, Resize/IntersectionObserver, timers, trackpad pointer capture, iframe e editor worker: lifecycle e cleanup determinísticos. Evitar `document.body` com portal órfão após locale/theme/route switch. Ao restabelecer o notebook, restaurar **estado de aplicativo seguro**, não memória de dados digitados no site externo.

## Falhas simuladas para QA
WebGL indisponível; `webglcontextlost`; chunks 3D/physics falham; API DOM `Html transform` não fica alinhada; versão do browser sem CSS 3D; iframe recusado por CSP/XFO; DNS offline; site redireciona; iframe sem cookies; site extremamente lento; foco preso no frame; touch cross-axis; quebra com site aberto; reload em estado broken; tab oculta durante throw; mudança de idioma com modal aberto; prefers-reduced-motion; page com JS desativado.

## Direitos/aviso do visitante
Se houver página externa no display, indicar domínio claramente em chrome de browser próprio. Não dar a entender que NutriOpus e Déborah fazem parte da infraestrutura do portfólio. Se o site for protegido ou privado, não coletar dados do iframe nem registrar suas interações; evitar qualquer overlay enganoso sobre formulários (clickjacking). Fornecer botão explícito `Abrir em nova aba` em HTTPS.
