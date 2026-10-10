# POC-003: About com trajetória interativa (C)

Protótipo: `pocs/preview/poc-003-timeline.html`; screenshot `assets/mockups/03-timeline-desktop.png`.

## Objetivo
Mostrar desenvolvimento de carreira sem um currículo em forma de tabela. A experiência é prova de trajetória, não espetáculo.

## Modelo
- Desktop: coluna cronológica à esquerda, painel ativo à direita com título do cargo, contexto e responsabilidades verificadas.
- Clique/Enter seleciona experiência; indicador de linha vertical ativo; transição suave somente em conteúdo decorativo.
- Com JS desativado: lista com todos os marcos e detalhes visíveis.
- Mobile: cards empilhados com headings sem sticky; foco e ordem DOM coerentes.
- Interação por scroll opcional após validar usabilidade; não implementar scroll hijacking.

## Conteúdo candidato
Venturus, Jabil, CyberLabs/UEA (sujeito a confirmar papel, período e autorização), projetos próprios. Não assumir que o período da POC é a data real de experiência.

## Estados
Default, selected, hover, focus, reduced-motion, viewport compacta, conteúdo editorial não aprovado (omitido).

## Aceite
AC-005, AC-008, AC-009, AC-014.
