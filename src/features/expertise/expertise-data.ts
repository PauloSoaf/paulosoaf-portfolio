import type { ContentStatus, LocalizedText } from "@/features/content/types";

/** Grouped by problem solved, not a wall of logos (S03, T03-06). Stack limited to known/public evidence. */
export interface ExpertiseGroup {
  id: string;
  status: ContentStatus;
  title: LocalizedText;
  problem: LocalizedText;
  tech: readonly string[];
}

export const expertiseGroups: readonly ExpertiseGroup[] = [
  {
    id: "product-interfaces",
    status: "draft",
    title: {
      pt: "Interfaces de produto",
      en: "Product interfaces",
      es: "Interfaces de producto",
    },
    problem: {
      pt: "Interfaces web claras, rápidas e acessíveis para sistemas com muitas regras.",
      en: "Clear, fast and accessible web interfaces for rule-heavy systems.",
      es: "Interfaces web claras, rápidas y accesibles para sistemas con muchas reglas.",
    },
    tech: ["React", "Angular", "TypeScript"],
  },
  {
    id: "systems-integration",
    status: "draft",
    title: {
      pt: "Sistemas e integrações",
      en: "Systems and integrations",
      es: "Sistemas e integraciones",
    },
    problem: {
      pt: "APIs, serviços e integrações que mantêm dados e processos conectados.",
      en: "APIs, services and integrations that keep data and processes connected.",
      es: "APIs, servicios e integraciones que mantienen datos y procesos conectados.",
    },
    tech: [".NET / C#", "Python", "Django REST Framework", "NestJS", "WebSockets"],
  },
  {
    id: "interactive-3d",
    status: "draft",
    title: {
      pt: "Experiências interativas e 3D",
      en: "Interactive and 3D experiences",
      es: "Experiencias interactivas y 3D",
    },
    problem: {
      pt: "Visualização 3D e interfaces exploráveis que rodam no navegador.",
      en: "3D visualization and explorable interfaces that run in the browser.",
      es: "Visualización 3D e interfaces explorables que funcionan en el navegador.",
    },
    tech: ["Three.js", "React Three Fiber"],
  },
];
