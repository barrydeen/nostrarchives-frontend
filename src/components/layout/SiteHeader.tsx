"use client";

import { useState } from "react";
import Link from "next/link";
import { Radio, Search, X } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/explore", label: "Explore" },
  { href: "/trending", label: "Trending" },
  { href: "/analytics", label: "Analytics" },
];

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex items-center gap-4 px-4 py-2.5 sm:px-8 lg:px-16">
        {searchOpen ? (
          /* ── Mobile search overlay ── */
          <div className="flex w-full items-center gap-2 sm:hidden">
            <button
              onClick={() => setSearchOpen(false)}
              className="shrink-0 rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Close search"
            >
              <X className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              <SearchBar compact autoFocus onNavigate={() => setSearchOpen(false)} />
            </div>
          </div>
        ) : (
          /* ── Mobile: logo + nav + search icon ── */
          <>
            <Link href="/" className="flex shrink-0 items-center gap-2 sm:hidden">
              <div className="rounded-lg bg-gradient-to-tr from-neon-pink/30 via-neon-blue/40 to-neon-green/30 p-1.5 shadow-glow">
                <Radio className="size-4 text-white" />
              </div>
            </Link>
            <nav className="flex items-center gap-1 sm:hidden">
              {navItems.map((nav) => (
                <Link
                  key={nav.href}
                  href={nav.href}
                  className="rounded-full px-2.5 py-1 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
                >
                  {nav.label}
                </Link>
              ))}
            </nav>
            <button
              onClick={() => setSearchOpen(true)}
              className="ml-auto shrink-0 rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white sm:hidden"
              aria-label="Open search"
            >
              <Search className="size-5" />
            </button>
          </>
        )}

        {/* ── Desktop: always visible ── */}
        <Link href="/" className="hidden shrink-0 items-center gap-2 sm:flex">
          <div className="rounded-lg bg-gradient-to-tr from-neon-pink/30 via-neon-blue/40 to-neon-green/30 p-1.5 shadow-glow">
            <Radio className="size-4 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-white">
            Nostr Archives
          </span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
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
        <div className="ml-auto hidden w-full max-w-md sm:block">
          <SearchBar compact />
        </div>
      </div>
    </header>
  );
}
