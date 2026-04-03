"use client";

import { useState } from "react";
import { Radio, ChevronDown, ChevronUp } from "lucide-react";
import type { ConversationRelayConfig } from "@/lib/nip17";
import { dmStore } from "@/lib/dm-store";

interface RelayBadgeProps {
  config: ConversationRelayConfig | null;
}

export function RelayBadge({ config }: RelayBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  if (!config) return null;

  const totalRelays = new Set([
    ...config.ours,
    ...Array.from(config.theirs.values()).flat(),
  ]).size;

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/40 transition hover:bg-white/10 hover:text-white/60"
      >
        <Radio className="size-3" />
        via {totalRelays} relay{totalRelays !== 1 ? "s" : ""}
        {expanded ? (
          <ChevronUp className="size-3" />
        ) : (
          <ChevronDown className="size-3" />
        )}
      </button>

      {expanded && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-xl border border-white/10 bg-surface p-3 shadow-xl">
          {/* Our relays */}
          <div className="mb-2">
            <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-white/30">
              Your DM Relays
            </h4>
            {config.ours.length === 0 ? (
              <p className="text-[11px] text-white/20">Using bootstrap relays</p>
            ) : (
              <ul className="space-y-0.5">
                {config.ours.map((r) => (
                  <li
                    key={r}
                    className="truncate text-[11px] font-mono text-neon-blue/70"
                  >
                    {r.replace("wss://", "")}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Their relays */}
          {Array.from(config.theirs.entries()).map(([pk, relays]) => {
            const profile = dmStore.getProfile(pk);
            const name =
              profile?.display_name || profile?.name || pk.slice(0, 12) + "...";
            return (
              <div key={pk} className="mb-2 last:mb-0">
                <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                  {name}&apos;s DM Relays
                </h4>
                {relays.length === 0 ? (
                  <p className="text-[11px] text-white/20">Using bootstrap relays</p>
                ) : (
                  <ul className="space-y-0.5">
                    {relays.map((r) => (
                      <li
                        key={r}
                        className="truncate text-[11px] font-mono text-neon-green/70"
                      >
                        {r.replace("wss://", "")}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
