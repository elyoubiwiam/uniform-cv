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
  hyperlinks: z.array(z.object({ text: z.string(), url: z.string() })),
});

export type CV = z.infer<typeof cvSchema>;

export type Template = {
  agencyName: string;
  accentColor: string;
  logoDataUrl: string | null;
  hideContactDetails: boolean;
  footerNote: string;
  anonymise: boolean;
  font: "helvetica" | "times";
  align: "left" | "center";
};

export const defaultTemplate: Template = {
  agencyName: "",
  accentColor: "#C2512B",
  logoDataUrl: null,
  hideContactDetails: false,
  footerNote: "",
  anonymise: false,
  font: "helvetica",
  align: "left",
};

export type StylePreset = { id: string; name: string; note: string; accentColor: string; font: Template["font"]; align: Template["align"] };

export const stylePresets: StylePreset[] = [
  { id: "classic", name: "Classic", note: "Clean sans, left aligned", accentColor: "#C2512B", font: "helvetica", align: "left" },
  { id: "executive", name: "Executive", note: "Serif, centred header", accentColor: "#1F3A5F", font: "times", align: "center" },
  { id: "modern", name: "Modern", note: "Sans, teal accents", accentColor: "#0F766E", font: "helvetica", align: "left" },
  { id: "minimal", name: "Minimal", note: "Serif, quiet charcoal", accentColor: "#374151", font: "times", align: "left" },
];
