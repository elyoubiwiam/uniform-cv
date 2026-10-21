import type { CV } from "@/lib/cv-schema";
import type { Issue } from "@/lib/proofread";
import type { RecruiterCover } from "@/lib/cv-cover";

export type Status = "queued" | "reading" | "ready" | "approved" | "error";

export type Candidate = {
  id: string;
  file: File;
  status: Status;
  cv: CV | null;
  originalCv: CV | null;
  shortenAttempt: number;
  shortening: boolean;
  error: string | null;
  issues?: Issue[];
  checking?: boolean;
  // Snapshot of the CV text at the last successful spelling check, so we only re-prompt when the text changed since.
  checkedCv?: string;
  scanned?: boolean;
  cover?: RecruiterCover;
};
