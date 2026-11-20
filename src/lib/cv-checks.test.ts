import { describe, expect, it } from "vitest";
import { cvSchema } from "./cv-schema";
import { missingDetails } from "./cv-checks";

const base = {
  fullName: "Alex Reed", headline: null, location: null, email: "alex@example.com", phone: "07700 900123", links: [], summary: null,
  experience: [{ title: "Analyst", company: "Acme", location: null, startDate: "2020", endDate: null, bullets: [] }],
  education: [], skills: [], languages: [], certifications: [], interests: [], hyperlinks: [],
};
const make = (patch: Record<string, unknown> = {}) => cvSchema.parse({ ...base, ...patch });

describe("Missing detail check", () => {
  it("reports nothing for a complete CV", () => { expect(missingDetails(make(), { contactHidden: false })).toEqual([]); });
  it("reports missing contact details", () => { expect(missingDetails(make({ email: null, phone: " " }), { contactHidden: false })).toEqual(["email", "phone number"]); });
  it("ignores contact details when they are hidden or anonymised", () => { expect(missingDetails(make({ email: null, phone: null }), { contactHidden: true })).toEqual([]); });
  it("reports missing work experience", () => { expect(missingDetails(make({ experience: [] }), { contactHidden: false })).toEqual(["work experience"]); });
  it("counts roles without any dates", () => {
    const role = { title: "Analyst", company: "Acme", location: null, startDate: null, endDate: null, bullets: [] };
    expect(missingDetails(make({ experience: [role, role] }), { contactHidden: false })).toEqual(["dates on 2 roles"]);
  });
});
