# Especificação de telas e estados

Cada tela possui comportamento sem JS, loading, ready, interação, erro e reduced motion.

## `/` : header e hero
- Default: marca `PS.`, nav Work, About, Services, Contact, seletor de idioma, CTA principal visível.
- Loading 3D: arte SVG local já renderizada, texto totalmente legível e clicável. Nunca spinner bloqueante.
- Ready: overlay/progressivo Canvas só depois de hidratação e verificação de suporte/performance.
- Interacting: parallax cursor máximo visual limitado e movimento suavizado; não deslocar hit targets nem conteúdo.
- WebGL indisponível/context lost: fallback SVG/PNG, sem error overlay intrusivo.
- Reduced motion / touch: arte estática ou baixa complexidade; CTA e links invariáveis.
- Nav compacta mobile: botão Menu com `aria-expanded`, foco e Escape; navegação disponível sem canvas.

## `/` : projects
- Default: projeto selecionado, título, resumo, tipo, stack; cards laterais parcialmente visíveis desktop. Mobile: um slide legível e indicador claro.
- Autoplay: lento; botão Pausar/Reproduzir; hover/foco/drag suspendem. Respeitar reduced motion.
- Teclado: setas no carrossel focado, Tab percorre controles, Enter abre case; links externos com label e rel seguro.
- Loading: thumb otimizada da ilustração/captura; sem layout shift.
- Empty: nunca publicar sessão vazia; oferecer link GitHub se conteúdo revisado insuficiente.
- Erro de mídia: fallback local por projeto e alt contextual.
- Link demo: exibir SOMENTE após verificação explícita (não inventar URL).

## `/` : about / timeline
- Sem JS: cronologia linear visível por HTML, com heading e descrições.
- Desktop: lista de marcos à esquerda, card de detalhe à direita, foco por clique/teclado e sincronização por scroll opcional.
- Mobile: cartões empilhados, sem sticky problemático.
- Reduced motion: sem animações vinculadas ao scroll.
- Marcas e histórias: conteúdo revisado e sem dado confidencial.

## `/projects/[slug]` : case study
- Cabeçalho identificável, resumo, situação, desafio, contribuição individual, arquitetura, aprendizados e links verificados.
- Layout estático se JS desabilitado; metadados corretos; imagens com dimensões e caption.
- Invalid slug: notFound com navegação para Work; não 500.
- Missing demo: omitir controle; jamais apontar para `#` fingindo demo.

## `/` : contact / footer
- E-mail e LinkedIn como caminhos mínimos; WhatsApp apenas se contato profissional aprovado.
- Ausência de contato validado: etapa bloqueada para publicação, nunca placeholder `seu-email`.
- Currículo: incluir apenas arquivo revisado e disponível, com link acessível e indicação de idioma.

## Explore Mode (pós-MVP)
- Fechado por padrão; botão `Explorar em 3D` opcional, permite fechar e retornar ao foco correto.
- Sem suporte WebGL: lista textual de projetos com mesmas rotas, sem perda de conteúdo.
