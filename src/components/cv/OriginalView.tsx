import { useEffect, useState } from "react";
import { PdfFirstPage } from "@/components/cv/PdfFirstPage";
import { Button } from "@/components/ui/button";
import { Minus, Plus, RotateCcw } from "lucide-react";

export function OriginalView({ file }: { file: File }) {
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
    setUrl(null); setHtml(null); setText(null);
    if (isPdf) return () => { cancelled = true; };
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

  if (isPdf) return <PdfFirstPage source={file} loadingLabel="Loading the original CV…" />;

  return (
    <div className="relative mx-auto w-full">
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border border-border bg-card/95 p-1 shadow-sm">
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}><Minus /></Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 min-w-14 px-1 tabular-nums" aria-label="Reset zoom" onClick={() => setZoom(1)}><RotateCcw className="h-3.5 w-3.5" /> {Math.round(zoom * 100)}%</Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Zoom in" disabled={zoom >= 3} onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}><Plus /></Button>
      </div>
      <div className="aspect-[1/1.414] w-full overflow-auto rounded-sm bg-card shadow-[0_1px_3px_rgb(0_0_0/0.08),0_12px_40px_-12px_rgb(0_0_0/0.18)]">
        <div style={{ width: `${zoom * 100}%` }} className="space-y-4">
          {isImg && url && <img src={url} alt="Original CV" className="block w-full" />}
          {html !== null && <div className="prose prose-sm max-w-none p-10 text-foreground [&_a]:text-accent" style={{ fontSize: `${zoom * 12}px` }} dangerouslySetInnerHTML={{ __html: html }} />}
          {text !== null && <pre className="whitespace-pre-wrap p-10 font-sans text-foreground" style={{ fontSize: `${zoom * 12}px` }}>{text}</pre>}
        </div>
      </div>
    </div>
  );
}
