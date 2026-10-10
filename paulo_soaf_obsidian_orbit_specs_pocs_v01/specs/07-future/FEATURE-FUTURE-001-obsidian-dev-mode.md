# FEATURE-FUTURE-001: Obsidian Dev Mode

| Campo | Valor |
|---|---|
| ID | `FEATURE-FUTURE-001` |
| Nome | Obsidian Dev Mode |
| Proposta técnica | `POC-006: Developer Inspector` (`specs/04-pocs/POC-006-developer-inspector.md`) |
| Status | **Aprovada conceitualmente — NÃO autorizada para implementação** |
| Prioridade | P2 (pós-MVP; não bloqueia lançamento) |
| Registrada em | 10/10/2026, a pedido do proprietário |
| Fonte | `FEATURE-FUTURE-001-source-prompt.md` (prompt original, verbatim) |
| Sprint | Nenhuma. Não substitui nem reordena S00–S06 |

> **Regra de prioridade:** primeiro finalizar o produto principal (S00–S05, gates e estabilização); depois, com
> autorização explícita, transformar o site em uma experiência de exploração do próprio código. Nenhuma linha de
> código, dependência, rota, CSS ou configuração de build do Dev Mode deve ser criada antes disso.

## 1. Objetivo
Permitir que visitantes ativem um modo desenvolvedor, selecionem visualmente um componente real do portfólio e
consultem, sem sair do site: nome técnico, arquivo de origem, código real (incluindo shaders GLSL quando existirem),
tecnologias, arquitetura, decisões técnicas, otimizações e links para o arquivo exato no GitHub.

Hipótese de valor: para P2 (tech lead/engenheiro, `personas-and-journeys.md`) o próprio site vira prova verificável
de engenharia — alinhado a "Evidence over decoration" (`design-system.md`). Para P1/P3 o recurso fica invisível
até ser ativado, sem custo na jornada principal.

## 2. Condição para iniciar a POC-006 (gate)
Todas obrigatórias:
1. MVP publicado: S05 concluída com todos os ACs P0/P1 aprovados e regressão documentada.
2. Nenhum bug bloqueador aberto nas funcionalidades existentes; Web Vitals de campo medidos (RNF-001).
3. **Autorização explícita do proprietário** para iniciar a POC-006.
4. Repositório do portfólio público (ou decisão registrada de omitir links GitHub — ver R-DM-07).
5. Lista definitiva de componentes inspecionáveis montada a partir do código real existente naquele momento.
6. Decisão de licença/autorização de exibição do código (R-DM-08) e ADR do gerador de snapshots aprovados.

Até lá, o S06 (Explore Mode) continua sendo a única feature pós-MVP planejada; a ordem entre S06 e esta feature
será decidida pelo proprietário após o MVP.

## 3. Escopo
**Dentro:** botão de ativação no header; destaque e seleção de componentes autorizados; painel técnico com abas
Overview, Code, Architecture e Performance; snapshots de código gerados no build a partir de allowlist; manifesto
estático com SHA do commit publicado; links GitHub fixados no SHA; PT/EN/ES; Dark/Light; mobile, tablet e desktop;
acessibilidade; testes.

**Fora:** executar, editar ou compilar código no navegador (nenhum executor JS/TS); chamadas à GitHub API em
runtime; exibir qualquer arquivo fora da allowlist; código privado, corporativo ou de terceiros sem autorização;
métricas não medidas; redesenho de qualquer área do Obsidian Orbit v0.1.

## 4. Experiência de usuário
### 4.1 Ativação e seleção
- Controle `</> Dev Mode` no `SiteHeader`, discreto, **desativado por padrão**; não cobre CTAs nem causa overflow
  no header mobile (mesma regra do ADDENDUM-001 §4.1). Persistência do estado entre visitas: não, salvo decisão da POC.
- Ativado: componentes inspecionáveis recebem destaque discreto em hover **e** foco; etiqueta com o nome técnico.
- Seleção por clique, toque ou teclado (Enter/Espaço), nunca dependente só de hover.
- Desativar remove destaques, listeners e overlays; a aplicação volta ao comportamento normal sem recarregar.

