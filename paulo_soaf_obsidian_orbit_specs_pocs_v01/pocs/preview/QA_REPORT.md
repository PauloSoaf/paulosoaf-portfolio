# QA das POCs visuais, 10/10/2026

## Execução
Protótipo HTML/CSS/SVG + JS em Chromium headless via Playwright. Capturas geradas nos tamanhos 1440x900 e 390x844. As imagens de cada seção podem ser mais altas do que a viewport, pois representam a seção inteira.

## Evidências
- Sem exceções JavaScript durante renderização nas 6 capturas.
- Sem overflow horizontal em 1440 ou 390 px.
- Smoke tests PASS em 1440x900 e 390x844: slide seguinte, pausar autoplay, alterar capítulo timeline, ativar fallback visual, escolher outro nó Explore.
- Avaliação visual manual da composição desktop/mobile concluída. PNGs na pasta `assets/mockups/`.

## Limites do QA
- Não é auditoria WCAG 2.2 completa nem teste em dispositivos físicos.
- Não mede FPS da cena WebGL, pois WebGL real será implementado em S01.
- Não executa build Next.js, pois este pacote contém specs e protótipos, não o aplicativo final.
- JS desligado no HTML standalone: algumas melhorias interativas ficam indisponíveis; funcionalidade sem JS será validada na implementação Next.js real.
