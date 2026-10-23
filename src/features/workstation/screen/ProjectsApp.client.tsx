"use client";
import { useEffect, useRef, useSyncExternalStore, type Dispatch } from "react";
import type { Locale } from "@/i18n/config";
import { format } from "@/i18n/format";
import { CommercialPreview } from "./CommercialPreview.client";
import { CarouselCountdown } from "@/components/carousel/CarouselCountdown.client";
import { useProjectPlayback } from "@/features/projects/ProjectPlaybackProvider.client";
import type { NotebookPointerController } from "../input/NotebookPointerController";
import type { WorkstationEvent } from "../state/workstation-machine";
import { canOpenSite, siteForProject, workstationSites, type WorkstationAccess } from "../sites";
import { workstationLabels } from "../labels";

export function ProjectsApp({ locale, pointer, dispatch, access, projected }: {
  locale: Locale; pointer: NotebookPointerController; dispatch: Dispatch<WorkstationEvent>; access: WorkstationAccess; projected: boolean;
}) {
  const playback = useProjectPlayback();
  return playback?.projects.length ? <ProjectScreen playback={playback} locale={locale} pointer={pointer} dispatch={dispatch} access={access} projected={projected} /> : null;
}

function ProjectScreen({ playback, locale, pointer, dispatch, access, projected }: {
  playback: NonNullable<ReturnType<typeof useProjectPlayback>>; locale: Locale; pointer: NotebookPointerController;
  dispatch: Dispatch<WorkstationEvent>; access: WorkstationAccess; projected: boolean;
}) {
  const { store, projects, labels } = playback;
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const root = useRef<HTMLDivElement>(null);
  const engagement = useRef({ hovered: false, focused: false });
  const project = projects[state.index] ?? projects[0]!;
  const candidate = siteForProject(project.slug);
  const site = candidate && canOpenSite(access, candidate) ? candidate : null;
  const text = workstationLabels[locale];
  const open = () => dispatch({ type: "FOCUS_SCREEN" });
  useEffect(() => {
    const unregister = [pointer.register("project-next", { click: () => store.send({ type: "next" }) }),
      pointer.register("project-previous", { click: () => store.send({ type: "previous" }) }),
      pointer.register("project-toggle", { click: () => { if (!state.reduced) store.send({ type: "toggle" }); } }),
      pointer.register("project-open", { click: () => dispatch({ type: "FOCUS_SCREEN" }) })];
    return () => unregister.forEach(fn => fn());
  }, [pointer, store, project.slug, access, dispatch, state.reduced]);
  useEffect(() => {
    const node = root.current; if (!node) return;
    let intersects = false;
    // The reducer restricts automatic entry to Work. A gallery explicitly opened from
    // Desktop is also a visible player, even while the page remains in the Hero.
    const sync = () => store.send({ type: "visible", value: intersects && getComputedStyle(node).visibility !== "hidden" });
    const observer = new IntersectionObserver(entries => { intersects = !!entries.at(-1)?.isIntersecting; sync(); }, { threshold: .1 });
    observer.observe(node);
    const host = node.closest("[data-workstation]");
    const visibility = new MutationObserver(sync);
    if (host) visibility.observe(host, { attributes: true, attributeFilter: ["data-project-reading"] });
    return () => { observer.disconnect(); visibility.disconnect(); store.send({ type: "visible", value: false }); };
  }, [store]);
  useEffect(() => () => store.send({ type: "engaged", value: false }), [store]);
  useEffect(() => {
    // Focusing a cross-origin document blurs the parent window, without bubbling its
    // inner events. Stop playback until an explicit restart so reading is never replaced.
    const blur = () => { if (root.current?.contains(document.activeElement) && document.activeElement?.tagName === "IFRAME" && store.getSnapshot().playing) store.send({ type: "toggle" }); };
    window.addEventListener("blur", blur);
    return () => window.removeEventListener("blur", blur);
  }, [store]);
  const engage = (kind: "hovered" | "focused", value: boolean) => {
    engagement.current[kind] = value;
    store.send({ type: "engaged", value: engagement.current.hovered || engagement.current.focused });
  };
  return <div ref={root} className="workbench-gallery" data-notebook-projects data-project={project.slug} data-selected-index={state.index} data-running={state.running}
    role="group" aria-roledescription={labels.carousel.role} aria-label={workstationLabels[locale].projects}
    onMouseEnter={() => engage("hovered", true)} onMouseLeave={() => engage("hovered", false)}
    onFocusCapture={() => engage("focused", true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) engage("focused", false); }}>
    <div className="workbench-project-address"><strong>{project.title}</strong>{site ? <a href={workstationSites[site].url} target="_blank" rel="noopener noreferrer" aria-label={text.external}>{new URL(workstationSites[site].url).hostname} ↗</a> : null}</div>
    <div className="workbench-gallery-stage" key={project.slug}>
      {site ? <CommercialPreview siteId={site} text={text} dispatch={dispatch} projected={projected} embedded /> : <div className="workbench-project-unavailable">
        <p className="workbench-kicker">{labels.projects.kinds[project.kind]}</p>
        <h2>{project.title}</h2><p>{project.summary[locale]}</p><p>{text.noDemo}</p>
        {project.repository ? <a href={project.repository.href} target="_blank" rel="noopener noreferrer">{text.repository} ↗</a> : null}
      </div>}
    </div>
    <div className="workbench-gallery-controls">
      <button type="button" data-input-action="project-toggle" disabled={state.reduced || !state.clock} onClick={() => store.send({ type: "toggle" })}>{state.playing ? labels.carousel.pause : labels.carousel.play}</button>
      <button type="button" data-input-action="project-previous" aria-label={labels.carousel.previous} onClick={() => store.send({ type: "previous" })}>←</button>
      <span>{format(labels.carousel.position, { index: state.index + 1, total: projects.length })}</span>
      <button type="button" data-input-action="project-next" aria-label={labels.carousel.next} onClick={() => store.send({ type: "next" })}>→</button>
      <button type="button" data-input-action="project-open" onClick={open}>{text.focus} ⤢</button>
      {state.clock ? <CarouselCountdown clock={state.clock} running={state.running} reduced={state.reduced} labels={labels.carousel} /> : null}
    </div>
  </div>;
}
