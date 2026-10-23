"use client";
import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

const JourneyScreenContext = createContext<{
  enabled: boolean; available: boolean; target: HTMLDivElement | null;
  setAvailable: Dispatch<SetStateAction<boolean>>;
  setTarget: Dispatch<SetStateAction<HTMLDivElement | null>>;
} | null>(null);

/** The existing server-rendered articles move into one screen; no duplicate biography. */
export function JourneyScreenProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const [available, setAvailable] = useState(false);
  return <JourneyScreenContext value={{ enabled, available, target, setAvailable, setTarget }}>{children}</JourneyScreenContext>;
}
export const useJourneyScreen = () => useContext(JourneyScreenContext);
