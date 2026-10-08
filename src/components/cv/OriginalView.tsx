import { useEffect, useState } from "react";

export function OriginalView({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const name = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
  const isImg = file.type.startsWith("image/");
  const isDocx = name.endsWith(".docx");

  useEffect(() => {
    let cancelled = false;
    if (isPdf || isImg) {
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
        if (!cancelled) setHtml(null), setUrl(null), setText(t);
      }
    })();
    return () => { cancelled = true; };
  }, [file]);
  const [text, setText] = useState<string | null>(null);

  return (
    <div className="h-[calc(100vh-220px)] min-h-[500px] overflow-auto rounded-md border bg-card">
      {isPdf && url && <iframe src={url} title="Original CV" className="h-full w-full" />}
      {isImg && url && <img src={url} alt="Original CV" className="w-full" />}
      {html !== null && <div className="prose prose-sm max-w-none p-6 text-foreground [&_a]:text-accent" dangerouslySetInnerHTML={{ __html: html }} />}
      {text !== null && <pre className="whitespace-pre-wrap p-6 font-sans text-sm text-foreground">{text}</pre>}
    </div>
  );
}
