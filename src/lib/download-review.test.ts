import { describe, expect, it } from "vitest";
import { downloadReviewIds, idsNeedingReview } from "./download-review";

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

describe("skip re-checking unchanged, already checked CVs", () => {
  const cv = { fullName: "Alex" };
  it("skips a CV checked once whose text hasn't changed since", () => {
    const candidates = [{ id: "one", cv, status: "ready", checkedCv: JSON.stringify(cv) }];
    expect(idsNeedingReview(candidates, ["one"])).toEqual([]);
  });
  it("asks again when the text was edited after the last check", () => {
    const candidates = [{ id: "one", cv, status: "ready", checkedCv: JSON.stringify({ ...cv, fullName: "Old" }) }];
    expect(idsNeedingReview(candidates, ["one"])).toEqual(["one"]);
  });
  it("asks when the CV was never checked", () => {
    const candidates = [{ id: "one", cv, status: "ready" }];
    expect(idsNeedingReview(candidates, ["one"])).toEqual(["one"]);
  });
  it("only skips the unchanged CVs in a batch and keeps the rest", () => {
    const candidates = [
      { id: "checked", cv, status: "ready", checkedCv: JSON.stringify(cv) },
      { id: "edited", cv, status: "ready", checkedCv: JSON.stringify({ ...cv, fullName: "Old" }) },
    ];
    expect(idsNeedingReview(candidates, ["checked", "edited"])).toEqual(["edited"]);
  });
});
