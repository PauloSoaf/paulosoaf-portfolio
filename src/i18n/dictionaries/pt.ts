/**
 * Fonte de verdade das chaves de interface. `en` e `es` são tipados como `Dictionary`,
 * então chaves ausentes ou extras quebram o typecheck (RNF-018).
 * Textos em caixa normal: o CSS aplica uppercase onde o design pede (melhor para leitores de tela).
 */
export const pt = {
  meta: {
    title: "Paulo Soaf — Engenheiro Full Stack",
    description:
      "Portfólio de Paulo Soaf: engenharia de software Full Stack, sistemas robustos e experiências digitais.",
    notFoundTitle: "Página não encontrada — Paulo Soaf",
  },
  a11y: {
    skipToContent: "Pular para o conteúdo",
    home: "Paulo Soaf — página inicial",
    primaryNav: "Navegação principal",
    footerNav: "Navegação do rodapé",
    language: "Idioma",
    newTab: "abre em nova aba",
  },
  nav: {
    work: "Projetos",
    about: "Sobre",
    expertise: "Especialidades",
    services: "Serviços",
    contact: "Contato",
    menu: "Menu",
    headerCta: "Fale comigo",
  },
  theme: {
    toLight: "Ativar tema claro",
    toDark: "Ativar tema escuro",
  },
  hero: {
    titleLead: "Engenharia",
    titleEmphasis: "do inesperado.",
    summary:
      "Transformo problemas complexos em sistemas robustos, interfaces intuitivas e experiências digitais que as pessoas querem explorar.",
    ctaProjects: "Explorar projetos",
    ctaContact: "Entrar em contato",
    signature: "Paulo_Soaf / Desde 2026",
    scrollHint: "Role para explorar",
  },
  heroScene: {
    pause: "Pausar movimento", resume: "Retomar movimento", staticArt: "Usar arte estática",
    enable: "Ativar arte 3D", reduced: "Movimento reduzido ativo",
    exploreLeft: "Explorar objeto à esquerda", exploreRight: "Explorar objeto à direita", hint: "Arraste na horizontal para explorar",
  },
  sections: {
    work: {
      kicker: "01 / Projetos selecionados",
      titleLead: "Projetos em",
      titleEmphasis: "destaque.",
      description:
        "Construindo desde aplicações em tempo real até mundos digitais. Projetos reais, apresentados com contexto e profundidade.",
    },
    about: {
      kicker: "02 / Trajetória",
      titleLead: "Mais que",
      titleEmphasis: "código.",
      description:
        "Da engenharia de software corporativo à computação gráfica. Uma jornada orientada por sistemas que funcionam e experiências que fazem sentido.",
    },
    expertise: {
      kicker: "03 / Especialidades",
      titleLead: "Problemas que",
      titleEmphasis: "resolvo.",
      description:
        "Competências agrupadas pelo tipo de problema que resolvem, com a stack técnica de cada frente.",
    },
    services: {
      kicker: "04 / Serviços",
      titleLead: "Vamos construir",
      titleEmphasis: "juntos.",
      description:
        "Para empresas e pessoas que precisam de software confiável, integrações bem feitas ou uma presença digital marcante.",
    },
    contact: {
      kicker: "05 / Contato",
      titleLead: "Vamos",
      titleEmphasis: "conversar.",
      description: "Para oportunidades, projetos ou parcerias, escolha o canal mais conveniente.",
    },
  },
  carousel: {
    role: "carrossel",
    slide: "slide",
    previous: "Projeto anterior",
    next: "Próximo projeto",
    pause: "Pausar reprodução automática",
    play: "Reproduzir automaticamente",
    position: "{index} de {total}",
    hint: "Arraste ou use as setas",
    playing: "Reprodução automática · 7 s",
    suspended: "Reprodução suspensa",
    paused: "Reprodução pausada",
    reduced: "Movimento reduzido · reprodução manual",
    single: "Projeto selecionado",
    countdown: "Próximo projeto em {seconds} segundos",
    countdownPaused: "Contagem pausada: {seconds} segundos restantes",
    selectProject: "Selecionar projeto: {title}",
  },
  projects: {
    conceptArt: "Arte conceitual · não é captura do projeto",
    stackPending: "Stack em verificação",
    demo: "Abrir aplicação",
    demoLabel: "Abrir aplicação de {title}",
    case: "Ver estudo de caso",
    kinds: {
      "commercial-product": "Produto comercial",
      "professional-website": "Website profissional",
      "open-source": "Open source",
      "enterprise-application": "Aplicação empresarial",
      "technical-experiment": "Experimento técnico",
      "academic-project": "Projeto acadêmico",
    },
    sourceCode: "Código",
    sourceCodeLabel: "Código de {title} no GitHub",
    fallbackTitle: "Estudos de caso em preparação.",
    fallbackText:
      "Os projetos estão em revisão editorial. Enquanto isso, os repositórios públicos estão disponíveis no GitHub.",
    teamCredits: "Projeto em equipe com {names}.",
    fallbackCta: "Ver repositórios no GitHub",
    categories: {
      "3d": "3D",
      web: "Web",
      fullstack: "Full Stack",
      games: "Jogos",
      academic: "Acadêmico",
    },
  },
  journey: {
    navigation: "Capítulos da trajetória",
    position: "Capítulo {index} / {total}",
    followScroll: "Acompanhar a rolagem",
    chapter: "Capítulo {index}",
    tagsLabel: "Tecnologias",
  },
  expertise: {
    techLabel: "Tecnologias",
  },
  services: {
    cta: "Conversar sobre um projeto",
  },
  contact: {
    channels: {
      email: "E-mail",
      linkedin: "LinkedIn",
      github: "GitHub",
      cv: "Currículo",
    },
  },
  editorial: {
    banner:
      "Prévia editorial — este ambiente exibe rascunhos. Itens marcados não entram no build de produção.",
    status: {
      draft: "Rascunho",
      review: "Em revisão",
      approved: "Aprovado",
    },
    sectionPending: "O conteúdo desta seção aguarda aprovação editorial.",
    channelPending: "{channel}: pendente de validação editorial — não publicado.",
  },
  footer: {
    tagline: "Engenharia, produto e experiências digitais.",
    languages: "Idiomas",
    copyright: "© {year} Paulo Soaf. Todos os direitos reservados.",
    backToTop: "Voltar ao topo",
  },
  notFound: {
    kicker: "Erro 404",
    titleLead: "Página não",
    titleEmphasis: "encontrada.",
    description:
      "O endereço pode ter mudado ou não existe. Use os atalhos abaixo para continuar navegando.",
    toWork: "Ver projetos",
    toHome: "Ir para o início",
  },
};

export type Dictionary = typeof pt;
