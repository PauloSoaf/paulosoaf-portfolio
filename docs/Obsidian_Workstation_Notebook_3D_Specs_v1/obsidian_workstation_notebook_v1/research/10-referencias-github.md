# Dez repositórios GitHub verificados via GitHub API em 14/10/2026

Todos os links abaixo apontam para repositórios existentes consultados em tempo real. São **referências e candidatos**, não dependências já instaladas nem autorização de copiar código indiscriminadamente. Licença do repositório deve ser respeitada inclusive ao incorporar assets ou adaptar implementação; confirmar licenças dos arquivos específicos.

| ID | Repositório | Link | Licença reportada | Uso proposto |
|---|---|---|---|---|
| GH-01 | pmndrs/react-three-fiber | https://github.com/pmndrs/react-three-fiber | MIT | Canvas/R3F/gestos e render demand; **já presente na base** |
| GH-02 | pmndrs/drei | https://github.com/pmndrs/drei | MIT | `<Html transform>`, helpers/GLTF/performance — **avaliar adição** |
| GH-03 | pmndrs/react-three-rapier | https://github.com/pmndrs/react-three-rapier | MIT | Integração Rapier física com React/R3F, joints, colliders — **avaliar versão compatível** |
| GH-04 | dimforge/rapier | https://github.com/dimforge/rapier | Apache-2.0 | Motor físico oficial, docs, conceitos de impulso/sleep/colisões; repo ativo (em vez de `rapier.js` antigo arquivado) |
| GH-05 | pmndrs/gltfjsx | https://github.com/pmndrs/gltfjsx | MIT | Converter GLB otimizado em componentes JSX se modelar notebook autoral |
| GH-06 | zeux/meshoptimizer | https://github.com/zeux/meshoptimizer | MIT | Otimizar geometria/GLB antes do deploy, reduzir draw/asset cost |
| GH-07 | mrdoob/three.js | https://github.com/mrdoob/three.js | MIT | Matemática, raycast, camera projection, materiais/mesh — **já presente** |
| GH-08 | pmndrs/zustand | https://github.com/pmndrs/zustand | MIT | Store opcional para OS state sem React rerender por frame; só instalar se reduzir complexidade |
| GH-09 | microsoft/monaco-editor | https://github.com/microsoft/monaco-editor | MIT | Editor de código read-only opcional; cuidado: chunk grande; talvez Shiki seja suficiente |
| GH-10 | xtermjs/xterm.js | https://github.com/xtermjs/xterm.js | MIT | Terminal visual do mini OS; a UI não executa comandos reais; alternativa mais leve é terminal custom |

## Escolha de dependências por fase
- **P01**: testar `@react-three/drei` Html e controle de câmera. Não instalar Rapier ainda.
- **P02/P03**: browser DOM e snippets JSON + syntax highlighting sob demanda (sem Monaco obrigatório).
- **P04**: `@react-three/rapier` e dependência transitiva WASM, travar versões após matriz React 19/R3F 9/Three 0.186.
- **P05**: mini OS/terminal: usar React/HTML básico; Xterm/Monaco são bibliotecas a avaliar somente após medição do bundle.
- **P06**: gltfjsx/meshoptimizer no pipeline de build para modelos GLB reais.

## Nota sobre Rapier
`dimforge/rapier.js` também existe, mas o GitHub o marca **arquivado e migrado** para `dimforge/rapier`. Por isso a referência selecionada é o repositório oficial ativo `dimforge/rapier`. Não instalar biblioteca arquivada apenas por achar um tutorial antigo.
