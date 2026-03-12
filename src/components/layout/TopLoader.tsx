"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin progress bar at the top of the viewport.
 * Starts on client-side navigation, completes when the new route renders.
 */
export function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timerRef.current = null;
    timeoutRef.current = null;
  }, []);

  const start = useCallback(() => {
    cleanup();
    setProgress(0);
    setVisible(true);

    // Ramp progress from 0 → ~90% with decreasing speed
    let p = 0;
    timerRef.current = setInterval(() => {
      p += (90 - p) * 0.08;
      if (p >= 89.5) {
        p = 90;
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setProgress(p);
    }, 80);
  }, [cleanup]);

  const finish = useCallback(() => {
    cleanup();
    setProgress(100);
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, [cleanup]);

  // Intercept client-side navigation clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      // Skip external links, hash-only, and new-tab links
      if (href.startsWith("http") || href.startsWith("#") || anchor.target === "_blank") return;
      // Skip if modifier keys held (open in new tab)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // If navigating to same path + search, skip
      const url = new URL(href, window.location.origin);
      if (url.pathname === pathname && url.search === window.location.search) return;
      start();
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [pathname, start]);

  // Complete the bar when the route actually changes
  useEffect(() => {
    finish();
  }, [pathname, searchParams, finish]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] h-[3px]">
      <div
        className="h-full bg-gradient-to-r from-neon-pink via-neon-blue to-neon-green shadow-[0_0_10px_rgba(94,208,255,0.6)]"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? "width 200ms ease-out" : "width 80ms linear",
        }}
      />
    </div>
  );
}
