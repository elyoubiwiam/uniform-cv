import { stylePresets, type Template } from "@/lib/cv-schema";
import { cn } from "@/lib/utils";

/** Starting-point layouts. Colours shown are the agency's chosen accent values (user data). */
export function StylePicker({ template, onChange, className }: { template: Template; onChange: (t: Template) => void; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {stylePresets.map((p) => {
        const active = template.font === p.font && template.align === p.align && template.accentColor.toLowerCase() === p.accentColor.toLowerCase();
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange({ ...template, accentColor: p.accentColor, font: p.font, align: p.align })}
            className={cn("rounded-md border bg-card p-3 text-left transition-colors hover:border-accent", active ? "border-accent ring-1 ring-accent" : "border-border")}
          >
            <div className={cn("space-y-1", p.align === "center" && "flex flex-col items-center")}>
              <div className="h-2 w-16 rounded-sm bg-foreground/80" />
              <div className="h-1.5 w-10 rounded-sm" style={{ backgroundColor: p.accentColor }} />
              <div className="mt-1 h-px w-full" style={{ backgroundColor: p.accentColor }} />
              <div className="h-1 w-full rounded-sm bg-muted" />
              <div className="h-1 w-4/5 rounded-sm bg-muted" />
            </div>
            <p className="mt-2 text-sm font-semibold" style={{ fontFamily: p.font === "times" ? "Georgia, serif" : "Helvetica, Arial, sans-serif" }}>{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.note}</p>
          </button>
        );
      })}
    </div>
  );
}
