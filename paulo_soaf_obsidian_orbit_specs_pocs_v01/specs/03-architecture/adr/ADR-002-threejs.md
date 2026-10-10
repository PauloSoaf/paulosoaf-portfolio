# ADR-002: Three.js/R3F apenas para experiências visuais isoladas

Status: Proposed. Contexto: POC hero usa 3D, mas performance mobile e acessibilidade são prioridades.

Decisão: Three.js + R3F isolados em componente cliente lazy; fallback local SVG estático. No início, arte procedural leve (globo topográfico/orbitas/shader) em vez de motor de jogo reutilizado integralmente. Explore Mode adiado.

Consequências: menor risco de bundle e vazamento WebGL; não basta importar o engine Dr-Manaus inteiro. Antes de reutilizar algoritmo/código, revisar propriedade intelectual/licenças/complexidade.

Reavaliar se: demonstrações medidas mostrarem viabilidade de cenas mais complexas.
