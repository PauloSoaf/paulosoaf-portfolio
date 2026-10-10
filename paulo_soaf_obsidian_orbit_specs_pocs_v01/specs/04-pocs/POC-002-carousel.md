# POC-002: Carrossel cinematográfico de projetos (B)

Protótipo: `pocs/preview/poc-002-carousel.html`; screenshot `assets/mockups/02-projects-desktop.png` e `06-projects-mobile.png`.

## Objetivo
Transformar obras reais em narrativas visuais grandes, com profundidade, título claro, tecnologias e links verificados.

## Comportamento
- Slide central em escala 1, laterais sugerem continuidade, sem cortes de conteúdo necessário.
- Autoplay inicial lento (7s) quando permitido e visível; controles Prev, Next, Pausar/Reproduzir; pausa em hover/foco/drag, desativa em reduced motion.
- Arrastar touch/mouse com limiar (ex: 40px), prevenir clique acidental após drag. Setas quando carrossel está focado, foco visível.
- O projeto ativo poderá solicitar mudança de cena 3D de fundo no futuro, sem criar canvas por projeto e sem falhar se arte GL não carregar.
- Cada card leva ao case. CTA `GitHub` validado. CTA `Demo` somente se validado.

## Modelo de estado
`selectedIndex`, `isPlaying`, `isHovered`, `hasFocus`, `isDragging`, `reducedMotion`, `visible`.
`shouldAutoAdvance = isPlaying && !isHovered && !hasFocus && !isDragging && !reducedMotion && visible`.
A distinção play/pause voluntário vs pausa automática deve ser clara na UX.

## Casos de teste
Controles teclado, role/aria, touch, autoplay, hover/focus, adição/remoção projetos, mídia indisponível, projeto sem demo, viewport 360 e 1440.

## Aceite
AC-003, AC-004, AC-008, AC-009, AC-015; acessibilidade W3C WAI Carousel Tutorial.
