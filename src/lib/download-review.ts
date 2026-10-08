type Reviewable = { id: string; cv: unknown; status: string };

// Resolve the exact CVs covered by the reminder and the eventual download.
export function downloadReviewIds(candidates: Reviewable[], candidateId?: string): string[] {
  const ready = candidates.filter((candidate) => candidate.cv != null);
  if (candidateId !== undefined) return ready.filter((candidate) => candidate.id === candidateId).map((candidate) => candidate.id);
  const approved = ready.filter((candidate) => candidate.status === "approved");
  return (approved.length ? approved : ready).map((candidate) => candidate.id);
}