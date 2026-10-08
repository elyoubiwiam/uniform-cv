export type ImageType = "image/png" | "image/jpeg" | "image/webp";

/** Photos and scans of CVs are sent to the reader as images. */
export function imageType(name: string): ImageType | null {
  const n = name.toLowerCase();
  if (n.endsWith(".png")) return "image/png";
  if (/\.(jpe?g)$/.test(n)) return "image/jpeg";
  if (n.endsWith(".webp")) return "image/webp";
  return null;
}
