import { effectiveTemplate, type CV, type Template } from "./cv-schema";

/** Recruiter-added information is separate from verbatim extracted CV text. */
export type RecruiterCover = {
  candidateName: string;
  noticePeriod: string;
  currentSalary: string;
  expectedSalary: string;
  employer: string;
  location: string;
  relocation: "" | "yes" | "no" | "discuss";
  notes: string;
};

export const emptyRecruiterCover: RecruiterCover = {
  candidateName: "", noticePeriod: "", currentSalary: "", expectedSalary: "",
  employer: "", location: "", relocation: "", notes: "",
};

export function salaryGBP(value: string) {
  const trimmed = value.trim();
  return trimmed ? `£${trimmed.replace(/^£\s*/, "")}` : "Not provided";
}

export function recruiterCoverContent(cv: CV, raw: Template, details?: RecruiterCover) {
  const template = effectiveTemplate(raw);
  if (template.audience !== "recruiter") return null;
  const cover = details ?? emptyRecruiterCover;
  const anonymousName = cv.fullName.trim().split(/\s+/).map((part) => part.charAt(0).toUpperCase()).join(". ");
  return {
    name: template.anonymise ? anonymousName || "Candidate" : cover.candidateName.trim() || cv.fullName || "Candidate",
    rows: [
      ["Notice period", cover.noticePeriod.trim() || "Not provided"],
      ["Current salary", salaryGBP(cover.currentSalary)],
      ["Salary expectations", salaryGBP(cover.expectedSalary)],
      ...(!template.anonymise ? [
        ["Current / last employer", cover.employer.trim() || cv.experience[0]?.company || "Not provided"],
        ["Location", cover.location.trim() || cv.location || "Not provided"],
      ] : []),
      ["Able to relocate", ({ yes: "Yes", no: "No", discuss: "Open to discussion", "": "Not provided" })[cover.relocation]],
    ] as [string, string][],
    // Free-form notes can identify a candidate; never leak them into anonymous exports.
    notes: template.anonymise ? "" : cover.notes.trim(),
    recruiter: [template.consultantName, template.consultantTitle, template.consultantEmail, template.consultantPhone, template.agencyAddress, template.agencyWebsite].filter(Boolean),
  };
}