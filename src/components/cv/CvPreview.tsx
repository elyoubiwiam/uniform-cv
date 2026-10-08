import type { CV, Template } from "@/lib/cv-schema";
import type { Issue } from "@/lib/proofread";
import { allLinks, contactLine, dateRange, headerLinks, linkSegments } from "@/lib/cv-export";

/** On-screen preview of the export. Uses the agency's chosen accent (user data, not a theme colour). */
function Marked({ text, issues }: { text: string; issues: Issue[] }) {
  const hits = issues.filter((i) => text.includes(i.text));
  if (!hits.length) return <>{text}</>;
  const re = new RegExp(`(${hits.map((h) => h.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  return (
    <>
      {text.split(re).map((part, i) => {
        const hit = hits.find((h) => h.text === part);
        return hit ? (
          <span key={i} title={`${hit.reason}: "${hit.suggestion}"`} className="underline decoration-destructive decoration-wavy underline-offset-2">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}

export function CvPreview({ cv, template, issues = [] }: { cv: CV; template: Template; issues?: Issue[] }) {
  const accent = { color: template.accentColor };
  const links = allLinks(cv, template);
  const L = ({ text }: { text: string }) => (
    <>
      {linkSegments(text, links).map((s, i) =>
        s.url ? <a key={i} href={s.url} target="_blank" rel="noreferrer" className="underline" style={accent}>{s.text}</a> : <Marked key={i} text={s.text} issues={issues} />,
      )}
    </>
  );
  const center = template.align === "center";
  const fontFamily = template.font === "times" ? "Georgia, 'Times New Roman', serif" : "Helvetica, Arial, sans-serif";
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mt-5">
      <h3 className="border-b border-border pb-1 text-[11px] font-bold uppercase tracking-[0.15em]" style={accent}>
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
  return (
    <div className="mx-auto aspect-[1/1.414] w-full max-w-[640px] overflow-hidden rounded-sm bg-card p-10 text-[12px] leading-relaxed text-card-foreground shadow-[0_1px_3px_rgb(0_0_0/0.08),0_12px_40px_-12px_rgb(0_0_0/0.18)]" style={{ fontFamily }}>
      <div className="h-full overflow-y-auto pr-1">
        <div className={center ? "flex flex-col-reverse items-center gap-3 text-center" : "flex items-start justify-between gap-4"}>
          <div>
            <h2 className="text-2xl font-bold leading-tight"><Marked text={cv.fullName || "Candidate"} issues={issues} /></h2>
            {cv.headline && <p className="text-sm" style={accent}><Marked text={cv.headline} issues={issues} /></p>}
          </div>
          {template.logoDataUrl ? (
            <img src={template.logoDataUrl} alt="" className="h-8 w-auto object-contain" />
          ) : template.agencyName ? (
            <span className="text-[10px] font-bold uppercase tracking-wider" style={accent}>{template.agencyName}</span>
          ) : null}
        </div>
        <p className={`mt-1 text-[11px] text-muted-foreground ${center ? "text-center" : ""}`}><L text={contactLine(cv, template)} /></p>
        <div className={`mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] ${center ? "justify-center" : ""}`}>
          {headerLinks(cv, template).map((link, i) => <a key={i} href={link.url} target="_blank" rel="noreferrer" className="break-all underline" style={accent}>{link.text}</a>)}
        </div>
        <div className="mt-3 h-[2px]" style={{ backgroundColor: template.accentColor }} />

        {cv.summary && <Section title="Profile"><p className="whitespace-pre-line"><L text={cv.summary} /></p></Section>}
        {cv.experience.length > 0 && (
          <Section title="Experience">
            {cv.experience.map((e, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between gap-3">
                  <span className="font-bold"><Marked text={e.title} issues={issues} /></span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{dateRange(e.startDate, e.endDate)}</span>
                </div>
                <div style={accent}><Marked text={[e.company, e.location].filter(Boolean).join(", ")} issues={issues} /></div>
                <ul className="mt-1 list-disc pl-4">
                  {e.bullets.map((b, j) => <li key={j}><L text={b} /></li>)}
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
                  <span className="font-bold"><Marked text={e.degree} issues={issues} /></span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{dateRange(e.startDate, e.endDate)}</span>
                </div>
                <div style={accent}><Marked text={e.institution} issues={issues} /></div>
                {e.details && <p><L text={e.details} /></p>}
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
        ).map(([t, items]) => items.length > 0 && <Section key={t} title={t}><p><L text={items.join("  ·  ")} /></p></Section>)}
      </div>
    </div>
  );
}
