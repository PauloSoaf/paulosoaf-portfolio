import type { ContentStatus, LocalizedText } from "@/features/content/types";

/** information-architecture.md §5, "conforme disponibilidade": the owner must confirm each offer. */
export interface ServiceOffer {
  id: string;
  status: ContentStatus;
  title: LocalizedText;
  description: LocalizedText;
}

export const serviceOffers: readonly ServiceOffer[] = [
  {
    id: "premium-websites",
    status: "draft",
    title: {
      pt: "Sites com identidade própria",
      en: "Websites with their own identity",
      es: "Sitios con identidad propia",
    },
    description: {
      pt: "Sites e landing pages rápidos, acessíveis e com direção visual autoral.",
      en: "Fast, accessible websites and landing pages with a distinctive visual direction.",
      es: "Sitios y landing pages rápidos, accesibles y con dirección visual propia.",
    },
  },
  {
    id: "systems-integration",
    status: "draft",
    title: {
      pt: "Integração de sistemas",
      en: "Systems integration",
      es: "Integración de sistemas",
    },
    description: {
      pt: "Conexão entre APIs, plataformas e processos para reduzir trabalho manual.",
      en: "Connecting APIs, platforms and processes to reduce manual work.",
      es: "Conexión entre APIs, plataformas y procesos para reducir el trabajo manual.",
    },
  },
  {
    id: "custom-software",
    status: "draft",
    title: {
      pt: "Software sob medida",
      en: "Custom software",
      es: "Software a medida",
    },
    description: {
      pt: "Aplicações web Full Stack desenhadas a partir do problema do seu negócio.",
      en: "Full Stack web applications designed around your business problem.",
      es: "Aplicaciones web Full Stack diseñadas a partir del problema de tu negocio.",
    },
  },
  {
    id: "maintenance",
    status: "draft",
    title: {
      pt: "Manutenção e evolução",
      en: "Maintenance and evolution",
      es: "Mantenimiento y evolución",
    },
    description: {
      pt: "Correções, melhorias e modernização gradual de sistemas existentes.",
      en: "Fixes, improvements and gradual modernization of existing systems.",
      es: "Correcciones, mejoras y modernización gradual de sistemas existentes.",
    },
  },
];
