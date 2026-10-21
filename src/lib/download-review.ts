type Reviewable = { id: string; cv: unknown; status: string };

// Resolve the exact CVs covered by the reminder and the eventual download.
export function downloadReviewIds(candidates: Reviewable[], candidateId?: string): string[] {
  const ready = candidates.filter((candidate) => candidate.cv != null);
  if (candidateId !== undefined) return ready.filter((candidate) => candidate.id === candidateId).map((candidate) => candidate.id);
  const approved = ready.filter((candidate) => candidate.status === "approved");
  return (approved.length ? approved : ready).map((candidate) => candidate.id);
}

// A CV only needs another check when its text changed since the last successful check.
export function idsNeedingReview(candidates: Reviewable[], ids: string[]): string[] {
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  return ids.filter((id) => {
    const candidate = byId.get(id);
    if (!candidate || candidate.cv == null) return false;
    return JSON.stringify(candidate.cv) !== candidate.checkedCv;
  });
}