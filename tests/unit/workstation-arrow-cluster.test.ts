import { describe, expect, it } from "vitest";
import { KEY_DEPTH, NOTEBOOK_KEYS } from "@/features/workstation/input/keyboard-layout";
import { NotebookInputController } from "@/features/workstation/input/NotebookInputController";

const keyDepth = KEY_DEPTH; // Shared by keycap geometry, labels and the cluster's vertical gap.
const arrows = ["↑", "←", "↓", "→"] as const;
const key = (label: string) => NOTEBOOK_KEYS.find((item) => item.label === label)!;

describe("notebook inverted-T arrow cluster", () => {
  it("centres Up above Down and aligns the three lower arrows with equal spacing", () => {
    const up = key("↑"), left = key("←"), down = key("↓"), right = key("→");
    expect(up.x).toBeCloseTo(down.x, 8);
    expect(up.z).toBeLessThan(down.z);
    expect(left.z).toBe(down.z); expect(right.z).toBe(down.z);
    expect(left.x).toBeLessThan(down.x); expect(down.x).toBeLessThan(right.x);
    expect(down.x - left.x).toBeCloseTo(right.x - down.x, 8);
  });
  it("uses the neighbouring small-key width and the same physical gaps on both axes", () => {
    const left = key("←"), down = key("↓"), up = key("↑"), right = key("→");
    for (const label of arrows) expect(key(label).width).toBeCloseTo(key("A").width, 8);
    const horizontal = down.x - left.x - (down.width + left.width) / 2;
    expect(horizontal).toBeGreaterThan(0);
    expect(right.x - down.x - (right.width + down.width) / 2).toBeCloseTo(horizontal, 8);
    expect(down.z - up.z - keyDepth).toBeCloseTo(horizontal, 8);
  });
  it("keeps all four caps inside the keyboard recess without intersecting another key", () => {
    for (const label of arrows) {
      const arrow = key(label);
      expect(Math.abs(arrow.x) + arrow.width / 2).toBeLessThan(3.12 / 2);
      expect(Math.abs(arrow.z + .28) + keyDepth / 2).toBeLessThan(1.3 / 2);
      for (const other of NOTEBOOK_KEYS) {
        if (arrow === other) continue;
        const overlapX = Math.abs(arrow.x - other.x) < (arrow.width + other.width) / 2 - 1e-8;
        const overlapZ = Math.abs(arrow.z - other.z) < keyDepth - 1e-8;
        expect(overlapX && overlapZ, `${label} overlaps ${other.label}`).toBe(false);
      }
    }
  });
  it.each([["↑", 2], ["←", 6], ["↓", 12], ["→", 8]] as const)("the rendered instance for %s edits in the correct direction", (label, caret) => {
    const input = new NotebookInputController();
    let selection = { value: "abcd\nefgh\nijkl", start: 7, end: 7 };
    input.port = { read: () => selection, write: (next) => { selection = next; }, focus: () => {} };
    const instanceId = NOTEBOOK_KEYS.findIndex((item) => item.label === label);
    input.key(NOTEBOOK_KEYS[instanceId]!.label);
    expect(selection).toEqual({ value: "abcd\nefgh\nijkl", start: caret, end: caret });
    expect(input.pressed.has(label)).toBe(true);
  });
});
