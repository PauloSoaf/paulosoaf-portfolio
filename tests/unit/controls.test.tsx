import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MobileMenu } from "@/components/layout/MobileMenu.client";
import { ThemeToggle } from "@/components/ui/ThemeToggle.client";
import { THEME_BOOTSTRAP_SCRIPT } from "@/theme/theme-script";

describe("accessible controls", () => {
  it("opens the menu with the keyboard and restores focus on Escape", async () => {
    const user = userEvent.setup();
    render(<MobileMenu label="Menu"><a href="#work">Projetos</a></MobileMenu>);
    const button = screen.getByRole("button", { name: "Menu" });
    button.focus();
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-expanded", "true");
    await user.tab();
    expect(screen.getByRole("link", { name: "Projetos" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
    expect(screen.queryByRole("link", { name: "Projetos" })).toBeNull();
  });
  it("closes the menu when a navigation link is activated", async () => {
    const user = userEvent.setup();
    render(<MobileMenu label="Menu"><a href="#work">Projetos</a></MobileMenu>);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(screen.getByRole("link", { name: "Projetos" }));
    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false");
  });
  it("persists theme changes without losing focus or remounting content", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle labels={{ toLight: "Ativar tema claro", toDark: "Ativar tema escuro" }} />);
    const button = screen.getByRole("button", { name: "Ativar tema claro" });
    await user.click(button);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(document.cookie).toContain("ps-theme=light");
    expect(button).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Ativar tema escuro" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(button).toHaveFocus();
  });
  it("applies the saved theme before hydration and ignores invalid preferences", () => {
    document.cookie = "ps-theme=light; Path=/";
    window.eval(THEME_BOOTSTRAP_SCRIPT);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(document.documentElement).toHaveAttribute("data-js");
    document.cookie = "ps-theme=unexpected; Path=/";
    window.eval(THEME_BOOTSTRAP_SCRIPT);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });
});
