import { z } from "zod";

export const cvSchema = z.object({
  fullName: z.string(),
  headline: z.string().nullable(),
  location: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  links: z.array(z.string()),
  summary: z.string().nullable(),
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      location: z.string().nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      bullets: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      institution: z.string(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      details: z.string().nullable(),
    }),
  ),
  skills: z.array(z.string()),
  languages: z.array(z.string()),
  certifications: z.array(z.string()),
  interests: z.array(z.string()),
  hyperlinks: z.array(z.object({ text: z.string(), url: z.string() })),
});

export type CV = z.infer<typeof cvSchema>;

export type Template = {
  audience: "recruiter" | "candidate";
  agencyName: string;
  accentColor: string;
  logoDataUrl: string | null;
  hideContactDetails: boolean;
  footerNote: string;
  anonymise: boolean;
  font: "helvetica" | "times";
  align: "left" | "center";
  consultantName: string;
  consultantTitle: string;
  consultantEmail: string;
  consultantPhone: string;
  agencyAddress: string;
  agencyWebsite: string;
};

export const defaultTemplate: Template = {
  audience: "recruiter",
  agencyName: "",
  accentColor: "#C2512B",
  logoDataUrl: null,
  hideContactDetails: false,
  footerNote: "",
  anonymise: false,
  font: "helvetica",
  align: "left",
  consultantName: "",
  consultantTitle: "",
  consultantEmail: "",
  consultantPhone: "",
  agencyAddress: "",
  agencyWebsite: "",
};

/** Candidates never get agency branding or anonymisation, even if fields were filled in recruiter mode. */
export function effectiveTemplate(t: Template): Template {
  if (t.audience !== "candidate") return t;
  return {
    ...t,
    agencyName: "",
    logoDataUrl: null,
    footerNote: "",
    anonymise: false,
    hideContactDetails: false,
    consultantName: "",
    consultantTitle: "",
    consultantEmail: "",
    consultantPhone: "",
    agencyAddress: "",
    agencyWebsite: "",
  };
}

export function consultantLine(t: Template) {
  const who = [t.consultantName, t.consultantTitle].filter(Boolean).join(", ");
  const rest = [t.consultantEmail, t.consultantPhone].filter(Boolean);
  if (!who && !rest.length) return "";
  return `Presented by ${[who, ...rest].filter(Boolean).join("  ·  ")}`;
}

export function footerLines(t: Template): [string, string] {
  return [[t.agencyName, t.footerNote].filter(Boolean).join(" — "), [t.agencyAddress, t.agencyWebsite].filter(Boolean).join("  ·  ")];
}

export type StylePreset = { id: string; name: string; note: string; accentColor: string; font: Template["font"]; align: Template["align"] };

export const stylePresets: StylePreset[] = [
  { id: "classic", name: "Classic", note: "Clean sans, left aligned", accentColor: "#C2512B", font: "helvetica", align: "left" },
  { id: "executive", name: "Executive", note: "Serif, centred header", accentColor: "#1F3A5F", font: "times", align: "center" },
  { id: "modern", name: "Modern", note: "Sans, teal accents", accentColor: "#0F766E", font: "helvetica", align: "left" },
  { id: "minimal", name: "Minimal", note: "Serif, quiet charcoal", accentColor: "#374151", font: "times", align: "left" },
];

const INTEREST_HEADING = /^(hobbies|hobby|interests?|centres? d'intérêts?|centres? d'interet|loisirs|passions?|activities|personal interests?)\s*[:\-–]?\s*/i;

/** Safety net: if a category heading (e.g. "HOBBIES") ended up inside skills, move it and everything after into interests. */
export function separateCategories(cv: CV): CV {
  const idx = cv.skills.findIndex((s) => INTEREST_HEADING.test(s.trim()));
  if (idx === -1) return cv;
  const moved = cv.skills.slice(idx).map((s, i) => (i === 0 ? s.trim().replace(INTEREST_HEADING, "") : s)).filter((s) => s.trim());
  return { ...cv, skills: cv.skills.slice(0, idx), interests: [...moved, ...(cv.interests ?? [])] };
}
