export type NotebookKey = { label: string; x: number; z: number; width: number };
export const KEY_DEPTH = .18;
const KEY_PITCH = .23, KEY_GAP = .035, ROW_START = -.76, ROW_PITCH = .24;
type Unit = readonly [string | null, number];
const rows: readonly (readonly Unit[])[] = [
  [["esc", 1], ..."1234567890".split("").map((label): Unit => [label, 1]), ["⌫", 2]],
  [["tab", 1.5], ..."QWERTYUIOP".split("").map((label): Unit => [label, 1]), ["\\", 1.5]],
  [["caps", 1.75], ..."ASDFGHJKL".split("").map((label): Unit => [label, 1]), ["enter", 2.25]],
  [["shift", 1.75], ..."ZXCVBNM,.".split("").map((label): Unit => [label, 1]), [null, .25], ["↑", 1], ["shift", 1]],
  [["ctrl", 1.25], ["alt", 1.25], ["space", 6.25], ["alt", 1.25], ["←", 1], ["↓", 1], ["→", 1]],
];
export const NOTEBOOK_KEYS: readonly NotebookKey[] = rows.flatMap((row, index) => {
  let offset = -1.495;
  return row.flatMap(([label, units]) => {
    const width = units * KEY_PITCH, x = offset + width / 2;
    offset += width;
    if (label === null) return []; // Small separation from punctuation, not an invisible key.
    // The upper arrow shares Down's column and the same physical gap as the lower arrows.
    const z = label === "↑" ? ROW_START + (rows.length - 1) * ROW_PITCH - KEY_DEPTH - KEY_GAP : ROW_START + index * ROW_PITCH;
    return [{ label, x, z, width: width - KEY_GAP }];
  });
});
