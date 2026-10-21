import { Bold, Check, Italic, Plus, Trash2, Underline, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toggleMark, type Mark } from "@/lib/cv-format";
import { normalizeSkills } from "@/lib/cv-skills";
import { applyFix, type Issue } from "@/lib/proofread";
import type { CV } from "@/lib/cv-schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const list = (s: string) => s.split(",").map((l) => l.trim()).filter(Boolean);
const orNull = (s: string) => (s.trim() ? s : null);

function Field({ label, value, onChange, multiline, rich }: { label: string; value: string | null; onChange: (v: string) => void; multiline?: boolean; rich?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {multiline ? (
        <Textarea data-rich={rich || undefined} value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={4} />
      ) : (
        <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      )}
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

function DraftField({ label, items, sep, parse, onChange, multiline, rich }: { label: string; items: string[]; sep: string; parse: (s: string) => string[]; onChange: (v: string[]) => void; multiline?: boolean; rich?: boolean }) {
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
      {multiline ? (
        <Textarea data-rich={rich || undefined} value={draft} onChange={(e) => change(e.target.value)} onBlur={commit} rows={4} />
      ) : (
        <Input value={draft} onChange={(e) => change(e.target.value)} onBlur={commit} />
      )}
    </div>
  );
}

function SkillsField({ skills, onChange }: { skills: string[]; onChange: (skills: string[]) => void }) {
  const value = normalizeSkills(skills).join("\n");
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  return <div className="space-y-1">
    <Label htmlFor="cv-skills" className="text-xs text-muted-foreground">Skills</Label>
    <Textarea id="cv-skills" rows={5} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => {
      const normalized = normalizeSkills([draft]);
      setDraft(normalized.join("\n"));
      onChange(normalized);
    }} />
  </div>;
}

function applyMark(el: HTMLTextAreaElement, mark: Mark) {
  const next = toggleMark(el.value, el.selectionStart, el.selectionEnd, mark);
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(el, next.value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.focus();
  requestAnimationFrame(() => el.setSelectionRange(next.start, next.end));
}

function FormatBar({ target }: { target: React.RefObject<HTMLTextAreaElement | null> }) {
  const tools = [["bold", Bold, "Bold (Ctrl+B)"], ["italic", Italic, "Italic (Ctrl+I)"], ["underline", Underline, "Underline (Ctrl+U)"]] as const;
  return (
    <div className="sticky top-0 z-10 flex items-center gap-1 rounded-md border border-border bg-card p-1 shadow-sm">
      {tools.map(([mark, Icon, label]) => (
        <Button key={mark} type="button" variant="ghost" size="icon" aria-label={label} title={label}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { if (target.current?.isConnected) applyMark(target.current, mark); }}>
          <Icon className="h-4 w-4" />
        </Button>
      ))}
      <span className="ml-1 text-xs text-muted-foreground">Select text in Profile, bullet points or education details, then format it.</span>
    </div>
  );
}

export function CvEditor({ cv, onChange, issues = [], onIssues }: { cv: CV; onChange: (cv: CV) => void; issues?: Issue[]; onIssues?: (i: Issue[]) => void }) {
  const set = <K extends keyof CV>(k: K, v: CV[K]) => onChange({ ...cv, [k]: v });
  const target = useRef<HTMLTextAreaElement | null>(null);
  const rich = (el: EventTarget) => el instanceof HTMLTextAreaElement && el.dataset.rich ? el : null;
  return (
    <div className="space-y-3"
      onFocus={(e) => { const el = rich(e.target); if (el) target.current = el; }}
      onKeyDown={(e) => {
        const el = rich(e.target);
        const mark = ({ b: "bold", i: "italic", u: "underline" } as const)[e.key.toLowerCase() as "b"];
        if (el && mark && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) { e.preventDefault(); applyMark(el, mark); }
      }}>
      <FormatBar target={target} />
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
