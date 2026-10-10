# ADDENDUM-001 — Internacionalização (PT/EN/ES) e temas Dark/Light

**Projeto:** `paulo_soaf`  
**Baseline obrigatória:** Obsidian Orbit **v0.1**, contida em `paulo_soaf_obsidian_orbit_specs_pocs_v01.zip`  
**Status:** requisito complementar aprovado para planejamento/implementação  
**Natureza:** aditivo, não redesign, não substitui as specs originais  
**Prioridade:** P0 para idiomas e alternância de tema; não depender de features pós-MVP

> **LEIA PRIMEIRO, CLAUDE:** este documento adiciona **português brasileiro, inglês, espanhol e dois temas** ao projeto já especificado na v0.1. **Não use o pacote v0.2 como baseline visual.** Ele foi rejeitado por deslocar a estética para tons verdes excessivos. **Não redesenhe** hero, projeto, carrossel, timeline, identidade espacial, layout, motion ou arquitetura de renderização. Implemente estas funcionalidades com a menor mudança visual possível.

---

## 1. Escopo e invariantes

### 1.1 Objetivo

Permitir que qualquer visitante:

1. Escolha entre **PT-BR, EN e ES**.
2. Escolha entre **Dark e Light** a qualquer momento.
3. Navegue pela home, projetos, estudos de caso, timeline, serviços e contato sem perder as escolhas ao trocar de página ou atualizar a aba.
4. Tenha o mesmo conteúdo verificável, CTAs, interações e identidade Obsidian Orbit em todas as **6 combinações** de idioma/tema.

### 1.2 Não negociável: preservar o visual da v0.1

- O **Dark original é a referência visual principal**, não o tema esverdeado do pacote v0.2.
- Conservar **exatamente** os tokens-base da v0.1 descritos em `specs/01-design/design-system.md` e `assets/design-tokens.json` para o dark.
- Manter o verde-água **somente como acento** em CTAs pontuais, elementos ativos, foco e pequenos highlights; não criar grandes blocos ou overlays verdes.
- Não colorir todas as palavras de destaque, ícones, cartões e cenas com verde. A hierarquia é estabelecida sobretudo por **branco, grafite, espaço, tipografia e iluminação**.
- Preservar composição, tipografia, hierarquia, parallax restrito, fallback SVG e cenas WebGL da POC-001; preservar carrossel POC-002 e timeline POC-003.
- O **Light deve ser um tema neutro** derivado da mesma linguagem editorial: superfícies claras, textos grafite e destaques discretos. Não é outra marca nem um segundo conceito criativo.
- Manter responsividade e acessibilidade. Nenhum novo seletor pode cobrir os CTAs do hero ou causar overflow no header mobile.
- O modo de exploração 3D continua opcional, conforme S06. Não antecipá-lo em função deste adendo.
- **Não alterar o repositório e as specs originais em massa**; criar somente arquivos e pequenas alterações necessárias para suportar idioma/tema. Modificações em conteúdo e design existentes devem ser justificadas.

---

## 2. Design system: extensão de tema

### 2.1 Dark (inalterado: tokens oficiais da v0.1)

| Token semântico | Valor **imutável** | Função |
|---|---|---|
| `bg.base` | `#090D11` | Fundo principal |
| `bg.surface` | `#141B20` | Cards, navegação |
| `bg.elevated` | `#233038` | Superfícies elevadas |
| `fg.primary` | `#F2F6F4` | Títulos e texto principal |
| `fg.secondary` | `#A9B6B9` | Texto de apoio |
| `accent.primary` | `#65E6C3` | Destaques **pontuais** |
| `accent.secondary` | `#8A9CFF` | Efeitos secundários raros |
| `border.subtle` | `#2B383D` | Separadores |
| `status.error` | `#FF8B83` | Erros |

