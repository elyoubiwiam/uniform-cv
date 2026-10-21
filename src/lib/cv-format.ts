/** Inline formatting stored in CV text as markers: **bold**, *italic*, __underline__. */
export type Styled = { text: string; bold?: boolean | undefined; italic?: boolean | undefined; underline?: boolean | undefined };
export type Mark = "bold" | "italic" | "underline";
export const MARKERS: Record<Mark, string> = { bold: "**", italic: "*", underline: "__" };

const TOKEN = /(\*\*|__|\*)/;
const key = { "**": "bold", "*": "italic", "__": "underline" } as const;

export function hasFormatting(str: string) {
  return parseFormatting(str).some((s) => s.bold || s.italic || s.underline);
}

/** Split text into styled runs. A marker only counts when it has a matching partner. */
export function parseFormatting(str: string): Styled[] {
  const parts = str.split(TOKEN);
  const out: Styled[] = [];
  const state = { bold: false, italic: false, underline: false };
  const push = (text: string) => {
    if (!text) return;
    const last = out[out.length - 1];
    const style = { bold: state.bold || undefined, italic: state.italic || undefined, underline: state.underline || undefined };
    if (last && last.bold === style.bold && last.italic === style.italic && last.underline === style.underline) last.text += text;
    else out.push({ text, ...style });
  };
  parts.forEach((part, i) => {
    if (i % 2 === 0) return push(part);
    const k = key[part as keyof typeof key];
    const closesLater = parts.slice(i + 1).some((p, j) => j % 2 === 1 && p === part);
    if (state[k] || closesLater) state[k] = !state[k];
    else push(part);
  });
  return out;
}

export function stripFormatting(str: string) {
  return parseFormatting(str).map((s) => s.text).join("");
}

/** Wrap [start, end) of value in the marker; unwrap if already wrapped. Returns new value and selection. */
export function toggleMark(value: string, start: number, end: number, mark: Mark) {
  const m = MARKERS[mark];
  const sel = value.slice(start, end);
  const before = value.slice(start - m.length, start);
  const after = value.slice(end, end + m.length);
  if (before === m && after === m && !(mark === "italic" && (value.slice(start - 2, start) === "**" || value.slice(end, end + 2) === "**"))) {
    return { value: value.slice(0, start - m.length) + sel + value.slice(end + m.length), start: start - m.length, end: end - m.length };
  }
  const lead = sel.match(/^\s*/)![0].length;
  const trail = sel.match(/\s*$/)![0].length;
  const s = start + lead, e = Math.max(s, end - trail);
  return { value: value.slice(0, s) + m + value.slice(s, e) + m + value.slice(e), start: s + m.length, end: e + m.length };
}
