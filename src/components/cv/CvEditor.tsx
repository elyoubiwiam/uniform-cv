import { ArrowDown, Bold, Check, Italic, Plus, Trash2, Underline, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toggleMark, type Mark } from "@/lib/cv-format";
import { normalizeSkills } from "@/lib/cv-skills";
import { applyFix, type Issue } from "@/lib/proofread";
import type { CV } from "@/lib/cv-schema";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { emptyRecruiterCover, validRange, WEEKDAYS, type Availability, type RecruiterCover, type TimeRange, type Weekday } from "@/lib/cv-cover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function AutoTextarea({ value, className, ...props }: React.ComponentProps<typeof Textarea>) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const resize = () => {
    const el = ref.current;
    if (!el || el.getBoundingClientRect().width === 0) return;
    const { borderTopWidth, borderBottomWidth } = getComputedStyle(el);
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + parseFloat(borderTopWidth) + parseFloat(borderBottomWidth)}px`;
  };
  useLayoutEffect(resize, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let width = 0;
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width !== width) {
        width = entry.contentRect.width;
        resize();
      }
    });
    observer.observe(el);
    let active = true;
    void document.fonts.ready.then(() => { if (active) resize(); });
    return () => { active = false; observer.disconnect(); };
  }, []);
  return <Textarea ref={ref} value={value} onInput={resize} {...props} className={cn("min-h-10 resize-none overflow-hidden leading-6", className)} />;
}

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const list = (s: string) => s.split(",").map((l) => l.trim()).filter(Boolean);
const orNull = (s: string) => (s.trim() ? s : null);

function Field({ label, value, onChange, rich }: { label: string; value: string | null; onChange: (v: string) => void; multiline?: boolean; rich?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <AutoTextarea data-rich={rich || undefined} value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={1} aria-label={label} />
    </div>
  );
}

function Heading({ children, onAdd }: { children: React.ReactNode; onAdd?: () => void }) {
  return (
    <div className="mt-6 flex items-center justify-between border-b border-border pb-1">
      <h3 className="font-display text-lg">{children}</h3>
      {onAdd && (
        <Button variant="ghost" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      )}
    </div>
  );
}

function DraftField({ label, items, sep, parse, onChange, rich }: { label: string; items: string[]; sep: string; parse: (s: string) => string[]; onChange: (v: string[]) => void; multiline?: boolean; rich?: boolean }) {
  const value = items.join(sep);
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    setDraft((d) => (parse(d).join(sep) === value ? d : value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  const commit = () => { const p = parse(draft); setDraft(p.join(sep)); onChange(p); };
  const change = (v: string) => { setDraft(v); onChange(parse(v)); };
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <AutoTextarea data-rich={rich || undefined} value={draft} onChange={(e) => change(e.target.value)} onBlur={commit} rows={1} aria-label={label} />
    </div>
  );
}

function SkillsField({ skills, onChange }: { skills: string[]; onChange: (skills: string[]) => void }) {
  const value = normalizeSkills(skills).join("\n");
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  return <div className="space-y-1">
    <Label htmlFor="cv-skills" className="text-xs text-muted-foreground">Skills</Label>
    <AutoTextarea id="cv-skills" rows={1} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => {
      const normalized = normalizeSkills([draft]);
      setDraft(normalized.join("\n"));
      onChange(normalized);
    }} />
  </div>;
}

function applyMark(el: HTMLTextAreaElement, mark: Mark) {
  const next = toggleMark(el.value, el.selectionStart, el.selectionEnd, mark);
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  if (!setter) return;
  setter.call(el, next.value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.focus();
  requestAnimationFrame(() => el.setSelectionRange(next.start, next.end));
}

function selectionPoint(el: HTMLTextAreaElement) {
  const style = getComputedStyle(el);
  const mirror = document.createElement("div");
  for (const prop of ["boxSizing", "width", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth", "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "wordSpacing", "textIndent"] as const) mirror.style[prop] = style[prop];
  Object.assign(mirror.style, { position: "absolute", visibility: "hidden", whiteSpace: "pre-wrap", overflowWrap: "break-word", top: "0", left: "-9999px", borderStyle: "solid" });
  mirror.textContent = el.value.slice(0, el.selectionStart);
  const marker = document.createElement("span");
  marker.textContent = el.value.slice(el.selectionStart, el.selectionEnd) || ".";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);
  const rect = el.getBoundingClientRect();
  const top = rect.top + marker.offsetTop - el.scrollTop;
  const left = rect.left + Math.min(marker.offsetLeft, rect.width - 40);
  document.body.removeChild(mirror);
  return { top, left };
}

function SelectionToolbar({ editor }: { editor: React.RefObject<HTMLDivElement | null> }) {
  const [state, setState] = useState<{ el: HTMLTextAreaElement; top: number; left: number } | null>(null);
  useEffect(() => {
    const update = () => {
      const el = document.activeElement;
      if (el instanceof HTMLTextAreaElement && el.dataset["rich"] && editor.current?.contains(el) && el.selectionEnd > el.selectionStart) {
        const { top, left } = selectionPoint(el);
        setState({ el, top: Math.max(8, top - 44), left: Math.max(8, Math.min(left, window.innerWidth - 136)) });
      } else setState(null);
    };
    const hide = (e: KeyboardEvent) => { if (e.key === "Escape") setState(null); };
    const events = ["selectionchange", "mouseup", "keyup"] as const;
    events.forEach((ev) => document.addEventListener(ev, update));
    document.addEventListener("keydown", hide);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      events.forEach((ev) => document.removeEventListener(ev, update));
      document.removeEventListener("keydown", hide);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [editor]);
  if (!state) return null;
  const tools = [["bold", Bold, "Bold (Ctrl+B)"], ["italic", Italic, "Italic (Ctrl+I)"], ["underline", Underline, "Underline (Ctrl+U)"]] as const;
  return (
    <div role="toolbar" aria-label="Text formatting" className="fixed z-50 flex items-center gap-0.5 rounded-md border border-border bg-popover p-1 shadow-md" style={{ top: state.top, left: state.left }}>
      {tools.map(([mark, Icon, label]) => (
        <Button key={mark} type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={label} title={label}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { if (state.el.isConnected) applyMark(state.el, mark); }}>
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}

const TIMES = Array.from({ length: 96 }, (_, i) => `${String(Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`);

function TimeSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger className="w-24" aria-label={label}><SelectValue /></SelectTrigger><SelectContent className="max-h-60">{TIMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>;
}

function AvailabilityField({ value = {}, onChange }: { value?: Availability; onChange: (v: Availability) => void }) {
  const setDay = (day: Weekday, ranges: TimeRange[] | undefined) => {
    const next = { ...value };
    if (ranges) next[day] = ranges; else delete next[day];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Interview availability</Label>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Available days">
        {WEEKDAYS.map(([day, label]) => {
          const on = Boolean(value[day]);
          return <Button key={day} type="button" size="sm" variant={on ? "default" : "outline"} aria-pressed={on}
            onClick={() => setDay(day, on ? undefined : [{ from: "09:00", to: "17:00" }])}>{label}</Button>;
        })}
      </div>
      {WEEKDAYS.filter(([day]) => value[day]).map(([day, label]) => {
        const ranges = value[day] ?? [];
        return (
          <div key={day} className="flex flex-wrap items-start gap-3 rounded-md border border-border p-2">
            <span className="w-10 pt-2 text-sm font-medium">{label}</span>
            <div className="flex-1 space-y-2">
              {ranges.map((r, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <TimeSelect label={`${label} start time ${i + 1}`} value={r.from} onChange={(from) => setDay(day, ranges.map((x, j) => (j === i ? { ...x, from } : x)))} />
                  <span className="text-sm text-muted-foreground">until</span>
                  <TimeSelect label={`${label} end time ${i + 1}`} value={r.to} onChange={(to) => setDay(day, ranges.map((x, j) => (j === i ? { ...x, to } : x)))} />
                  <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${label} time ${i + 1}`} onClick={() => setDay(day, ranges.length > 1 ? ranges.filter((_, j) => j !== i) : undefined)}><X className="h-4 w-4" /></Button>
                  {!validRange(r) && <span className="text-xs text-destructive">End must be after start</span>}
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={() => setDay(day, [...ranges, { from: "14:00", to: "17:00" }])}><Plus className="h-4 w-4" /> Add another time</Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CvEditor({ cv, onChange, issues = [], onIssues, cover, onCoverChange, anonymise = false }: { cv: CV; onChange: (cv: CV) => void; issues?: Issue[]; onIssues?: (i: Issue[]) => void; cover?: RecruiterCover | undefined; onCoverChange?: ((cover: RecruiterCover) => void) | undefined; anonymise?: boolean }) {
  const details = cover ?? emptyRecruiterCover;
  const coverField = (key: Exclude<keyof RecruiterCover, "relocation" | "availability">, label: string, fallback = "") => <Field label={label} value={details[key] || fallback} onChange={(value) => onCoverChange?.({ ...details, [key]: value })} />;
  const set = <K extends keyof CV>(k: K, v: CV[K]) => onChange({ ...cv, [k]: v });
  const editor = useRef<HTMLDivElement | null>(null);
  const target = useRef<HTMLTextAreaElement | null>(null);
  const rich = (el: EventTarget) => el instanceof HTMLTextAreaElement && el.dataset["rich"] ? el : null;
  return (
    <div ref={editor} className="space-y-3"
      onFocus={(e) => { const el = rich(e.target); if (el) target.current = el; }}
      onKeyDown={(e) => {
        const el = rich(e.target);
        const mark = ({ b: "bold", i: "italic", u: "underline" } as const)[e.key.toLowerCase() as "b"];
        if (el && mark && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) { e.preventDefault(); applyMark(el, mark); }
      }}>
      <SelectionToolbar editor={editor} />
      <nav aria-label="CV sections" className="flex flex-wrap gap-1 border-b border-border pb-2">
        {[...(onCoverChange ? ["Recruiter cover page"] : []), "Experience", "Education", "Skills", "Interests & hobbies"].map((section) => (
          <Button key={section} variant="ghost" size="sm" onClick={() => {
            const heading = Array.from(editor.current?.querySelectorAll("h3") ?? []).find((el) => el.textContent === section);
            heading?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
          }}><ArrowDown className="h-3 w-3" />{section}</Button>
        ))}
      </nav>
      {onCoverChange && <section className="space-y-3">
        <Heading>Recruiter cover page</Heading>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {coverField("candidateName", "Name of candidate", cv.fullName)}
          {coverField("noticePeriod", "Notice period")}
          {coverField("currentSalary", "Current salary (£)")}
          {coverField("expectedSalary", "Salary expectations (£)")}
          {coverField("employer", "Current / last employer", cv.experience[0]?.company ?? "")}
          {coverField("location", "Candidate location", cv.location ?? "")}
          <div className="space-y-1"><Label className="text-xs text-muted-foreground">Able to relocate if needed</Label>
            <Select value={details.relocation || "unspecified"} onValueChange={(value) => {
              if (value === "yes" || value === "no" || value === "discuss" || value === "unspecified") onCoverChange({ ...details, relocation: value === "unspecified" ? "" : value });
            }}><SelectTrigger aria-label="Able to relocate if needed"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unspecified">Not provided</SelectItem><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem><SelectItem value="discuss">Open to discussion</SelectItem></SelectContent></Select>
          </div>
        </div>
        <AvailabilityField value={details.availability} onChange={(availability) => onCoverChange({ ...details, availability })} />
        {coverField("notes", "Recruiter notes")}
        {anonymise && <p className="text-xs text-muted-foreground">The anonymous cover uses initials and excludes employer, location and recruiter notes.</p>}
      </section>}
      {issues.length > 0 && (
        <div className="space-y-2 rounded-md border border-destructive/40 bg-card p-3">
          <p className="text-xs text-muted-foreground">{issues.length} possible spelling/grammar issue{issues.length > 1 ? "s" : ""}, underlined in red in the preview. Nothing is changed unless you accept it — or just edit the text below.</p>
          {issues.map((i) => (
            <div key={i.id} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate">
                <span className="underline decoration-destructive decoration-wavy">{i.text}</span> → <strong>{i.suggestion}</strong>
                <span className="ml-1 text-xs text-muted-foreground">({i.reason})</span>
              </span>
              <Button size="sm" variant="outline" onClick={() => { onChange(applyFix(cv, i)); onIssues?.(issues.filter((x) => x.id !== i.id)); }}>
                <Check className="h-4 w-4" /> Accept
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onIssues?.(issues.filter((x) => x.id !== i.id))}>
                <X className="h-4 w-4" /> Ignore
              </Button>
            </div>
          ))}
        </div>
      )}
      <Heading>Candidate</Heading>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Full name" value={cv.fullName} onChange={(v) => set("fullName", v)} />
        <Field label="Headline" value={cv.headline} onChange={(v) => set("headline", orNull(v))} />
        <Field label="Location" value={cv.location} onChange={(v) => set("location", orNull(v))} />
        <Field label="Email" value={cv.email} onChange={(v) => set("email", orNull(v))} />
        <Field label="Phone" value={cv.phone} onChange={(v) => set("phone", orNull(v))} />
        <DraftField label="Links (comma separated)" items={cv.links} sep=", " parse={list} onChange={(v) => set("links", v)} />
      </div>
      <Heading onAdd={() => set("hyperlinks", [...cv.hyperlinks, { text: "", url: "" }])}>Candidate links</Heading>
      {cv.hyperlinks.map((h, i) => {
        const up = (patch: Partial<typeof h>) => set("hyperlinks", cv.hyperlinks.map((x, j) => (j === i ? { ...x, ...patch } : x)));
        return (
          <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
            <Field label="Title" value={h.text} onChange={(v) => up({ text: v })} />
            <Field label="Web address" value={h.url} onChange={(v) => up({ url: v })} />
            <Button aria-label="Remove candidate link" variant="ghost" size="icon" className="text-destructive" onClick={() => set("hyperlinks", cv.hyperlinks.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
      <Field label="Profile" value={cv.summary} onChange={(v) => set("summary", orNull(v))} multiline rich />

      <Heading onAdd={() => set("experience", [...cv.experience, { title: "", company: "", location: null, startDate: null, endDate: null, bullets: [] }])}>
        Experience
      </Heading>
      {cv.experience.map((e, i) => {
        const up = (patch: Partial<typeof e>) => set("experience", cv.experience.map((x, j) => (j === i ? { ...x, ...patch } : x)));
        return (
          <div key={i} className="space-y-3 rounded-md border border-border bg-card p-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Job title" value={e.title} onChange={(v) => up({ title: v })} />
              <Field label="Company" value={e.company} onChange={(v) => up({ company: v })} />
              <Field label="Start" value={e.startDate} onChange={(v) => up({ startDate: orNull(v) })} />
              <Field label="End" value={e.endDate} onChange={(v) => up({ endDate: orNull(v) })} />
            </div>
            <Field label="Location" value={e.location} onChange={(v) => up({ location: orNull(v) })} />
            <DraftField label="Bullet points (one per line)" items={e.bullets} sep={"\n"} parse={lines} onChange={(v) => up({ bullets: v })} multiline rich />
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => set("experience", cv.experience.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" /> Remove role
            </Button>
          </div>
        );
      })}

      <Heading onAdd={() => set("education", [...cv.education, { degree: "", institution: "", startDate: null, endDate: null, details: null }])}>
        Education
      </Heading>
      {cv.education.map((e, i) => {
        const up = (patch: Partial<typeof e>) => set("education", cv.education.map((x, j) => (j === i ? { ...x, ...patch } : x)));
        return (
          <div key={i} className="space-y-3 rounded-md border border-border bg-card p-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Degree" value={e.degree} onChange={(v) => up({ degree: v })} />
              <Field label="Institution" value={e.institution} onChange={(v) => up({ institution: v })} />
              <Field label="Start" value={e.startDate} onChange={(v) => up({ startDate: orNull(v) })} />
              <Field label="End" value={e.endDate} onChange={(v) => up({ endDate: orNull(v) })} />
            </div>
            <Field label="Details" value={e.details} onChange={(v) => up({ details: orNull(v) })} multiline rich />
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => set("education", cv.education.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" /> Remove
            </Button>
          </div>
        );
      })}

      <Heading>Skills</Heading>
      <SkillsField skills={cv.skills} onChange={(skills) => set("skills", skills)} />
      <Heading>Interests & hobbies</Heading>
      <DraftField label="Interests & hobbies (comma separated)" items={cv.interests ?? []} sep=", " parse={list} onChange={(v) => set("interests", v)} multiline />
      <Heading>Languages & certifications</Heading>
      <DraftField label="Languages (comma separated)" items={cv.languages} sep=", " parse={list} onChange={(v) => set("languages", v)} />
      <DraftField label="Certifications (comma separated)" items={cv.certifications} sep=", " parse={list} onChange={(v) => set("certifications", v)} />
    </div>
  );
}