A tabela acima reproduz a direção original. **Não retocar o dark** para combinar com o light. Os tokens de interface adicionais (hover, focus, selected, muted etc.) devem ser **derivados** desses valores e verificados quanto a contraste.

### 2.2 Light (proposta derivada, validável pela POC)

| Token semântico | Valor sugerido | Função |
|---|---|---|
| `bg.base` | `#F7F8FA` | Fundo neutro levemente frio |
| `bg.surface` | `#FFFFFF` | Cards e header |
| `bg.elevated` | `#EBEFF2` | Elevação e áreas secundárias |
| `fg.primary` | `#172027` | Texto/títulos grafite |
| `fg.secondary` | `#53616B` | Texto de apoio |
| `accent.primary` | `#176B63` | Links/estados ativos com contraste sobre claro |
| `accent.secondary` | `#5568B8` | Pequenos detalhes alternativos |
| `border.subtle` | `#D7DFE3` | Bordas |
| `status.error` | `#B4232B` | Erros |

**Observação:** os valores Light são **ponto de partida**, não autorização para modificar os valores Dark. Ajustes finos são permitidos apenas no light se testes de contraste exigirem. Preferir um tom teal **escuro e discreto** como acento de interface, nunca pintar grandes superfícies de verde.

### 2.3 Regras de aplicação

- Fundos e cards devem usar variáveis semânticas, **nunca cores hardcoded** duplicadas por componente.
- Botões: primário dark com acento original, e primário light com texto branco sobre acento escuro ou preenchimento grafite, conforme contraste. Não reutilizar `#65E6C3` para texto pequeno sobre fundo branco.
- Links em ambos temas têm estados hover/focus/visited distinguíveis por **mais que cor** quando necessário (underline, borda, ícone ou mudança de peso).
- Ícones e efeitos do hero permanecem predominantemente **neutros**. Destaques iluminados em teal/azul ficam sutis no light, sem banho verde.
- Sombras, gradientes, imagens e SVGs devem funcionar em ambos temas; se houver versões da ilustração, mantê-las com os mesmos enquadramento, forma e semântica.
- Nunca usar `filter: invert(1)` para criar o light.
- `color-scheme: dark|light` acompanha o tema, inclusive controles nativos.
- Verificar contraste de texto, ações, contornos e indicadores com **WCAG 2.2 AA** como meta; não afirmar conformidade só por usar uma paleta proposta.

### 2.4 Tokens CSS, ilustração de estrutura (não patch obrigatório)

```css
:root,
[data-theme="dark"] {
  color-scheme: dark;
  --color-background: #090D11;
  --color-surface: #141B20;
  --color-elevated: #233038;
  --color-text: #F2F6F4;
  --color-text-muted: #A9B6B9;
  --color-accent: #65E6C3;
  --color-accent-secondary: #8A9CFF;
  --color-border: #2B383D;
  --color-error: #FF8B83;
}

[data-theme="light"] {
  color-scheme: light;
  --color-background: #F7F8FA;
  --color-surface: #FFFFFF;
  --color-elevated: #EBEFF2;
  --color-text: #172027;
  --color-text-muted: #53616B;
  --color-accent: #176B63;
  --color-accent-secondary: #5568B8;
  --color-border: #D7DFE3;
  --color-error: #B4232B;
}
```

Usar nomenclatura compatível com os tokens reais da aplicação. Se já houver convenção distinta, **mapear em vez de duplicar**.

---

## 3. Internacionalização (i18n)

### 3.1 Idiomas e rotas

