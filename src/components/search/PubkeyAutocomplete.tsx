"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.nostrarchives.com";

interface Suggestion {
  pubkey: string;
  name: string | null;
  display_name: string | null;
  picture: string | null;
  nip05: string | null;
}

interface PubkeyAutocompleteProps {
  name: string;
  id?: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
}

export function PubkeyAutocomplete({
  name,
  id,
  label,
  placeholder = "name, npub, or hex pubkey",
  defaultValue,
}: PubkeyAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const [hiddenValue, setHiddenValue] = useState(defaultValue ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount, if there's a defaultValue that looks like a pubkey, show it as-is
  useEffect(() => {
    if (defaultValue) {
      setDisplayValue(defaultValue);
      setHiddenValue(defaultValue);
    }
  }, [defaultValue]);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    // Don't suggest if input looks like a raw pubkey or npub
    if (q.length === 64 && /^[0-9a-f]+$/i.test(q)) return;
    if (q.startsWith("npub1")) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/v1/search/suggest?q=${encodeURIComponent(q)}&limit=5`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) return;
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
      setOpen((data.suggestions ?? []).length > 0);
    } catch {
      // ignore
    }
  }, []);

  const handleInput = (value: string) => {
    setDisplayValue(value);
    setHiddenValue(value); // always sync — user may type raw pubkey/npub
    setQuery(value);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 200);
  };

  const selectSuggestion = (s: Suggestion) => {
    const preferredName = s.display_name || s.name || s.pubkey.slice(0, 12) + "…";
    setDisplayValue(preferredName);
    setHiddenValue(s.pubkey);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      <label htmlFor={id ?? name} className="text-xs font-medium text-white/50">
        {label}
      </label>

      {/* Hidden input carries the actual pubkey value for form submission */}
      <input type="hidden" name={name} value={hiddenValue} />

      <input
        ref={inputRef}
        id={id ?? name}
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        className="w-full rounded-2xl border border-white/10 bg-surface/80 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
          {suggestions.map((s, i) => (
            <li key={s.pubkey}>
              <button
                type="button"
                onMouseDown={() => selectSuggestion(s)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  i === activeIndex
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {s.picture ? (
                  <img
                    src={s.picture}
                    alt=""
                    className="size-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs text-white/40">
                    ?
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {s.display_name || s.name || "Unknown"}
                  </div>
                  <div className="truncate text-xs text-white/40">
                    {s.nip05 || `${s.pubkey.slice(0, 16)}…`}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
