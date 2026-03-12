"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, User2, FileText, ArrowRight } from "lucide-react";
import { decodeEntity, entityPath, looksLikeEntity } from "@/lib/nostr";
import { truncateHex, formatNumber } from "@/lib/utils";
import type { ProfileSearchResult, SuggestResponse } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.nostrarchives.com";
const DEBOUNCE_MS = 250;
const MIN_QUERY_LEN = 2;

// Client-side suggestion cache (TTL 60s)
const cache = new Map<string, { data: SuggestResponse; ts: number }>();
const CACHE_TTL = 60_000;

function getCached(key: string): SuggestResponse | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function SearchBar({
  compact = false,
  autoFocus = false,
  onNavigate,
}: {
  compact?: boolean;
  autoFocus?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProfileSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < MIN_QUERY_LEN) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Skip API call for entity-like input — will resolve on submit
    if (looksLikeEntity(q)) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Check client cache
    const cached = getCached(q.toLowerCase());
    if (cached) {
      if (cached.resolved) {
        // Entity resolved server-side
        setSuggestions([]);
        setIsOpen(false);
        return;
      }
      setSuggestions(cached.suggestions);
      setIsOpen(cached.suggestions.length > 0);
      setSelectedIdx(-1);
      return;
    }

    // Fetch from API
    setIsLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(
        `${API}/v1/search/suggest?q=${encodeURIComponent(q)}&limit=5`,
        { signal: controller.signal, headers: { Accept: "application/json" } },
      );
      if (!res.ok) return;
      const data: SuggestResponse = await res.json();

      // Cache it
      cache.set(q.toLowerCase(), { data, ts: Date.now() });

      if (data.resolved) {
        setSuggestions([]);
        setIsOpen(false);
      } else {
        setSuggestions(data.suggestions);
        setIsOpen(data.suggestions.length > 0);
        setSelectedIdx(-1);
      }
    } catch {
      // Aborted or network error — ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fetchSuggestions(value.trim()), DEBOUNCE_MS);
    },
    [fetchSuggestions],
  );

  const navigate = useCallback(
    (path: string) => {
      setIsOpen(false);
      setQuery("");
      setSuggestions([]);
      onNavigate?.();
      router.push(path);
    },
    [router, onNavigate],
  );

  const handleSubmit = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // Try client-side entity decode for instant navigation
    const entity = decodeEntity(trimmed);
    if (entity) {
      navigate(entityPath(entity));
      return;
    }

    // 64-char hex — go to search page (could be pubkey or event id)
    // Full search page → /search?q=...
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }, [query, navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }
      if (e.key === "Enter") {
        if (selectedIdx >= 0 && suggestions[selectedIdx]) {
          navigate(`/profiles/${suggestions[selectedIdx].pubkey}`);
        } else {
          handleSubmit();
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((prev) => Math.max(prev - 1, -1));
      }
    },
    [selectedIdx, suggestions, navigate, handleSubmit],
  );

  const profileName = (p: ProfileSearchResult) =>
    p.display_name || p.name || truncateHex(p.pubkey);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className={`flex items-center gap-2 rounded-2xl border border-white/10 bg-surface/60 backdrop-blur-xl ${compact ? "px-3 py-2" : "px-4 py-3"}`}>
        <Search className="size-4 shrink-0 text-white/50" />
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          placeholder="Search profiles, notes, or paste npub / nevent..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        />
        {isLoading && <Loader2 className="size-4 animate-spin text-white/40" />}
        {query.trim().length > 0 && !isLoading && (
          <button
            onClick={handleSubmit}
            className="rounded-xl bg-white/10 p-1.5 text-white/60 transition hover:bg-white/20 hover:text-white"
          >
            <ArrowRight className="size-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-surface/95 shadow-2xl backdrop-blur-xl">
          {suggestions.map((profile, idx) => (
            <button
              key={profile.pubkey}
              onClick={() => navigate(`/profiles/${profile.pubkey}`)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                idx === selectedIdx
                  ? "bg-white/10"
                  : "hover:bg-white/5"
              } ${idx < suggestions.length - 1 ? "border-b border-white/5" : ""}`}
            >
              {profile.picture ? (
                <img
                  src={profile.picture}
                  alt=""
                  className="size-9 shrink-0 rounded-full bg-white/10 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <User2 className="size-4 text-white/40" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-white">
                    {profileName(profile)}
                  </span>
                  {profile.nip05 && (
                    <span className="truncate text-xs text-white/40">
                      {profile.nip05}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-white/50">
                  <span>{formatNumber(profile.follower_count)} followers</span>
                  {profile.engagement_score > 0 && (
                    <span>{formatNumber(profile.engagement_score)} engagement</span>
                  )}
                </div>
              </div>
              <ArrowRight className="size-3.5 shrink-0 text-white/30" />
            </button>
          ))}
          <button
            onClick={handleSubmit}
            className="flex w-full items-center justify-center gap-2 border-t border-white/5 px-4 py-2.5 text-xs text-white/50 transition hover:bg-white/5 hover:text-white/80"
          >
            <Search className="size-3" />
            View all results for &ldquo;{query.trim()}&rdquo;
          </button>
        </div>
      )}
    </div>
  );
}
