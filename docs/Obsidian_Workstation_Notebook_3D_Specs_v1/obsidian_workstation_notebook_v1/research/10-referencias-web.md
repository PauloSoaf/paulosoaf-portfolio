# Dez referências da internet — documentações oficiais verificadas em 14/10/2026

Estas referências foram consultadas por URL pública neste planejamento. São **documentação técnica / padrões**, não prova de que os dois sites comerciais aceitam embed. Cada referência traz decisão concreta para a implementação. Não copiar assets/design de terceiros automaticamente.

| ID | Referência | Link | Aplicação direta no notebook |
|---|---|---|---|
| WEB-01 | React Three Fiber — Scaling performance | https://r3f.docs.pmnd.rs/advanced/scaling-performance | `frameloop="demand"`, invalidate, geometria reaproveitada, desempenho em notebooks móveis |
| WEB-02 | Drei — Html | https://drei.docs.pmnd.rs/misc/html | DOM ancorado no display transformado 3D; testar clipping/oclusão e foco de `iframe` |
| WEB-03 | React Three Rapier — Docs | https://pmndrs.github.io/react-three-rapier/ | RigidBody/Physics, collider, limite e eventos de colisão para arremessar e quebrar virtualmente |
| WEB-04 | MDN — Pointer events | https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events | PointerCapture/mouse/toque, cancelar gestures, distinguir arrastar notebook de rolar dentro da tela |
| WEB-05 | MDN — CSP frame-ancestors | https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors | Entender a política que o site filho usa para autorizar/recusar o notebook |
| WEB-06 | MDN — Window.postMessage | https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage | Bridge cooperativa entre app e iframe externo, com `origin` e `source` rigorosos |
| WEB-07 | MDN — Same-origin policy | https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy | Justificar impossibilidade de o trackpad virtual acionar DOM do site remoto livremente |
| WEB-08 | Playwright — FrameLocator | https://playwright.dev/docs/api/class-framelocator | Provar input/scroll/click dos embeds em E2E; distinguir privilégio de automação do JS do app |
| WEB-09 | MDN — iframe | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe | `sandbox`, lazy, foco, políticas de navegação, cookies e embeds de terceiros |
| WEB-10 | W3C/WAI — Dialog Modal Pattern | https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ | Modo FOCUS_SCREEN mobile/desktop com foco, Escape e retorno ao acionador |

## Leitura em ordem
- P00: WEB-05/06/07/08/09 para evitar promessa tecnicamente impossível.
- P01: WEB-01/02/04/10 para a tela clicável e o chassi.
- P04: WEB-03/04 para física e input.

## Observações cruciais
`frame-ancestors` é *resposta do filho*; `frame-src` é *política de carregamento do pai*. O repositório tem `frame-ancestors 'none'` e `default-src 'self'`, sem `frame-src`. A correção não é desligar toda CSP: permitir duas origens no `frame-src`, sujeito à autorização que os filhos concederem. O iframe cross-origin não dá direito a ler o documento filho. Nem todos os browsers suportam todos os recursos de CSS3D/HTML com igual comportamento — a prova em browser real é obrigatória.
