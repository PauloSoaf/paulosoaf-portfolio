# POC-001: Hero com universo procedural (A)

Status: referência navegável entregue em `pocs/preview/poc-001-hero.html`. **A forma atual é SVG + CSS, não WebGL**. Referências visuais: `assets/mockups/01-hero-desktop.png`, `05-hero-mobile.png`, `assets/illustrations/procedural-orb.svg`.

## Objetivo
Hero reconhecível, autoral e rápido. Inspirar-se nos problemas técnicos do Dr-Manaus (procedural, renderização, coordenadas) sem copiar engine completo nem gerar planeta genérico comum.

## Hipótese
Uma representação cósmica com linhas de órbita e um núcleo procedural topográfico acrescenta memorabilidade sem prejudicar conversão, se texto/CTA carregarem primeiro e canvas for opcional.

## Direção visual
Texto alinhado à esquerda e objeto à direita; luz rim verde, materiais grafite azul-petróleo, fundo `#090D11`. Arte deve respeitar espaço negativo e nunca reduzir contraste do copy.

## Implementação técnica pretendida
- Criar `HeroScene.tsx` com `Canvas` R3F lazy no client.
- Geometria esférica deformada por noise determinístico/shader leve, wireframe orbital, 1-2 luzes e render limpo; fallback SVG idêntico na composição.
- Pointer gera target rotation clamp ±0.10 rad, com lerp; `prefers-reduced-motion` render estático.
- Observador de interseção pausa/desmonta conforme custo aferido; `Canvas fallback` e ErrorBoundary para falhas GPU/context lost.
- Nunca atualizar estado React por frame; usar refs/frame loop quando justificável.
- Não converter cena inteira em vídeo não acessível sem justificativa.

## Casos de teste
- No GPU, com JS bloqueado e em conexão limitada: CTA visível.
- 360x800/390x844: sem copy sobre esfera e sem scroll horizontal.
- Reduced motion: sem giração/parallax/autoplay e foco normal.
- Analisar paint e tamanho de bundle antes/depois do lazy import.

## Aceite
AC-001, AC-002, AC-008, AC-009, AC-010, AC-015. O visual é aprovado por comparação consciente aos mockups, não cópia pixel-perfect às cegas.
