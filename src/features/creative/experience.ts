"use client";

import { useSyncExternalStore } from "react";
const subscribe = () => () => {};
export function useCreativeExperience(): boolean {
  return useSyncExternalStore(subscribe, () => document.documentElement.dataset.experience !== "classic", () => true);
}

export const clampProgress = (value: number): number => Math.max(0, Math.min(1, value));
export const heroExitProgress = (top: number, height: number, viewport: number): number => clampProgress(-top / Math.max(1, Math.min(height, viewport * .85)));
