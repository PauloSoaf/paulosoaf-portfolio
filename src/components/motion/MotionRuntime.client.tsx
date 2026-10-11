"use client";

import { useEffect } from "react";
import { installMotion } from "@/features/motion/motion-engine";
import { installPressFeedback } from "@/features/motion/press-feedback";

/** Behaviour only. Content, palette, layout and section components remain server-rendered. */
export function MotionRuntime() {
  useEffect(() => {
    const root = document.querySelector("main");
    if (root) return installMotion(root);
  }, []);
  useEffect(installPressFeedback, []);
  return null;
}
