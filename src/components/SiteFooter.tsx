import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-muted-foreground">
        <span>Uniform — free</span>
        <nav className="flex gap-4">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy & data</Link>
        </nav>
      </div>
    </footer>
  );
}

export function PageHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-3">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight">Uniform<span className="text-accent">.</span></Link>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <span>Free</span>
          <Link to="/privacy" className="hover:text-foreground">Your data</Link>
        </nav>
      </div>
    </header>
  );
}
