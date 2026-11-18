import { describe, expect, it } from "vitest";
import { checkSignature, downloadReviewIds, idsNeedingReview } from "./download-review";

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
    const candidates = [{ id: "one", cv, status: "ready", checkedCv: checkSignature(cv) }];
    expect(idsNeedingReview(candidates, ["one"])).toEqual([]);
  });
  it("asks again when the text was edited after the last check", () => {
    const candidates = [{ id: "one", cv, status: "ready", checkedCv: checkSignature({ ...cv, fullName: "Old" }) }];
    expect(idsNeedingReview(candidates, ["one"])).toEqual(["one"]);
  });
  it("asks when the CV was never checked", () => {
    const candidates = [{ id: "one", cv, status: "ready" }];
    expect(idsNeedingReview(candidates, ["one"])).toEqual(["one"]);
  });
  it("only skips the unchanged CVs in a batch and keeps the rest", () => {
    const candidates = [
      { id: "checked", cv, status: "ready", checkedCv: checkSignature(cv) },
      { id: "edited", cv, status: "ready", checkedCv: checkSignature({ ...cv, fullName: "Old" }) },
    ];
    expect(idsNeedingReview(candidates, ["checked", "edited"])).toEqual(["edited"]);
  });
});

describe("checkSignature", () => {
  it("ignores spacing, formatting markers and entry order", () => {
    const a = { roles: [{ t: "Builder  2024" }, { t: "Exec 2022" }] };
    const b = { roles: [{ t: "Exec 2022" }, { t: "**Builder** 2024" }] };
    expect(checkSignature(a)).toBe(checkSignature(b));
  });
  it("changes when words are added", () => {
    expect(checkSignature({ t: "Builder" })).not.toBe(checkSignature({ t: "Builder new" }));
  });
});
