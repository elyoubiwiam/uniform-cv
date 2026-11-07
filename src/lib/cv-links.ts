/** Destination identity: normalise the host, never case-sensitive paths or query values. */
export function linkKey(value: string): string {
  const trimmed = value.trim();
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return `${url.host.toLowerCase().replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "")}${url.search}${url.hash}`;
    }
    return url.href;
  } catch {
    return trimmed;
  }
}

export function uniqueLinks(values: string[]): string[] {
  const seen = new Set<string>();
  return values.map((value) => value.trim()).filter((value) => {
    const key = linkKey(value);
    if (!value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function uniqueHyperlinks(values: { text: string; url: string }[]) {
  const out: { text: string; url: string }[] = [];
  const positions = new Map<string, number>();
  for (const value of values) {
    const text = value.text.trim();
    const url = value.url.trim();
    if (!text || !url) continue;
    const key = linkKey(url);
    const index = positions.get(key);
    if (index === undefined) {
      positions.set(key, out.length);
      out.push({ text, url });
    } else {
      const previous = out[index];
      // Prefer the source's title over another copy of the raw destination.
      if (previous && linkKey(previous.text) === key && linkKey(text) !== key) out[index] = { text, url: previous.url };
    }
  }
  return out;
}

export function cleanCvLinks<T extends { links: string[]; hyperlinks: { text: string; url: string }[] }>(cv: T): T {
  const hyperlinks = uniqueHyperlinks(cv.hyperlinks);
  const titled = new Set(hyperlinks.map((link) => linkKey(link.url)));
  return { ...cv, hyperlinks, links: uniqueLinks(cv.links).filter((link) => !titled.has(linkKey(link))) };
}

/** The file's annotation targets are authoritative, not the model's reconstruction. */
export function sourceHyperlinks(values: string[]) {
  return uniqueHyperlinks(values.map((value) => {
    const separator = value.lastIndexOf(" -> ");
    return separator < 0 ? { text: value, url: value } : { text: value.slice(0, separator), url: value.slice(separator + 4) };
  }));
}

export type LinkTextItem = { str: string; width: number; transform: number[] };
export function annotationTitle(items: LinkTextItem[], rect: number[]): string {
  const [left = 0, bottom = 0, right = 0, top = 0] = rect;
  const overlapping = items.filter((item) => {
    const x = item.transform[4] ?? 0;
    const y = item.transform[5] ?? 0;
    const height = Math.abs(item.transform[3] ?? 10) || 10;
    return item.str.trim() && item.width > 0 && x < right && x + item.width > left && y <= top + 2 && y + height >= bottom;
  });
  // A tall annotation may overlap several lines. Use the line nearest its centre.
  const closest = overlapping.reduce<LinkTextItem | undefined>((best, item) => {
    const distance = (value: LinkTextItem) => Math.abs((value.transform[5] ?? 0) + Math.abs(value.transform[3] ?? 10) / 2 - (bottom + top) / 2);
    return !best || distance(item) < distance(best) ? item : best;
  }, undefined);
  if (!closest) return "";
  return overlapping.filter((item) => Math.abs((item.transform[5] ?? 0) - (closest.transform[5] ?? 0)) < 3)
    .sort((a, b) => (a.transform[4] ?? 0) - (b.transform[4] ?? 0))
    // Never copy an entire surrounding sentence from a partially covered text run.
    .filter((item) => {
      const x = item.transform[4] ?? 0;
      return Math.min(x + item.width, right) - Math.max(x, left) >= item.width * 0.8;
    }).map((item) => item.str).join(" ").trim();
}