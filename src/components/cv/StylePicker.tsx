import { stylePresets, type Template } from "@/lib/cv-schema";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel";
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
export function StylePicker({ template, onChange, className, enlarged = false }: { template: Template; onChange: (t: Template) => void; className?: string; enlarged?: boolean }) {
  const [api, setApi] = useState<CarouselApi>();
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    if (!api) return;
    const update = () => setOverflow(api.canScrollPrev() || api.canScrollNext());
    update();
    api.on("reInit", update);
    api.on("select", update);
    return () => {
      api.off("reInit", update);
      api.off("select", update);
    };
  }, [api]);

  const styles = stylePresets.map((p) => {
        const active = template.font === p.font && template.align === p.align && template.accentColor.toLowerCase() === p.accentColor.toLowerCase();
        return (
          <Button
            key={p.id}
            type="button"
            onClick={() => onChange({ ...template, accentColor: p.accentColor, font: p.font, align: p.align })}
            variant="ghost"
            aria-pressed={active}
            aria-label={`Select ${p.name} style`}
            className={cn("block h-auto w-full whitespace-normal rounded-md border bg-card p-3 text-left transition-colors hover:border-accent hover:bg-card hover:text-foreground", active ? "border-accent ring-1 ring-accent" : "border-border")}
          >
            <img src={previews[p.id]} alt={`Example CV in the ${p.name} style`} className="h-auto w-full rounded-sm border border-border" draggable={false} />
            <p className="mt-2 text-sm font-semibold" style={{ fontFamily: p.font === "times" ? "Georgia, serif" : "Helvetica, Arial, sans-serif" }}>{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.note}</p>
          </Button>
        );
      });

  if (!enlarged) return <div className={cn("grid grid-cols-2 gap-2", className)}>{styles}</div>;

  return (
    <Carousel opts={{ align: "start", containScroll: "trimSnaps" }} setApi={setApi} className={cn("min-w-0", className)} aria-label="CV style examples">
      {overflow && <div className="mb-3 flex justify-end gap-2">
        <CarouselPrevious className="static h-10 w-10 translate-x-0 translate-y-0" aria-label="Previous CV style" title="Previous CV style" />
        <CarouselNext className="static h-10 w-10 translate-x-0 translate-y-0" aria-label="Next CV style" title="Next CV style" />
      </div>}
      <CarouselContent className="-ml-4 py-1">
        {styles.map((style, index) => <CarouselItem key={stylePresets[index].id} className="basis-full pl-4 sm:basis-1/2">{style}</CarouselItem>)}
      </CarouselContent>
    </Carousel>
  );
}
