# 06 — Mini OS autoral e Code do próprio portfólio

## Mini OS: o que significa funcional
**WorkbenchOS** é uma interface web fictícia, não um kernel Linux, distribuição, emulador de Linux ou ambiente que execute shell arbitrário. Um desktop com barra, janelas gerenciáveis, z-order, estados abrir/fechar/minimizar, foco, atalhos, papéis de parede na identidade Obsidian Orbit e aplicativos *que funcionam de verdade*.

### Apps MVP e expansão
- **Projects** (P0): lista autorada do catálogo existente e duas ações prioritárias para NutriOpus/Déborah que chamam `openSite` com whitelist.
- **Browser** (P0): viewport/iframe real e tela de estado de embed; controles sempre externos ao frame; fechar `×` volta ao WorkbenchOS.
- **Code Explorer** (P0): mapeamento de componente do portfólio → código real versionado; VS Code-like read-only; sem código de projetos externos.
- **About & Contact** (P1): versão compacta real da apresentação, contatos autorizados e botão `Falar comigo` fora do notebook.
- **Terminal** (P1): prompt visual e comandos curados (`help`, `about`, `projects`, `open nutriopus`, `open deborah`, `theme`, `clear`, `reset`, `whoami`). Sem `eval`, Function, shell, filesystem host, rede arbitrária ou interpretação de JS.
- **Playground** (P2): 1 mini jogo autoral simples (ex.: Snake/Pong/asteroides) e uma experiência criativa; lazy load, pause fora da tela. Não precisar dezenas de jogos.

Todos os apps com estados reais e undo/close; não criar ícones que não fazem nada. Texto traduzido PT/EN/ES, Dark/Light consistente. Persistir preferências, nunca dados de input dos sites embutidos.

## Code Mode: apenas fonte do repositório do portfólio
**Inclusões iniciais**: `src/components/hero/HeroEditorial.tsx`, `src/components/hero/HeroArtBoundary.client.tsx`, `src/components/ui/ThemeToggle.client.tsx`, `src/components/carousel/ProjectCarousel.client.tsx`, `src/features/motion/motion-engine.ts`, `src/components/timeline/JourneyTimeline.client.tsx`, mais o notebook 3D quando implementado. Validar nomes e versões no HEAD no começo da sprint. O código do WorkbenchOS faz parte do próprio portfólio e pode ser mostrado se explicitamente autorizado.

**Exclusões absolutas**: código NutriOpus; código Déborah Lima; repos corporativos/privados; `.env*`, chaves, credenciais, certificados, logs/snapshots internos, qualquer caminho não allowlisted. A exibição do site real no iframe **não dá direito de acessar seu código**.

### Geração em build
1. Manifesto explícito mapeia `componentId` → caminhos locais *fixos*, ranges e descrição editorial traduzida.
2. Script `scripts/generate-workstation-snippets.mjs` usa `realpath`, valida raízes autorizadas, rejeita `..`, symlink externo, extensão inesperada; não aceita caminho do cliente.
3. Valida ausência de segredos com denylist, heurística e revisão manual. Se não aprovado, **falha o build** ou não publica snippet; não confundir ausência de regex com ausência de segredo.
4. Gera JSON/TS estático versionado por SHA (`process.env.VERCEL_GIT_COMMIT_SHA` ou parâmetro de build explícito verificável), inclui hash/conteúdo e link GitHub para SHA exato. Não buscar GitHub API a cada clique.
5. Destino público read-only: carregar **somente quando Code Mode for aberto**, com highlighting Shiki/lightweight; Monaco apenas se houver edição/casos reais que justifiquem chunk maior.
6. Uma mesma seleção de componente pode atualizar automaticamente o Code App, mas o usuário pode bloquear/pinar um arquivo para leitura sem surpresa.

### Formas de seleção
- `Inspect mode` opt-in com tecla de atalho e botão visível; outlines apenas nos componentes registrados. Passe mouse/teclado para selecionar; um clique carrega o snippet.
- Projeto externo não abre seu código: se estiver em modo Code e selecionar NutriOpus/Déborah, mostrar somente código **do componente do próprio portfólio que renderiza o preview** se o usuário clicar explicitamente em `Como a vitrine foi feita`, nunca o projeto externo.
- Funções sem snippet publicado mostram arquitetura/prose do componente **do portfólio**, sem trecho fictício rotulado como real.

### Navegação de estados
`DESKTOP → CODE → X → DESKTOP`, `DESKTOP → BROWSER → X → DESKTOP`, `CODE → PROJECTS → BROWSER`, `BROWSER → FOCUS_SCREEN → X → DESKTOP` se close explícito, `Escape → sair de FOCUS_SCREEN` (não fechar janela inadvertidamente). Ao fechar browser, desmontar iframe salvo se houver requisito claro e privacidade garantida. A toolbar é **do notebook**, com `×` no canto superior direito da área de screen do sistema, não da página incorporada.

### Terminal sem execução perigosa
Dispatcher com mapa de comandos allowlisted, parse sem shell expansion. Saída controlada, limite de linhas e tamanho, sem replicar dados do DOM externo. Comandos de terminal são ações de navegação do OS, não sistema real. `cat` pode mostrar somente trechos do manifesto público, sem acesso arbitrário ao filesystem.

### Design/performance
Ícones simples e coerentes com tokens; manter 1 instância de OS screen e janelas; React state não re-renderiza Canvas por tecla. Carregar o editor read-only sob demanda. Corpo do site segue encontrável via SEO fora do computador; mini OS é uma camada narrativa, não substitui a home por janela vazia se JS/WebGL falhar.
