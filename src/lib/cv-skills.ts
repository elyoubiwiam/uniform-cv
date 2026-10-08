/** Replace only list separators, never punctuation inside skill names. Keep named groups on their own lines. */
export function normalizeSkills(items: string[]): string[] {
  const output: string[] = [];
  let plain: string[] = [];
  const flush = () => { if (plain.length) output.push(plain.join(", ")); plain = []; };
  for (const line of items.flatMap((item) => item.split(/\r?\n/))) {
    const clean = line.trim().replace(/\s+[-–—.]\s+|\s*[•·▪●|;]\s*/g, ", ")
      .replace(/\s*,\s*/g, ", ").replace(/^(?:,\s*)+|(?:,\s*)+$/g, "").trim();
    if (!clean) continue;
    if (/^[^:,]+:\s*\S/.test(clean)) { flush(); output.push(clean); }
    else plain.push(clean);
  }
  flush();
  return output;
}