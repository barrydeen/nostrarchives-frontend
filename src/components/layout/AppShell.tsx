"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";

const STORAGE_KEY = "sidebar_collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader
          menuOpen={mobileMenuOpen}
          onToggleMenu={() => setMobileMenuOpen((prev) => !prev)}
        />

        <div className="relative isolate flex-1 overflow-hidden">
          <div className="grid-overlay pointer-events-none absolute inset-0 opacity-60" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,119,206,0.18),transparent_55%)]" />
          <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
