"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, ArrowUp, ArrowDown } from "lucide-react";
import { TopZapper, ProfileMetadataEntry } from "@/lib/types";
import { formatNumber, truncateHex } from "@/lib/utils";

interface BiggestZappersProps {
  sent: TopZapper[];
  received: TopZapper[];
  profiles: Map<string, ProfileMetadataEntry>;
}

export function BiggestZappers({ sent, received, profiles }: BiggestZappersProps) {
  const [direction, setDirection] = useState<"received" | "sent">("received");
  const zappers = direction === "received" ? received : sent;

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-neon-amber/10 p-2">
            <Zap className="size-5 text-neon-amber" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Biggest Zappers</h2>
            <p className="text-xs text-white/50">Top zappers in the last 24 hours</p>
          </div>
        </div>
        <div className="flex overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03]">
          <button
            onClick={() => setDirection("received")}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition ${
              direction === "received"
                ? "bg-neon-amber/15 text-neon-amber"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            <ArrowDown className="size-3" />
            Received
          </button>
          <button
            onClick={() => setDirection("sent")}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition ${
              direction === "sent"
                ? "bg-neon-amber/15 text-neon-amber"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            <ArrowUp className="size-3" />
            Sent
          </button>
        </div>
      </div>

      {!zappers.length ? (
        <p className="text-sm text-white/40">No zaps in the last 24 hours.</p>
      ) : (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
          {zappers.map((zapper, index) => {
            const profile = profiles.get(zapper.pubkey);
            const name = profile?.preferred_name || truncateHex(zapper.pubkey);
            const picture = profile?.picture;

            return (
              <Link
                key={zapper.pubkey}
                href={`/profiles/${zapper.pubkey}`}
                className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-card/60 p-4 backdrop-blur transition hover:border-neon-amber/20 hover:bg-card/80"
              >
                {index < 3 && (
                  <span className="absolute right-3 top-3 font-mono text-[10px] font-bold text-neon-amber/40">
                    #{index + 1}
                  </span>
                )}
                {picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={picture}
                    alt=""
                    className="size-10 shrink-0 rounded-full object-cover ring-2 ring-neon-amber/20"
                    loading="lazy"
                  />
                ) : (
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neon-amber/10 text-sm font-bold text-neon-amber/60 ring-2 ring-neon-amber/20">
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/90 group-hover:text-white">
                    {name}
                  </p>
                  <p className="flex items-center gap-1 text-[11px] text-neon-amber/60">
                    <Zap className="size-3" />
                    {formatNumber(zapper.total_sats)} sats
                  </p>
                  <p className="text-[10px] text-white/30">
                    {zapper.zap_count} zap{zapper.zap_count !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
