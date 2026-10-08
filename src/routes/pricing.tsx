import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Uniform CV formatter (free during beta)" },
      { name: "description", content: "Uniform is free during beta: unlimited CV formatting, branding, anonymising and PDF/Word export." },
      { property: "og:title", content: "Pricing — Uniform is free during beta" },
      { property: "og:description", content: "Format unlimited CVs into one structured layout, free while Uniform is in beta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pricing,
});

const included = [
  "Unlimited CVs, read in batches",
  "PDF, Word, text, and photos or scans",
  "Agency logo, consultant details and footer",
  "Anonymise mode",
  "Make shorter and spelling check",
  "PDF and Word downloads",
];

function Pricing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Pricing</p>
        <h1 className="mt-3 font-display text-5xl font-medium tracking-tight">Free during beta.</h1>
        <p className="mt-5 text-lg text-muted-foreground">Use everything, as much as you like, while we build Uniform with early agencies and candidates.</p>
        <div className="mt-10 rounded-md border border-border bg-card p-8">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl">£0</span>
            <span className="text-muted-foreground">during beta</span>
          </div>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {included.map((i) => (
              <li key={i} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{i}</li>
            ))}
          </ul>
          <Button asChild className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/">Start formatting</Link></Button>
        </div>
        <section className="mt-10 border-t border-foreground pt-4">
          <h2 className="font-display text-2xl">Planned after beta</h2>
          <p className="mt-3 text-muted-foreground">Simple per-CV and agency plans, plus importing CVs straight from your ATS. Beta users will hear first, well before anything changes.</p>
          <Button asChild variant="outline" className="mt-5"><a href="mailto:hello@uniform.example">Get in touch</a></Button>
        </section>
      </main>
    </div>
  );
}
