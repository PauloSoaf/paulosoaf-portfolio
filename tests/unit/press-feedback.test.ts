import { beforeEach, describe, expect, it } from "vitest";
import { installPressFeedback } from "@/features/motion/press-feedback";

beforeEach(() => { document.body.innerHTML = '<a class="ui-cta" href="#about"><span>Explore</span></a><button class="ui-control" disabled>Disabled</button>'; });
function pointer(target: Element, type: string, pointerType = "touch") {
  const event = new Event(type, { bubbles: true }); Object.assign(event, { pointerId: 7, pointerType }); target.dispatchEvent(event);
}
describe("touch pressure lifecycle", () => {
  it("recognizes a descendant touch and releases outside the control on cancellation", () => {
    const cleanup = installPressFeedback(), link = document.querySelector("a")!;
    pointer(link.firstElementChild!, "pointerdown"); expect(link).toHaveAttribute("data-ui-pressed");
    pointer(document.body, "pointercancel"); expect(link).not.toHaveAttribute("data-ui-pressed"); cleanup();
  });
  it("ignores disabled controls and leaves mouse state to CSS", () => {
    const cleanup = installPressFeedback(); pointer(document.querySelector("button")!, "pointerdown"); pointer(document.querySelector("a")!, "pointerdown", "mouse");
    expect(document.querySelector("[data-ui-pressed]")).toBeNull(); cleanup();
  });
  it("clears held touch when hidden and removes listeners during cleanup", () => {
    const cleanup = installPressFeedback(), link = document.querySelector("a")!;
    pointer(link, "pointerdown"); document.dispatchEvent(new Event("visibilitychange")); expect(link).not.toHaveAttribute("data-ui-pressed");
    pointer(link, "pointerdown"); cleanup(); expect(link).not.toHaveAttribute("data-ui-pressed");
    pointer(link, "pointerdown"); expect(link).not.toHaveAttribute("data-ui-pressed");
  });
});
