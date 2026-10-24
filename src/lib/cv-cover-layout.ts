import { cvParagraphs } from "./cv-layout";
import type { recruiterCoverContent } from "./cv-cover";

type CoverContent = NonNullable<ReturnType<typeof recruiterCoverContent>>;
type Tone = "ink" | "accent" | "muted";
export type CoverBlock = { lines: string[]; size: number; bold: boolean; tone: Tone; lineHeight: number; gap: number; logoHeight?: number };
type Measure = (text: string, size: number, bold: boolean, width: number) => string[];

/** Measure the entire cover before drawing it; shrink only this page, never CV text. */
export function fitRecruiterCover(content: CoverContent, agency: string, width: number, height: number, measure: Measure, logoHeight = 0) {
  const layout = (scale: number) => {
    const blocks: CoverBlock[] = [];
    const add = (text: string, size: number, bold = false, tone: Tone = "ink", gap = 0) => {
      const lines = cvParagraphs(text).flatMap((paragraph, index) => [
        ...(index ? [""] : []),
        ...paragraph.split("\n").flatMap((line) => measure(line, size * scale, bold, width)),
      ]);
      blocks.push({ lines, size: size * scale, bold, tone, lineHeight: size * scale * 1.5, gap: gap * scale });
    };
    add(agency || "Candidate presentation", 18, true, "accent", 18);
    if (logoHeight) blocks.push({ lines: [], size: 0, bold: false, tone: "ink", lineHeight: 0, gap: 24 * scale, logoHeight: logoHeight * scale });
    add("Candidate overview", 10, false, "muted", 8);
    add(content.name, 24, true, "ink", 20);
    for (const [label, value] of content.rows) {
      add(label, 9, false, "muted");
      add(value, 11, false, "ink", 12);
    }
    if (content.notes) {
      add("Recruiter notes", 11, true, "ink", 8);
      add(content.notes, 10, false, "ink", 20);
    }
    if (content.recruiter.length) {
      add("Presented by", 10, true, "accent", 6);
      for (const line of content.recruiter) add(line, 9, false, "muted");
    }
    return { blocks, scale, height: blocks.reduce((sum, block) => sum + block.lines.length * block.lineHeight + (block.logoHeight ?? 0) + block.gap, 0) };
  };
  const full = layout(1);
  if (full.height <= height) return full;
  let low = 0;
  let high = 1;
  for (let i = 0; i < 32; i++) {
    const middle = (low + high) / 2;
    if (layout(middle).height <= height) low = middle;
    else high = middle;
  }
  return layout(low);
}