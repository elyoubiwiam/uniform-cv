import { describe, expect, it } from "vitest";
import { footerLogoSize } from "./cv-footer";

describe("small recruiter footer logo", () => {
  it("bounds a wide logo to the footer width", () => {
    expect(footerLogoSize(1200, 200)).toEqual({ width: 72, height: 12 });
  });
  it("bounds a tall logo to the footer height", () => {
    expect(footerLogoSize(200, 1000)).toEqual({ width: 4.8, height: 24 });
  });
  it("does not enlarge small logos", () => {
    expect(footerLogoSize(20, 10)).toEqual({ width: 20, height: 10 });
  });
});