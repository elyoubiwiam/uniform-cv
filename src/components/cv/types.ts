import type { CV } from "@/lib/cv-schema";

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
};
