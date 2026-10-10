import type { ContentStatus, LocalizedText } from "@/features/content/types";

/**
 * Thematic chapters from POC-003. They are editorial chapters, not dated positions: no companies,
 * roles or periods (those need confirmation and consent — S03, T03-01). Drafts until reviewed.
 */
export interface JourneyChapter {
  id: string;
  status: ContentStatus;
  label: LocalizedText;
  title: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  tags: readonly string[];
}

export const journeyChapters: readonly JourneyChapter[] = [
  {
    id: "foundations",
    status: "draft",
    label: { pt: "Fundamentos", en: "Foundations", es: "Fundamentos" },
    title: {
      pt: "Desenvolvimento Full Stack",
      en: "Full Stack development",
      es: "Desarrollo Full Stack",
    },
    summary: {
      pt: "React, APIs, arquitetura e sistemas",
      en: "React, APIs, architecture and systems",
      es: "React, APIs, arquitectura y sistemas",
    },
    description: {
      pt: "Aplicações Full Stack, arquitetura de interfaces, integração com APIs e desenvolvimento orientado a requisitos reais.",
      en: "Full Stack applications, interface architecture, API integration and development driven by real requirements.",
      es: "Aplicaciones Full Stack, arquitectura de interfaces, integración con APIs y desarrollo orientado a requisitos reales.",
    },
    tags: ["React", "TypeScript", ".NET"],
  },
  {
    id: "industrial-systems",
    status: "draft",
    label: { pt: "Sistemas industriais", en: "Industrial systems", es: "Sistemas industriales" },
    title: {
      pt: "Software para operações",
      en: "Software for operations",
      es: "Software para operaciones",
    },
    summary: {
      pt: "Integração e aplicações empresariais",
      en: "Integration and enterprise applications",
      es: "Integración y aplicaciones empresariales",
    },
    description: {
      pt: "Participação em soluções para operações e ambientes industriais, com sistemas corporativos, dashboards e integrações.",
      en: "Work on solutions for operations and industrial environments, with enterprise systems, dashboards and integrations.",
      es: "Participación en soluciones para operaciones y entornos industriales, con sistemas corporativos, dashboards e integraciones.",
    },
    tags: ["Angular", "C#", "SQL Server"],
  },
  {
    id: "creative-engineering",
    status: "draft",
    label: { pt: "Engenharia criativa", en: "Creative engineering", es: "Ingeniería creativa" },
    title: {
      pt: "3D e projetos próprios",
      en: "3D and personal projects",
      es: "3D y proyectos propios",
    },
    summary: {
      pt: "Interfaces, simulação e mundos digitais",
      en: "Interfaces, simulation and digital worlds",
      es: "Interfaces, simulación y mundos digitales",
    },
    description: {
      pt: "Aplicações interativas, interfaces complexas e experiências de exploração espacial com tecnologias web.",
      en: "Interactive applications, complex interfaces and space-exploration experiences built with web technologies.",
      es: "Aplicaciones interactivas, interfaces complejas y experiencias de exploración espacial con tecnologías web.",
    },
    tags: ["Three.js", "React", "Performance"],
  },
];
