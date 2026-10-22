import { describe, expect, it } from "vitest";
import { canOpenSite, type WorkstationAccess } from "@/features/workstation/sites";
import { runCommand } from "@/features/workstation/terminal/commands";
import { TerminalSession } from "@/features/workstation/terminal/session";

const publicAccess: WorkstationAccess = { sites: [], fixture: false };
describe("editorial access follows the notebook to its canonical route", () => {
  it("only enables server-selected projects and an explicitly enabled fixture", () => {
    for (const id of ["nutriopus", "deborah", "fixture", "unknown", null, {}, 1]) expect(canOpenSite(publicAccess, id)).toBe(false);
    const one: WorkstationAccess = { sites: ["nutriopus"], fixture: false };
    expect(canOpenSite(one, "nutriopus")).toBe(true);
    expect(canOpenSite(one, "deborah")).toBe(false);
    expect(canOpenSite({ ...one, fixture: true }, "fixture")).toBe(true);
  });
  for (const locale of ["pt", "en", "es"] as const) {
    it(`${locale}: commands cannot open filtered projects or the private fixture`, () => {
      for (const app of ["nutriopus", "deborah", "browser"]) {
        expect(runCommand(`open ${app}`, locale, publicAccess)).toMatchObject({ effects: [], tone: "error" });
      }
      const help = runCommand("help", locale, publicAccess).output.join(" ");
      expect(help).not.toMatch(/nutriopus|deborah|browser/);
      expect(runCommand("open notes", locale, publicAccess).effects).toEqual([{ type: "open", app: "notes" }]);
      expect(runCommand("code", locale, publicAccess).effects).toEqual([{ type: "code" }]);
      expect(runCommand("open nutriopus", locale, { sites: ["nutriopus"], fixture: false }).effects).toEqual([{ type: "open", app: "nutriopus" }]);
    });
  }
  it("the shared terminal session rejects opening before emitting an effect", () => {
    const session = new TerminalSession(publicAccess), events: unknown[] = [];
    session.onEffect = event => events.push(event);
    session.submit("open nutriopus", "pt", "paulo$");
    expect(events).toEqual([]);
    expect(session.lines.at(-1)).toMatchObject({ kind: "error", text: "Aplicativo indisponível." });
    session.submit("open notes", "pt", "paulo$");
    expect(events).toEqual([{ type: "open", app: "notes" }]);
  });
});
