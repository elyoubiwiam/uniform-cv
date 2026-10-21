import { useEffect, useState } from "react";
import { buildPdf } from "@/lib/cv-export";
import type { CV, Template } from "@/lib/cv-schema";
import type { RecruiterCover } from "@/lib/cv-cover";

/** Counts the actual export, rather than estimating from the screen preview. */
export function PdfPageCount({ cv, template, cover }: { cv: CV; template: Template; cover?: RecruiterCover | undefined }) {
  const source = JSON.stringify({ cv, template, cover });
  const [result, setResult] = useState<{ source: string; pages: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const input: { cv: CV; template: Template; cover?: RecruiterCover | undefined } = JSON.parse(source);
        const blob = await buildPdf(input.cv, input.template, input.cover);
        const { PDFDocument } = await import("pdf-lib");
        const pdf = await PDFDocument.load(await blob.arrayBuffer());
        if (!cancelled) setResult({ source, pages: pdf.getPageCount() });
      } catch {
        if (!cancelled) setResult(null);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [source]);

  const pages = result?.source === source ? result.pages : null;
  return <span aria-live="polite"> · {pages === null ? "PDF pages…" : `${pages} PDF ${pages === 1 ? "page" : "pages"}`}</span>;
}