### 4.2 Painel técnico
| Aba | Conteúdo | Regra de veracidade |
|---|---|---|
| Overview | Propósito e funcionamento em linguagem acessível (também para não técnicos) | Conteúdo editorial revisado (`draft → approved`) |
| Code | Código real com syntax highlighting, numeração de linhas, seletor de arquivos relacionados, copiar, link GitHub | Byte-idêntico ao arquivo no SHA publicado |
| Architecture | Responsabilidades, dependências, composição, decisões (com referência a ADRs) | Somente decisões existentes e documentadas |
| Performance | Estratégias de renderização/carregamento/otimização e métricas | Métrica só com fonte, data e dispositivo; sem dado = "não medido" |

### 4.3 Responsividade, teclado e movimento
- Desktop: painel lateral direito (redimensionável só se justificado na POC). Tablet: drawer. Mobile: fullscreen.
- `Escape` fecha o painel e devolve o foco ao componente selecionado (ou ao botão Dev Mode).
- Foco visível em todos os estados; ordem de tabulação coerente; anúncios de leitor de tela sem excesso.
- `prefers-reduced-motion`: sem animações de entrada do painel nem destaques animados.

### 4.4 Identidade visual
Extensão natural do Obsidian Orbit v0.1, sem redesenho: superfícies grafite/preto profundo, código em IBM Plex Mono,
acento `#65E6C3` apenas pontual (dark) e `#176B63` (light), bordas técnicas, nenhum grande bloco verde, highlighting
legível e com contraste verificado nos dois temas. Tokens existentes em `src/styles/tokens.css` (mapear, não duplicar).

## 5. Requisitos funcionais (adição; não renumera os existentes)
| ID | Prioridade | Requisito |
|---|---|---|
| RF-027 | P2 | Ativar e desativar o Dev Mode por controle no header; desativado por padrão em todas as rotas e idiomas. |
| RF-028 | P2 | Destacar componentes inspecionáveis em hover e foco, com etiqueta de nome técnico e seleção por clique, toque ou teclado. |
| RF-029 | P2 | Abrir painel técnico com abas Overview, Code, Architecture e Performance para o componente selecionado. |
| RF-030 | P2 | Exibir na aba Code o código real do commit publicado, com highlighting, numeração de linhas, seleção de arquivos relacionados e ação de copiar. |
| RF-031 | P2 | Oferecer link para o arquivo exato no GitHub, fixado no SHA do commit publicado. |
| RF-032 | P2 | Exibir Overview/Architecture/Performance com conteúdo editorial aprovado nos três idiomas, sem métricas ou decisões inventadas. |
| RF-033 | P2 | Fechar o painel (botão/Escape) e sair do modo restaurando foco, scroll e comportamento normal. |
| RF-034 | P2 | Manter registro declarativo (allowlist) como única fonte de componentes e arquivos inspecionáveis. |

## 6. Requisitos não funcionais (adição)
| ID | Prioridade | Critério |
|---|---|---|
| RNF-020 | P2 | Zero impacto no carregamento inicial: inspector, highlighter e manifesto em chunks carregados somente após ativação; orçamento exato definido e medido na POC-006 (ref. RNF-001/RNF-014). |
| RNF-021 | P2 | Segurança: somente arquivos da allowlist; validação de caminho (sem `..`, sem links simbólicos para fora da raiz, extensões permitidas); varredura de segredos; nunca `.env`, credenciais, tokens ou código não autorizado. |
| RNF-022 | P2 | Integridade: snapshot e links correspondem ao SHA do deploy publicado; build falha com segurança se arquivo faltar, estiver fora da allowlist ou contiver padrão de segredo. |
| RNF-023 | P2 | Independência: nenhuma requisição à GitHub API (ou outro serviço externo) durante a inspeção. |
| RNF-024 | P2 | Acessibilidade WCAG 2.2 AA: teclado completo, foco gerenciado, alternativa a hover, Escape, leitor de tela, reduced motion. |
| RNF-025 | P2 | Funciona em PT-BR/EN/ES × Dark/Light; contraste do syntax highlighting verificado nos dois temas. |
| RNF-026 | P2 | Sem regressão de animações, carrossel ou cena Three.js/R3F: Dev Mode desligado tem custo zero em runtime; ligado não força re-render por frame nem bloqueia o frameloop. |
| RNF-027 | P2 | Somente leitura: nenhum `eval`, executor ou compilação no cliente; compatível com a CSP vigente (ADR de segurança). |
| RNF-028 | P2 | Testes unitários, de integração, E2E, de segurança (allowlist/path traversal/segredos) e de performance antes do aceite. |