- Idiomas suportados: `pt` (**Português brasileiro, `pt-BR`**), `en` (**English**) e `es` (**Español**).
- URLs canônicas sugeridas: `/pt`, `/en`, `/es` e `/pt/projects/[slug]`, `/en/projects/[slug]`, `/es/projects/[slug]`.
- Conservar os **slugs técnicos estáveis** entre idiomas, salvo decisão explícita de arquitetura. Não duplicar cases por mudança de texto.
- Manter parâmetro de hash/âncora quando possível ao trocar idioma (`#projects`, `#about`, etc.).
- A URL deve ser a fonte de verdade para o idioma daquela página. Um cookie `locale` pode guardar a escolha **para futuras entradas em `/`**, mas não pode sobrescrever uma URL `/en/...` digitada ou compartilhada.
- Para a rota `/`, aplicar resolução definida e documentada: primeiro preferência explícita salva, depois `Accept-Language` se viável na estratégia de deploy, por fim `pt`. Se a hospedagem não permitir redirecionamento por cabeçalhos/cookies (por exemplo export estático), manter `/` com redirecionamento determinístico para `/pt`, registrando a limitação em ADR.
- Trocar tema **não muda idioma/rota**. Trocar idioma **não muda o tema**.

### 3.2 Localização completa, não só header

Localizar todos os textos de produto: hero, navegação, CTAs, carrossel, descrições, labels, `aria-label`, `alt`, mensagens de fallback/erro, seção de serviços, timeline, cases, metadados SEO, páginas 404, botões do Explore Mode, nome de arquivos de currículo quando existirem.

Exceções razoáveis: nomes próprios, marcas, nomes técnicos de frameworks/bibliotecas, URLs e outros termos que não devem ser traduzidos. Datas, meses e números visíveis devem usar `Intl.DateTimeFormat`/`Intl.NumberFormat` com locale adequado quando necessário.

### 3.3 Dicionários tipados

Estrutura sugestiva, compatível com a arquitetura v0.1:

```text
src/
  i18n/
    config.ts
    dictionaries/
      pt.ts
      en.ts
      es.ts
    get-dictionary.ts
  app/
    [locale]/
      layout.tsx
      page.tsx
      projects/[slug]/page.tsx
```

Usar **as mesmas chaves** nos três idiomas e validação automática de ausência de traduções. O HTML deve declarar `lang="pt-BR"`, `lang="en"` ou `lang="es"` conforme a rota.

Estruturas de conteúdo localizadas existentes devem passar de `Locale = 'pt' | 'en'` para `Locale = 'pt' | 'en' | 'es'`, preservando a validação editorial de casos e referências. Nenhum projeto `approved` pode ir a produção com conteúdo incompleto em algum dos três idiomas. As traduções geradas por IA são **rascunhos** até revisão de termos, dados e naturalidade.

### 3.4 SEO por idioma

- `title` e `description` correspondentes ao idioma.
- `canonical` específico da versão localizada.
- `hreflang` recíproco `pt-BR`, `en`, `es` e `x-default` coerente com a estratégia da raiz.
- Open Graph e sitemap corretos para as páginas traduzidas.
- Sem duplicações artificiais que façam páginas diferentes partilharem `canonical` indevido.
- URLs compartilhadas devem abrir **naquele idioma**, independentemente de cookie salvo.

---

## 4. Seletor de tema e de idioma: comportamento e UX

### 4.1 Posição e aparência

- Incluir os dois seletores **discretamente no SiteHeader existente**, sem reestruturar a navegação v0.1.
- Idioma: botão compacto como `PT ▾`, `EN ▾`, `ES ▾` ou seleção acessível, **sem bandeiras** (idioma não equivale a nacionalidade).
- Tema: botão com ícone Lua/Sol e label acessível (`Ativar tema claro` / `Ativar tema escuro`, traduzido).
- Desktop: alinhamento com controles do header existente, respeitando espaçamentos/tipografia v0.1.
- Mobile: os dois controles podem ficar em uma linha no menu expansível; não reduzir click targets nem esconder contato/projetos.
- Focus ring visível em ambos temas; estado `aria-expanded`/`aria-checked` conforme o padrão escolhido.
- Nunca abrir vários menus sobrepostos nem quebrar Escape, Tab e retorno de foco.

### 4.2 Estado inicial e persistência

