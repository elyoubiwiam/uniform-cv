import { Briefcase, User } from "lucide-react";
import type { Template } from "@/lib/cv-schema";
import { cn } from "@/lib/utils";

const options = [
  { id: "recruiter", label: "I'm a recruiter", note: "Agency logo, consultant details, anonymising", Icon: Briefcase },
  { id: "candidate", label: "I'm a candidate", note: "Just my CV, cleanly structured", Icon: User },
] as const;

export function AudiencePicker({ template, onChange }: { template: Template; onChange: (t: Template) => void }) {
  return (
    <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
      {options.map(({ id, label, note, Icon }) => {
        const on = template.audience === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange({ ...template, audience: id })}
            className={cn("flex items-start gap-3 rounded-md border p-3 text-left transition-colors", on ? "border-accent bg-accent/5" : "border-border hover:border-foreground/40")}
          >
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", on ? "text-accent" : "text-muted-foreground")} />
            <span>
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-xs text-muted-foreground">{note}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