## 7. Arquitetura proposta (referência; implementar somente após o gate)
```text
Registro declarativo (allowlist, TS tipado)
      │  build (CI, SHA conhecido)
      ▼
Gerador de snapshots ── valida caminhos ── varre segredos ── falha com segurança
      │
      ▼
Manifesto estático versionado (JSON por componente: arquivos, código já destacado, metadados, SHA)
      │  servido como asset estático, mesmo domínio (CSP connect-src 'self')
      ▼
Botão Dev Mode → import() do inspector → fetch do manifesto sob demanda → painel
```
- **Registro (TASK-01):** objeto tipado `inspectableComponents` (forma ilustrativa no prompt de origem; os nomes
  `UniverseHero`/`ProceduralUniverse` são exemplos, não arquivos existentes). Cada entrada: id estável, nome técnico,
  arquivo principal, arquivos relacionados, tags, referência ao conteúdo editorial por idioma.
- **Gerador (TASK-02):** roda no build; resolve caminhos relativos à raiz; rejeita fora da raiz/allowlist,
  `.env*`, `*.pem`, chaves; aplica scanner de segredos; aborta o build em qualquer violação.
- **Manifesto (TASK-03):** estático, com hash do conteúdo e SHA do commit (`git rev-parse HEAD` ou variável do
  provedor de deploy). Highlighting preferencialmente no build para não enviar o highlighter ao cliente.
- **Ligação ao DOM:** marcação declarativa (`data-inspect-id`) nos componentes autorizados, inerte com o modo desligado.
- **Links (TASK-07):** `https://github.com/<owner>/<repo>/blob/<sha>/<path>` — somente se o repositório for público.
- **ADR:** a decisão final (formato do manifesto, highlighter, detecção de segredos) será registrada como ADR no
  início da POC-006; nenhuma decisão aqui altera ADR-001…ADR-004 nem os ADRs de S00.

## 8. Componentes candidatos (lista não definitiva)
Estado no código em 10/10/2026 (sprint S00 em andamento). A lista final é feita sobre o código real no gate.
| Candidato | Origem prevista | Existe hoje? |
|---|---|---|
| Sistema de temas (bootstrap sem flash, toggle, tokens) | S00 | Em implementação (`src/theme/`, `src/styles/tokens.css`) |
| Sistema de internacionalização (rotas, negociação, dicionários) | S00 | Em implementação (`src/i18n/`, `src/proxy.ts`) |
| Gate editorial de conteúdo (`approved` / release check) | S00 | Em implementação (`src/features/content/`) |
| Hero procedural R3F e shaders | S01 | Não (somente fallback SVG em S00) |
| Carrossel cinematográfico | S02 | Não |
| Timeline interativa | S03 | Não |
| Componentes de animação | S01–S03 | Não |
| Explore Mode | S06 (opcional) | Não |

## 9. Critérios de aceite (adição)
| AC | RF/RNF | Validação |
|---|---|---|
| AC-024 | RF-027 | Dev Mode desligado por padrão; ativa/desativa pelo header com mouse, teclado e toque nas 6 combinações idioma×tema. |
| AC-025 | RF-028 RF-034 | Somente componentes do registro são selecionáveis; destaque em hover e foco; etiqueta com nome técnico. |
| AC-026 | RF-029 RF-033 RNF-024 | Painel abre com 4 abas navegáveis por teclado; Escape fecha e devolve o foco; leitor de tela anuncia título e aba. |
| AC-027 | RF-030 RNF-022 | Código exibido é byte-idêntico ao arquivo no SHA publicado (teste compara hashes); copiar entrega o mesmo conteúdo. |
| AC-028 | RF-031 | Links GitHub abrem o arquivo exato no SHA publicado. |
| AC-029 | RNF-023 | E2E com log de rede: nenhuma requisição externa durante a inspeção. |
| AC-030 | RNF-021 RNF-022 | Build falha para arquivo ausente, fora da raiz/allowlist ou com padrão de segredo; manifesto não contém nada fora da allowlist. |
| AC-031 | RNF-020 RNF-026 | Comparação antes/depois: JS inicial, LCP/INP/CLS e FPS da cena sem regressão relevante com o modo desligado; carga sob demanda ao ativar. |
| AC-032 | RNF-024 RNF-025 | Desktop painel lateral, tablet drawer, mobile fullscreen; sem overflow a 360 px; toque completo; contraste AA nos dois temas. |
| AC-033 | RF-032 | Abas editoriais aprovadas em PT/EN/ES; Performance sem métricas não medidas (fonte/data obrigatórias). |
| AC-034 | RNF-028 | Regressão completa (AC-001…AC-023 e ACs vigentes) aprovada com Dev Mode ligado e desligado. |