- **Dark é o tema padrão da primeira visita**, porque corresponde ao Obsidian Orbit v0.1. A escolha manual por Light prevalece nas próximas páginas e visitas.
- Persistir tema manual (`dark`/`light`) de preferência por **cookie** quando houver SSR, para renderizar `<html data-theme="...">` já na resposta e evitar flash de tema incorreto. Em estratégia estática, prever fallback seguro e documentar como prevenir FOUC dentro da CSP adotada.
- Persistir idioma explícito para entradas futuras no site; a URL localizada sempre tem prioridade.
- Ler somente valores permitidos (`dark`/`light`, `pt`/`en`/`es`) e ignorar valores inválidos de armazenamento.
- A atualização de tema não deve remontar/zerar timeline, carrossel, posição do scroll ou estado de controles, salvo necessidade técnica fundamentada.
- Não exigir login, backend de usuário, banco de dados ou serviço de terceiros para preferências.

### 4.3 Estados obrigatórios

| Estado | Idioma | Tema | Resultado esperado |
|---|---|---|---|
| Primeira visita `/pt` | PT | Dark | UI Obsidian Orbit original; controles legíveis |
| Alternar idioma `pt→en→es` | EN/ES | Mesmo tema | Conteúdo, metadados e acessibilidade no idioma selecionado |
| Alternar `dark→light` | Mesmo idioma | Light | Mudam só tokens/mídia dependentes do tema; não muda geometria/layout |
| Recarregar | Preservado | Preservado | Sem reverter escolha nem flash de tema incorreto em SSR |
| Abrir link direto `/es/projects/slug` | ES | Tema salvo ou Dark | Página específica em ES; nenhuma reescrita para outro idioma |
| JavaScript desativado | Idioma da URL | Dark ou tema SSR resolvido | Conteúdo navegável; links de idiomas continuam acessíveis |
| `prefers-reduced-motion` | Qualquer | Qualquer | Nenhuma transição de tema agressiva; acesso igual ao conteúdo |
| WebGL falha | Qualquer | Qualquer | Fallback coerente com tema e texto acessível |
| Mobile 360px | Qualquer | Qualquer | Header/menu sem overflow; dois controles utilizáveis |

---

## 5. Especificações de comportamento por componente

| Componente | Extensão requerida | O que preservar da v0.1 |
|---|---|---|
| `SiteHeader` | Locale switch + theme toggle discretos, teclado/ARIA | Dimensões, hierarquia, CTA e menu mobile |
| `HeroEditorial` | Títulos e CTAs localizados; tokens semânticos | Conteúdo editorial em primeiro plano, mesmo layout |
| `HeroCanvas` / `HeroFallback` | Luz/material ou SVG compatíveis com light | Geometria, ideia de universo procedural, timing e enquadramento |
| `ProjectCarousel` | Textos traduzidos; botões/labels localizados; superfícies temáticas | Swipe, autoplay pausável, transição, estados e teclado |
| `ExperienceTimeline` | Cargos/descrições localizados; cores de linhas/cards | Ordem, revelação por scroll e alternativa linear |
| `ProjectCase` | Conteúdo, metadados e imagens com alt localizado | Slugs, links verificados e gate `approved` |
| `Services` / `Contact` | Descrições, CTA, acessibilidade | Posicionamento comercial e canais reais |
| `ExploreMode` | Labels + contraste/fallback, quando vier S06 | Opcionalidade e saída fácil; não implementar agora |

### 5.1 Sobre a cena 3D no tema Light

A principal fonte de regressão visual no pacote rejeitado foi **o excesso de verde**. Portanto:

