import { useEffect, useState } from "react";

export function OriginalView({ file }: { file: File }) {
  const [pages, setPages] = useState<string[] | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
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
            await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
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

  return (
    <div className="h-[calc(100vh-220px)] min-h-[500px] overflow-auto rounded-md border bg-card">
      {isPdf && (pages ? (
        <div className="space-y-4 bg-muted/40 p-4">
          {pages.map((src, i) => (
            <img key={i} src={src} alt={`Original CV page ${i + 1}`} className="mx-auto w-full max-w-[794px] rounded-sm shadow" />
          ))}
        </div>
      ) : (
        <p className="p-6 text-sm text-muted-foreground">Loading the original CV…</p>
      ))}
      {isImg && url && <img src={url} alt="Original CV" className="mx-auto w-full max-w-[794px]" />}
      {html !== null && <div className="prose prose-sm max-w-none p-6 text-foreground [&_a]:text-accent" dangerouslySetInnerHTML={{ __html: html }} />}
      {text !== null && <pre className="whitespace-pre-wrap p-6 font-sans text-sm text-foreground">{text}</pre>}
    </div>
  );
}
