# paulo_soaf | Obsidian Orbit

Pacote de especificações para iniciar um **novo repositório** de portfólio. Data-base: 10/10/2026. Documento de planejamento, não código de produção finalizado.

## Objetivos, em ordem
1. Converter visitas em contato de recrutadores e clientes.
2. Comprovar competência de engenharia Full Stack e projetos criativos.
3. Produzir uma experiência visual memorável, sem bloquear conteúdo nem degradar a navegação.
4. Disponibilizar material demonstrável para compartilhamento no LinkedIn.

**Decisões aprovadas**: tema único **Obsidian Orbit**, equilíbrio visual/performance/conversão e três componentes **obrigatórios**: A. hero de universo procedural, B. carrossel cinematográfico, C. About com trajetória interativa. **Explore Mode é opcional e posterior ao MVP**.

## Por onde começar
1. Abrir `INSTRUCOES_PARA_CLAUDE.md`; passar o prompt desse arquivo à IA com o ZIP extraído na raiz do repositório novo.
2. Abrir `pocs/preview/index.html` no navegador, sem instalar nada, para inspecionar a direção visual. As POCs são HTML/CSS/SVG e JS de comportamento; **não são a cena WebGL final**.
3. Conferir as imagens em `assets/mockups/` e os SVGs em `assets/illustrations/`.
4. Executar somente a sprint `S00` e aprovar o design visual antes de seguir.
5. Registrar diferenças e decisões em `specs/03-architecture/adr/` e no changelog da sprint. NÃO substituir a referência por um template genérico.

## Pacote
- `specs/`: produto, design, RF/RNF, arquitetura, POCs e sprints, com IDs rastreáveis.
- `pocs/preview/`: protótipo navegável e arquivos auxiliares para POC-001, 002, 003 e 004.
- `assets/illustrations/`: artes vetoriais locais editáveis.
- `assets/mockups/`: capturas de referência geradas a partir do protótipo.
- `INSTRUCOES_PARA_CLAUDE.md`: prompt mestre e guardrails.
- `MANIFEST.json`: inventário com função dos arquivos.

## Avisos importantes
- As imagens/elementos das POCs são arte conceitual original, não capturas dos projetos reais.
- A cena do protótipo em CSS/SVG simula a estética 3D; Claude precisa criar a cena WebGL real isolada conforme POC-001.
- Não declarar links de demonstração sem verificar funcionamento; mostrar `Ver código` somente onde há repositório público real.
- Não colocar métricas inventadas, depoimentos fictícios, empresas sem autorização, nem protótipos acadêmicos como sistemas comerciais em produção.
- O material contém textos rascunho. Validar currículo, contato, disponibilidade e direitos sobre projetos antes da publicação.
