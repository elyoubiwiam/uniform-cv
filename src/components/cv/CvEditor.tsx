import { Check, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
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

function Field({ label, value, onChange, multiline }: { label: string; value: string | null; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {multiline ? (
        <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={4} />
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

export function CvEditor({ cv, onChange, issues = [], onIssues }: { cv: CV; onChange: (cv: CV) => void; issues?: Issue[]; onIssues?: (i: Issue[]) => void }) {
  const set = <K extends keyof CV>(k: K, v: CV[K]) => onChange({ ...cv, [k]: v });
  return (
    <div className="space-y-3">
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
        <Field label="Links (comma separated)" value={cv.links.join(", ")} onChange={(v) => set("links", list(v))} />
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
      <Field label="Profile" value={cv.summary} onChange={(v) => set("summary", orNull(v))} multiline />

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
            <Field label="Bullet points (one per line)" value={e.bullets.join("\n")} onChange={(v) => up({ bullets: lines(v) })} multiline />
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
            <Field label="Details" value={e.details} onChange={(v) => up({ details: orNull(v) })} />
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => set("education", cv.education.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" /> Remove
            </Button>
          </div>
        );
      })}

      <Heading>Skills</Heading>
      <SkillsField skills={cv.skills} onChange={(skills) => set("skills", skills)} />
      <Heading>Interests & hobbies</Heading>
      <Field label="Interests & hobbies (comma separated)" value={(cv.interests ?? []).join(", ")} onChange={(v) => set("interests", list(v))} multiline />
      <Heading>Languages & certifications</Heading>
      <Field label="Languages (comma separated)" value={cv.languages.join(", ")} onChange={(v) => set("languages", list(v))} />
      <Field label="Certifications (comma separated)" value={cv.certifications.join(", ")} onChange={(v) => set("certifications", list(v))} />
    </div>
  );
}
