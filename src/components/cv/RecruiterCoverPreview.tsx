import { recruiterCoverContent, type RecruiterCover } from "@/lib/cv-cover";
import type { CV, Template } from "@/lib/cv-schema";

export function RecruiterCoverPreview({ cv, template, cover }: { cv: CV; template: Template; cover?: RecruiterCover }) {
  const content = recruiterCoverContent(cv, template, cover);
  if (!content) return null;
  return <article aria-label="Recruiter cover page" className="mx-auto flex min-h-[640px] w-full max-w-[640px] flex-col rounded-sm bg-card p-6 text-card-foreground shadow-sm sm:p-10">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
      <h2 className="text-lg font-semibold break-words">{template.agencyName || "Candidate presentation"}</h2>
      {template.logoDataUrl && <img src={template.logoDataUrl} alt="Recruiter logo" className="h-16 w-40 shrink-0 object-contain" />}
    </header>
    <p className="mt-8 text-xs font-semibold uppercase text-accent">Candidate overview</p>
    <h3 className="mt-2 break-words text-2xl font-bold">{content.name}</h3>
    <dl className="mt-6 divide-y divide-border text-sm">
      {content.rows.map(([label, value]) => <div key={label} className="grid grid-cols-2 gap-4 py-3"><dt className="text-muted-foreground">{label}</dt><dd className="whitespace-pre-wrap break-words font-medium">{value}</dd></div>)}
    </dl>
    {content.notes && <section className="mt-6"><h4 className="text-sm font-semibold">Recruiter notes</h4><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{content.notes}</p></section>}
    {content.recruiter.length > 0 && <footer className="mt-8 border-t border-border pt-4 text-sm text-muted-foreground"><h4 className="mb-2 font-semibold text-foreground">Presented by</h4>{content.recruiter.map((line, i) => <p key={i} className="break-words">{line}</p>)}</footer>}
  </article>;
}