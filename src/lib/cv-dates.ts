const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const PRESENT = /present|current|now|today|ongoing|aujourd|actuel/i;

/** Converts a CV date like "2023", "Mar 2024", "03/2024" or "Present" into a sortable number. */
export function dateValue(s: string | null | undefined): number | null {
  if (!s || !s.trim()) return null;
  if (PRESENT.test(s)) return Infinity;
  const year = s.match(/\b(19|20)\d{2}\b/);
  if (!year) return null;
  const lower = s.toLowerCase();
  let month = MONTHS.findIndex((m) => lower.includes(m)) + 1;
  if (!month) {
    const num = s.match(/\b(0?[1-9]|1[0-2])\s*[/.-]\s*(19|20)\d{2}\b/);
    month = num ? Number(num[1]) : 0;
  }
  return Number(year[0]) * 100 + month;
}

/** Most recent first. Entries without any date stay at the top (newly added). Stable for ties. */
export function sortByDate<T extends { startDate: string | null; endDate: string | null }>(items: T[]): T[] {
  const key = (x: T) => {
    const end = dateValue(x.endDate);
    const start = dateValue(x.startDate);
    return { end: end ?? start, start: start ?? end };
  };
  return items
    .map((item, i) => ({ item, i, k: key(item) }))
    .sort((a, b) => {
      const ae = a.k.end ?? Number.POSITIVE_INFINITY * 1, be = b.k.end ?? Number.POSITIVE_INFINITY * 1;
      const aUndated = a.k.end === null, bUndated = b.k.end === null;
      if (aUndated !== bUndated) return aUndated ? -1 : 1;
      if (ae !== be) return be > ae ? 1 : -1;
      const as = a.k.start ?? 0, bs = b.k.start ?? 0;
      if (as !== bs) return bs > as ? 1 : -1;
      return a.i - b.i;
    })
    .map((x) => x.item);
}
