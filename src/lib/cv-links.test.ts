import { describe, expect, it } from "vitest";
import { headerLinks } from "./cv-export";
import { cvSchema, defaultTemplate } from "./cv-schema";
import { hasCompleteTextLayer } from "./pdf-text";
import { annotationTitle, cleanCvLinks, sourceHyperlinks } from "./cv-links";

const cv = cvSchema.parse({ fullName: "Jane Doe", headline: null, location: null, email: null, phone: null, links: [], summary: null, experience: [], education: [], skills: [], languages: [], certifications: [], interests: [], hyperlinks: [{ text: "Portfolio", url: "https://example.com/work" }] });

describe("Candidate header links", () => {
  it("shows only one link for repeated versions of the same destination", () => {
    const repeated = { ...cv, hyperlinks: [
      { text: "Portfolio", url: "https://example.com/work" },
      { text: "Portfolio again", url: "http://www.example.com/work/" },
    ] };
    expect(headerLinks(repeated, defaultTemplate)).toEqual([{ text: "Portfolio", url: "https://example.com/work" }]);
  });
  it("keeps a single titled editor entry rather than duplicating it in plain links", () => {
    expect(cleanCvLinks({ ...cv, links: ["https://example.com/work", "http://www.example.com/work/"], hyperlinks: [...cv.hyperlinks, ...cv.hyperlinks] }))
      .toMatchObject({ links: [], hyperlinks: [{ text: "Portfolio", url: "https://example.com/work" }] });
  });
  it("retains distinct case-sensitive paths and queries", () => {
    expect(sourceHyperlinks(["One -> https://example.com/Work?a=A", "Two -> https://example.com/work?a=a"])).toHaveLength(2);
  });
  it("preserves the file's exact target and prefers its title to a bare URL", () => {
    expect(sourceHyperlinks(["https://example.com/work", "Portfolio -> https://example.com/work"]))
      .toEqual([{ text: "Portfolio", url: "https://example.com/work" }]);
  });
  it("does not scrape adjacent text into a PDF link title", () => {
    const item = (str: string, x: number, width: number, y = 100) => ({ str, width, transform: [10, 0, 0, 10, x, y] });
    expect(annotationTitle([item("Portfolio", 50, 50), item("Unrelated sentence", 105, 100), item("Other line", 50, 50, 120)], [50, 98, 100, 112])).toBe("Portfolio");
    expect(annotationTitle([item("A whole sentence containing a tiny linked word", 0, 300)], [100, 98, 120, 112])).toBe("");
  });
  it("retains a titled link even when its title appears nowhere in the CV body", () => {
    expect(headerLinks(cv, defaultTemplate)).toEqual([{ text: "Portfolio", url: "https://example.com/work" }]);
  });
  it("hides personal header links when anonymising", () => {
    expect(headerLinks(cv, { ...defaultTemplate, anonymise: true })).toEqual([]);
  });
  it("hides header links with contact details", () => {
    expect(headerLinks(cv, { ...defaultTemplate, hideContactDetails: true })).toEqual([]);
  });
  it("does not repeat a link already shown in the contact line", () => {
    const dup = {
      ...cv,
      links: ["https://jamesoconnor-demo.design", "behance.net/joc-demo"],
      hyperlinks: [
        { text: "portfolio", url: "jamesoconnor-demo.design/" },
        { text: "behance.net/joc-demo", url: "https://www.behance.net/joc-demo" },
        { text: "Portfolio", url: "https://example.com/work" },
      ],
    };
    expect(headerLinks(dup, defaultTemplate)).toEqual([{ text: "Portfolio", url: "https://example.com/work" }]);
  });
});

describe("PDF text fast path", () => {
  it("falls back to the original PDF if even one page has no text layer", () => {
    expect(hasCompleteTextLayer(["Original candidate experience. ".repeat(10), ""])).toBe(false);
  });
  it("uses text only when every page has readable content", () => {
    expect(hasCompleteTextLayer(["Original candidate experience. ".repeat(10), "Original education details. ".repeat(10)])).toBe(true);
  });
});