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