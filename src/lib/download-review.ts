type Reviewable = { id: string; cv: unknown; status: string; checkedCv?: string };

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
    return checkSignature(candidate.cv) !== candidate.checkedCv;
  });
}
// Fingerprint of the CV's words, ignoring formatting markers, spacing and entry order,
// so tidying or date re-sorting after a check doesn't count as new content.
export function checkSignature(cv: unknown): string {
  const parts: string[] = [];
  const walk = (value: unknown) => {
    if (typeof value === "string") {
      const text = value.replace(/\*\*|__|\*/g, "").replace(/\s+/g, " ").trim();
      if (text) parts.push(text);
    } else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") Object.keys(value).sort().forEach((key) => walk((value as Record<string, unknown>)[key]));
  };
  walk(cv);
  return parts.sort().join("\u0000");
}
