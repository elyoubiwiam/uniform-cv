/** Fit branding within a small footer box without stretching or enlarging it. */
export function footerLogoSize(width: number, height: number) {
  if (width <= 0 || height <= 0 || !Number.isFinite(width + height)) return { width: 0, height: 0 };
  const scale = Math.min(72 / width, 24 / height, 1);
  return { width: width * scale, height: height * scale };
}