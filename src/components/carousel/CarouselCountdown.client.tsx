"use client";
import { useSyncExternalStore, type CSSProperties } from "react";
import { AUTOPLAY_INTERVAL } from "@/features/projects/carousel-controller";
import type { CarouselClock } from "@/features/projects/carousel-clock";
import { format } from "@/i18n/format";
import type { Dictionary } from "@/i18n/get-dictionary";

/** Isolated 10 Hz subscription: ticking never rerenders the project catalog. */
export function CarouselCountdown({ clock, running, reduced, labels }: {
  clock: CarouselClock; running: boolean; reduced: boolean; labels: Dictionary["carousel"];
}) {
  const remaining = useSyncExternalStore(clock.subscribe, clock.getSnapshot, clock.getServerSnapshot);
  const seconds = Math.ceil(remaining / 1000);
  return <span className="carousel-countdown" data-countdown={seconds} data-running={running}
    role="timer" aria-live="off" aria-label={reduced ? labels.reduced : format(running ? labels.countdown : labels.countdownPaused, { seconds })}
    style={{ "--countdown-progress": remaining / AUTOPLAY_INTERVAL } as CSSProperties}>
    <svg viewBox="0 0 44 44" aria-hidden="true"><circle className="countdown-track" cx="22" cy="22" r="18" /><circle className="countdown-ring" cx="22" cy="22" r="18" pathLength="100" /></svg>
    <span aria-hidden="true">{reduced ? "—" : seconds}<small>{reduced ? "" : "s"}</small></span>
  </span>;
}
