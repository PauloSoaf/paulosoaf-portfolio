"use client";

import { useEffect, useSyncExternalStore } from "react";

import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";
import {
  applyTheme,
  getDocumentTheme,
  subscribeToTheme,
  syncThemeColorMeta,
} from "@/theme/theme-client";
import { defaultTheme, type Theme } from "@/theme/theme";

interface ThemeToggleProps {
  labels: { toLight: string; toDark: string };
  className?: string;
}

const getServerTheme = (): Theme => defaultTheme;

/**
 * Dark/Light switch (RF-023). The server snapshot is always Dark, so hydration matches the static
 * HTML; the client snapshot then reads `<html data-theme>` (already set before paint by the bootstrap).
 * The label names the action ("Ativar tema claro"), so no `aria-pressed` is needed.
 * Hidden without JavaScript (`js-only`): a control that cannot work must not be offered.
 */
export function ThemeToggle({ labels, className }: ThemeToggleProps) {
  const theme = useSyncExternalStore(subscribeToTheme, getDocumentTheme, getServerTheme);
  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = next === "light" ? labels.toLight : labels.toDark;

  useEffect(() => {
    syncThemeColorMeta(theme);
  }, [theme]);

  return (
    <button
      type="button"
      className={cx(
        "js-only inline-flex size-11 items-center justify-center rounded-sm border border-line text-fg-muted transition-colors duration-(--oo-motion-fast) hover:border-line-strong hover:text-fg",
        className,
      )}
      aria-label={label}
      title={label}
      onClick={() => applyTheme(next)}
    >
      {/* Icon of the target theme, switched by CSS so it is right even before hydration. */}
      <span data-theme-only="dark">
        <Icon name="sun" size={18} />
      </span>
      <span data-theme-only="light">
        <Icon name="moon" size={18} />
      </span>
    </button>
  );
}
