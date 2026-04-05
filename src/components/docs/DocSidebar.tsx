"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TocEntry } from "@/lib/docs-data";

interface DocSidebarProps {
  toc: TocEntry[];
}

export function DocSidebar({ toc }: DocSidebarProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const scrollContainer = document.getElementById("docs-scroll-container");
    if (!scrollContainer) return;

    const ids = toc.flatMap((s) => [
      s.id,
      ...(s.children?.map((c) => c.id) ?? []),
    ]);

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { root: scrollContainer, rootMargin: "-20px 0px -60% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [toc]);

  const handleClick = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    const scrollContainer = document.getElementById("docs-scroll-container");
    if (el && scrollContainer) {
      const top = el.offsetTop - scrollContainer.offsetTop;
      scrollContainer.scrollTo({ top, behavior: "smooth" });
    } else if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const isActive = (id: string) => activeId === id;
  const isParentActive = (entry: TocEntry) =>
    isActive(entry.id) ||
    entry.children?.some((c) => isActive(c.id)) === true;

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-card/80 px-4 py-2.5 text-sm font-medium lg:hidden"
      >
        On this page
        <ChevronDown
          className={`h-4 w-4 text-white/40 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Sidebar nav */}
      <nav className={`${mobileOpen ? "block" : "hidden"} lg:block`}>
        <ul className="space-y-1.5 py-2 lg:py-0">
          {toc.map((entry) => (
            <li key={entry.id}>
              <button
                onClick={() => handleClick(entry.id)}
                className={`w-full text-left rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                  isParentActive(entry)
                    ? "text-white"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                {entry.title}
              </button>
              {entry.children && entry.children.length > 0 && (
                <ul className="ml-3 border-l border-white/[0.06] pl-3 space-y-0.5">
                  {entry.children.map((child) => (
                    <li key={child.id}>
                      <button
                        onClick={() => handleClick(child.id)}
                        className={`w-full text-left rounded-md px-2 py-1.5 text-sm transition-colors ${
                          isActive(child.id)
                            ? "text-neon-pink"
                            : "text-white/30 hover:text-white/50"
                        }`}
                      >
                        {child.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
