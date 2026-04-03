"use client";

import { SearchBar } from "@/components/search/SearchBar";

export function TopBar() {
  return (
    <header className="relative z-50 hidden border-b border-white/5 md:block">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-end px-4 py-2 sm:px-8">
        <div className="w-80">
          <SearchBar compact />
        </div>
      </div>
    </header>
  );
}
