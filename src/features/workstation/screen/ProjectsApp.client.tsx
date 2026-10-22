"use client";
import { useEffect, useRef, useSyncExternalStore, type Dispatch } from "react";
import type { Locale } from "@/i18n/config";
import { format } from "@/i18n/format";
import { ProjectMedia } from "@/components/projects/ProjectMedia.client";
import { CarouselCountdown } from "@/components/carousel/CarouselCountdown.client";
import { useProjectPlayback } from "@/features/projects/ProjectPlaybackProvider.client";
import type { NotebookPointerController } from "../input/NotebookPointerController";
import type { WorkstationEvent } from "../state/workstation-machine";
import { canOpenSite, siteForProject, type WorkstationAccess } from "../sites";
import { workstationLabels } from "../labels";

export function ProjectsApp({ locale, pointer, dispatch, access }: {
  locale: Locale; pointer: NotebookPointerController; dispatch: Dispatch<WorkstationEvent>; access: WorkstationAccess;
}) {
  const playback = useProjectPlayback();
  return playback?.projects.length ? <ProjectScreen playback={playback} locale={locale} pointer={pointer} dispatch={dispatch} access={access} /> : null;
}

function ProjectScreen({ playback, locale, pointer, dispatch, access }: {
  playback: NonNullable<ReturnType<typeof useProjectPlayback>>; locale: Locale; pointer: NotebookPointerController;
  dispatch: Dispatch<WorkstationEvent>; access: WorkstationAccess;
}) {
  const { store, projects, labels } = playback;
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const root = useRef<HTMLDivElement>(null);
  const engagement = useRef({ hovered: false, focused: false });
  const project = projects[state.index] ?? projects[0]!;
  const site = siteForProject(project.slug);
  const open = () => { if (site && canOpenSite(access, site)) dispatch({ type: "OPEN_SITE", siteId: site }); };
  useEffect(() => {
    const unregister = [pointer.register("project-next", { click: () => store.send({ type: "next" }) }),
      pointer.register("project-previous", { click: () => store.send({ type: "previous" }) }),
      pointer.register("project-toggle", { click: () => { if (!state.reduced) store.send({ type: "toggle" }); } }),
      pointer.register("project-open", { click: () => { const id = siteForProject(project.slug); if (id && canOpenSite(access, id)) dispatch({ type: "OPEN_SITE", siteId: id }); } })];
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
  const engage = (kind: "hovered" | "focused", value: boolean) => {
    engagement.current[kind] = value;
    store.send({ type: "engaged", value: engagement.current.hovered || engagement.current.focused });
  };
  return <div ref={root} className="workbench-gallery" data-notebook-projects data-project={project.slug} data-selected-index={state.index} data-running={state.running}
    role="group" aria-roledescription={labels.carousel.role} aria-label={workstationLabels[locale].projects}
    onMouseEnter={() => engage("hovered", true)} onMouseLeave={() => engage("hovered", false)}
    onFocusCapture={() => engage("focused", true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) engage("focused", false); }}>
    <div className="workbench-gallery-stage" key={project.slug}>
      <ProjectMedia image={project.image} title={project.title} slug={project.slug} art={project.art} locale={locale} conceptLabel={labels.projects.conceptArt} />
      <div className="workbench-gallery-copy">
        <p>{labels.projects.kinds[project.kind]} <span>{labels.editorial.status[project.status]}</span></p>
        <h2>{project.title}</h2><p>{project.summary[locale]}</p>
      </div>
    </div>
    <div className="workbench-gallery-controls">
      <button type="button" data-input-action="project-toggle" disabled={state.reduced || !state.clock} onClick={() => store.send({ type: "toggle" })}>{state.playing ? labels.carousel.pause : labels.carousel.play}</button>
      <button type="button" data-input-action="project-previous" aria-label={labels.carousel.previous} onClick={() => store.send({ type: "previous" })}>←</button>
      <span>{format(labels.carousel.position, { index: state.index + 1, total: projects.length })}</span>
      <button type="button" data-input-action="project-next" aria-label={labels.carousel.next} onClick={() => store.send({ type: "next" })}>→</button>
      {site && canOpenSite(access, site) ? <button type="button" data-input-action="project-open" onClick={open}>{workstationLabels[locale].project} ↗</button> : null}
      {state.clock ? <CarouselCountdown clock={state.clock} running={state.running} reduced={state.reduced} labels={labels.carousel} /> : null}
    </div>
  </div>;
}
