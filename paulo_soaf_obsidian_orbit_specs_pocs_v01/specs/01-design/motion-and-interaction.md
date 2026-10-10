# Motion system e interação

## Motivos de movimento
- Entrada editorial: opacity + translate Y pequeno.
- Hero procedural: rotação/inércia sutil com cursor, sem movimentar texto.
- Carrossel: translação/hierarquia de profundidade com snap, nunca wheel-jacking.
- Timeline: destaque do marco ativo e revelação de conteúdo, sem esconder conteúdo se JS falhar.
- Mudança de rota: crossfade leve; não prender a navegação atrás de animação.

## Tokens
| Token | Duração | Easing | Uso |
|---|---:|---|---|
| `motion.fast` | 140 ms | ease-out | Hover/foco |
| `motion.normal` | 280 ms | cubic-bezier(.2,.8,.2,1) | Entrada cards |
| `motion.slow` | 550 ms | cubic-bezier(.22,1,.36,1) | Mudanças de projeto |
| `motion.hero` | 850 ms | ease-out | Entrada hero (opcional) |
| `carousel.interval` | 7000 ms | timer controlado | Autoplay, com pausa clara |

Durações são hipóteses para POC; aferir usabilidade e permitir cancelamento.

## Regras
- `prefers-reduced-motion: reduce`: remove parallax, giro contínuo e autoplay; reduz animações a transições instantâneas/opacidade breve.
- Carrossel deve oferecer pausa explícita; pausa em hover/focus/drag, retoma somente com controle apropriado.
- Mudanças de slide anunciadas somente quando iniciadas pelo usuário; autoplay não deve disparar anúncios intrusivos.
- Conteúdo nunca depende de animate-in para aparecer; visibility padrão visível, progressive enhancement.
- `requestAnimationFrame` somente enquanto visível/interagindo; preferir demanda no WebGL se cena em repouso.
- Nenhuma transição global ultrapassando 1s que atrase links/CTAs.

## Segurança de navegação
Links e botões precisam ter semântica correta, foco persistente e estados `hover`, `focus-visible`, `active`, `disabled`, `loading` quando aplicáveis.
