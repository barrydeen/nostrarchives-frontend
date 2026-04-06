"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Monitor, Users, FileText, ArrowRight } from "lucide-react";
import { ClientEntry } from "@/lib/types";
import { fetchClientLeaderboard } from "@/lib/client-api";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function displayName(name: string): string {
  if (!name) return "Unknown";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function rankBadge(rank: number) {
  if (rank === 1)
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-xs font-bold text-black">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-400 text-xs font-bold text-black">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-black">
        3
      </span>
    );
  return (
    <span className="inline-flex size-6 items-center justify-center rounded-full border border-white/10 text-xs font-medium text-white/40">
      {rank}
    </span>
  );
}

const rangeOptions = [
  { label: "Today", value: "today" },
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "All", value: "all" },
];

function TimeframeSwitcher({
  value,
  onChange,
}: {
  value: string;
  onChange: (range: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-white/5 p-1">
      {rangeOptions.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface Props {
  clients: ClientEntry[];
}

export function ClientCard({ clients }: Props) {
  const [range, setRange] = useState("today");
  const [currentClients, setCurrentClients] = useState<ClientEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch "today" on mount
  useEffect(() => {
    fetchClientLeaderboard(100, "today")
      .then((res) => {
        if (res?.clients) setCurrentClients(res.clients);
      })
      .catch(() => setCurrentClients(clients))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRangeChange = useCallback(
    async (newRange: string) => {
      setRange(newRange);
      if (newRange === "all" && clients.length > 0) {
        setCurrentClients(clients);
        return;
      }
      setLoading(true);
      try {
        const res = await fetchClientLeaderboard(100, newRange);
        if (res?.clients) {
          setCurrentClients(res.clients);
        }
      } catch {
        // keep existing data on error
      } finally {
        setLoading(false);
      }
    },
    [clients],
  );

  // Sort by user_count descending
  const sorted = [...currentClients].sort((a, b) => b.user_count - a.user_count);
  const top = sorted.slice(0, 15);
  const maxUsers = top[0]?.user_count ?? 1;

  return (
    <div className="min-w-0 rounded-[28px] border border-white/10 bg-surface/70 p-5 shadow-2xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Monitor className="size-4 text-neon-blue" />
          <h2 className="text-base font-semibold">Client Usage</h2>
        </div>
        <TimeframeSwitcher value={range} onChange={handleRangeChange} />
      </div>

      {/* Column headers */}
      <div className="mb-2 flex items-center gap-3 px-1 text-[10px] uppercase tracking-widest text-white/30">
        <span className="w-6" />
        <span className="flex-1">Client</span>
        <span className="w-16 text-right">Users</span>
        <span className="w-16 text-right">Notes</span>
      </div>

      {/* Rows */}
      <div className={`space-y-1 transition-opacity duration-200 ${loading ? "opacity-50" : ""}`}>
        {top.map((client, idx) => {
          const rank = idx + 1;
          const barPct = Math.max(3, (client.user_count / maxUsers) * 100);

          return (
            <div
              key={client.client_name}
              className="group relative flex items-center gap-3 rounded-xl px-1 py-1.5 transition hover:bg-white/[0.03]"
            >
              <div className="shrink-0">{rankBadge(rank)}</div>

              {/* Name + bar */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {displayName(client.client_name)}
                </p>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-neon-blue/60 to-neon-blue/30 transition-all duration-500"
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex w-16 items-center justify-end gap-1 text-xs tabular-nums text-white/60">
                <Users className="size-3 text-white/30" />
                {formatNumber(client.user_count)}
              </div>
              <div className="flex w-16 items-center justify-end gap-1 text-xs tabular-nums text-white/40">
                <FileText className="size-3 text-white/20" />
                {formatNumber(client.note_count)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-center">
        <Link
          href="/analytics/clients"
          className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white/40 transition hover:bg-white/5 hover:text-white/70"
        >
          View all {currentClients.length} clients
          <ArrowRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}
