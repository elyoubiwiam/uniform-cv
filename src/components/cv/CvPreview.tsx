import type { CV, Template } from "@/lib/cv-schema";
import { contactLine, dateRange } from "@/lib/cv-export";

/** On-screen preview of the export. Uses the agency's chosen accent (user data, not a theme colour). */
export function CvPreview({ cv, template }: { cv: CV; template: Template }) {
  const accent = { color: template.accentColor };
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mt-5">
      <h3 className="border-b border-border pb-1 text-[11px] font-bold uppercase tracking-[0.15em]" style={accent}>
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
  return (
    <div className="mx-auto aspect-[1/1.414] w-full max-w-[640px] overflow-hidden rounded-sm bg-card p-10 text-[12px] leading-relaxed text-card-foreground shadow-[0_1px_3px_rgb(0_0_0/0.08),0_12px_40px_-12px_rgb(0_0_0/0.18)]">
      <div className="h-full overflow-y-auto pr-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold leading-tight">{cv.fullName || "Candidate"}</h2>
            {cv.headline && <p className="text-sm" style={accent}>{cv.headline}</p>}
          </div>
          {template.logoDataUrl ? (
            <img src={template.logoDataUrl} alt="" className="h-8 w-auto object-contain" />
          ) : template.agencyName ? (
            <span className="text-[10px] font-bold uppercase tracking-wider" style={accent}>{template.agencyName}</span>
          ) : null}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">{contactLine(cv, template)}</p>
        <div className="mt-3 h-[2px]" style={{ backgroundColor: template.accentColor }} />

        {cv.summary && <Section title="Profile"><p className="whitespace-pre-line">{cv.summary}</p></Section>}
        {cv.experience.length > 0 && (
          <Section title="Experience">
            {cv.experience.map((e, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between gap-3">
                  <span className="font-bold">{e.title}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{dateRange(e.startDate, e.endDate)}</span>
                </div>
                <div style={accent}>{[e.company, e.location].filter(Boolean).join(", ")}</div>
                <ul className="mt-1 list-disc pl-4">
                  {e.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              </div>
            ))}
          </Section>
        )}
        {cv.education.length > 0 && (
          <Section title="Education">
            {cv.education.map((e, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between gap-3">
                  <span className="font-bold">{e.degree}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{dateRange(e.startDate, e.endDate)}</span>
                </div>
                <div style={accent}>{e.institution}</div>
                {e.details && <p>{e.details}</p>}
              </div>
            ))}
          </Section>
        )}
        {(
          [
            ["Skills", cv.skills],
            ["Languages", cv.languages],
            ["Certifications", cv.certifications],
          ] as const
        ).map(([t, items]) => items.length > 0 && <Section key={t} title={t}><p>{items.join("  ·  ")}</p></Section>)}
      </div>
    </div>
  );
}
