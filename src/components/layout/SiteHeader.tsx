import Link from "next/link";
import { Github, Radio, Database } from "lucide-react";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/explore", label: "Explore" },
  { href: "/trending", label: "Trending" },
];

export function SiteHeader() {
  return (
    <header className="mb-10 flex flex-col gap-4 rounded-3xl border border-white/5 bg-surface/80 px-6 py-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-tr from-neon-pink/30 via-neon-blue/40 to-neon-green/30 p-2 shadow-glow">
            <Radio className="size-5 text-white" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">Nostr Archives</p>
            <h1 className="text-2xl font-semibold">Network Explorer</h1>
          </div>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-white/70">
          Live window into the nostr-api ingestion network. Search identities, inspect any note, and surface the signals that move the protocol forward.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-3">
          {navItems.map((nav) => (
            <Link
              key={nav.href}
              href={nav.href}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
            >
              {nav.label}
            </Link>
          ))}
        </nav>
        <div className="flex gap-2">
          <Link
            href="https://api.nostrarchives.com/v1/stats"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 hover:text-white"
          >
            <Database className="size-4" />
            API
          </Link>
          <Link
            href="https://github.com/barrydeen/nostrarchives-frontend"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full bg-white text-background px-4 py-2 text-sm font-semibold shadow-lg"
          >
            <Github className="size-4" />
            GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}
