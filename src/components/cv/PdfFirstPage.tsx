import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist";
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PdfFirstPage({ source, loadingLabel }: { source: Blob; loadingLabel: string }) {
  const [page, setPage] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(1);
  const documentRef = useRef<PDFDocumentProxy | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: PDFDocumentLoadingTask | null = null;
    setPage(null);
    setPageNumber(1);
    setPageCount(0);
    (async () => {
      const [pdfjs, worker] = await Promise.all([
        import("pdfjs-dist"),
        import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
      ]);
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      const task = pdfjs.getDocument({ data: new Uint8Array(await source.arrayBuffer()) });
      loadingTask = task;
      try {
        const pdf = await task.promise;
        if (cancelled) {
          await task.destroy();
          return;
        }
        documentRef.current = pdf;
        setPageCount(pdf.numPages);
      } catch {
        if (!cancelled) setPageCount(0);
      }
    })();
    return () => {
      cancelled = true;
      const document = documentRef.current;
      documentRef.current = null;
      if (document) void document.cleanup();
      if (loadingTask) void loadingTask.destroy();
    };
  }, [source]);

  useEffect(() => {
    const pdf = documentRef.current;
    if (!pdf || pageCount === 0) return;
    let cancelled = false;
    setPage(null);
    (async () => {
      const pdfPage = await pdf.getPage(pageNumber);
      const base = pdfPage.getViewport({ scale: 1 });
      const renderScale = Math.min(3, 1800 / base.width);
      const viewport = pdfPage.getViewport({ scale: renderScale });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await pdfPage.render({ canvas, canvasContext: context, viewport }).promise;
      if (!cancelled) setPage(canvas.toDataURL("image/png"));
    })();
    return () => { cancelled = true; };
  }, [pageCount, pageNumber]);

  return (
    <div className="relative mx-auto aspect-[1/1.414] w-full overflow-auto rounded-sm bg-card shadow-[0_1px_3px_rgb(0_0_0/0.08),0_12px_40px_-12px_rgb(0_0_0/0.18)]">
      {pageCount > 0 && (
        <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md border border-border bg-card/95 p-1 shadow-sm">
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Previous page" disabled={pageNumber <= 1} onClick={() => setPageNumber((value) => Math.max(1, value - 1))}>
            <ChevronLeft />
          </Button>
          <span className="min-w-20 px-1 text-center text-xs tabular-nums text-foreground" aria-live="polite">
            Page {pageNumber} of {pageCount}
          </span>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Next page" disabled={pageNumber >= pageCount} onClick={() => setPageNumber((value) => Math.min(pageCount, value + 1))}>
            <ChevronRight />
          </Button>
        </div>
      )}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border border-border bg-card/95 p-1 shadow-sm">
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom((value) => Math.max(0.5, +(value - 0.25).toFixed(2)))}>
          <Minus />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 min-w-14 px-1 tabular-nums" aria-label="Reset zoom" onClick={() => setZoom(1)}>
          <RotateCcw className="h-3.5 w-3.5" /> {Math.round(zoom * 100)}%
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Zoom in" disabled={zoom >= 3} onClick={() => setZoom((value) => Math.min(3, +(value + 0.25).toFixed(2)))}>
          <Plus />
        </Button>
      </div>
      {page ? (
        <img src={page} alt={`Page ${pageNumber} of CV`} className="block max-w-none" style={{ width: `${zoom * 100}%` }} />
      ) : (
        <p className="p-6 text-sm text-muted-foreground">{loadingLabel}</p>
      )}
    </div>
  );
}