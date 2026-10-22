import { describe, expect, it } from "vitest";
import {
  initialWorkstationState,
  isScreenInteractive,
  workstationReducer,
  type WorkstationEvent,
  type WorkstationState,
} from "@/features/workstation/state/workstation-machine";

const reduce = (...events: WorkstationEvent[]): WorkstationState =>
  events.reduce(workstationReducer, initialWorkstationState);

describe("workstation screen and manipulation state", () => {
  it("opens the automatic gallery on entering Projects and returns to Desktop on leaving", () => {
    const gallery = reduce({ type: "SYNC_PROJECTS", active: true });
    expect(gallery.app).toEqual({ kind: "PROJECTS", automatic: true });
    expect(workstationReducer(gallery, { type: "SYNC_PROJECTS", active: false }).app.kind).toBe("DESKTOP");
  });
  it.each(["OPEN_NOTES", "OPEN_TERMINAL", "OPEN_CODE"] as const)("passive scroll preserves a manually opened %s", type => {
    const current = reduce({ type });
    expect(workstationReducer(current, { type: "SYNC_PROJECTS", active: true })).toBe(current);
  });
  it("keeps explicit gallery and focus choices independent of passive scroll", () => {
    const gallery = reduce({ type: "OPEN_PROJECTS" });
    expect(workstationReducer(gallery, { type: "SYNC_PROJECTS", active: false })).toBe(gallery);
    const focused = reduce({ type: "FOCUS_SCREEN" });
    expect(workstationReducer(focused, { type: "SYNC_PROJECTS", active: true })).toBe(focused);
  });
  it("explicit Projects navigation can replace an app without resetting lid or rotation", () => {
    const current = reduce({ type: "OPEN_TERMINAL" }, { type: "ROTATE", axis: 1, delta: .2 });
    const gallery = workstationReducer(current, { type: "OPEN_PROJECTS", automatic: true });
    expect(gallery.app.kind).toBe("PROJECTS");
    expect(gallery.rotation).toEqual(current.rotation);
    expect(gallery.lidAngle).toBe(current.lidAngle);
    expect(workstationReducer(reduce({ type: "FAIL" }), { type: "OPEN_PROJECTS" }).mode).toBe("BROKEN");
  });
  it.each(["fixture", "nutriopus", "deborah"])("selects only the registered site %s", (siteId) => {
    const state = reduce({ type: "OPEN_SITE", siteId });
    expect(state.mode).toBe("PREVIEW");
    expect(state.app).toEqual({ kind: "PREVIEW", siteId });
    expect(isScreenInteractive(state)).toBe(true);
  });

  it.each([
    "https://evil.example/",
    "javascript:alert(1)",
    "../../private",
    "__proto__",
    "FIXTURE",
    { toString: () => "fixture" },
    null,
    undefined,
  ])("rejects unregistered or malformed site IDs (%s) without losing the current app", (siteId) => {
    const current = reduce({ type: "OPEN_CODE" });
    expect(workstationReducer(current, { type: "OPEN_SITE", siteId })).toBe(current);
  });

  it("keeps the focused presentation while opening and closing apps", () => {
    const focused = reduce({ type: "OPEN_SITE", siteId: "fixture" }, { type: "FOCUS_SCREEN" });
    expect(focused).toMatchObject({ mode: "FOCUS_SCREEN", priorFocus: true });
    const code = workstationReducer(focused, { type: "OPEN_CODE" });
    expect(code).toMatchObject({ mode: "FOCUS_SCREEN", app: { kind: "CODE" }, priorFocus: true });
    const desktop = workstationReducer(code, { type: "CLOSE_X" });
    expect(desktop).toMatchObject({ mode: "FOCUS_SCREEN", app: { kind: "DESKTOP" }, priorFocus: true });
    expect(workstationReducer(desktop, { type: "EXIT_FOCUS" })).toMatchObject({
      mode: "DESKTOP", priorFocus: false,
    });
  });

  it("returns to the current app when leaving focus", () => {
    const preview = reduce(
      { type: "FOCUS_SCREEN" },
      { type: "OPEN_SITE", siteId: "fixture" },
      { type: "EXIT_FOCUS" },
    );
    expect(preview).toMatchObject({ mode: "PREVIEW", app: { kind: "PREVIEW", siteId: "fixture" }, priorFocus: false });
    const code = reduce({ type: "OPEN_CODE" }, { type: "FOCUS_SCREEN" }, { type: "EXIT_FOCUS" });
    expect(code.mode).toBe("CODE");
  });

  it("disables screen input while rotating and restores the app afterward", () => {
    const moving = reduce({ type: "OPEN_SITE", siteId: "fixture" }, { type: "BEGIN_ROTATE" });
    expect(moving.mode).toBe("MANIPULATE");
    expect(isScreenInteractive(moving)).toBe(false);
    for (const event of [{ type: "FOCUS_SCREEN" }, { type: "OPEN_CODE" }, { type: "OPEN_SITE", siteId: "deborah" }] as const) {
      expect(workstationReducer(moving, event)).toBe(moving);
    }
    const resting = workstationReducer(moving, { type: "END_ROTATE" });
    expect(resting.mode).toBe("PREVIEW");
    expect(isScreenInteractive(resting)).toBe(true);
  });

  it("does not let manipulation or stale pointer releases steal DOM focus", () => {
    const focused = reduce({ type: "FOCUS_SCREEN" });
    for (const event of [{ type: "BEGIN_ROTATE" }, { type: "ROTATE", axis: 1, delta: 0.3 }, { type: "END_ROTATE" }] as const) {
      expect(workstationReducer(focused, event)).toBe(focused);
    }
    expect(isScreenInteractive(focused)).toBe(true);
  });

  it("closing the lid exits focus, preserves the app, and blocks interaction", () => {
    const closed = reduce(
      { type: "OPEN_SITE", siteId: "fixture" },
      { type: "FOCUS_SCREEN" },
      { type: "SET_LID", angle: 14.99 },
    );
    expect(closed).toMatchObject({ mode: "PREVIEW", app: { kind: "PREVIEW", siteId: "fixture" }, priorFocus: false });
    expect(isScreenInteractive(closed)).toBe(false);
    // Closing the lid disables screen input, while the chassis remains explorable.
    const rotating = workstationReducer(closed, { type: "BEGIN_ROTATE" });
    expect(rotating.mode).toBe("MANIPULATE");
    expect(isScreenInteractive(rotating)).toBe(false);
    expect(workstationReducer(rotating, { type: "ROTATE", axis: 0, delta: 0.2 }).rotation[0]).toBe(0.2);
    expect(isScreenInteractive(workstationReducer(closed, { type: "SET_LID", angle: 15 }))).toBe(true);
    const focused = workstationReducer(closed, { type: "FOCUS_SCREEN" });
    expect(focused).toMatchObject({ mode: "FOCUS_SCREEN", lidAngle: 108, priorFocus: true });
    expect(isScreenInteractive(focused)).toBe(true);
  });

  it("closing the lid also releases manipulation without selecting a different app", () => {
    const closed = reduce({ type: "OPEN_CODE" }, { type: "BEGIN_ROTATE" }, { type: "SET_LID", angle: -10 });
    expect(closed).toMatchObject({ mode: "CODE", app: { kind: "CODE" }, lidAngle: 0 });
    expect(isScreenInteractive(closed)).toBe(false);
    expect(reduce({ type: "SET_LID", angle: 500 }).lidAngle).toBe(135);
  });

  it("bounds every rotation axis without mutating the prior pose", () => {
    const initial: WorkstationState = Object.freeze({ ...initialWorkstationState, rotation: Object.freeze([0, 0, 0] as const) });
    let rotated = initial;
    for (const axis of [0, 1, 2] as const) rotated = workstationReducer(rotated, { type: "ROTATE", axis, delta: 100 });
    expect(rotated.rotation).toEqual([0.6, 1.35, 0.3]);
    for (const axis of [0, 1, 2] as const) rotated = workstationReducer(rotated, { type: "ROTATE", axis, delta: -100 });
    expect(rotated.rotation).toEqual([-0.6, -1.35, -0.3]);
    expect(initial.rotation).toEqual([0, 0, 0]);
  });

  it("rejects non-finite inputs, invalid axes and unknown runtime events", () => {
    const malformed = [
      ...[NaN, Infinity, -Infinity, "90"].flatMap((value) => [
        { type: "SET_LID", angle: value },
        { type: "ROTATE", axis: 1, delta: value },
      ]),
      { type: "ROTATE", axis: 3, delta: 1 },
      { type: "ROTATE", axis: "1", delta: 1 },
      { type: "THROW", velocity: 100 },
      { type: "__proto__" },
      {}, null, undefined, 42, "RESET",
    ];
    for (const event of malformed) {
      expect(workstationReducer(initialWorkstationState, event as WorkstationEvent)).toBe(initialWorkstationState);
    }
  });

  it("failure removes interactive content and stays inert until an idempotent reset", () => {
    const broken = reduce({ type: "OPEN_SITE", siteId: "fixture" }, { type: "FOCUS_SCREEN" }, { type: "FAIL" });
    expect(broken).toMatchObject({ mode: "BROKEN", app: { kind: "DESKTOP" }, priorFocus: false });
    expect(isScreenInteractive(broken)).toBe(false);
    const blocked: WorkstationEvent[] = [
      { type: "OPEN_SITE", siteId: "fixture" }, { type: "OPEN_CODE" }, { type: "CLOSE_X" },
      { type: "FOCUS_SCREEN" }, { type: "EXIT_FOCUS" }, { type: "SET_LID", angle: 90 },
      { type: "BEGIN_ROTATE" }, { type: "ROTATE", axis: 1, delta: 1 }, { type: "END_ROTATE" }, { type: "FAIL" },
    ];
    for (const event of blocked) expect(workstationReducer(broken, event)).toBe(broken);
    const reset = workstationReducer(broken, { type: "RESET" });
    expect(reset).toBe(initialWorkstationState);
    expect(workstationReducer(reset, { type: "RESET" })).toBe(reset);
    expect(isScreenInteractive(reset)).toBe(true);
  });
});
