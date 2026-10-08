import { describe, expect, it } from "vitest";
import { normalizeSkills } from "./cv-skills";

describe("parser-friendly skill separators", () => {
  it("uses plain commas instead of mixed hyphens and dots", () => {
    expect(normalizeSkills(["Social Media Planning - SEO . Hootsuite", "Figma · Adobe Suite"])).toEqual(["Social Media Planning, SEO, Hootsuite, Figma, Adobe Suite"]);
  });
  it("keeps the supplied category groups distinct", () => {
    const groups = ["AI & Automation: Claude, Lovable, AI automations", "Web & Data: Python, React, SQL, HTML, CSS, MongoDB, Google Data Studio", "Design & UX: Figma, Adobe Suite, user research", "Marketing: SEO, social media planning, Hootsuite"];
    expect(normalizeSkills(groups)).toEqual(groups);
  });
  it("preserves punctuation within actual skill names", () => {
    expect(normalizeSkills(["scikit-learn - Node.js - .NET - C++ - CI/CD"])).toEqual(["scikit-learn, Node.js, .NET, C++, CI/CD"]);
  });
  it("is stable across repeated editing and formatting", () => {
    const skills = normalizeSkills(["Marketing: SEO - Hootsuite\nDesign & UX: Figma · Adobe Suite"]);
    expect(normalizeSkills(skills)).toEqual(skills);
  });
});