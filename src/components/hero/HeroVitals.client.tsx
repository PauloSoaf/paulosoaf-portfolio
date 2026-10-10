"use client";

import { useReportWebVitals } from "next/web-vitals";

type Vital = Parameters<Parameters<typeof useReportWebVitals>[0]>[0];
function recordVital(metric: Vital) {
  // Local diagnostics only: no visitor identifier, tracking cookie or network transmission.
  performance.measure(`portfolio:vital:${metric.name}`, {
    start: 0, duration: metric.value, detail: { value: metric.value, rating: metric.rating },
  });
}
export function HeroVitals() { useReportWebVitals(recordVital); return null; }
