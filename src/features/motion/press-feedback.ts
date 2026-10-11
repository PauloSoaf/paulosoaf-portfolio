/** CSS :active is inconsistent during a held touch. Mirror only touch pressure, never capture it. */
export function installPressFeedback(): () => void {
  const pressed = new Map<number, HTMLElement>();
  const down = (event: PointerEvent) => {
    if (event.pointerType !== "touch" || !(event.target instanceof Element)) return;
    const control = event.target.closest<HTMLElement>(".ui-cta, .ui-control");
    if (!control || control.matches(":disabled, [aria-disabled=true]")) return;
    pressed.set(event.pointerId, control); control.setAttribute("data-ui-pressed", "");
  };
  const release = (event: PointerEvent) => { pressed.get(event.pointerId)?.removeAttribute("data-ui-pressed"); pressed.delete(event.pointerId); };
  const clear = () => { for (const control of pressed.values()) control.removeAttribute("data-ui-pressed"); pressed.clear(); };
  document.addEventListener("pointerdown", down, { passive: true });
  document.addEventListener("pointerup", release, { passive: true });
  document.addEventListener("pointercancel", release, { passive: true });
  window.addEventListener("blur", clear); document.addEventListener("visibilitychange", clear);
  return () => {
    clear(); document.removeEventListener("pointerdown", down); document.removeEventListener("pointerup", release); document.removeEventListener("pointercancel", release);
    window.removeEventListener("blur", clear); document.removeEventListener("visibilitychange", clear);
  };
}
