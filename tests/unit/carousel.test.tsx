import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectCarousel } from "@/components/carousel/ProjectCarousel.client";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { carouselReducer, initialCarouselState, selectedIndex, shouldAutoAdvance, slideOffset, wrapIndex } from "@/features/projects/carousel-controller";
import { projects } from "@/features/projects/project-data";
import { orderProjects, publicRepository } from "@/features/projects/project-presentation";
import { validateProjects } from "@/features/projects/project-validation";
import { visibleItems } from "@/features/content/visibility";
import { pt } from "@/i18n/dictionaries/pt";

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
});

describe("carousel and commercial catalog", () => {
  it("uses the newest viewport entry when the browser batches opposite transitions", () => {
    let callback!: IntersectionObserverCallback;
    vi.stubGlobal("IntersectionObserver", class {
      constructor(cb: IntersectionObserverCallback) { callback = cb; }
      observe() {} disconnect() {}
    });
    const { container } = render(<ProjectCarousel slides={[{ slug: "a", title: "A", content: <p>A</p> }, { slug: "b", title: "B", content: <p>B</p> }]} labels={pt.carousel} />);
    act(() => callback([{ isIntersecting: false }, { isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver));
    expect(container.querySelector("[data-carousel]")).toHaveAttribute("data-visible", "true");
    act(() => callback([{ isIntersecting: true }, { isIntersecting: false }] as IntersectionObserverEntry[], {} as IntersectionObserver));
    expect(container.querySelector("[data-carousel]")).toHaveAttribute("data-visible", "false");
  });
  it("configures the requested feature priority without mutating or deleting the catalog", () => {
    expect(orderProjects(projects).map((p) => p.slug)).toEqual([
      "nutriopus", "deborah-lima", "dr-manaus", "iot-devices-manager", "chess-in-react", "gol-na-hora", "game-hub",
    ]);
    const reversed = projects.map((p) => ({ ...p, featuredOrder: p.slug === "chess-in-react" ? 0 : p.featuredOrder }));
    expect(orderProjects(reversed)[0]?.slug).toBe("chess-in-react");
    expect(visibleItems(projects, false)).toEqual([]);
    expect(projects).toHaveLength(7);
  });
  it("admits private candidates without stack/image/GitHub/demo while keeping approval gates", () => {
    const candidates = projects.filter((p) => p.sourceVisibility === "private");
    expect(candidates).toHaveLength(2);
    expect(validateProjects(candidates, { today: new Date("2026-10-10") })).toEqual([]);
    for (const p of candidates) {
      expect(p.status).toBe("draft"); expect(publicRepository(p)).toBeUndefined(); expect(p.demo).toBeUndefined();
      expect(p.image).toBeUndefined(); expect(p.tech).toEqual([]);
    }
    expect(validateProjects(candidates.map((p) => ({ ...p, status: "approved" })), { today: new Date("2026-10-10") }))
      .toContainEqual(expect.objectContaining({ path: expect.stringContaining("stackVerification") }));
  });
  it("rejects disclosure of private code, an invented case route and invalid ordering", () => {
    const p = { ...projects[0]!, repository: { href: "https://example.org/private", verifiedAt: "2026-10-10" },
      featuredOrder: -1, caseStudy: { availability: "available" as const, path: "/pt/projects/missing" as const } };
    const issues = validateProjects([p], { today: new Date("2026-10-10") });
    expect(issues.map((i) => i.path)).toEqual(expect.arrayContaining([
      "projects[0:nutriopus].repository", "projects[0:nutriopus].featuredOrder", "projects[0:nutriopus].caseStudy",
    ]));
    expect(publicRepository(p)).toBeUndefined();
  });
  it("wraps navigation and resolves two-item depth without duplicating an interactive slide", () => {
    expect(wrapIndex(-1, 7)).toBe(6); expect(wrapIndex(7, 7)).toBe(0); expect(wrapIndex(1, 0)).toBe(0);
    expect([0, 1].map((i) => slideOffset(i, 0, 2))).toEqual([0, 1]);
    expect(slideOffset(6, 0, 7)).toBe(-1);
  });
  it.each(["isHovered", "hasFocus", "isDragging", "reducedMotion"] as const)("suspends autoplay for %s", (key) => {
    const ready = { ...initialCarouselState, visible: true };
    expect(shouldAutoAdvance(ready, 3)).toBe(true);
    expect(shouldAutoAdvance({ ...ready, [key]: true }, 3)).toBe(false);
  });
  it("suspends for hidden tab, offscreen, empty or single lists", () => {
    const ready = { ...initialCarouselState, visible: true };
    expect(shouldAutoAdvance({ ...ready, tabVisible: false }, 3)).toBe(false);
    expect(shouldAutoAdvance(initialCarouselState, 3)).toBe(false);
    expect(shouldAutoAdvance(ready, 1)).toBe(false); expect(shouldAutoAdvance(ready, 0)).toBe(false);
  });
  it("never restarts a manual/focus pause automatically and refuses play during reduced motion", () => {
    let s = carouselReducer(initialCarouselState, { type: "focus", value: true });
    s = carouselReducer(s, { type: "focus", value: false }); expect(s.isPlaying).toBe(false);
    s = carouselReducer(s, { type: "playing", value: true }); expect(s.isPlaying).toBe(true);
    s = carouselReducer(s, { type: "playing", value: false });
    for (const type of ["hover", "drag", "visible", "tab"] as const) s = carouselReducer(s, { type, value: false });
    expect(s.isPlaying).toBe(false);
    s = carouselReducer(s, { type: "reduced", value: true });
    expect(carouselReducer(s, { type: "playing", value: true }).isPlaying).toBe(false);
  });
  it("keeps selection by slug on reordering, clamps removed selections and silences auto announcements", () => {
    let s = carouselReducer(initialCarouselState, { type: "step", delta: 1, slugs: ["a", "b", "c"], announcement: "b" });
    expect(selectedIndex(s, ["b", "a", "c"])).toBe(0); expect(selectedIndex(s, ["a", "c"])).toBe(0);
    expect(s.announcement).toBe("b");
    s = carouselReducer(s, { type: "step", delta: 1, slugs: ["a", "b", "c"] }); expect(s.announcement).toBe("");
  });
  it("renders no carousel for empty data, no rotation controls for one, and survives changing item count", () => {
    const list = (slugs: string[]) => slugs.map((slug) => ({ slug, title: slug, content: <a href={`https://example.org/${slug}`}>{slug}</a> }));
    const { container, rerender } = render(<ProjectCarousel slides={[]} labels={pt.carousel} />);
    expect(container.querySelector("[data-carousel]")).toBeNull();
    rerender(<ProjectCarousel slides={list(["a"])} labels={pt.carousel} />);
    expect(screen.queryByRole("button")).toBeNull(); expect(screen.getByRole("link", { name: "a" })).toBeVisible();
    rerender(<ProjectCarousel slides={list(["a", "b"])} labels={pt.carousel} />);
    fireEvent.click(screen.getByRole("button", { name: pt.carousel.next }));
    expect(container.querySelector("[data-carousel]")).toHaveAttribute("data-selected-index", "1");
    expect(container.querySelector('[data-project="a"]')).toHaveAttribute("inert");
    rerender(<ProjectCarousel slides={list(["b", "a"])} labels={pt.carousel} />);
    expect(container.querySelector("[data-carousel]")).toHaveAttribute("data-selected-index", "0");
    rerender(<ProjectCarousel slides={list(["a"])} labels={pt.carousel} />);
    expect(container.querySelector("[data-carousel]")).toHaveAttribute("data-selected-index", "0");
  });
  it("shows honest local artwork and no actions for a private project without demo or case", () => {
    const { container } = render(<ProjectCard project={projects[0]!} locale="pt" dict={pt} position={1} total={7} />);
    expect(screen.getByText(pt.projects.conceptArt)).toBeVisible(); expect(screen.getByText(pt.projects.stackPending)).toBeVisible();
    expect(container.querySelector("a")).toBeNull(); expect(container.querySelector('[data-concept="nutrition"]')).not.toBeNull();
  });
});
