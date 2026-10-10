import type { Project } from "./project-types";

/** Sort a copy, preserving the catalog and editorial filter. Secondary projects stay available. */
export function orderProjects(items: readonly Project[]): Project[] {
  return [...items].sort((a, b) => (a.featuredOrder ?? Infinity) - (b.featuredOrder ?? Infinity));
}

export function publicRepository(project: Project) {
  return project.sourceVisibility === "public" ? project.repository : undefined;
}
