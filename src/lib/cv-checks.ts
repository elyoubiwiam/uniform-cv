import type { CV } from "@/lib/cv-schema";

/**
 * Plain-English list of things a client would expect to see that this CV does not contain.
 * Informational only: nothing is added or changed, and the recruiter decides what to do.
 * Contact details are not expected when they are hidden or the CV is anonymised.
 */
export function missingDetails(cv: CV, options: { contactHidden: boolean }): string[] {
  const missing: string[] = [];
  if (!cv.fullName.trim()) missing.push("name");
  if (!options.contactHidden) {
    if (!cv.email?.trim()) missing.push("email");
    if (!cv.phone?.trim()) missing.push("phone number");
  }
  if (!cv.experience.length) {
    missing.push("work experience");
  } else {
    const undated = cv.experience.filter((role) => !role.startDate?.trim() && !role.endDate?.trim()).length;
    if (undated) missing.push(`dates on ${undated} ${undated === 1 ? "role" : "roles"}`);
  }
  return missing;
}
