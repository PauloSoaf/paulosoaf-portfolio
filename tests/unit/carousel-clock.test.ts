import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCarouselClock } from "@/features/projects/carousel-clock";
import { companionDiameter } from "@/features/creative/companion";
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
describe("carousel deadline", () => {
  it("emits every second from seven through zero and expires exactly once at 7000ms", () => {
    const expire = vi.fn(), clock = createCarouselClock(expire), seen = [7];
    clock.subscribe(() => seen.push(Math.ceil(clock.getSnapshot() / 1000)));
    clock.start(); vi.advanceTimersByTime(6999); expect(expire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1); expect(expire).toHaveBeenCalledTimes(1);
    expect([...new Set(seen)]).toEqual([7,6,5,4,3,2,1,0]);
    expect(clock.getSnapshot()).toBe(0); clock.start(); expect(clock.getSnapshot()).toBe(0);
    vi.advanceTimersByTime(100); expect(Math.ceil(clock.getSnapshot() / 1000)).toBe(7);
    clock.dispose(); expect(vi.getTimerCount()).toBe(0);
  });
  it("freezes exact remaining milliseconds and resumes the deadline without resetting to seven", () => {
    const expire = vi.fn(), clock = createCarouselClock(expire); clock.start();
    vi.advanceTimersByTime(2300); clock.pause(); expect(clock.getSnapshot()).toBe(4700);
    vi.advanceTimersByTime(20_000); expect(clock.getSnapshot()).toBe(4700); expect(expire).not.toHaveBeenCalled();
    clock.start(); vi.advanceTimersByTime(4699); expect(expire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1); expect(expire).toHaveBeenCalledTimes(1); clock.dispose();
  });
  it("a manual selection resets the cycle and disposing releases timers/subscribers", () => {
    const expire = vi.fn(), clock = createCarouselClock(expire), subscriber = vi.fn();
    const unsubscribe = clock.subscribe(subscriber); clock.start(); vi.advanceTimersByTime(4300);
    clock.reset(); expect(clock.getSnapshot()).toBe(7000); expect(vi.getTimerCount()).toBe(0);
    unsubscribe(); const count = subscriber.mock.calls.length; clock.start(); vi.advanceTimersByTime(1000);
    expect(subscriber).toHaveBeenCalledTimes(count); clock.dispose(); vi.advanceTimersByTime(10000); expect(expire).not.toHaveBeenCalled();
  });
  it("a canceled callback already queued by the platform cannot expire a resumed cycle", () => {
    const clear = vi.spyOn(globalThis, "clearTimeout").mockImplementation(() => {});
    const expire = vi.fn(), clock = createCarouselClock(expire);
    clock.start(); clock.pause(); clock.start(); vi.advanceTimersByTime(7000);
    expect(expire).toHaveBeenCalledTimes(1); expect(clock.getSnapshot()).toBe(0);
    clock.dispose(); clear.mockRestore();
  });
});
it("page companion interpolates continuous sizes and leaves enough mobile space for 44px controls", () => {
  expect(companionDiameter(0,false)).toBe(170); expect(companionDiameter(1,false)).toBe(250);
  expect(companionDiameter(2,false)).toBe(195); expect(companionDiameter(3,false)).toBe(270);
  expect(companionDiameter(.5,false)).toBe(210);
  for (let step=0;step<=500;step++) {
    const mobile=companionDiameter(step/100,true); expect(mobile).toBeGreaterThanOrEqual(104); expect(mobile).toBeLessThanOrEqual(141);
  }
  expect(Math.abs(companionDiameter(.999,false)-companionDiameter(1.001,false))).toBeLessThan(.01);
});
