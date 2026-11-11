import { describe, expect, it } from "vitest";
import { sortByDate } from "./cv-dates";
const e = (startDate: string | null, endDate: string | null, id: string) => ({ startDate, endDate, id });
describe("sortByDate", () => {
  it("places a role between two existing ones chronologically, newest first", () => {
    const out = sortByDate([e("2023", "2024", "a"), e("2015", "2018", "c"), e("2019", "2022", "b")]);
    expect(out.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
  it("puts current roles and undated new entries on top", () => {
    const out = sortByDate([e("2023", "2024", "a"), e("Jan 2025", "Present", "p"), e(null, null, "new")]);
    expect(out.map((x) => x.id)).toEqual(["new", "p", "a"]);
  });
  it("uses months within the same year", () => {
    const out = sortByDate([e("Jan 2020", "Mar 2021", "a"), e("Apr 2021", "Nov 2021", "b")]);
    expect(out.map((x) => x.id)).toEqual(["b", "a"]);
  });
});
