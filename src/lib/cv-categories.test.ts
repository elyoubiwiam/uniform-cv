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
import { tidySpaces } from "./reflow";
describe("tidySpaces", () => {
  it("removes space before final point and doubled spaces", () => {
    expect(tidySpaces("Led  the team .")).toBe("Led the team.");
    expect(tidySpaces("Built apps , fast")).toBe("Built apps, fast");
  });
  it("keeps .NET", () => expect(tidySpaces("C# and .NET")).toBe("C# and .NET"));
});
