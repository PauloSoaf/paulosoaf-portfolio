# Ferramentas opcionais de QA das POCs

Precisam de Python 3.10+, `pip install playwright` e navegador Chromium instalado. O ambiente de desenvolvimento pode usar `playwright install chromium`. Scripts são independentes da stack Next.js definitiva.

- `python tools/smoke_test_pocs.py`: smoke tests nos tamanhos desktop/mobile usando conteúdo local inline.
- `python tools/capture_mockups.py`: regenera as 6 capturas. Atenção: sobrescreve PNGs existentes.

Os scripts embutem CSS/SVG/JS na página durante a verificação para não depender de hosts ou CDN. Isso não transforma o HTML em Next.js/R3F e não substitui testes E2E da aplicação definitiva.
