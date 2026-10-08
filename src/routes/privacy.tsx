import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/SiteFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & data — Uniform CV formatter" },
      { name: "description", content: "Where CVs go, how long they're kept, and how Uniform approaches UK GDPR." },
      { property: "og:title", content: "Privacy & data — Uniform CV formatter" },
      { property: "og:description", content: "CVs are read once and never stored on our servers. Here's exactly how candidate data is handled." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

const sections: [string, string[]][] = [
  ["Where files go", [
    "Your files are opened in your own browser. Where a PDF already has text, that text is pulled out in the browser.",
    "The text (or the file itself, for scans and photos) is sent once over an encrypted connection to our AI service so it can be organised into the standard layout.",
    "Nothing is saved on our servers, and files aren't used to train AI models.",
  ]],
  ["How long it's kept", [
    "Formatted CVs live only in your open browser tab. Refreshing or closing the tab clears them, so download what you need first.",
    "Your template (style, logo, consultant and agency details) is saved in this browser only, until you clear it.",
    "There are no accounts and no database.",
  ]],
  ["UK GDPR", [
    "Uniform is designed with UK GDPR in mind. When a recruitment agency uses Uniform, the agency remains the data controller for its candidates' data, and Uniform acts as a processor on its behalf, only to format CVs.",
    "Data is kept to a minimum: we only process what's in the file, only for as long as it takes to read it.",
    "Anonymise mode can remove names, contact details and other personal details before a CV is shared with a client.",
    "For data requests or a data processing agreement, contact privacy@uniform.example (placeholder until confirmed).",
  ]],
];

function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Privacy & data</p>
        <h1 className="mt-3 font-display text-5xl font-medium tracking-tight">Read once. Never stored.</h1>
        <p className="mt-5 text-lg text-muted-foreground">Agencies ask before uploading candidate data, and they should. Here's how it works.</p>
        {sections.map(([title, items]) => (
          <section key={title} className="mt-10 border-t border-foreground pt-4">
            <h2 className="font-display text-2xl">{title}</h2>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              {items.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
