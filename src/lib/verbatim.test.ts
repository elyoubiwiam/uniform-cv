import { describe, expect, it } from "vitest";
import type { CV } from "./cv-schema";
import { anonymiseLeaks, checkVerbatim } from "./verbatim";

const cv: CV = {
  fullName: "Jane Doe",
  headline: "Marketing Manager",
  location: "Leeds",
  email: "jane@example.com",
  phone: "07700 900123",
  links: [],
  summary: "Results-driven marketer with strong communication skills.",
  experience: [{ title: "Marketing Manager", company: "Acme", location: null, startDate: "Jan 2020", endDate: "now", bullets: ["Led a team of five."] }],
  education: [{ degree: "BSc Psychology", institution: "York", startDate: "2015", endDate: "2018", details: null }],
  skills: ["SEO, Copywriting"],
  languages: ["French"],
  certifications: [],
  interests: ["Volleyball"],
  hyperlinks: [],
};

const source = `Jane Doe
Marketing Manager | Leeds | jane@example.com | 07700 900123
PROFILE
Results-driven marketer with strong commu-
nication skills.
EXPERIENCE
Marketing Manager, Acme, Jan 2020 to now
Led a team of five.
EDUCATION
BSc Psychology, York, 2015 to 2018
SKILLS
SEO, Copywriting
LANGUAGES
French
HOBBIES
Volleyball`;

describe("checkVerbatim", () => {
  it("passes a CV copied word for word, ignoring headings and PDF line breaks", () => {
    expect(checkVerbatim(source, cv)).toEqual({ passed: true, added: [], missingCount: 0, missingSample: [] });
  });

  it("handles words a PDF split in two", () => {
    const split = source.replace("Psychology", "Psych ology");
    expect(checkVerbatim(split, cv).passed).toBe(true);
  });

  it("flags reworded text", () => {
    const changed = { ...cv, experience: [{ ...cv.experience[0]!, bullets: ["Managed a team of five."] }] };
    const result = checkVerbatim(source, changed);
    expect(result.passed).toBe(false);
    expect(result.added).toEqual(["managed"]);
  });

  it("flags a normalised date", () => {
    const changed = { ...cv, experience: [{ ...cv.experience[0]!, endDate: "Present" }] };
    expect(checkVerbatim(source, changed).added).toEqual(["present"]);
  });

  it("flags a large dropped section, even when its words appear elsewhere", () => {
    const dropped = `${source}\n${"Led the marketing team and the team of five at Acme in Leeds with strong skills. ".repeat(4)}`;
    const result = checkVerbatim(dropped, cv);
    expect(result.passed).toBe(false);
    expect(result.missingCount).toBeGreaterThan(20);
  });

  it("allows initials in an anonymised CV", () => {
    expect(checkVerbatim(source, { ...cv, fullName: "J. D." }, true).passed).toBe(true);
  });
});

describe("anonymiseLeaks", () => {
  const clean = { ...cv, fullName: "J. D.", email: null, phone: null };

  it("finds nothing when contact details are gone", () => {
    expect(anonymiseLeaks(source, clean)).toEqual([]);
  });

  it("finds an email or phone number left behind", () => {
    const leaked = { ...clean, summary: "Call 07700900123 or write to Jane@example.com." };
    expect(anonymiseLeaks(source, leaked)).toEqual(["jane@example.com", "07700 900123"]);
  });

  it("finds a LinkedIn profile left in the links", () => {
    const withProfile = `${source}\nlinkedin.com/in/janedoe`;
    const leaked = { ...clean, hyperlinks: [{ text: "LinkedIn", url: "https://www.linkedin.com/in/janedoe" }] };
    expect(anonymiseLeaks(withProfile, leaked)).toEqual(["linkedin.com/in/janedoe"]);
  });

  it("doesn't treat dates as phone numbers", () => {
    expect(anonymiseLeaks("2015 - 2018 - 2020", { ...clean, summary: "2015 - 2018" })).toEqual([]);
  });
});
