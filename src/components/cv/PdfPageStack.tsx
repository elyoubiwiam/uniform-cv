import { useEffect, useState } from "react";
import { buildPdf } from "@/lib/cv-export";
import type { CV, Template } from "@/lib/cv-schema";
import type { RecruiterCover } from "@/lib/cv-cover";

/** Every page of the real PDF export, stacked with visible page breaks. */
export function PdfPageStack({ cv, template, cover }: { cv: CV; template: Template; cover?: RecruiterCover | undefined }) {
  const source = JSON.stringify({ cv, template, cover });
  const [pages, setPages] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const input: { cv: CV; template: Template; cover?: RecruiterCover } = JSON.parse(source);
        const blob = await buildPdf(input.cv, input.template, input.cover);
        const [pdfjs, worker] = await Promise.all([import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.mjs?url")]);
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const task = pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) });
        const pdf = await task.promise;
        const images: string[] = [];
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: Math.min(3, 1400 / base.width) });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) continue;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvas, canvasContext: context, viewport }).promise;
          images.push(canvas.toDataURL("image/png"));
        }
        await task.destroy();
        if (!cancelled) setPages(images);
      } catch {
        if (!cancelled) setPages(null);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [source]);

  const heading = (
    <div className="mb-3 flex items-center justify-between gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output CV</p>
      {pages && <p className="text-xs text-muted-foreground">{pages.length} PDF page{pages.length === 1 ? "" : "s"}</p>}
    </div>
  );

  if (!pages) {
    return <div>{heading}<div className="aspect-[1/1.414] w-full rounded-sm bg-card p-6 text-sm text-muted-foreground shadow-sm">Creating the preview…</div></div>;
  }
  return (
    <div>
      {heading}
      <div className="space-y-2">
        {pages.map((src, i) => (
          <div key={i}>
            {i > 0 && (
              <div className="my-3 flex items-center gap-3 text-xs font-medium text-muted-foreground" aria-hidden="true">
                <span className="h-px flex-1 border-t border-dashed border-border" />
                Page break
                <span className="h-px flex-1 border-t border-dashed border-border" />
              </div>
            )}
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Page {i + 1} of {pages.length}</p>
            <img src={src} alt={`Page ${i + 1} of ${pages.length}`} className="block w-full rounded-sm bg-card shadow-[0_1px_3px_rgb(0_0_0/0.08),0_12px_40px_-12px_rgb(0_0_0/0.18)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
