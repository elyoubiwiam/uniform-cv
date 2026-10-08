/** Conservative fast path: every page needs a usable text layer; otherwise use the original PDF. */
export function hasCompleteTextLayer(pages: string[]) {
  return pages.length > 0 && pages.every((text) => text.trim().length >= 80 && !text.includes("\uFFFD"));
}

export async function readPdfText(buffer: ArrayBuffer): Promise<{ text: string; hyperlinks: string[] } | null> {
  const [pdfjs, worker] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const task = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  try {
    const pdf = await task.promise;
    const pages: string[] = [];
    const hyperlinks: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const [content, annotations] = await Promise.all([page.getTextContent(), page.getAnnotations()]);
      const items = content.items.filter((item) => "str" in item);
      // Rebuild lines by position; a larger vertical gap marks a real paragraph break.
      let out = "";
      let lastY: number | null = null;
      let lastH = 10;
      for (const item of items) {
        if (!item.str) continue;
        const y = item.transform[5] ?? 0;
        const h = Math.abs(item.transform[3] ?? 10) || 10;
        if (lastY !== null && Math.abs(lastY - y) > h * 0.5) {
          out = out.trimEnd() + (Math.abs(lastY - y) > Math.max(h, lastH) * 1.8 ? "\n\n" : "\n");
        } else if (out && !/\s$/.test(out) && !/^\s/.test(item.str)) out += " ";
        out += item.str;
        lastY = y;
        lastH = h;
      }
      pages.push(out);
      for (const annotation of annotations) {
        if (!annotation.url) continue;
        const rect = annotation.rect as number[];
        const [left = 0, bottom = 0, right = 0, top = 0] = rect;
        const title = items.filter((item) => {
          const x = item.transform[4] ?? 0;
          const y = item.transform[5] ?? 0;
          return x < right && x + item.width > left && y >= bottom - 3 && y <= top + 3;
        }).map((item) => item.str).join(" ").trim();
        hyperlinks.push(title ? `${title} -> ${annotation.url}` : annotation.url);
      }
    }
    return hasCompleteTextLayer(pages) ? { text: pages.join("\n\n"), hyperlinks: [...new Set(hyperlinks)].slice(0, 200) } : null;
  } finally {
    await task.destroy();
  }
}