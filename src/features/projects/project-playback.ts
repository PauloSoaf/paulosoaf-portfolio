import type { CarouselClock } from "./carousel-clock";

export type PlaybackCommand = { type: "previous" | "next" | "toggle" } | { type: "engaged" | "visible"; value: boolean };
export type ProjectPlayback = {
  index: number; playing: boolean; running: boolean; reduced: boolean; clock: CarouselClock | null;
};
const initial: ProjectPlayback = { index: 0, playing: true, running: false, reduced: false, clock: null };

/** Read-through bridge, not a second carousel or timer. Late scene mounts see the current slide. */
export function createProjectPlayback() {
  let value = initial;
  let command: ((event: PlaybackCommand) => void) | undefined;
  const listeners = new Set<() => void>();
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => value,
    getServerSnapshot: () => initial,
    publish(next: ProjectPlayback, handler: (event: PlaybackCommand) => void) {
      command = handler; value = next; listeners.forEach(listener => listener());
    },
    send(event: PlaybackCommand) { command?.(event); },
  };
}