- **Não transformar o planeta/objeto procedural em uma esfera verde brilhante**.
- Preservar material e linguagem **grafite, cinza-azulado, profundidade, rim light contida** da POC original.
- No Light, ajustar **exposição, contraste, plano de fundo e cor da iluminação** para manter a forma legível, sem fundos esverdeados nem glow saturado.
- Evitar trocar câmeras, layout do hero, velocidade de rotação ou quantidade de objetos ao trocar de tema.
- Deixar o canvas decorativo e sujeito ao fallback; se a adaptação de luz for custosa, usar temporariamente um SVG estático light mantendo geometria e composição.
- O tema não altera a semântica nem a funcionalidade de nenhum projeto apresentado.

---

## 6. Novos requisitos rastreáveis (adicionar, não renumerar)

### 6.1 Requisitos funcionais

| ID | Prioridade | Descrição |
|---|---|---|
| `RF-021` | P0 | Fornecer três idiomas: PT-BR, EN e ES em todas as rotas públicas do MVP. |
| `RF-022` | P0 | Permitir troca explícita de idioma pelo header preservando a rota equivalente e o tema. |
| `RF-023` | P0 | Permitir alternância Dark/Light em todas as páginas, sem alterar a composição Obsidian Orbit. |
| `RF-024` | P0 | Persistir preferência de tema e preferência de idioma sem autenticação. |
| `RF-025` | P0 | Localizar textos, ações, mensagens, labels/alt/ARIA e metadados SEO nas três versões. |
| `RF-026` | P1 | Adaptar arte/fallback/estados interativos aos dois temas sem bloquear conteúdo. |

**Atualização de RF-009 existente:** estender de PT-BR/EN para **PT-BR/EN/ES**, mantendo sua intenção original; não criar conflito de prioridades. **Atualização de RF-014:** metadados e hreflang para três idiomas.

### 6.2 Requisitos não funcionais

| ID | Prioridade | Descrição |
|---|---|---|
| `RNF-015` | P0 | Não ocorrer regressão visual material no dark comparado à v0.1, especialmente na cor de fundo, composição e hero. |
| `RNF-016` | P0 | Testar acesso por teclado, foco, semântica, contraste e 200% zoom nos dois temas e três idiomas. |
| `RNF-017` | P0 | Evitar flash de tema incorreto na estratégia SSR adotada; documentar limitação caso deploy estático. |
| `RNF-018` | P0 | Dicionários consistentes, URL localizada e SEO/hreflang válidos; strings faltantes bloqueiam release. |
| `RNF-019` | P1 | Troca de preferências sem remount desnecessário, perda de seleção do carrossel, scroll ou excessos de JS. |

### 6.3 Critérios de aceite

| ID | Validação objetiva |
|---|---|
| `AC-017` | `/pt`, `/en`, `/es` carregam e `<html lang>` corresponde à rota. |
| `AC-018` | Em todas as 6 combinações PT/EN/ES × Dark/Light, header, hero, projects, timeline, cases e footer usam textos/cores adequados. |
| `AC-019` | Idioma e tema persistem em navegação/reload; abrir URL explícita não é sobrescrito por preferência. |
| `AC-020` | Screenshots da home/cases/carrossel dark mantêm fidelidade com os mockups da v0.1; light é editorial neutro e sem banho verde. |
| `AC-021` | Teclado, screen reader, zoom 200%, menu mobile e reduced-motion verificados para ambos seletores e temas. |
| `AC-022` | Tradução de mensagens, metadados, alt/ARIA e SEO por locale, sem chaves ausentes, falsos dados ou mistura indevida de idiomas. |
| `AC-023` | Falha de WebGL e indisponibilidade de JS não impedem conteúdo e navegação por links de idioma. |

---

## 7. Tasks de sprint (distribuir na estrutura existente)

**Não criar sprint que exija refazer toda a interface.** Integrar conforme dependências do projeto.

### S00 — Fundação (antes dos componentes)

