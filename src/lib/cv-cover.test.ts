import { describe, expect, it } from "vitest";
import { cvSchema, defaultTemplate } from "./cv-schema";
import { formatAvailability, emptyRecruiterCover, recruiterCoverContent, salaryGBP } from "./cv-cover";

const cv = cvSchema.parse({ fullName: "Alex Reed", headline: null, location: "London", email: null, phone: null, links: [], summary: null, experience: [], education: [], skills: [], languages: [], certifications: [], interests: [], hyperlinks: [] });
describe("Recruiter cover information", () => {
  it("uses pound sterling for salary expectations", () => { expect(salaryGBP("55000")).toBe("£55000"); expect(salaryGBP("£60,000")).toBe("£60,000"); });
  it("keeps notice period on the cover", () => { expect(recruiterCoverContent(cv, defaultTemplate, { ...emptyRecruiterCover, noticePeriod: "4 weeks" })?.rows).toContainEqual(["Notice period", "4 weeks"]); });
  it("keeps current salary on the cover", () => { expect(recruiterCoverContent(cv, defaultTemplate, { ...emptyRecruiterCover, currentSalary: "45000" })?.rows).toContainEqual(["Current salary", "£45000"]); });
  it("uses the recruiter-entered candidate name", () => { expect(recruiterCoverContent(cv, defaultTemplate, { ...emptyRecruiterCover, candidateName: "Alexandra Reed" })?.name).toBe("Alexandra Reed"); });
  it("keeps the current or last employer", () => { expect(recruiterCoverContent(cv, defaultTemplate, { ...emptyRecruiterCover, employer: "Acme" })?.rows).toContainEqual(["Current / last employer", "Acme"]); });
  it("keeps the candidate location", () => { expect(recruiterCoverContent(cv, defaultTemplate, { ...emptyRecruiterCover, location: "Bristol" })?.rows).toContainEqual(["Location", "Bristol"]); });
  it("keeps relocation availability", () => { expect(recruiterCoverContent(cv, defaultTemplate, { ...emptyRecruiterCover, relocation: "yes" })?.rows).toContainEqual(["Able to relocate", "Yes"]); });
  it("keeps recruiter notes separate from CV text", () => { expect(recruiterCoverContent(cv, defaultTemplate, { ...emptyRecruiterCover, notes: "Interviewed on Tuesday" })?.notes).toBe("Interviewed on Tuesday"); expect(cv.summary).toBeNull(); });
  it("includes consultant details", () => { expect(recruiterCoverContent(cv, { ...defaultTemplate, consultantName: "Sarah Khan" })?.recruiter).toContain("Sarah Khan"); });
  it("omits the cover in candidate mode", () => { expect(recruiterCoverContent(cv, { ...defaultTemplate, audience: "candidate" })).toBeNull(); });
  it("does not leak recruiter-entered identifiers into anonymous covers", () => {
    const result = recruiterCoverContent(cv, { ...defaultTemplate, anonymise: true }, { ...emptyRecruiterCover, candidateName: "Secret Name", employer: "Secret Employer", location: "Secret Location", notes: "Secret Notes" });
    expect(result?.name).toBe("A. R"); expect(JSON.stringify(result)).not.toContain("Secret");
  });
  it("lists availability in week order with several ranges", () => { expect(formatAvailability({ wed: [{ from: "10:00", to: "11:30" }], mon: [{ from: "09:00", to: "12:00" }, { from: "14:00", to: "17:00" }] })).toBe("Mon 09:00–12:00, 14:00–17:00 · Wed 10:00–11:30"); });
  it("never shows Sunday", () => { expect(formatAvailability({ sun: [{ from: "09:00", to: "10:00" }] } as never)).toBe("Not provided"); });
  it("skips ranges ending before they start", () => { expect(formatAvailability({ tue: [{ from: "15:00", to: "09:00" }] })).toBe("Not provided"); });
  it("shows availability on the cover", () => { expect(recruiterCoverContent(cv, defaultTemplate, { ...emptyRecruiterCover, availability: { fri: [{ from: "09:00", to: "10:00" }] } })?.rows).toContainEqual(["Interview availability", "Fri 09:00–10:00"]); });
});
