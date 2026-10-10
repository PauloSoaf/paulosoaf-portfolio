# FEATURE-FUTURE-001 — prompt de origem (registro verbatim)

Registrado em 10/10/2026 a pedido do proprietário ("guarde isso na pasta de specs"). Texto original preservado
sem edição como fonte da especificação estruturada em `FEATURE-FUTURE-001-obsidian-dev-mode.md`.
Em caso de divergência, este texto prevalece sobre a interpretação até revisão do proprietário.

---

# PROMPT PARA CLAUDE: Planejamento futuro do Obsidian Dev Mode

## 1. Contexto

Estamos desenvolvendo o portfólio pessoal `paulo-soaf-portfolio`, utilizando a identidade visual Obsidian Orbit v0.1.

O projeto possui:

- Next.js, React e TypeScript.
- Three.js e React Three Fiber.
- Hero com universo procedural.
- Carrossel cinematográfico de projetos.
- Timeline interativa de experiência profissional.
- Explore Mode 3D opcional.
- Internacionalização em PT-BR, EN e ES.
- Temas claro e escuro.
- Arquitetura documentada em `specs/`.
- Desenvolvimento organizado por sprints, RFs, RNFs, critérios de aceite e testes de regressão.

Uma nova funcionalidade foi aprovada para desenvolvimento futuro: Obsidian Dev Mode.

IMPORTANTE: NÃO IMPLEMENTAR AGORA.

A prioridade absoluta continua sendo finalizar todas as funcionalidades existentes, concluir as sprints planejadas, corrigir bugs e estabilizar o portfólio.

Sua tarefa neste momento é exclusivamente documentar, planejar e registrar essa funcionalidade no backlog futuro.

## 2. Objetivo do Obsidian Dev Mode

Criar um modo desenvolvedor interativo que permita aos visitantes inspecionar os componentes reais do portfólio.

O visitante poderá ativar o Dev Mode, selecionar visualmente um componente e descobrir como ele foi implementado, incluindo seu código-fonte, tecnologias, decisões arquiteturais e detalhes de performance.

Exemplo:

O visitante visualiza o universo procedural do Hero.

Ao ativar o Dev Mode e selecionar o universo, abre-se um painel técnico apresentando:

- Nome do componente: `UniverseHero`.
- Caminho do arquivo original.
- Código TSX real utilizado na aplicação.
- Shaders GLSL relacionados, quando existirem.
- Dependências e tecnologias utilizadas.
- Explicação da arquitetura.
- Decisões técnicas e otimizações relevantes.
- Links para os arquivos originais no GitHub.
- Botão para copiar o código.

O objetivo é transformar o próprio portfólio em uma demonstração de engenharia de software, permitindo que desenvolvedores compreendam a implementação sem sair da aplicação.

## 3. Experiência de usuário

### 3.1 Ativação

Adicionar futuramente um botão `</> Dev Mode` no header.

O recurso deverá permanecer desativado por padrão.

Quando ativado:

1. Os componentes inspecionáveis recebem destaques discretos ao passar o cursor ou receber foco.
2. Uma etiqueta exibe o nome técnico do componente.
3. Ao selecionar o componente, um painel técnico é aberto.
4. O usuário pode navegar entre abas e arquivos relacionados.
5. O usuário pode fechar o painel ou desativar o Dev Mode.
6. Ao sair, a aplicação volta ao comportamento normal.

### 3.2 Painel técnico

O painel deverá possuir as seguintes abas:

Code: código-fonte real com syntax highlighting, numeração de linhas, seleção de arquivos, copiar código e link para GitHub.

Architecture: explicação de responsabilidades, dependências, composição dos componentes e decisões arquiteturais.

Performance: estratégias de otimização, renderização, carregamento e métricas reais quando disponíveis.

Overview: explicação simplificada sobre o funcionamento e propósito do componente, acessível também para visitantes não técnicos.

Não inventar métricas de desempenho ou decisões técnicas inexistentes.

### 3.3 Responsividade

Desktop: painel lateral direito, com possibilidade de redimensionamento caso seja tecnicamente justificável.

Tablet: drawer adaptativo.

Mobile: painel fullscreen, com navegação adequada para toque.

O Dev Mode deverá funcionar com teclado, ter estados de foco visíveis e oferecer alternativas às interações baseadas em hover.

A tecla Escape fecha o painel de inspeção.

### 3.4 Identidade visual

Preservar rigorosamente o Obsidian Orbit v0.1.

Não redesenhar o site.

O Dev Mode deverá parecer uma extensão natural da identidade original, com:

- Superfícies grafite e preto profundo.
- Tipografia monoespaçada no código.
- Acentos verde-água discretos.
- Bordas técnicas e animações sutis.
- Syntax highlighting legível.
- Suporte ao tema claro sem descaracterizar o design.
- Respeito à preferência `prefers-reduced-motion`.

Não usar grandes superfícies verdes ou efeitos excessivos.

## 4. Arquitetura proposta

A abordagem preferencial será gerar snapshots autorizados do código durante o build.

Não realizar chamadas à GitHub API toda vez que o visitante abrir o inspector.

Criar futuramente um registro declarativo semelhante a:

