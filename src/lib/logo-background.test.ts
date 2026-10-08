import { describe, expect, it } from "vitest";
import { clearLogoBackground, shouldOfferBackgroundRemoval } from "./logo-background";

describe("recruiter logo background consent", () => {
  it("asks for non-PNG uploads", () => {
    expect(shouldOfferBackgroundRemoval({ name: "logo.jpg", type: "image/jpeg" })).toBe(true);
    expect(shouldOfferBackgroundRemoval({ name: "logo.webp", type: "image/webp" })).toBe(true);
  });
  it("does not ask for PNG uploads", () => {
    expect(shouldOfferBackgroundRemoval({ name: "logo.PNG", type: "" })).toBe(false);
    expect(shouldOfferBackgroundRemoval({ name: "logo", type: "image/png" })).toBe(false);
  });
  it("clears the backdrop without changing the logo or original image", () => {
    const pixels = new Uint8ClampedArray(5 * 5 * 4).fill(255);
    for (const index of [6, 7, 8, 11, 13, 16, 17, 18]) pixels.set([20, 100, 180, 255], index * 4);
    const result = clearLogoBackground(pixels, 5, 5);
    expect(result[3]).toBe(0);
    expect([...result.slice(6 * 4, 6 * 4 + 4)]).toEqual([20, 100, 180, 255]);
    expect(result[12 * 4 + 3]).toBe(255); // enclosed white logo detail
    expect(pixels[3]).toBe(255);
  });
  it("does not erase a patterned backdrop with uncertain logo boundaries", () => {
    const pixels = new Uint8ClampedArray(5 * 5 * 4);
    for (let index = 0; index < 25; index++) pixels.set(index % 2 ? [255, 0, 0, 255] : [0, 0, 255, 255], index * 4);
    expect(() => clearLogoBackground(pixels, 5, 5)).toThrow("cannot be removed safely");
  });
});