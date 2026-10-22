"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { Project } from "./project-types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { createProjectPlayback } from "./project-playback";

/** Only display fields from the already-filtered server catalog cross this boundary. */
export type PlaybackProject = Pick<Project, "slug" | "title" | "kind" | "status" | "summary" | "image" | "art">;
const ProjectPlaybackContext = createContext<{
  store: ReturnType<typeof createProjectPlayback>; projects: readonly PlaybackProject[];
  labels: Pick<Dictionary, "carousel" | "projects" | "editorial">;
} | null>(null);

export function ProjectPlaybackProvider({ projects, labels, children }: {
  projects: readonly PlaybackProject[]; labels: Pick<Dictionary, "carousel" | "projects" | "editorial">; children: ReactNode;
}) {
  const [store] = useState(createProjectPlayback);
  return <ProjectPlaybackContext value={{ store, projects, labels }}>{children}</ProjectPlaybackContext>;
}
export const useProjectPlayback = () => useContext(ProjectPlaybackContext);
