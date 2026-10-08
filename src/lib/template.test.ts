import { describe, expect, it } from "vitest";
import { consultantLine, defaultTemplate, effectiveTemplate } from "./cv-schema";
import { imageType } from "./file-kind";

const branded = { ...defaultTemplate, agencyName: "Northbridge", consultantName: "Sarah Khan", footerNote: "Confidential", anonymise: true };

describe("template audience", () => {
  it("candidate mode removes all agency branding and anonymisation", () => {
    const t = effectiveTemplate({ ...branded, audience: "candidate" });
    expect(t.agencyName).toBe("");
    expect(t.footerNote).toBe("");
    expect(consultantLine(t)).toBe("");
    expect(t.anonymise).toBe(false);
  });
  it("recruiter consultant block stays when anonymising", () => {
    expect(consultantLine(effectiveTemplate(branded))).toBe("Presented by Sarah Khan");
  });
});

describe("image uploads", () => {
  it("detects photo and scan files", () => {
    expect(imageType("cv.JPG")).toBe("image/jpeg");
    expect(imageType("scan.png")).toBe("image/png");
    expect(imageType("cv.pdf")).toBeNull();
  });
});
