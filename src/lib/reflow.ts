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

/** Remove stray spaces: doubled spaces between words and spaces before a full stop/comma ending a phrase. */
export function tidySpaces(text: string): string {
  return text
    .replace(/[ \t\u00a0]{2,}/g, " ")
    .replace(/[ \t\u00a0]+([.,;])(?=\s|$)/g, "$1")
    .replace(/[ \t]+$/gm, "");
}

const tidy = (s: string | null) => (s ? tidySpaces(s) : s);

export function reflowCv(cv: CV): CV {
  return {
    ...cv,
    headline: tidy(cv.headline),
    summary: cv.summary ? tidySpaces(reflow(cv.summary)) : cv.summary,
    experience: cv.experience.map((r) => ({ ...r, bullets: r.bullets.map((b) => tidySpaces(reflow(b))) })),
    education: cv.education.map((e) => ({ ...e, details: tidy(e.details) })),
    skills: cv.skills.map(tidySpaces),
    interests: (cv.interests ?? []).map(tidySpaces),
    certifications: cv.certifications.map(tidySpaces),
  };
}
