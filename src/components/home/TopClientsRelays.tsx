"use client";

import Link from "next/link";
import { Monitor, Radio, Users, FileText } from "lucide-react";
import { ClientEntry, RelayLeaderboardEntry } from "@/lib/types";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function displayClient(name: string): string {
  if (!name) return "Unknown";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function displayRelay(url: string): string {
  try {
    return url.replace(/^wss?:\/\//, "").replace(/\/$/, "");
  } catch {
    return url;
  }
}

function rankBadge(rank: number) {
  if (rank === 1)
    return (
      <span className="inline-flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-[10px] font-bold text-black">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-400 text-[10px] font-bold text-black">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-[10px] font-bold text-black">
        3
      </span>
    );
  return (
    <span className="inline-flex size-5 items-center justify-center rounded-full border border-white/10 text-[10px] font-medium text-white/40">
      {rank}
    </span>
  );
}

interface Props {
  clients: ClientEntry[];
  relays: RelayLeaderboardEntry[];
}

export function TopClientsRelays({ clients, relays }: Props) {
  const topClients = [...clients].sort((a, b) => b.user_count - a.user_count).slice(0, 10);
  const topRelays = [...relays].sort((a, b) => b.user_count - a.user_count).slice(0, 10);
  const maxClientUsers = topClients[0]?.user_count ?? 1;
  const maxRelayUsers = topRelays[0]?.user_count ?? 1;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {/* Top Clients */}
      <div className="rounded-2xl border border-white/[0.06] bg-card/60 p-5 backdrop-blur">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-neon-blue/10 p-2">
            <Monitor className="size-5 text-neon-blue" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Top Clients</h2>
            <p className="text-xs text-white/50">Most popular Nostr apps</p>
          </div>
        </div>

        <div className="space-y-1">
          {topClients.map((client, idx) => {
            const rank = idx + 1;
            const barPct = Math.max(3, (client.user_count / maxClientUsers) * 100);

            return (
              <div
                key={client.client_name}
                className="flex items-center gap-2.5 rounded-xl px-1 py-1.5 transition hover:bg-white/[0.03]"
              >
                <div className="shrink-0">{rankBadge(rank)}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{displayClient(client.client_name)}</p>
                  <div className="mt-0.5 h-0.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-neon-blue/60 to-neon-blue/20"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs tabular-nums text-white/50">
                  <Users className="size-3 text-white/30" />
                  {formatNumber(client.user_count)}
                </div>
                <div className="flex items-center gap-1 text-xs tabular-nums text-white/35">
                  <FileText className="size-3 text-white/20" />
                  {formatNumber(client.note_count)}
                </div>
              </div>
            );
          })}
        </div>

        <Link
          href="/analytics"
          className="mt-3 block text-center text-xs text-white/30 transition hover:text-white/60"
        >
          View all clients →
        </Link>
      </div>

      {/* Top Relays */}
      <div className="rounded-2xl border border-white/[0.06] bg-card/60 p-5 backdrop-blur">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-neon-purple/10 p-2">
            <Radio className="size-5 text-neon-purple" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Top Relays</h2>
            <p className="text-xs text-white/50">Most used by NIP-65 relay lists</p>
          </div>
        </div>

        <div className="space-y-1">
          {topRelays.map((relay, idx) => {
            const rank = idx + 1;
            const barPct = Math.max(3, (relay.user_count / maxRelayUsers) * 100);

            return (
              <div
                key={relay.relay_url}
                className="flex items-center gap-2.5 rounded-xl px-1 py-1.5 transition hover:bg-white/[0.03]"
              >
                <div className="shrink-0">{rankBadge(rank)}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium font-mono">{displayRelay(relay.relay_url)}</p>
                  <div className="mt-0.5 h-0.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-neon-purple/60 to-neon-purple/20"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs tabular-nums text-white/50">
                  <Users className="size-3 text-white/30" />
                  {formatNumber(relay.user_count)}
                </div>
              </div>
            );
          })}
        </div>

        <Link
          href="/analytics"
          className="mt-3 block text-center text-xs text-white/30 transition hover:text-white/60"
        >
          View all relays →
        </Link>
      </div>
    </div>
  );
}
