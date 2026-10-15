"use client";
import { PROJECT_REQUEST, siteForProject } from "./sites";
export function ProjectNotebookButton({ slug, label }: { slug: string; label: string }) {
  if (!siteForProject(slug)) return null;
  return <button type="button" className="carousel-button js-only" onClick={() => {
    window.dispatchEvent(new CustomEvent(PROJECT_REQUEST, { detail: { slug } }));
  }}>{label} <span aria-hidden="true">↗</span></button>;
}
