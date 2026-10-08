import { describe, it, expect } from "vitest";
import { separateCategories, type CV } from "./cv-schema";
const base = { fullName: "A", headline: null, location: null, email: null, phone: null, links: [], summary: null, experience: [], education: [], languages: [], certifications: [], interests: [], hyperlinks: [] } as Omit<CV, "skills">;
describe("separateCategories", () => {
  it("moves hobbies out of skills", () => {
    const cv = separateCategories({ ...base, skills: ["SEO", "React", "HOBBIES", "Volleyball", "Dance"] });
    expect(cv.skills).toEqual(["SEO", "React"]);
    expect(cv.interests).toEqual(["Volleyball", "Dance"]);
  });
  it("handles heading glued to first item", () => {
    const cv = separateCategories({ ...base, skills: ["SQL", "Hobbies: Pilates"] });
    expect(cv.interests).toEqual(["Pilates"]);
  });
});
