# P00 — Decisão e wireframes

Decisão consolidada: [ADR-015](../../../adr/ADR-015-workstation-dom-screen.md). O ensaio comparou Drei `Html transform` e DOM externo com projeção afim; adotou a segunda após teste em desenvolvimento e build otimizado. Um único Canvas por página. A escultura anterior continua na landing normal como rollback.

## Wireframes usados na POC

```text
Desktop / Hero                    Desktop / Work
┌─────────────────────────────┐   ┌─────────────────────────────┐
│ navegação / tema / idiomas   │   │ título editorial da seção   │
│                             │   │                             │
│ título          notebook    │   │ case atual       notebook   │
│ narrativa       3D + DOM    │   │ galeria          menor      │
│ CTAs            controles   │   │ 7→0              controles  │
└─────────────────────────────┘   └─────────────────────────────┘
  About, serviços e contato voltam à largura editorial completa.

Mobile / fluxo                    Mobile / foco
┌───────────────┐                 ┌───────────────┐
│ navegação     │                 │ voltar     ×  │
│ título        │                 │ app        ×  │
│ narrativa     │                 │ domínio       │
│ CTAs          │                 │               │
│ notebook 3D   │     Focar       │ iframe DOM    │
│ controles     │ ──────────────► │ legível       │
│ explorar      │                 │ scroll nativo │
│ próximo texto │                 │               │
└───────────────┘                 └───────────────┘
```

As capturas representam o resultado implementado, não estes desenhos. Não há divisão 50/50 permanente; poses por toda a landing ficam em P06. Desktop alterna retângulo do Hero e retângulo reservado ao lado do Work. Tablet/mobile mantêm o notebook no fluxo com camada plana para sites. Conteúdo editorial e CTA continuam fora do computador.

Baseline disponível: [QA CreativeFollowup](../../CreativeFollowup/REPORT.md), screenshots/vídeos nativos e métricas do commit `5c607eb`. Nenhum relatório histórico foi sobrescrito. A nova matriz compara a mesma identidade v0.1, com substituição explicitamente autorizada da escultura por notebook na POC; os mockups antigos não continham esse notebook. Aceite artístico pertence ao proprietário.
