# POCs visuais executáveis offline

Abra `index.html` em Chrome/Firefox. Alternativamente execute um servidor estático (`python -m http.server 8000`) a partir da raiz do pacote e entre em `http://localhost:8000/pocs/preview/index.html`.

Arquivos:
- `index.html`: preview integrado de todas as seções e interações.
- `poc-001-hero.html`: hero, pointer parallax e botão de fallback.
- `poc-002-carousel.html`: carrossel com autoplay, pause, setas, teclado, pointer/touch drag e links de repositórios reais.
- `poc-003-timeline.html`: seletor de marcos e painel editorial.
- `poc-004-explore.html`: seleção de nós e saída; demonstração conceitual do modo pós-MVP.

## Limitações deliberadas
Estes protótipos são HTML/CSS/SVG/JS vanilla para transferir design e interação a Claude. **Não carregam Next.js, R3F, shaders reais, métricas do negócio nem conteúdo corporativo**. O hero no navegador é arte vetorial, não cena 3D de produção.
O botão `TESTAR FALLBACK` da POC simula visualmente estado degradado; na implementação real, trocar para um fallback SVG de composição equivalente.
Os períodos no About são capítulos editoriais conceituais, não anos factuais. Os links GitHub são públicos; não há URLs de aplicações publicadas verificadas neste pacote.
