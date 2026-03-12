import Link from "next/link";
import { Radio } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/explore", label: "Explore" },
  { href: "/trending", label: "Trending" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex items-center gap-4 px-4 py-2.5 sm:px-8 lg:px-16">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="rounded-lg bg-gradient-to-tr from-neon-pink/30 via-neon-blue/40 to-neon-green/30 p-1.5 shadow-glow">
            <Radio className="size-4 text-white" />
          </div>
          <span className="hidden text-sm font-semibold tracking-wide text-white sm:inline">
            Nostr Archives
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navItems.map((nav) => (
            <Link
              key={nav.href}
              href={nav.href}
              className="rounded-full px-3 py-1 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              {nav.label}
            </Link>
          ))}
        </nav>

        {/* Search — grows to fill middle */}
        <div className="ml-auto w-full max-w-md">
          <SearchBar compact />
        </div>
      </div>
    </header>
  );
}
