import { AUTOPLAY_INTERVAL } from "./carousel-controller";

/** One deadline drives both the visible timer and slide selection. Suspensions preserve time. */
export function createCarouselClock(expire: () => void) {
  let remaining = AUTOPLAY_INTERVAL, snapshot = remaining, deadline = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let generation = 0;
  const listeners = new Set<() => void>();
  const publish = (value: number) => {
    if (snapshot === value) return;
    snapshot = value; listeners.forEach(listener => listener());
  };
  const tick = (cycle: number) => {
    if (cycle !== generation || timer === undefined) return;
    remaining = Math.max(0, deadline - Date.now()); publish(remaining);
    if (remaining === 0) { timer = undefined; expire(); return; }
    timer = setTimeout(() => tick(cycle), Math.min(100, remaining));
  };
  const pause = () => {
    if (timer === undefined) return;
    generation++;
    clearTimeout(timer); timer = undefined;
    remaining = Math.max(0, deadline - Date.now()); publish(remaining);
  };
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => AUTOPLAY_INTERVAL,
    start() {
      if (timer !== undefined) return;
      // Hold the completed zero until the next tick paints the following cycle's seven.
      if (remaining === 0) remaining = AUTOPLAY_INTERVAL;
      const cycle = ++generation;
      deadline = Date.now() + remaining; timer = setTimeout(() => tick(cycle), Math.min(100, remaining));
    },
    pause,
    reset() { pause(); remaining = AUTOPLAY_INTERVAL; publish(remaining); },
    dispose() { pause(); listeners.clear(); },
  };
}
export type CarouselClock = ReturnType<typeof createCarouselClock>;
