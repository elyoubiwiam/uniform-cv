import { stylePresets, type Template } from "@/lib/cv-schema";
import { cn } from "@/lib/utils";
import styleClassic from "@/assets/style-classic.jpg";
import styleExecutive from "@/assets/style-executive.jpg";
import styleModern from "@/assets/style-modern.jpg";
import styleMinimal from "@/assets/style-minimal.jpg";

const previews: Record<string, string> = {
  classic: styleClassic,
  executive: styleExecutive,
  modern: styleModern,
  minimal: styleMinimal,
};

/** Starting-point layouts, each shown with a real sample CV rendered in that style. */
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
            <img src={previews[p.id]} alt={`Example CV in the ${p.name} style`} className="aspect-[3/4] w-full rounded-sm border border-border object-cover object-top" />
            <p className="mt-2 text-sm font-semibold" style={{ fontFamily: p.font === "times" ? "Georgia, serif" : "Helvetica, Arial, sans-serif" }}>{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.note}</p>
          </button>
        );
      })}
    </div>
  );
}