```typescript
export const inspectableComponents = {
  "hero.universe": {
    name: "UniverseHero",
    source: "src/components/hero/UniverseHero.tsx",
    relatedFiles: [
      "src/components/hero/ProceduralUniverse.tsx"
    ],
    tags: ["React", "Three.js", "R3F"]
  }
};
```

Esse registro é apenas uma referência arquitetural, não deve ser implementado agora.

O gerador deverá:

1. Processar somente arquivos explicitamente autorizados.
2. Validar os caminhos e impedir acesso fora da lista permitida.
3. Extrair o código real existente no repositório.
4. Produzir um manifesto estático com snippets e metadados.
5. Registrar o SHA do commit correspondente ao deploy.
6. Disponibilizar o conteúdo apenas quando o Dev Mode for ativado.
7. Permitir abrir o arquivo exato no GitHub.
8. Falhar com segurança se algum arquivo estiver ausente.

Nunca publicar arquivos `.env`, credenciais, tokens, segredos, código privado ou informações corporativas não autorizadas.

O código será somente para leitura.

Não criar um executor de JavaScript ou TypeScript arbitrário.

## 5. Componentes inicialmente inspecionáveis

Considerar como candidatos:

- Hero procedural e seus shaders.
- Carrossel cinematográfico.
- Timeline interativa.
- Sistema de temas.
- Sistema de internacionalização.
- Componentes de animação.
- Explore Mode, quando estiver implementado.
- Componentes autorais relevantes para demonstrar engenharia.

A lista definitiva deverá ser montada após análise do código real.

Não inventar componentes, arquivos ou implementações que ainda não existam.

## 6. Requisitos não funcionais

O Dev Mode deverá:

- Não prejudicar o carregamento inicial.
- Utilizar carregamento sob demanda.
- Não provocar regressões nas animações.
- Não comprometer a performance do Three.js.
- Funcionar em PT-BR, EN e ES.
- Funcionar nos temas claro e escuro.
- Possuir navegação acessível.
- Ser compatível com dispositivos móveis.
- Utilizar código correspondente à versão publicada.
- Não depender da disponibilidade da GitHub API durante a inspeção.
- Não expor arquivos não autorizados.
- Possuir testes unitários, de integração e E2E.
- Preservar todas as funcionalidades atuais.

## 7. Planejamento de entrega futura

Registrar a funcionalidade como:

`FEATURE-FUTURE-001: Obsidian Dev Mode`

E criar a proposta:

`POC-006: Developer Inspector`

A sprint de implementação deverá ocorrer somente após a estabilização do MVP e conclusão das funcionalidades prioritárias.

Dividir futuramente em tarefas:

TASK-01: Registro declarativo de componentes inspecionáveis.

TASK-02: Gerador seguro de snippets no build.

TASK-03: Manifesto de componentes e metadados.

TASK-04: Interface de ativação e seleção visual.

TASK-05: Painel técnico com abas.

TASK-06: Syntax highlighting e navegação entre arquivos.

TASK-07: Links para GitHub vinculados ao commit publicado.

TASK-08: Adaptação mobile, temas e internacionalização.

TASK-09: Acessibilidade e controle de interações conflitantes.

TASK-10: Testes de regressão, segurança e performance.

## 8. Critérios de aceite futuros

A funcionalidade será considerada pronta quando:

- O usuário conseguir ativar e desativar o Dev Mode.
- Componentes autorizados puderem ser selecionados.
- O painel apresentar código verdadeiro, não exemplos fictícios.
- O código corresponder ao commit publicado.
- Os links para GitHub abrirem os arquivos corretos.
- Todos os três idiomas funcionarem.
- Os dois temas mantiverem contraste adequado.
- O mobile possuir interação completa.
- O uso do Dev Mode não prejudicar a navegação comum.
- A aplicação não depender de requisições GitHub por inspeção.
- Os testes de regressão permanecerem aprovados.
- Nenhum arquivo não autorizado for exposto.

## 9. O que fazer agora

Sua tarefa atual é somente:

1. Ler a estrutura real de `specs/`, o roadmap e as sprints existentes.
2. Criar uma especificação Markdown detalhada para o Obsidian Dev Mode.
3. Adicionar a funcionalidade ao backlog futuro, respeitando a nomenclatura do projeto.
4. Documentar RFs, RNFs, arquitetura proposta, critérios de aceite, riscos e dependências.
5. Registrar que a funcionalidade está aprovada conceitualmente, mas não autorizada para implementação.
6. Preservar todas as decisões visuais e arquiteturais já aprovadas.

Não modificar componentes React, CSS, Three.js, dependências, rotas, configuração de build ou código de produção neste momento.

Não substituir nem reordenar as sprints atuais.

Não criar uma implementação parcial ou experimental sem autorização.

Ao finalizar a documentação, apresente os arquivos criados, as decisões registradas, os riscos identificados e a condição necessária para começar a futura POC.

## 10. Regra final

O Obsidian Dev Mode é uma funcionalidade diferenciadora do portfólio, mas sua implementação não pode atrasar o lançamento.

Primeiro finalizamos o produto principal. Depois transformamos o próprio site em uma experiência interativa de exploração do seu código-fonte.
