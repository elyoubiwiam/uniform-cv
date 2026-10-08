import { createFileRoute, Link } from "@tanstack/react-router";
import cvBefore from "@/assets/cv-before.jpg";
import cvAfter from "@/assets/cv-after.jpg";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { imageType, type ImageType } from "@/lib/file-kind";
import { AudiencePicker } from "@/components/cv/AudiencePicker";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, FileText, Loader2, RotateCw, Scissors, RefreshCw, Undo2, SpellCheck, EyeOff, Trash2, Upload, AlertCircle, FileDown } from "lucide-react";
import { toast } from "sonner";
import { checkCv, extractCv, shortenCv } from "@/lib/cv.functions";
import { liveIssues } from "@/lib/proofread";
import { StylePicker } from "@/components/cv/StylePicker";
import { defaultTemplate, effectiveTemplate, type CV, type Template } from "@/lib/cv-schema";
import { buildDocx, buildPdf, downloadBlob, safeFileName } from "@/lib/cv-export";
import type { Candidate } from "@/components/cv/types";
import { CvEditor } from "@/components/cv/CvEditor";
import { CvPreview } from "@/components/cv/CvPreview";
import { TemplateSettings } from "@/components/cv/TemplateSettings";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Uniform — Batch CV formatting for recruiters" },
      { name: "description", content: "Upload a stack of CVs, review them in one standard layout, and export client-ready PDF or Word files." },
      { property: "og:title", content: "Uniform — Batch CV formatting for recruiters" },
      { property: "og:description", content: "Turn a pile of CVs into one consistent, client-ready format in minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const MAX_BYTES = 10 * 1024 * 1024;
const CONCURRENCY = 3;
const TEMPLATE_KEY = "uniform.template.v1";

async function pdfLinks(buf: ArrayBuffer): Promise<string[]> {
  try {
    const { PDFDocument, PDFName, PDFDict, PDFArray, PDFString, PDFHexString } = await import("pdf-lib");
    const pdf = await PDFDocument.load(buf, { ignoreEncryption: true, updateMetadata: false });
    const urls = new Set<string>();
    for (const page of pdf.getPages()) {
      const annots = page.node.lookupMaybe(PDFName.of("Annots"), PDFArray);
      if (!annots) continue;
      for (let i = 0; i < annots.size(); i++) {
        const a = annots.lookupMaybe(i, PDFDict);
        const uri = a?.lookupMaybe(PDFName.of("A"), PDFDict)?.lookup(PDFName.of("URI"));
        if (uri instanceof PDFString || uri instanceof PDFHexString) urls.add(uri.decodeText());
      }
    }
    return [...urls].slice(0, 200);
  } catch {
    return [];
  }
}

type Payload = { kind: "pdf" | "text" | "image"; data: string; hyperlinks: string[]; mediaType?: ImageType };

function toBase64(ab: ArrayBuffer) {
  const buf = new Uint8Array(ab);
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function fileToPayload(file: File): Promise<Payload> {
  const name = file.name.toLowerCase();
  const img = imageType(name);
  if (img) return { kind: "image", data: toBase64(await file.arrayBuffer()), hyperlinks: [], mediaType: img };
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    const ab = await file.arrayBuffer();
    // Text-layer PDFs avoid a second document/OCR read by the model. Scans retain the original path.
    try {
      const { readPdfText } = await import("@/lib/pdf-text");
      const parsed = await readPdfText(ab.slice(0));
      if (parsed) return { kind: "text", data: parsed.text, hyperlinks: parsed.hyperlinks };
    } catch {
      // Damaged or unsupported text layers must never prevent the original PDF from being read.
    }
    const hyperlinks = await pdfLinks(ab.slice(0));
    return { kind: "pdf", data: toBase64(ab), hyperlinks };
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const ab = await file.arrayBuffer();
    const [{ value }, { value: html }] = await Promise.all([
      mammoth.extractRawText({ arrayBuffer: ab }),
      mammoth.convertToHtml({ arrayBuffer: ab }),
    ]);
    const anchors = Array.from(new DOMParser().parseFromString(html, "text/html").querySelectorAll("a[href]"));
    const hyperlinks = anchors
      .map((a) => `${a.textContent?.trim() ?? ""} -> ${a.getAttribute("href")}`)
      .filter((l) => !l.includes("-> #"))
      .slice(0, 200);
    return { kind: "text", data: value, hyperlinks };
  }
  return { kind: "text", data: await file.text(), hyperlinks: [] };
}

function Index() {
  const extract = useServerFn(extractCv);
  const shorten = useServerFn(shortenCv);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [template, setTemplate] = useState<Template>(defaultTemplate);
  const [dragging, setDragging] = useState(false);
  const [exporting, setExporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const running = useRef(new Set<string>());
  const templateRef = useRef(template);
  templateRef.current = template;

  const check = useServerFn(checkCv);
  const runCheck = async (c: Candidate) => {
    if (!c.cv) return;
    patch(c.id, { checking: true });
    const res = await check({ data: { cv: c.cv } }).catch(() => null);
    if (res?.ok) {
      patch(c.id, { checking: false, issues: res.issues.map((i) => ({ ...i, id: crypto.randomUUID() })) });
      if (!res.issues.length) toast.success("No spelling or grammar issues found.");
    } else {
      patch(c.id, { checking: false });
      toast.error(res && !res.ok ? res.error : "Couldn't check this CV. Try again.");
    }
  };

  const runShorten = async (c: Candidate) => {
    if (!c.originalCv) return;
    patch(c.id, { shortening: true });
    const res = await shorten({ data: { cv: c.originalCv, anonymise: effectiveTemplate(template).anonymise, attempt: c.shortenAttempt } }).catch(() => null);
    if (res?.ok) patch(c.id, { cv: res.cv, shortening: false, shortenAttempt: c.shortenAttempt + 1 });
    else {
      patch(c.id, { shortening: false });
      toast.error(res && !res.ok ? res.error : "Couldn't shorten this CV. Try again.");
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TEMPLATE_KEY);
      if (raw) setTemplate({ ...defaultTemplate, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);
  const updateTemplate = (t: Template) => {
    setTemplate(t);
    try {
      localStorage.setItem(TEMPLATE_KEY, JSON.stringify(t));
    } catch {
      toast.error("Logo is too large to save in this browser.");
    }
  };

  const patch = (id: string, p: Partial<Candidate>) => setCandidates((cs) => cs.map((c) => (c.id === id ? { ...c, ...p } : c)));

  const process = useCallback(
    async (c: Candidate) => {
      running.current.add(c.id);
      patch(c.id, { status: "reading", error: null });
      try {
        const payload = await fileToPayload(c.file);
        if (!payload.data.trim()) throw new Error("This file has no readable text.");
        const res = await extract({ data: { filename: c.file.name, ...payload, anonymise: effectiveTemplate(templateRef.current).anonymise } });
        if (res.ok) patch(c.id, { status: "ready", cv: res.cv, originalCv: res.cv, shortenAttempt: 0, scanned: payload.kind !== "text" });
        else patch(c.id, { status: "error", error: res.error });
      } catch (e) {
        patch(c.id, { status: "error", error: e instanceof Error ? e.message : "Couldn't read this file." });
      } finally {
        running.current.delete(c.id);
      }
    },
    [extract],
  );

  // simple queue
  useEffect(() => {
    const queued = candidates.filter((c) => c.status === "queued" && !running.current.has(c.id));
    const free = CONCURRENCY - running.current.size;
    queued.slice(0, Math.max(0, free)).forEach((c) => void process(c));
  }, [candidates, process]);

  const addFiles = (files: FileList | File[]) => {
    const next: Candidate[] = [];
    for (const f of Array.from(files)) {
      if (!/\.(pdf|docx|txt|png|jpe?g|webp)$/i.test(f.name)) {
        toast.error(`${f.name}: only PDF, Word (.docx), text or image (JPG, PNG, WEBP) files.`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} is larger than 10 MB.`);
        continue;
      }
      next.push({ id: crypto.randomUUID(), file: f, status: "queued", cv: null, originalCv: null, shortenAttempt: 0, shortening: false, error: null });
    }
    if (!next.length) return;
    setCandidates((cs) => [...cs, ...next]);
    setSelectedId((s) => s ?? next[0]!.id);
  };

  const selected = candidates.find((c) => c.id === selectedId) ?? null;
  const done = candidates.filter((c) => c.cv);
  const approved = candidates.filter((c) => c.status === "approved");
  const progress = useMemo(() => {
    const total = candidates.length;
    const finished = candidates.filter((c) => ["ready", "approved", "error"].includes(c.status)).length;
    return { total, finished };
  }, [candidates]);

  const exportOne = async (cv: CV, kind: "pdf" | "docx") => {
    const blob = kind === "pdf" ? await buildPdf(cv, template) : await buildDocx(cv, template);
    downloadBlob(blob, safeFileName(cv, kind));
  };

  const exportBatch = async (kind: "pdf" | "docx") => {
    const list = (approved.length ? approved : done).filter((c) => c.cv);
    if (!list.length) return;
    setExporting(true);
    try {
      const used = new Set<string>();
      for (const c of list) {
        const blob = kind === "pdf" ? await buildPdf(c.cv!, template) : await buildDocx(c.cv!, template);
        let name = safeFileName(c.cv!, kind);
        let n = 2;
        while (used.has(name)) name = safeFileName(c.cv!, kind).replace(`.${kind}`, `_${n++}.${kind}`);
        used.add(name);
        downloadBlob(blob, name);
        // small gap so browsers allow each separate download
        await new Promise((r) => setTimeout(r, 400));
      }
    } catch (e) {
      console.error(e);
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-2xl font-semibold tracking-tight">Uniform<span className="text-accent">.</span></span>
            <span className="hidden text-sm text-muted-foreground md:inline">{template.audience === "candidate" ? "Structure your CV" : "CV formatting for recruiters"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden px-2 text-sm text-muted-foreground sm:inline">Free</span>
            <Link to="/privacy" className="hidden px-2 text-sm text-muted-foreground hover:text-foreground sm:inline">Your data</Link>
            <TemplateSettings template={template} onChange={updateTemplate} />
            <Button size="sm" variant="outline" disabled={!done.length || exporting} onClick={() => exportBatch("docx")}>
              <FileDown className="h-4 w-4" /> Word
            </Button>
            <Button size="sm" disabled={!done.length || exporting} onClick={() => exportBatch("pdf")} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export {approved.length ? `${approved.length} approved` : done.length ? `all ${done.length}` : ""} PDF
            </Button>
          </div>
        </div>
      </header>

      {candidates.length === 0 ? (
        <main className="mx-auto max-w-3xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Format only — no rewriting</p>
          <h1 className="mt-3 font-display text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
            {template.audience === "candidate" ? <>Your CV in.<br />A structure robots can read out.</> : <>A stack of CVs in.<br />One clean format out.</>}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            {template.audience === "candidate"
              ? "Drop in your CV in any layout. It's rebuilt in a clean, structured format using your own words, so recruitment software and recruiters both read it correctly."
              : "Drop in candidate CVs in any layout. Each one is rebuilt in your standard template using the candidate's own words — review, tweak, and send PDFs or Word files to your client."}
          </p>
          <div className="mt-10">
            <BeforeAfterSlider before={cvBefore} after={cvAfter} />
          </div>
          <div className="mt-10">
            <p className="mb-2 text-sm font-medium">1. Who's using Uniform?</p>
            <AudiencePicker template={template} onChange={updateTemplate} />
          </div>
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">2. Pick a style to start from <span className="text-muted-foreground">(fine-tune it under Template{template.audience === "recruiter" ? ", where you can add your logo and consultant details" : ""})</span></p>
            <StylePicker template={template} onChange={updateTemplate} className="sm:grid-cols-4" />
            {template.audience === "recruiter" && <label className="mt-4 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={template.anonymise} onChange={(e) => updateTemplate({ ...template, anonymise: e.target.checked })} className="h-4 w-4 accent-[var(--accent)]" />
              Anonymise candidates (initials only, personal details removed)
            </label>}
          </div>
          <p className="mt-8 text-sm font-medium">3. Add {template.audience === "candidate" ? "your CV" : "your CVs"}</p>
          <DropZone dragging={dragging} setDragging={setDragging} onFiles={addFiles} inputRef={inputRef} big />
          <ol className="mt-10 grid gap-4 text-sm sm:grid-cols-3">
            {["Upload PDFs or Word files in bulk", "Review each CV side by side", "Download each as PDF or Word"].map((s, i) => (
              <li key={s} className="border-t border-foreground pt-3">
                <span className="font-display text-2xl text-accent">0{i + 1}</span>
                <p className="mt-1">{s}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12 rounded-md border border-border bg-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Why structure matters</p>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Before a human reads your CV, a robot parser does. Recruitment software scans the content for skills,
              roles, dates and contact details — and it only reads them correctly when a CV is cleanly structured.
              A great CV in a messy layout can get misread or overlooked. Uniform exists for exactly that: it
              rebuilds every CV into one structured format that robots and recruiters both read accurately.
            </p>
          </div>
          <div className="mt-6 rounded-md border border-border p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Your data</p>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              CVs are sent once to our AI service to read them and are not stored on our servers. They stay in this browser tab and
              disappear when you refresh. No accounts, no database, no training on your files. Designed with UK GDPR in mind.{" "}
              <Link to="/privacy" className="text-foreground underline">How data is handled</Link>
            </p>
          </div>
        </main>
      ) : (
        <main className="mx-auto grid max-w-[1500px] gap-6 px-6 py-6 lg:grid-cols-[300px_1fr]">
          <aside className="space-y-3">
            <DropZone dragging={dragging} setDragging={setDragging} onFiles={addFiles} inputRef={inputRef} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progress.finished} of {progress.total} processed · {approved.length} approved</span>
              <button className="hover:text-destructive" onClick={() => { setCandidates([]); setSelectedId(null); }}>Clear all</button>
            </div>
            <ul className="space-y-1">
              {candidates.map((c) => (
                <li key={c.id}>
                  <div
                    className={cn(
                      "group flex items-center gap-2 rounded-md border border-transparent px-2 py-2 text-sm transition-colors",
                      c.id === selectedId ? "border-border bg-card" : "hover:bg-secondary",
                    )}
                  >
                    <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setSelectedId(c.id)}>
                      <StatusIcon status={c.status} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{c.cv?.fullName || c.file.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{c.error ?? (c.cv ? c.file.name : c.status === "queued" ? "Waiting…" : "Reading…")}</span>
                      </span>
                    </button>
                    <button
                      aria-label="Remove"
                      className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      onClick={() => {
                        setCandidates((cs) => cs.filter((x) => x.id !== c.id));
                        if (selectedId === c.id) setSelectedId(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          <section className="min-w-0">
            {!selected ? (
              <p className="py-20 text-center text-muted-foreground">Select a CV on the left to review it.</p>
            ) : !selected.cv ? (
              <div className="flex flex-col items-center gap-4 py-24 text-center">
                {selected.status === "error" ? (
                  <>
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <p>{selected.error}</p>
                    <Button variant="outline" onClick={() => patch(selected.id, { status: "queued", error: null })}>
                      <RotateCw className="h-4 w-4" /> Retry
                    </Button>
                  </>
                ) : (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                    <p className="text-muted-foreground">Reading {selected.file.name}…</p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-3xl">{selected.cv.fullName || "Candidate"}</h2>
                    <p className="text-sm text-muted-foreground">From {selected.file.name}{selected.scanned && <span className="ml-2 rounded-sm bg-accent/10 px-1.5 py-0.5 text-xs text-accent">Read from a scan — check carefully</span>}{effectiveTemplate(template).anonymise && <span className="ml-2 inline-flex items-center gap-1"><EyeOff className="h-3 w-3" /> Anonymised</span>}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => exportOne(selected.cv!, "docx")}>
                      <FileText className="h-4 w-4" /> Word
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportOne(selected.cv!, "pdf")}>
                      <Download className="h-4 w-4" /> PDF
                    </Button>
                    {selected.status === "approved" ? (
                      <Button size="sm" variant="secondary" onClick={() => patch(selected.id, { status: "ready" })}>
                        <Check className="h-4 w-4 text-success" /> Approved
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          patch(selected.id, { status: "approved" });
                          const next = candidates.find((c) => c.id !== selected.id && c.status === "ready");
                          if (next) setSelectedId(next.id);
                        }}
                      >
                        <Check className="h-4 w-4" /> Approve & next
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-2 text-sm">
                  <span className="px-1 text-muted-foreground">Length:</span>
                  {selected.shortenAttempt === 0 ? (
                    <Button size="sm" variant="outline" disabled={selected.shortening} onClick={() => runShorten(selected)}>
                      {selected.shortening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />} Make shorter
                    </Button>
                  ) : (
                    <>
                      <span className="px-1">Shorter version shown</span>
                      <Button size="sm" variant="outline" disabled={selected.shortening} onClick={() => runShorten(selected)}>
                        {selected.shortening ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Try another
                      </Button>
                      <Button size="sm" variant="ghost" disabled={selected.shortening} onClick={() => patch(selected.id, { cv: selected.originalCv, shortenAttempt: 0 })}>
                        <Undo2 className="h-4 w-4" /> Back to original
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" disabled={selected.checking} onClick={() => runCheck(selected)}>
                    {selected.checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <SpellCheck className="h-4 w-4" />} Check spelling
                  </Button>
                  <Button size="sm" variant="ghost" className="ml-auto" disabled={selected.shortening} onClick={() => patch(selected.id, { status: "queued", cv: null })}>
                    <RotateCw className="h-4 w-4" /> Re-read file
                  </Button>
                </div>
                <Tabs defaultValue="side" className="lg:hidden">
                  <TabsList>
                    <TabsTrigger value="side">Preview</TabsTrigger>
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                  </TabsList>
                  <TabsContent value="side"><CvPreview cv={selected.cv} template={template} issues={liveIssues(selected.cv, selected.issues ?? [])} /></TabsContent>
                  <TabsContent value="edit"><CvEditor cv={selected.cv} onChange={(cv) => patch(selected.id, { cv })} issues={liveIssues(selected.cv, selected.issues ?? [])} onIssues={(issues) => patch(selected.id, { issues })} /></TabsContent>
                </Tabs>
                <div className="hidden gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                  <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
                    <CvEditor cv={selected.cv} onChange={(cv) => patch(selected.id, { cv })} issues={liveIssues(selected.cv, selected.issues ?? [])} onIssues={(issues) => patch(selected.id, { issues })} />
                  </div>
                  <div className="sticky top-20 self-start">
                    <CvPreview cv={selected.cv} template={template} issues={liveIssues(selected.cv, selected.issues ?? [])} />
                  </div>
                </div>
              </>
            )}
          </section>
        </main>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: Candidate["status"] }) {
  if (status === "approved") return <Check className="h-4 w-4 shrink-0 text-success" />;
  if (status === "error") return <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />;
  if (status === "ready") return <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />;
  return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />;
}

function DropZone({
  dragging,
  setDragging,
  onFiles,
  inputRef,
  big,
}: {
  dragging: boolean;
  setDragging: (v: boolean) => void;
  onFiles: (f: FileList) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  big?: boolean;
}) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-border text-center transition-colors hover:border-accent",
        dragging && "border-accent bg-accent/5",
        big ? "mt-10 gap-3 bg-card px-6 py-14" : "gap-1 px-4 py-5",
      )}
    >
      <Upload className={cn("text-accent", big ? "h-8 w-8" : "h-5 w-5")} />
      <p className={cn("font-medium", big ? "text-lg" : "text-sm")}>{big ? "Drop CVs here or click to upload" : "Add more CVs"}</p>
      {big && <p className="text-sm text-muted-foreground">PDF, Word, text, or a photo/scan (JPG, PNG) · up to 10 MB each · as many as you like</p>}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        className="hidden"
        onChange={(e) => { if (e.target.files) onFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}
