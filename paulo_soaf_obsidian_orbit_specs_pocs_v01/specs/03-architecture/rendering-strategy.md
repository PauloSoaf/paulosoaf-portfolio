# Estratégia de renderização e performance

## Hero (POC-001)
1. SSR/SSG envia título, descrição, CTAs e fallback SVG.
2. Client boundary monta depois do conteúdo (após hidratação); adiar inicialização do Canvas até a seção estar próxima da viewport.
3. Verificar `prefers-reduced-motion`, suporte WebGL e heurística de dispositivo antes do Canvas; sem bloquear CTA.
4. R3F `Canvas` com fallback DOM e ErrorBoundary/recuperação de context loss.
5. `frameloop='demand'` em cenas quase estáticas, invalidando em interação; se movimento contínuo for necessário, limitar e pausar fora da viewport.
6. Qualidade adaptativa: dpr de 1 a no máximo 1.5 por padrão para cena pesada; desabilitar pós-processamento e limitar geometria em mobile. Valores sujeitos a profiling.
7. Evitar glTF grande, skybox pesado, bloom multicamada e shaders complexos sem orçamento medido.
8. Descartar materials/geometries/textures e listeners ao unmount; controlar memória GPU.

## Carrossel (POC-002)
- DOM/CSS para texto, links e layout. Não criar um canvas por card.
- Imagens pré-geradas responsivas; `next/image` quando compatível com build/hosting; poster otimizado. Carregar lateral próximo sob demanda.
- Alteração do projeto ativo envia estado somente para uma cena compartilhada opcional. Sem tornar o estado dependente da GPU.
- `translate3d` para deslocamento, evitando relayout desnecessário; acessibilidade de controles obrigatória.

## Timeline (POC-003)
- Conteúdo HTML primeiro; interatividade progressive enhancement.
- `IntersectionObserver` opcional para destacar marco, não para ocultar texto. Acompanhamento de scroll deve respeitar reduced motion.
- No mobile não usar efeitos sticky que obstruam conteúdo.

## Imagens/fontes
- Pré-carregar apenas font/subset críticos; preferir fontes locais com licença adequada, NUNCA compartilhar arquivo de fonte neste pacote.
- `font-display: swap` com métricas que evitem shift. Imagens com width/height/aspect-ratio.
- Limites de JS/tempo são hipóteses até profiling em dispositivo real.