## 10. Tarefas futuras
IDs conforme o prompt de origem. Quando a sprint for agendada, recebem também o prefixo da sprint
(padrão `TNN-XX`, ex.: S07 → `T07-01…T07-10`), sem renumerar as sprints existentes.
| Tarefa | Descrição | Cobre |
|---|---|---|
| TASK-01 | Registro declarativo de componentes inspecionáveis | RF-034 |
| TASK-02 | Gerador seguro de snippets no build | RNF-021, RNF-022, AC-030 |
| TASK-03 | Manifesto de componentes e metadados | RF-030, RNF-022, RNF-023 |
| TASK-04 | Interface de ativação e seleção visual | RF-027, RF-028, AC-024, AC-025 |
| TASK-05 | Painel técnico com abas | RF-029, RF-032, RF-033, AC-026, AC-033 |
| TASK-06 | Syntax highlighting e navegação entre arquivos | RF-030, RNF-025, AC-027 |
| TASK-07 | Links para GitHub vinculados ao commit publicado | RF-031, AC-028 |
| TASK-08 | Adaptação mobile, temas e internacionalização | RNF-025, AC-032 |
| TASK-09 | Acessibilidade e controle de interações conflitantes (WebGL, drag do carrossel) | RNF-024, RNF-026 |
| TASK-10 | Testes de regressão, segurança e performance | RNF-028, AC-029, AC-031, AC-034 |

## 11. Riscos
| ID | Risco | Nível | Mitigação |
|---|---|---|---|
| R-DM-01 | Escopo atraente atrasar o lançamento | Alto | Gate da seção 2; nada antes de S05 + autorização |
| R-DM-02 | Exposição de segredo ou arquivo não autorizado | Alto | Allowlist, validação de caminho, scanner de segredos, build fail-safe, revisão humana do manifesto |
| R-DM-03 | Código exibido divergir do publicado | Médio | SHA no manifesto + teste de hash (AC-027) |
| R-DM-04 | Peso do inspector/highlighter afetar Web Vitals | Médio | Highlight no build, chunk lazy, orçamento medido (RNF-020) |
| R-DM-05 | Conflito de eventos com canvas R3F, drag do carrossel ou Explore Mode | Médio | Modo de seleção exclusivo, overlay de seleção, testes dedicados (TASK-09) |
| R-DM-06 | Painel/overlay inacessível (foco preso ou perdido) | Médio | Padrões WAI-ARIA de diálogo/drawer, testes de teclado e leitor de tela |
| R-DM-07 | Repositório privado invalida links GitHub | Médio | Pré-condição do gate ou ocultar links (nunca apontar para 404) |
| R-DM-08 | Licença/autoria: repositórios públicos hoje não têm licença declarada; risco de exibir código de terceiros | Médio | Definir licença/termos de exibição; allowlist só com código autoral |
| R-DM-09 | Registro desatualizado após refactors | Baixo | Build falha se arquivo registrado não existir |
| R-DM-10 | Explicações técnicas imprecisas | Médio | Mesmo fluxo editorial `draft → approved` dos demais conteúdos |

## 12. Dependências
- MVP S00–S05 concluído; componentes-alvo existentes e estáveis (S01 hero, S02 carrossel, S03 timeline; S06 se houver).
- Sistemas de i18n (PT/EN/ES) e temas (Dark/Light) da S00; tokens Obsidian Orbit v0.1.
- Pipeline de CI com SHA do commit disponível no build; política de CSP vigente (ADR de segurança da S00).
- Repositório público e decisão de licença; fluxo editorial de conteúdo aprovado.

## 13. Decisões registradas
1. Feature aprovada conceitualmente; implementação **não autorizada** até o gate da seção 2.
2. Snapshots gerados no build a partir de allowlist; sem GitHub API em runtime.
3. Somente leitura; nenhum executor de código.
4. Carregamento sob demanda; custo zero com o modo desligado.
5. Sem redesenho: Obsidian Orbit v0.1 e decisões de S00–S06 permanecem inalteradas.
6. IDs alocados por adição: RF-027…RF-034, RNF-020…RNF-028, AC-024…AC-034, POC-006, TASK-01…TASK-10.
   `POC-005` não foi alocado por esta feature (permanece livre).
