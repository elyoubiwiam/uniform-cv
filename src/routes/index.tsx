import { createFileRoute, Link } from "@tanstack/react-router";
import cvBefore from "@/assets/cv-before.jpg";
import cvAfter from "@/assets/cv-after.jpg";
import uniformIcon from "@/assets/uniform-icon.png";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { imageType, type ImageType } from "@/lib/file-kind";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, FilePenLine, FileText, Loader2, RotateCw, Scissors, RefreshCw, Undo2, SpellCheck, EyeOff, Trash2, Upload, AlertCircle, FileDown } from "lucide-react";
import { toast } from "sonner";
import { checkCv, extractCv, shortenCv } from "@/lib/cv.functions";
import { liveIssues } from "@/lib/proofread";
import { StylePicker } from "@/components/cv/StylePicker";
import { defaultTemplate, effectiveTemplate, separateCategories, type Template } from "@/lib/cv-schema";
import { buildDocx, buildPdf, downloadBlob, safeFileName } from "@/lib/cv-export";
import type { Candidate } from "@/components/cv/types";
import { OriginalView } from "@/components/cv/OriginalView";
import { GeneratedPdfView } from "@/components/cv/GeneratedPdfView";
import { CvEditor } from "@/components/cv/CvEditor";
import { CvPreview } from "@/components/cv/CvPreview";
import { PdfPageCount } from "@/components/cv/PdfPageCount";
import { RecruiterDetails } from "@/components/cv/RecruiterDetails";
import { downloadReviewIds, idsNeedingReview } from "@/lib/download-review";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Uniform | CV formatting for recruiters" },
      { name: "description", content: "Upload candidate CVs, review them in your agency template and send client-ready PDF or Word files." },
      { property: "og:title", content: "Uniform | CV formatting for recruiters" },
      { property: "og:description", content: "Every candidate CV in your agency format, ready for clients in minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const MAX_BYTES = 10 * 1024 * 1024;
const CONCURRENCY = 5;
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
  const [desktopView, setDesktopView] = useState<"edit" | "compare">("edit");
  const [dragging, setDragging] = useState(false);
  const [started, setStarted] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloadRequest, setDownloadRequest] = useState<{ kind: "pdf" | "docx"; ids: string[] } | null>(null);
  const [reviewingDownloads, setReviewingDownloads] = useState(false);
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
      patch(c.id, { checking: false, checkedCv: JSON.stringify(c.cv), issues: res.issues.map((i) => ({ ...i, id: crypto.randomUUID() })) });
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
      if (raw) setTemplate({ ...defaultTemplate, ...JSON.parse(raw), audience: "recruiter" });
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

  /** The logo links to "/", the same route the tool lives on, so going home also clears the working session. */
  const goHome = () => {
    setCandidates([]);
    setSelectedId(null);
    setStarted(false);
    setDesktopView("edit");
    setDownloadRequest(null);
    window.scrollTo({ top: 0 });
  };


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

  const addFiles = (files: FileList | File[]): Candidate[] => {
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
    if (!next.length) return [];
    setCandidates((cs) => [...cs, ...next]);
    setSelectedId((s) => s ?? next[0]?.id ?? null);
    return next;
  };

  /** One-off edit: add the file and open the editor straight away, skipping the confirmation list. */
  const quickEdit = (files: FileList | File[]) => {
    const added = addFiles(files);
    if (!added.length) return;
    setSelectedId(added[0].id);
    setStarted(true);
    window.scrollTo({ top: 0 });
  };

  const selectedRaw = candidates.find((c) => c.id === selectedId) ?? null;
  const selected = selectedRaw?.cv
    ? { ...selectedRaw, cv: separateCategories(selectedRaw.cv), originalCv: selectedRaw.originalCv ? separateCategories(selectedRaw.originalCv) : null }
    : selectedRaw;
  const done = candidates.filter((c) => c.cv);
  const approved = candidates.filter((c) => c.status === "approved");
  const progress = useMemo(() => {
    const total = candidates.length;
    const finished = candidates.filter((c) => ["ready", "approved", "error"].includes(c.status)).length;
    return { total, finished };
  }, [candidates]);

  const requestDownload = (kind: "pdf" | "docx", candidateId?: string) => {
    const ids = downloadReviewIds(candidates, candidateId);
    if (!ids.length) return;
    if (!idsNeedingReview(candidates, ids).length) {
      // Every CV was already checked and unchanged: download straight away.
      void exportBatch(kind, ids);
      return;
    }
    setDownloadRequest({ kind, ids });
  };

  const checkBeforeDownload = async () => {
    if (!downloadRequest) return;
    const needs = idsNeedingReview(candidates, downloadRequest.ids);
    const list = candidates.filter((candidate) => needs.includes(candidate.id) && candidate.cv);
    setDownloadRequest(null);
    if (!list.length) return;
    setSelectedId(list[0]?.id ?? null);
    setReviewingDownloads(true);
    try {
      // Check several CVs at once instead of one after another.
      const queue = [...list];
      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
          for (let next = queue.shift(); next; next = queue.shift()) await runCheck(next);
        }),
      );
      toast.info("Review the suggestions for each CV, then download when you're ready. Nothing is corrected automatically.");
    } finally {
      setReviewingDownloads(false);
    }
  };

  const exportBatch = async (kind: "pdf" | "docx", ids: string[]) => {
    const list = candidates.filter((c) => ids.includes(c.id) && c.cv);
    if (!list.length) return;
    setExporting(true);
    try {
      const used = new Set<string>();
      for (const c of list) {
        if (!c.cv) continue;
        const separated = separateCategories(c.cv);
        const blob = kind === "pdf" ? await buildPdf(separated, template, c.cover) : await buildDocx(separated, template, c.cover);
        let name = safeFileName(separated, kind);
        let n = 2;
        while (used.has(name)) name = safeFileName(separated, kind).replace(`.${kind}`, `_${n++}.${kind}`);
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

  const onLanding = candidates.length === 0 || !started;
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-6 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/" onClick={goHome} className="flex items-center gap-3" aria-label="Uniform, back to homepage">
              <img src={uniformIcon} alt="" aria-hidden className="h-8 w-8 shrink-0" width={32} height={32} />
              <span className="font-display text-2xl font-semibold leading-none tracking-tight">Uniform<span className="text-accent">.</span></span>
            </Link>
            <span className="hidden text-sm leading-none text-muted-foreground lg:inline">CV formatting for recruiters</span>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/privacy" className="hidden px-2 text-sm text-muted-foreground hover:text-foreground sm:inline">Your data</Link>
            {onLanding ? (
              <Button size="sm" onClick={() => document.getElementById("upload")?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                <Upload className="h-4 w-4" /> Upload CVs
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" disabled={!done.length || exporting || reviewingDownloads} onClick={() => requestDownload("docx")}>
                  <FileDown className="h-4 w-4" /> Word
                </Button>
                <Button size="sm" disabled={!done.length || exporting || reviewingDownloads} onClick={() => requestDownload("pdf")}>
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  <span className="hidden sm:inline">Export {approved.length ? `${approved.length} approved` : done.length ? `all ${done.length}` : ""}</span> PDF
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {onLanding ? (
        <main className="mx-auto max-w-3xl px-5 py-14 sm:px-6 sm:py-20">
          <section className="animate-rise text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">For recruitment agencies · Free</p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">Every CV in your format.<br className="hidden sm:block" /> In minutes.</h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Upload candidate CVs in any layout. Uniform rebuilds each one in your agency template, word for word, ready to send to clients.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="h-12 w-full px-8 text-base shadow-md sm:w-auto" onClick={() => document.getElementById("upload")?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                <Upload className="h-5 w-5" /> Upload CVs
              </Button>
              <Button size="lg" variant="ghost" className="h-12 w-full text-base sm:w-auto" onClick={() => document.getElementById("example")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                See an example
              </Button>
            </div>
          </section>

          <ol className="mt-14 grid gap-3 sm:grid-cols-3">
            {[["Upload", "PDF, Word or scans, in bulk."], ["Review", "Check and edit each CV."], ["Send", "Download PDF or Word."]].map(([t, d], i) => (
              <li key={t} className="animate-rise rounded-lg bg-card p-5 shadow-sm" style={{ animationDelay: `${i * 80}ms` }}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">{i + 1}</span>
                <p className="mt-3 font-semibold">{t}</p>
                <p className="text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>

          <section id="example" className="mt-16 scroll-mt-24">
            <h2 className="text-center text-2xl font-semibold tracking-tight">Before and after</h2>
            <div className="mx-auto mt-6 max-w-sm">
              <BeforeAfterSlider before={cvBefore} after={cvAfter} />
            </div>
          </section>

          <section className="mt-16 space-y-10 rounded-xl bg-card p-5 shadow-sm sm:p-8">
            <div>
              <h2 className="text-xl font-semibold tracking-tight"><span className="text-accent">1.</span> Choose a style</h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">You can change it at any time.</p>
              <StylePicker template={template} onChange={updateTemplate} enlarged />
              <label className="mt-6 flex items-start gap-3 rounded-lg bg-muted p-4 text-sm">
                <input type="checkbox" checked={template.anonymise} onChange={(e) => updateTemplate({ ...template, anonymise: e.target.checked })} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]" />
                <span><span className="font-medium">Anonymise candidates.</span> <span className="text-muted-foreground">Names become initials. Email, phone, address and links are removed.</span></span>
              </label>
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight"><span className="text-accent">2.</span> Add your details <span className="text-sm font-normal text-muted-foreground">(optional)</span></h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">Shown on the cover page and footer.</p>
              <RecruiterDetails template={template} onChange={updateTemplate} />
            </div>
            <div id="upload" className="scroll-mt-24">
              <h2 className="text-xl font-semibold tracking-tight"><span className="text-accent">3.</span> Upload CVs</h2>
              <DropZone dragging={dragging} setDragging={setDragging} onFiles={addFiles} inputRef={inputRef} big />
              {candidates.length > 0 && (
                <div className="animate-rise mt-4 space-y-3 rounded-lg border border-border p-4">
                  <p className="text-sm font-medium">{candidates.length} CV{candidates.length > 1 ? "s" : ""} ready. Check the list, then start.</p>
                  <ul className="space-y-1">
                    {candidates.map((c) => (
                      <li key={c.id} className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">{c.file.name}</span>
                        <button className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${c.file.name}`} onClick={() => { setCandidates((cs) => cs.filter((x) => x.id !== c.id)); setSelectedId((s) => (s === c.id ? null : s)); }}><Trash2 className="h-4 w-4" /></button>
                      </li>
                    ))}
                  </ul>
                  <Button size="lg" className="w-full sm:w-auto" onClick={() => { setSelectedId((s) => s ?? candidates[0]?.id ?? null); setStarted(true); window.scrollTo({ top: 0 }); }}>Start formatting</Button>
                </div>
              )}
            </div>
          </section>

          <section className="mt-16 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-card p-6 shadow-sm">
              <h2 className="font-semibold">Built for ATS platforms</h2>
              <p className="mt-2 text-sm text-muted-foreground">Applicant tracking systems read structure, not design. A clean, consistent layout means skills, roles and dates are read correctly.</p>
            </div>
            <div className="rounded-xl bg-card p-6 shadow-sm">
              <h2 className="font-semibold">Your data</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                CVs are read once and never stored. They stay in this tab until you refresh. Designed for UK GDPR.{" "}
                <Link to="/privacy" className="font-medium text-accent underline underline-offset-2">Learn more</Link>
              </p>
            </div>
          </section>
        </main>
      ) : (
        <main className={cn("mx-auto grid gap-6 px-6 py-6", desktopView === "compare" ? "max-w-[1800px] lg:grid-cols-1" : "max-w-[1500px] lg:grid-cols-[300px_1fr]")}>
          <aside className={cn("space-y-3", desktopView === "compare" && "lg:hidden")}>
            <DropZone dragging={dragging} setDragging={setDragging} onFiles={addFiles} inputRef={inputRef} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progress.finished} of {progress.total} processed · {approved.length} approved</span>
              <button className="hover:text-destructive" onClick={() => { setCandidates([]); setSelectedId(null); setStarted(false); }}>Clear all</button>
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
                    <p className="text-sm text-muted-foreground">From {selected.file.name}{selected.scanned && <span className="ml-2 rounded-sm bg-accent/10 px-1.5 py-0.5 text-xs text-accent">Read from a scan. Check carefully</span>}{effectiveTemplate(template).anonymise && <span className="ml-2 inline-flex items-center gap-1"><EyeOff className="h-3 w-3" /> Anonymised</span>}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" disabled={exporting || reviewingDownloads || selected.checking} onClick={() => requestDownload("docx", selected.id)}>
                      <FileText className="h-4 w-4" /> Word
                    </Button>
                    <Button variant="outline" size="sm" disabled={exporting || reviewingDownloads || selected.checking} onClick={() => requestDownload("pdf", selected.id)}>
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
                  <Button size="sm" variant="outline" disabled={selected.checking || reviewingDownloads} onClick={() => runCheck(selected)}>
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
                    <TabsTrigger value="compare">Compare</TabsTrigger>
                  </TabsList>
                  <TabsContent value="side"><CvPreview cv={selected.cv} template={template} cover={selected.cover} issues={liveIssues(selected.cv, selected.issues ?? [])} /></TabsContent>
                  <TabsContent value="edit"><CvEditor cv={selected.cv} cover={selected.cover} anonymise={template.anonymise} onCoverChange={(cover) => patch(selected.id, { cover })} onChange={(cv) => patch(selected.id, { cv })} issues={liveIssues(selected.cv, selected.issues ?? [])} onIssues={(issues) => patch(selected.id, { issues })} /></TabsContent>
                  <TabsContent value="compare" className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original</p>
                    <OriginalView file={selected.file} />
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Uniformed<PdfPageCount cv={selected.cv} template={template} cover={selected.cover} /></p>
                    <GeneratedPdfView cv={selected.cv} template={template} cover={selected.cover} />
                  </TabsContent>
                </Tabs>
                <Tabs value={desktopView} onValueChange={(v) => setDesktopView(v as "edit" | "compare")} className="hidden lg:block">
                  <TabsList className="mb-4">
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="compare">Compare with original</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className={`hidden gap-8 lg:grid ${desktopView === "compare" ? "lg:grid-cols-2" : "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"}`}>
                  <div className="min-w-0">
                    {desktopView === "edit" ? (
                      <CvEditor cv={selected.cv} cover={selected.cover} anonymise={template.anonymise} onCoverChange={(cover) => patch(selected.id, { cover })} onChange={(cv) => patch(selected.id, { cv })} issues={liveIssues(selected.cv, selected.issues ?? [])} onIssues={(issues) => patch(selected.id, { issues })} />
                    ) : (
                      <>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original · {selected.file.name}</p>
                        <OriginalView file={selected.file} />
                      </>
                    )}
                  </div>
                  <div className={cn("sticky top-20 self-start", desktopView === "edit" && "max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain")}>
                    {desktopView === "compare" && <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Uniformed<PdfPageCount cv={selected.cv} template={template} cover={selected.cover} /></p>}
                    {desktopView === "compare" ? (
                      <GeneratedPdfView cv={selected.cv} template={template} cover={selected.cover} />
                    ) : (
                      <CvPreview cv={selected.cv} template={template} cover={selected.cover} issues={liveIssues(selected.cv, selected.issues ?? [])} />
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        </main>
      )}
      <Dialog open={downloadRequest !== null} onOpenChange={(open) => { if (!open) setDownloadRequest(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Check spelling before downloading?</DialogTitle>
            <DialogDescription>
              {downloadRequest && downloadRequest.ids.length > 1 ? `Check spelling, grammar and terminology in the ${idsNeedingReview(candidates, downloadRequest.ids).length} CVs that changed before sharing them.` : "Check spelling, grammar and terminology before sharing this CV."} CVs already checked and unchanged are downloaded without asking again. You choose which suggestions to accept; nothing is corrected automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              const request = downloadRequest;
              setDownloadRequest(null);
              if (request) void exportBatch(request.kind, request.ids);
            }}><Download className="h-4 w-4" /> Download anyway</Button>
            <Button onClick={() => void checkBeforeDownload()}><SpellCheck className="h-4 w-4" /> Check spelling first</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
