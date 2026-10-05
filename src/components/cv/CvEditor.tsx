import { Plus, Trash2 } from "lucide-react";
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

export function CvEditor({ cv, onChange }: { cv: CV; onChange: (cv: CV) => void }) {
  const set = <K extends keyof CV>(k: K, v: CV[K]) => onChange({ ...cv, [k]: v });

  return (
    <div className="space-y-3">
      <Heading>Candidate</Heading>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Full name" value={cv.fullName} onChange={(v) => set("fullName", v)} />
        <Field label="Headline" value={cv.headline} onChange={(v) => set("headline", orNull(v))} />
        <Field label="Location" value={cv.location} onChange={(v) => set("location", orNull(v))} />
        <Field label="Email" value={cv.email} onChange={(v) => set("email", orNull(v))} />
        <Field label="Phone" value={cv.phone} onChange={(v) => set("phone", orNull(v))} />
        <Field label="Links (comma separated)" value={cv.links.join(", ")} onChange={(v) => set("links", list(v))} />
      </div>
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

      <Heading>Skills & more</Heading>
      <Field label="Skills (comma separated)" value={cv.skills.join(", ")} onChange={(v) => set("skills", list(v))} multiline />
      <Field label="Languages (comma separated)" value={cv.languages.join(", ")} onChange={(v) => set("languages", list(v))} />
      <Field label="Certifications (comma separated)" value={cv.certifications.join(", ")} onChange={(v) => set("certifications", list(v))} />
    </div>
  );
}
