# ADR-004: carrossel DOM acessível, WebGL desacoplado

Status: Proposed. Contexto: experiência cinematográfica não pode comprometer navegação e SEO.

Decisão: conteúdo/carrossel implementado em HTML/CSS/React e controlador de estado. Cena WebGL de fundo opcional assina mudanças de slide mas nunca é a fonte de verdade de dados.

Consequências: qualidade visual avançada com fallback robusto. Suporte ao WAI Carousel Pattern e pausa do autoplay.
