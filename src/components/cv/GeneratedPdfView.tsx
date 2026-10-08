import { useEffect, useState } from "react";
import { PdfFirstPage } from "@/components/cv/PdfFirstPage";
import { buildPdf } from "@/lib/cv-export";
import type { CV, Template } from "@/lib/cv-schema";

export function GeneratedPdfView({ cv, template }: { cv: CV; template: Template }) {
  const source = JSON.stringify({ cv, template });
  const [result, setResult] = useState<{ source: string; blob: Blob } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const input: { cv: CV; template: Template } = JSON.parse(source);
        const blob = await buildPdf(input.cv, input.template);
        if (!cancelled) setResult({ source, blob });
      } catch {
        if (!cancelled) setResult(null);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [source]);

  const blob = result?.source === source ? result.blob : null;
  return blob ? (
    <PdfFirstPage source={blob} loadingLabel="Loading the uniformed CV…" />
  ) : (
    <div className="aspect-[1/1.414] w-full rounded-sm bg-card p-6 text-sm text-muted-foreground shadow-[0_1px_3px_rgb(0_0_0/0.08),0_12px_40px_-12px_rgb(0_0_0/0.18)]">
      Creating the uniformed PDF…
    </div>
  );
}