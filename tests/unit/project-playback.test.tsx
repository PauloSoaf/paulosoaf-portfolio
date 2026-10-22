import { act, render, screen } from "@testing-library/react";
import { useSyncExternalStore } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { ProjectCarousel } from "@/components/carousel/ProjectCarousel.client";
import { ProjectPlaybackProvider, useProjectPlayback } from "@/features/projects/ProjectPlaybackProvider.client";
import { pt } from "@/i18n/dictionaries/pt";

function Companion() {
  const { store } = useProjectPlayback()!;
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return <div><output data-testid="companion">{state.index}</output>
    <button onClick={() => store.send({ type: "visible", value: true })}>show companion</button>
    <button onClick={() => store.send({ type: "engaged", value: true })}>engage</button>
    <button onClick={() => store.send({ type: "engaged", value: false })}>release</button>
    <button onClick={() => store.send({ type: "next" })}>companion next</button>
  </div>;
}
afterEach(() => vi.useRealTimers());

it("shares one seven-second clock, selection and interaction pause when only the notebook is visible", () => {
  vi.useFakeTimers();
  let viewport!: IntersectionObserverCallback;
  vi.stubGlobal("IntersectionObserver", class { constructor(callback: IntersectionObserverCallback) { viewport = callback; } observe() {} disconnect() {} });
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  const { container } = render(<ProjectPlaybackProvider projects={[]} labels={pt}>
    <ProjectCarousel labels={pt.carousel} slides={[{ slug: "a", title: "A", content: <p>A</p> }, { slug: "b", title: "B", content: <p>B</p> }]} />
    <Companion />
  </ProjectPlaybackProvider>);
  const carousel = container.querySelector("[data-carousel]")!;
  expect(carousel).toHaveAttribute("data-visible", "false");
  act(() => screen.getByText("show companion").click());
  expect(carousel).toHaveAttribute("data-auto", "true");
  act(() => vi.advanceTimersByTime(2000));
  // A late offscreen notification used to pause the clock without changing data-auto.
  act(() => viewport([{ isIntersecting: false }] as IntersectionObserverEntry[], {} as IntersectionObserver));
  act(() => vi.advanceTimersByTime(1000));
  expect(container.querySelector("[data-countdown]")).toHaveAttribute("data-countdown", "4");
  act(() => screen.getByText("engage").click());
  act(() => vi.advanceTimersByTime(10000));
  expect(screen.getByTestId("companion")).toHaveTextContent("0");
  expect(container.querySelector("[data-countdown]")).toHaveAttribute("data-countdown", "4");
  act(() => screen.getByText("release").click());
  act(() => vi.advanceTimersByTime(3999));
  expect(carousel).toHaveAttribute("data-selected-index", "0");
  act(() => vi.advanceTimersByTime(1));
  expect(carousel).toHaveAttribute("data-selected-index", "1");
  expect(screen.getByTestId("companion")).toHaveTextContent("1");
  act(() => screen.getByText("companion next").click());
  expect(carousel).toHaveAttribute("data-selected-index", "0");
  expect(screen.getByTestId("companion")).toHaveTextContent("0");
  expect(container.querySelector("[data-countdown]")).toHaveAttribute("data-countdown", "7");
});
