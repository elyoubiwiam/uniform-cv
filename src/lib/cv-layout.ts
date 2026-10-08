import { tidySpaces } from "./reflow";

export const cvSpacing = { lineHeight: 1.5, paragraphGap: 6, bulletGap: 3, entryGap: 10 } as const;

/** Preserve paragraph boundaries while normalising redundant whitespace only. */
export function cvParagraphs(text: string): string[] {
  return text.replace(/\r\n?/g, "\n").split(/\n[ \t]*\n+/)
    .map((paragraph) => tidySpaces(paragraph).trim()).filter(Boolean);
}