import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/SiteFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy and data | Uniform" },
      { name: "description", content: "Where CVs go, who processes them, how long they're kept, and how Uniform approaches UK GDPR." },
      { property: "og:title", content: "Privacy and data | Uniform" },
      { property: "og:description", content: "Uniform has no database and doesn't keep your CVs. Here's exactly how candidate data is handled, including by our AI provider." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

const sections: [string, string[]][] = [
  ["Where files go", [
    "Your files are opened in your own browser. Where a PDF or Word file already has text, that text is pulled out in the browser.",
    "The text (or the whole file, for scans, photos and PDFs without usable text) is sent over an encrypted connection, through Uniform's server, to the Claude API from Anthropic, our AI provider. Claude organises it into the standard layout.",
    "CV text is also sent to Claude if you use Check spelling or Make shorter.",
    "Uniform has no database and doesn't save CVs on its server.",
  ]],
  ["How long it's kept", [
    "Formatted CVs live only in your open browser tab. Refreshing or closing the tab clears them, so download what you need first.",
    "Your template (style, logo, consultant and agency details) is saved in this browser only, until you clear it.",
    "There are no accounts.",
    "Anthropic deletes what is sent through its API within 30 days by default. It can keep data longer where needed to enforce its usage policy or comply with the law.",
    "By default, Anthropic doesn't use data sent through its API to train its models.",
  ]],
  ["UK GDPR", [
    "Uniform is designed with UK GDPR in mind. When a recruitment agency uses Uniform, the agency remains the data controller for its candidates' data, and Uniform acts as a processor on its behalf, only to format CVs.",
    "Data is kept to a minimum: Uniform only processes what's in the file, and only to format it. Anthropic acts as a sub-processor.",
    "Anonymise mode asks Claude to remove names, contact details and other personal details, so Claude does see the full CV first. Always check the result before sharing it with a client.",
    "For data requests or to ask about a data processing agreement, contact elyoubi.wia@gmail.com.",
  ]],
];

function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Privacy & data</p>
        <h1 className="mt-3 font-display text-5xl font-medium tracking-tight">What happens to your CVs.</h1>
        <p className="mt-5 text-lg text-muted-foreground">How Uniform handles candidate data for your agency.</p>
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
