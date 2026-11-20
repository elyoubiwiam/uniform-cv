import { defaultTemplate, type Template } from "@/lib/cv-schema";

const MARKER = "uniformTemplate";

/** Template as a small JSON file, so it can be kept as a backup, moved to another computer or shared with colleagues. */
export function templateFileContents(template: Template): string {
  return JSON.stringify({ [MARKER]: 1, ...template }, null, 2);
}

/**
 * Reads a template file. Only known settings with the right type are kept, anything else is ignored,
 * and the result is always a recruiter template. Returns null when the text is not a Uniform template file.
 */
export function parseTemplateFile(text: string): Template | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const data = raw as Record<string, unknown>;
  if (data[MARKER] !== 1) return null;

  const next: Record<string, unknown> = { ...defaultTemplate };
  for (const key of Object.keys(defaultTemplate) as (keyof Template)[]) {
    const value = data[key];
    if (key === "logoDataUrl") {
      if (value === null || (typeof value === "string" && /^data:image\/(png|jpeg|webp);base64,/i.test(value))) next[key] = value;
    } else if (key === "font") {
      if (value === "helvetica" || value === "times") next[key] = value;
    } else if (key === "align") {
      if (value === "left" || value === "center") next[key] = value;
    } else if (key === "accentColor") {
      if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)) next[key] = value;
    } else if (typeof value === typeof defaultTemplate[key]) {
      next[key] = value;
    }
  }
  return { ...(next as Template), audience: "recruiter" };
}
