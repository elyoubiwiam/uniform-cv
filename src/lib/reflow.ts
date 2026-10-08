import type { CV } from "./cv-schema";

/** Undo visual line wrapping from the source layout; keep real paragraph breaks and list items. */
export function reflow(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n+/)
    .map((para) =>
      para
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .reduce((acc, line) => {
          if (!acc) return line;
          if (/^([•\-–*▪●◦]|\d+[.)])\s/.test(line)) return `${acc}\n${line}`;
          if (/[a-zà-ÿ]-$/.test(acc) && /^[a-zà-ÿ]/.test(line)) return acc.slice(0, -1) + line;
          return `${acc} ${line}`;
        }, ""),
    )
    .filter(Boolean)
    .join("\n\n");
}

export function reflowCv(cv: CV): CV {
  return {
    ...cv,
    summary: cv.summary ? reflow(cv.summary) : cv.summary,
    experience: cv.experience.map((r) => ({ ...r, bullets: r.bullets.map(reflow) })),
  };
}
