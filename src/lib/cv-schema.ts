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
});

export type CV = z.infer<typeof cvSchema>;

export type Template = {
  agencyName: string;
  accentColor: string;
  logoDataUrl: string | null;
  hideContactDetails: boolean;
  footerNote: string;
};

export const defaultTemplate: Template = {
  agencyName: "",
  accentColor: "#C2512B",
  logoDataUrl: null,
  hideContactDetails: false,
  footerNote: "",
};
