import { useCallback, useRef, useState } from "react";
import { ChevronsLeftRight } from "lucide-react";

export function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  const [touched, setTouched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const move = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos(Math.min(96, Math.max(4, ((clientX - r.left) / r.width) * 100)));
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setTouched(true);
    move(e.clientX);
  };

  return (
    <figure className="rounded-md border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-sm bg-foreground px-2 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-background">Before</span>
        <span className="rounded-sm bg-accent px-2 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-accent-foreground">After</span>
      </div>
      <div
        ref={ref}
        role="slider"
        aria-label="Compare CV before and after formatting"
        aria-valuenow={Math.round(pos)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={(e) => e.buttons === 1 && move(e.clientX)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setPos((p) => Math.max(4, p - 4));
          if (e.key === "ArrowRight") setPos((p) => Math.min(96, p + 4));
        }}
        className="relative aspect-[3/4] w-full cursor-ew-resize touch-none select-none overflow-hidden rounded-sm"
      >
        <img src={before} alt="A cluttered two-column CV with icons and coloured boxes" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
          <img src={after} alt="The same CV in a clean single-column structured layout" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        </div>
        <div className="absolute inset-y-0" style={{ left: `${pos}%` }}>
          <div className="absolute inset-y-0 -ml-px w-0.5 bg-background shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" />
          <div className="absolute top-1/2 -ml-5 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md">
            <ChevronsLeftRight className="h-5 w-5" />
          </div>
        </div>
        {!touched && (
          <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background">
            Drag to compare
          </span>
        )}
      </div>
      <figcaption className="mt-3 text-center text-sm text-muted-foreground">
        Same words. One structure ATS platforms and recruiters both read. <span className="text-xs">(Fictional sample.)</span>
      </figcaption>
    </figure>
  );
}
