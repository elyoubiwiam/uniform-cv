import { describe, expect, it } from "vitest";
import { downloadReviewIds } from "./download-review";

describe("spelling review before downloads", () => {
  const candidates = [
    { id: "first", cv: {}, status: "ready" },
    { id: "second", cv: {}, status: "approved" },
    { id: "waiting", cv: null, status: "reading" },
  ];
  it("covers the requested CV for individual PDF or Word downloads", () => {
    expect(downloadReviewIds(candidates, "first")).toEqual(["first"]);
  });
  it("covers only approved CVs when exporting an approved batch", () => {
    expect(downloadReviewIds(candidates)).toEqual(["second"]);
  });
  it("covers every readable CV when none are approved", () => {
    expect(downloadReviewIds(candidates.map((candidate) => ({ ...candidate, status: "ready" })))).toEqual(["first", "second"]);
  });
});