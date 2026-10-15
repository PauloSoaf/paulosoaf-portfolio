# Checklist de entrega por operador/agente

## P00
- [ ] HEAD, branch, dirty tree e merge-base documentados.
- [ ] CSP parent `frame-src` e policies child verificadas na origem HTTPS que será publicada.
- [ ] URLs finais dos sites reais, certificado, redirects, auth, permissão de embed registrados.
- [ ] Status `PASS/FAIL/UNKNOWN` por domínio com prova; blockers não mascarados.
- [ ] Estratégia de ecrã `<Html>` ou DOM 2D projetado decidida após testes.

## P01
- [ ] Sem split permanente; notebook acompanha conteúdo ao lado.
- [ ] Chassi/tampa 3D genuínos, giro, focus screen.
- [ ] DOM do OS clicável dentro da tela, fixture de iframe com scroll real.
- [ ] Mobile legível e acessível, fallback completo.
- [ ] Testes, vídeos e métricas de POC.

## P02–P03
- [ ] NutriOpus real e Déborah real funcionam em iframe ou RFs seguem oficialmente bloqueados.
- [ ] X sempre fecha preview/code retornando ao Desktop.
- [ ] IDs do Code apontam apenas para arquivo do portfólio no SHA publicado.
- [ ] Sem snippets externos, chaves, dados pessoais ou URLs fictícias.

## P04–P06
- [ ] Input de tela não briga com pointer de manipulação.
- [ ] Abertura/fechamento, arremesso, impacto, quebra reversível e restore.
- [ ] Teclas e trackpad virtuais realizam ações reais do nosso OS; limitação cross-origin visível.
- [ ] Mini OS com pelo menos um minigame funcional, sem shell arbitrário.
- [ ] Cena responde ao scroll sem engolir copy/CTA e sem Canvas duplicado.

## P07
- [ ] Gate editorial, i18n, Dark/Light, Save-Data, reduced motion e mobile preservados.
- [ ] A11y manual + E2E browser real + perf hardware real.
- [ ] Licenças revisadas.
- [ ] Rollback feature flag testado.
- [ ] Aceite visual do proprietário antes de merge/deploy.