- `T00-i18n-01`: adicionar `es` à tipagem e estrutura de dicionários; definir estratégia `/pt`, `/en`, `/es` e fallback da raiz; preparar `html lang`.
- `T00-theme-01`: migrar cores hardcoded relevantes para tokens semânticos **sem alterar Dark**; adicionar valores Light sob `[data-theme="light"]`.
- `T00-theme-02`: implementar provider/controle mínimo para tema, preferências e aplicação antes do primeiro paint quando viável.
- `T00-header-01`: adicionar seletores ao header responsivo com suporte teclado, menu e ARIA.
- `T00-regression-01`: capturar baseline dark e fazer comparação visual com a v0.1 antes de seguir.

### S01 — Hero procedural

- `T01-translate-01`: hero e CTAs PT/EN/ES.
- `T01-theme-01`: fallback SVG e cena WebGL nos dois temas, preservando composição/luzes originais no dark.
- `T01-test-01`: inspecionar hero 360px/1440px em 6 combinações; GPU indisponível; reduced-motion.

### S02 — Carrossel

- `T02-translate-01`: textos do case, comandos, navegação e labels em três idiomas.
- `T02-theme-01`: tokens Light para cards, bordas e indicadores sem colorir fundo com verde.
- `T02-test-01`: autoplay, pause, drag, foco, setas e persistência da seleção após alternância de tema.

### S03 — About & Timeline

- `T03-translate-01`: experiências e datas nos três idiomas, com revisão editorial.
- `T03-theme-01`: linhas, cards e estados de timeline em Light sem refazer layout.
- `T03-test-01`: linearização sem JS, mobile e teclado em cada combinação.

### S04 — Cases, Serviços e Conversão

- `T04-translate-01`: conteúdo aprovado de cases, serviços, contatos e CV quando disponível.
- `T04-seo-01`: metadata/canonical/hreflang/sitemap por idioma; 404s consistentes.
- `T04-test-01`: links diretos a cases e troca de idioma preservando slug.

### S05 — Hardening / Release

- `T05-matrix-01`: executar suíte 6 combinações × viewports prioritários, com comparação dark v0.1.
- `T05-a11y-01`: auditar contraste WCAG, teclado, foco, menus e reduced-motion.
- `T05-l10n-01`: validar ausência de chaves, tradução revisada e metadata.
- `T05-regression-01`: executar os ACs originais (001–016) e novos (017–023); gerar relatório de diferenças.

**S06 (Explore Mode):** fora da execução atual, apenas preparar mensagens e suporte temático no contrato de componentes futuros.

---

## 8. Plano de testes / matriz de regressão

### 8.1 Combinações obrigatórias

| Locale | Dark | Light |
|---|---|---|
| `pt` | ✓ | ✓ |
| `en` | ✓ | ✓ |
| `es` | ✓ | ✓ |

Executar home e pelo menos um case real aprovado em todas as combinações. Testar no mínimo **360, 390, 768, 1024 e 1440 px** nas fases previstas. Capturar screenshots na mesma viewport/estado para comparação.

### 8.2 Unitários e integração

1. Resolver locale de rota, idioma inválido e prioridade de URL.
2. Resolver tema ausente/inválido, persistência e toggle repetido.
3. Validar igualdade de chaves `pt/en/es`; falhar build para traduções obrigatórias ausentes.
4. Testar textos `aria-label`, `alt`, textos de botões e metadata.
5. Testar dicionário de project cards/cases com status `approved`.
6. Testar o `ThemeToggle` e o `LanguageSwitch` sem perder foco indevidamente.

### 8.3 E2E críticos

