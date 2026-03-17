"use client";

import { useState } from "react";
import { Trophy, Users, FileText, ArrowUpDown } from "lucide-react";
import { ClientEntry } from "@/lib/types";

type SortKey = "note_count" | "user_count";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

/** Title-case a client name for display. */
function displayName(name: string): string {
  if (!name) return "Unknown";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function rankBadge(rank: number) {
  if (rank === 1)
    return (
      <span className="inline-flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-sm font-bold text-black shadow-lg shadow-yellow-500/20">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-400 text-sm font-bold text-black shadow-lg shadow-gray-400/20">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-sm font-bold text-black shadow-lg shadow-orange-500/20">
        3
      </span>
    );
  return (
    <span className="inline-flex size-8 items-center justify-center rounded-full border border-white/10 bg-surface/80 text-sm font-medium text-white/50">
      {rank}
    </span>
  );
}

/** Bar width as percentage of max value. */
function barWidth(value: number, max: number): string {
  if (max <= 0) return "0%";
  return `${Math.max(2, (value / max) * 100)}%`;
}

interface Props {
  clients: ClientEntry[];
}

export function ClientLeaderboard({ clients }: Props) {
  const [sortBy, setSortBy] = useState<SortKey>("note_count");

  const sorted = [...clients].sort((a, b) => b[sortBy] - a[sortBy]);

  const maxNotes = sorted[0]?.note_count ?? 1;
  const maxUsers = sorted[0]?.user_count ?? 1;

  const toggleSort = () =>
    setSortBy((prev) => (prev === "note_count" ? "user_count" : "note_count"));

  const totalNotes = clients.reduce((sum, c) => sum + c.note_count, 0);
  const totalUsers = clients.reduce((sum, c) => sum + c.user_count, 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-card/70 p-5 shadow-xl">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/40">
            <Trophy className="size-3.5" />
            Clients tracked
          </div>
          <p className="mt-2 text-2xl font-bold">{clients.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-card/70 p-5 shadow-xl">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/40">
            <FileText className="size-3.5" />
            Total tagged notes
          </div>
          <p className="mt-2 text-2xl font-bold">{formatNumber(totalNotes)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-card/70 p-5 shadow-xl">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/40">
            <Users className="size-3.5" />
            Total unique users
          </div>
          <p className="mt-2 text-2xl font-bold">{formatNumber(totalUsers)}</p>
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="rounded-[32px] border border-white/10 bg-surface/70 p-6 shadow-2xl">
        {/* Sort toggle */}
        <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
          <h2 className="text-xl font-semibold">Leaderboard</h2>
          <button
            onClick={toggleSort}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-surface/80 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-white/30 hover:text-white"
          >
            <ArrowUpDown className="size-3" />
            Sort by {sortBy === "note_count" ? "notes" : "users"}
          </button>
        </div>

        <div className="space-y-2">
          {sorted.map((client, idx) => {
            const rank = idx + 1;
            const notesPct = barWidth(client.note_count, maxNotes);
            const usersPct = barWidth(client.user_count, maxUsers);

            return (
              <div
                key={client.client_name}
                className="group relative flex items-center gap-4 rounded-2xl border border-white/5 bg-card/40 px-4 py-3 transition hover:border-white/15 hover:bg-card/60"
              >
                {/* Rank */}
                <div className="shrink-0">{rankBadge(rank)}</div>

                {/* Name + bars */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {displayName(client.client_name)}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-white/50">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <FileText className="size-3 shrink-0" />
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-neon-pink/70 to-neon-pink/40 transition-all duration-500"
                          style={{ width: notesPct }}
                        />
                      </div>
                      <span className="shrink-0 tabular-nums">
                        {formatNumber(client.note_count)}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <Users className="size-3 shrink-0" />
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-neon-blue/70 to-neon-blue/40 transition-all duration-500"
                          style={{ width: usersPct }}
                        />
                      </div>
                      <span className="shrink-0 tabular-nums">
                        {formatNumber(client.user_count)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
