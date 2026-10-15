export type NotebookKey = { label: string; x: number; z: number; width: number };
type Unit = readonly [string, number];
const rows: readonly (readonly Unit[])[] = [
  [["esc", 1], ..."1234567890".split("").map((label): Unit => [label, 1]), ["⌫", 2]],
  [["tab", 1.5], ..."QWERTYUIOP".split("").map((label): Unit => [label, 1]), ["\\", 1.5]],
  [["caps", 1.75], ..."ASDFGHJKL".split("").map((label): Unit => [label, 1]), ["enter", 2.25]],
  [["shift", 1.75], ..."ZXCVBNM,.".split("").map((label): Unit => [label, 1]), ["shift", 2.25]],
  [["ctrl", 1.25], ["↑", 1], ["alt", 1.25], ["space", 5], ["alt", 1.25], ["←", 1], ["↓", 1], ["→", 1.25]],
];
export const NOTEBOOK_KEYS: readonly NotebookKey[] = rows.flatMap((row, index) => {
  let offset = -1.495;
  return row.map(([label, units]) => {
    const width = units * .23;
    const key = { label, x: offset + width / 2, z: -.76 + index * .24, width: width - .035 };
    offset += width; return key;
  });
});
