# Modelo de conteúdo e tipos

```ts
type Locale = 'pt' | 'en';
type ContentStatus = 'draft' | 'review' | 'approved';

type LocalizedText = Record<Locale, string>;
type ExternalLink = { label: string; href: string; verifiedAt: string };

type Project = {
  slug: string;
  title: string;
  status: ContentStatus;
  categories: ('3d' | 'web' | 'fullstack' | 'games' | 'academic')[];
  summary: LocalizedText;
  challenge: LocalizedText;
  contribution: LocalizedText;
  tech: string[];
  image: { src: string; alt: LocalizedText; width: number; height: number };
  repository?: ExternalLink;
  demo?: ExternalLink; // só se verificado
  teamCredits?: string[];
  publicEvidence?: string[];
};

type Experience = {
  id: string;
  company: string;
  role: LocalizedText;
  period: { start: string; end?: string }; // YYYY-MM
  description: LocalizedText;
  publishApproved: boolean;
};
```

## Política de build
- Lista de projetos publicada usa `status === 'approved'`.
- Exigir slug único, conteúdo PT/EN não vazio, imagem existente, URL `https:` válida quando presente.
- Repositório GitHub público pode estar verificado, mas demos externas precisam ser testadas separadamente.
- Experiências profissionais só entram com `publishApproved=true`; ocultar detalhes e materiais que dependam de consentimento.
- Não embutir mock em dados de produção: POCs são arquivo separado em `pocs/`.

## Seed de conteúdo candidato
`Dr-Manaus` (arte 3D), `IoT-devices-manager` (Full Stack), `ChessInReact` (jogo), `game-hub` (a revisar), `gol-na-hora` (protótipo acadêmico). Validação de autoria, versão, stack e demo é tarefa editorial de S00/S03.