```gherkin
Cenário: o usuário mantém tema ao trocar idioma
  Dado que estou em /pt com tema Dark
  Quando ativo o Light e seleciono English
  Então navego para /en
  E o conteúdo aparece em inglês
  E o tema permanece Light
  E os CTAs e projetos continuam acessíveis

Cenário: URL compartilhada prevalece sobre idioma salvo
  Dado que salvei português como idioma preferido
  Quando abro diretamente /es/projects/dr-manaus
  Então o conteúdo desse projeto aparece em espanhol
  E o site não me redireciona para /pt

Cenário: tema original não sofreu redesign
  Dado que acesso /pt em Dark
  Então os tokens escuros da v0.1 permanecem idênticos
  E hero, carrossel e timeline seguem os layouts de referência
  E nenhuma superfície grande assume um verde saturado

Cenário: o header funciona em mobile
  Dado que acesso /en a 360px
  Quando abro o menu, mudo para Español e ativo Dark
  Então o menu e o foco continuam funcionais
  E não há overflow horizontal
  E os CTAs do hero permanecem alcançáveis
```

### 8.4 Evidências e gates

- Capturas antes/depois da v0.1 **Dark** como baseline visual.
- Capturas Light nas mesmas viewports e estados, sem substituírem o baseline Dark.
- Log de lint, typecheck, testes unitários, build, E2E e testes de acessibilidade realizados.
- Se tiver diferenças na composição original, registrar em changelog/ADR e **solicitar revisão**, em vez de considerar mudança aprovada silenciosamente.
- Não declarar concluído se faltar qualquer idioma, houver regressão no Dark, falhar seleção por teclado ou o site apresentar textos de chave/placeholder em produção.

---

## 9. Orientações diretas para Claude (execução)

> Implementar SOMENTE a extensão deste `ADDENDUM-001` por cima das especificações Obsidian Orbit **v0.1**. O usuário rejeitou a direção visual v0.2 porque ficou verde demais. Não usar tokens, screenshots ou mockups da v0.2 como verdade visual. Preservar os tokens Dark originais, hero procedural, carrossel cinematográfico, timeline interativa, efeitos e composição. Acrescentar idioma espanhol ao PT/EN já planejado e tema Light realmente neutro. Não adicionar novas dependências de i18n ou tema sem explicar por que a arquitetura simples existente não atende. Seguir as sprints atuais, adicionar testes e registrar regressões. Não editar funcionalidades fora do escopo. Não fazer commit/push/deploy sem autorização explícita.

**Antes de codificar, retornar:**

1. Quais arquivos da v0.1 serão afetados e quais novos serão criados.
2. Se o projeto já tem `pt/en` e quais strings ainda não estão localizadas.
3. Como as preferências serão persistidas **sem hydration mismatch ou flash** considerando a hospedagem atual.
4. Como garantir que a identidade Dark não mude e que a POC Light tenha aspecto branco/grafite, não verde.
5. Quais testes serão criados para `RF-021..026`, `RNF-015..019` e `AC-017..023`.

**Depois de codificar, entregar:** arquivos alterados, tarefas e RF/RNF/AC atendidos, testes e resultados, screenshots comparativos Dark/Light e limites conhecidos. **Não incluir fake demos, textos corporativos sigilosos ou métricas inventadas.**

---

## 10. Instalação do adendo

1. Copie este arquivo para `specs/06-addenda/ADDENDUM-001-i18n-themes.md` no **repositório baseado na v0.1**.
2. Instrua Claude a lê-lo **após** `specs/01-design/design-system.md` e **antes** da sprint que executará.
3. Atualize matrizes RF/RNF/AC e checklist das sprints **somente por adição**, evitando apagar requisitos anteriores.
4. Implemente progressivamente e compare sempre a versão Dark com os mockups originais.

**Decisão registrada:** identidade visual Obsidian Orbit v0.1 preservada; idiomas PT-BR/EN/ES; temas Dark/Light; Dark padrão; Light neutro editorial; sem redesign.












Leia specs/06-addenda/ADDENDUM-001-i18n-themes.md e incorpore seus requisitos às sprints existentes. Preserve integralmente a identidade Obsidian Orbit v0.1. Não utilize a v0.2 como referência visual. Implemente os três idiomas e dois temas sem redesenhar o projeto, mantendo as funcionalidades existentes e executando os testes de regressão.