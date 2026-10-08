import type { CV } from "@/lib/cv-schema";

/** After anonymisation removes words, repair what removal breaks: sentence-start capitals,
 * doubled spaces, orphaned punctuation and dangling joiners. Never changes other wording. */
export function tidySentence(s: string): string {
  let t = s
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:!?)])/g, "$1")
    .replace(/\(\s*\)/g, "")
    .replace(/,\s*([,.;:])/g, "$1")
    .replace(/^[\s,;:–—-]+/gm, "")
    .replace(/[ \t]+$/gm, "");
  // Capitalise the first letter of each line and after sentence-ending punctuation.
  t = t.replace(/(^|[.!?]\s+|\n\s*(?:[•\-*]\s*)?)([a-z])/g, (_m, pre: string, c: string) => pre + c.toUpperCase());
  return t;
}

export function tidyAnonymisedCv(cv: CV): CV {
  const fix = (v: string | null | undefined) => (typeof v === "string" ? tidySentence(v) : v);
  return {
    ...cv,
    summary: fix(cv.summary) as CV["summary"],
    experience: cv.experience.map((e) => ({ ...e, bullets: e.bullets.map((b) => tidySentence(b)) })),
  };
}
