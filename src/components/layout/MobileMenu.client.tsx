"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";

interface MobileMenuProps {
  /** Visible, constant label ("Menu"); the open state is conveyed by `aria-expanded` (RF-018). */
  label: string;
  /** Server-rendered navigation and preference controls. */
  children: ReactNode;
  className?: string;
}

const WIDE_VIEWPORT = "(min-width: 64rem)";

/**
 * Disclosure menu for compact/tablet headers. Escape closes it and returns focus to the button;
 * activating a link, clicking outside or widening the viewport also closes it. Not a modal: no
 * focus trap and no scroll lock. Hidden without JavaScript — a "Menu" link to the footer
 * navigation replaces it (SiteHeader).
 */
export function MobileMenu({ label, children, className }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    }
    // Following a link (mouse, touch or Enter) closes the menu; delegated from the panel.
    function onPanelClick(event: MouseEvent) {
      if ((event.target as HTMLElement).closest("a")) setOpen(false);
    }
    const wide = window.matchMedia(WIDE_VIEWPORT);
    function onViewportChange() {
      if (wide.matches) setOpen(false);
    }

    const panel = panelRef.current;
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    panel?.addEventListener("click", onPanelClick);
    wide.addEventListener("change", onViewportChange);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      panel?.removeEventListener("click", onPanelClick);
      wide.removeEventListener("change", onViewportChange);
    };
  }, [open]);

  return (
    <div className={cx("js-only", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-2.5 rounded-sm border border-line-strong px-4 text-xs font-semibold tracking-[0.08em] uppercase transition-colors duration-(--oo-motion-fast) hover:border-accent"
      >
        {label}
        <Icon name={open ? "close" : "menu"} size={16} />
      </button>
      <div
        ref={panelRef}
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full max-h-[calc(100svh-var(--oo-header-height))] overflow-y-auto border-b border-line bg-surface shadow-card"
      >
        <div className="container-page flex flex-col gap-6 pt-4 pb-7">{children}</div>
      </div>
    </div>
  );
}
