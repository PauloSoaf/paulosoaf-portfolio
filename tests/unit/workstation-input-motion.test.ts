import { describe, expect, it } from "vitest";
import { spring } from "@/features/workstation/orchestrator/position";
import { editText, NotebookInputController } from "@/features/workstation/input/NotebookInputController";
import { NotebookPointerController } from "@/features/workstation/input/NotebookPointerController";
import { NOTEBOOK_KEYS } from "@/features/workstation/input/keyboard-layout";

describe("critically damped motion", () => {
  it("has the same result at 30/60/120Hz without overshoot", () => {
    const results = [30, 60, 120].map((hz) => {
      let value = 0, velocity = 0;
      for (let frame = 0; frame < hz; frame++) { const next = spring(value, 100, velocity, 1 / hz); value = next.value; velocity = next.velocity; expect(value).toBeLessThanOrEqual(100); }
      return value;
    });
    expect(results[0]).toBeCloseTo(results[1]!, 8); expect(results[1]).toBeCloseTo(results[2]!, 8);
    expect(results[0]).toBeGreaterThan(99.9);
  });
  it("preserves velocity on a reversal and settles without discontinuity", () => {
    const first = spring(0, 800, 0, 1 / 60);
    const next = spring(first.value, -400, first.velocity, 1 / 60);
    expect(Math.abs(next.value - first.value)).toBeLessThan(50);
    let position = next;
    for (let i = 0; i < 180; i++) position = spring(position.value, -400, position.velocity, 1 / 60);
    expect(position.value).toBeCloseTo(-400, 6); expect(position.velocity).toBeCloseTo(0, 6);
  });
});
describe("owned text input", () => {
  it("replaces a selection, backspaces, inserts newlines and moves across lines", () => {
    expect(editText({ value: "abc", start: 1, end: 2 }, "X")).toEqual({ value: "aXc", start: 2, end: 2 });
    expect(editText({ value: "abc", start: 0, end: 0 }, "Backspace").value).toBe("abc");
    const next = editText({ value: "ab", start: 1, end: 1 }, "Enter");
    expect(next).toEqual({ value: "a\nb", start: 2, end: 2 });
    expect(editText({ value: "abcd\nxy\n1234", start: 9, end: 9 }, "ArrowUp").start).toBe(6);
    expect(editText({ value: "abcd\nxy", start: 2, end: 2 }, "ArrowDown").start).toBe(7);
    expect(editText({ value: "ab", start: 1, end: 2 }, "ArrowLeft").start).toBe(1);
    expect(editText({ value: "ab", start: 1, end: 2 }, "ArrowRight").start).toBe(2);
    expect(editText(next, "Control")).toEqual(next);
  });
  it("maps visible keys, one-shot Shift, Caps, Space, Enter, arrows and Backspace to a real text port", () => {
    const input = new NotebookInputController(); let selection = { value: "", start: 0, end: 0 };
    input.port = { read: () => selection, write: (next) => { selection = next; }, focus: () => {} };
    for (const label of ["shift", "A", "space", "B", "enter", "C", "⌫", "caps", "D", "shift", "E"]) input.key(label);
    expect(selection.value).toBe("A b\nDe");
    input.key("←"); input.key("space"); expect(selection.value).toBe("A b\nD e");
    expect(NOTEBOOK_KEYS.every((key) => Number.isFinite(key.x) && key.width > 0)).toBe(true);
    expect(input.pressed.has("space")).toBe(true);
  });
  it("never sends virtual typing into an external iframe", () => {
    const input = new NotebookInputController(); input.external = true; let writes = 0;
    input.port = { read: () => ({ value: "", start: 0, end: 0 }), write: () => { writes++; }, focus: () => {} };
    input.key("A"); expect(writes).toBe(0);
  });
});
describe("normalized pointer", () => {
  it("clamps movement, ignores invalid samples, and retains coordinates while its view remounts", () => {
    const pointer = new NotebookPointerController(); pointer.move(100, -100);
    expect([pointer.x, pointer.y]).toEqual([1, 0]); pointer.move(NaN, Infinity);
    expect([pointer.x, pointer.y]).toEqual([1, 0]); pointer.bind(null);
    expect([pointer.x, pointer.y]).toEqual([1, 0]);
  });
});
