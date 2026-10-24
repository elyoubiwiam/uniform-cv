import { describe, expect, it } from "vitest";
import { headerLinks } from "./cv-export";
import { cvSchema, defaultTemplate } from "./cv-schema";
import { hasCompleteTextLayer } from "./pdf-text";

const cv = cvSchema.parse({ fullName: "Jane Doe", headline: null, location: null, email: null, phone: null, links: [], summary: null, experience: [], education: [], skills: [], languages: [], certifications: [], interests: [], hyperlinks: [{ text: "Portfolio", url: "https://example.com/work" }] });

describe("Candidate header links", () => {
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