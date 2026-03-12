"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, User2, MessageSquare } from "lucide-react";
import clsx from "clsx";

const hexRegex = /^[0-9a-f]{64}$/i;

export function SearchBar() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const isValidHex = useMemo(() => hexRegex.test(value.trim()), [value]);

  const navigate = useCallback(
    (type: "profile" | "note") => {
      const cleaned = value.trim();
      if (!cleaned) return;
      if (!hexRegex.test(cleaned)) return;

      startTransition(() => {
        router.push(type === "profile" ? `/profiles/${cleaned}` : `/notes/${cleaned}`);
      });
    },
    [router, value],
  );

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-surface/60 px-4 py-3">
          <Search className="size-4 text-white/60" />
          <input
            className="flex-1 bg-transparent text-base text-white placeholder:text-white/40 focus:outline-none"
            placeholder="Paste a pubkey or event id (hex). npub support coming soon."
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("profile")}
            disabled={!isValidHex || isPending}
            className={clsx(
              "inline-flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold transition",
              isValidHex
                ? "bg-gradient-to-r from-neon-pink/80 to-neon-blue/80 text-white shadow-glow"
                : "bg-white/5 text-white/40",
            )}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <User2 className="size-4" />}
            Profile
          </button>
          <button
            onClick={() => navigate("note")}
            disabled={!isValidHex || isPending}
            className={clsx(
              "inline-flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold transition",
              isValidHex
                ? "bg-gradient-to-r from-neon-green/70 to-neon-amber/70 text-white shadow-glow"
                : "bg-white/5 text-white/40",
            )}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <MessageSquare className="size-4" />}
            Note
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-white/50">
        Tip: pull any entity from <span className="font-semibold text-white/80">nostr-api</span> and paste it here. We validate hex and route you to the right view instantly.
      </p>
    </div>
  );
}
