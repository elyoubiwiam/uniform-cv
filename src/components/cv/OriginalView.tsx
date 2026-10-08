import { useEffect, useState } from "react";

export function OriginalView({ file }: { file: File }) {
  const [pages, setPages] = useState<string[] | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const name = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
  const isImg = file.type.startsWith("image/");
  const isDocx = name.endsWith(".docx");

  useEffect(() => {
    let cancelled = false;
    setPages(null); setUrl(null); setHtml(null); setText(null);
    if (isPdf) {
      (async () => {
        const [pdfjs, worker] = await Promise.all([
          import("pdfjs-dist"),
          import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
        ]);
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
        try {
          const pdf = await task.promise;
          const out: string[] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const base = page.getViewport({ scale: 1 });
            const scale = Math.min(3, 1400 / base.width);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport }).promise;
            out.push(canvas.toDataURL("image/png"));
          }
          if (!cancelled) setPages(out);
        } finally {
          await task.destroy();
        }
      })();
      return () => { cancelled = true; };
    }
    if (isImg) {
      const u = URL.createObjectURL(file);
      setUrl(u);
      return () => { cancelled = true; URL.revokeObjectURL(u); };
    }
    (async () => {
      if (isDocx) {
        const mammoth = await import("mammoth");
        const r = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
        if (!cancelled) setHtml(r.value);
      } else {
        const t = await file.text();
        if (!cancelled) setText(t);
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  const btn = "h-7 w-7 rounded border bg-card text-sm font-semibold hover:bg-muted disabled:opacity-40";
  return (
    <div className="relative w-full max-w-[640px] mx-auto">
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border bg-card/95 p-1 shadow-sm">
        <button type="button" aria-label="Zoom out" className={btn} disabled={zoom <= 0.5} onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}>−</button>
        <button type="button" aria-label="Reset zoom" className="h-7 min-w-12 rounded px-1 text-xs tabular-nums hover:bg-muted" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
        <button type="button" aria-label="Zoom in" className={btn} disabled={zoom >= 3} onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}>+</button>
      </div>
      <div className="aspect-[1/1.414] w-full overflow-auto rounded-sm bg-card shadow-[0_1px_3px_rgb(0_0_0/0.08),0_12px_40px_-12px_rgb(0_0_0/0.18)]">
        <div style={{ width: `${zoom * 100}%` }} className="space-y-4">
          {isPdf && (pages ? pages.map((src, i) => (
            <img key={i} src={src} alt={`Original CV page ${i + 1}`} className="block w-full" />
          )) : <p className="p-6 text-sm text-muted-foreground">Loading the original CV…</p>)}
          {isImg && url && <img src={url} alt="Original CV" className="block w-full" />}
          {html !== null && <div className="prose prose-sm max-w-none p-10 text-foreground [&_a]:text-accent" style={{ fontSize: `${zoom * 12}px` }} dangerouslySetInnerHTML={{ __html: html }} />}
          {text !== null && <pre className="whitespace-pre-wrap p-10 font-sans text-foreground" style={{ fontSize: `${zoom * 12}px` }}>{text}</pre>}
        </div>
      </div>
    </div>
  );
}
