import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JourneyTimeline } from "@/components/timeline/JourneyTimeline.client";
import { journeyChapters } from "@/features/experience/journey-data";
import { visibleItems } from "@/features/content/visibility";
import { pt } from "@/i18n/dictionaries/pt";

let desktop = true;
beforeEach(() => {
  desktop = true;
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("min-width") && desktop, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
});
const chapters = (ids: string[]) => ids.map((id) => ({ id, title: id, label: id, summary: `summary ${id}`, content: <h3 id={`journey-heading-${id}`}>detail {id}</h3> }));

describe("progressive thematic timeline", () => {
  it("keeps all inherited chapters draft and does not fabricate employers or dates", () => {
    expect(visibleItems(journeyChapters, false)).toEqual([]);
    expect(journeyChapters.map((c) => c.id)).toEqual(["foundations", "industrial-systems", "creative-engineering"]);
    expect(journeyChapters.every((c) => c.status === "draft")).toBe(true);
  });
  it("supports empty and single catalogs without scroll controls", () => {
    const { container, rerender } = render(<JourneyTimeline chapters={[]} labels={pt.journey} />);
    expect(container.querySelector("[data-timeline]")).toBeNull();
    rerender(<JourneyTimeline chapters={chapters(["a"])} labels={pt.journey} />);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("detail a");
    expect(screen.queryByRole("button", { name: pt.journey.followScroll })).toBeNull();
  });
  it("uses vertical tabs, automatic arrow activation, wrap, Home/End and panel focus", () => {
    render(<JourneyTimeline chapters={chapters(["a", "b", "c"])} labels={pt.journey} />);
    fireEvent.keyDown(screen.getByRole("tab", { selected: true }), { key: "ArrowDown" });
    expect(screen.getByRole("tab", { selected: true })).toHaveAccessibleName(/b/);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("detail b");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(screen.getByRole("tab", { selected: true }), { key: "End" });
    fireEvent.keyDown(screen.getByRole("tab", { selected: true }), { key: "ArrowDown" });
    expect(screen.getByRole("tabpanel")).toHaveTextContent("detail a");
    fireEvent.keyDown(screen.getByRole("tab", { selected: true }), { key: "Home" });
    expect(screen.getByRole("tabpanel")).toHaveTextContent("detail a");
  });
  it("preserves selection by id when reordered, clamps removal, and adds new chapters", () => {
    const { container, rerender } = render(<JourneyTimeline chapters={chapters(["a", "b"])} labels={pt.journey} />);
    fireEvent.click(screen.getByRole("tab", { name: /b/ }));
    rerender(<JourneyTimeline chapters={chapters(["b", "a", "c"])} labels={pt.journey} />);
    expect(container.querySelector("[data-timeline]")).toHaveAttribute("data-selected-chapter", "b");
    rerender(<JourneyTimeline chapters={chapters(["a", "c"])} labels={pt.journey} />);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("detail a");
  });
  it("keeps mobile as a linear list with every chapter exposed", () => {
    desktop = false;
    const { container } = render(<JourneyTimeline chapters={chapters(["a", "b", "c"])} labels={pt.journey} />);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(container.querySelectorAll(".journey-item[inert], .journey-item[aria-hidden=true]")).toHaveLength(0);
  });
});
