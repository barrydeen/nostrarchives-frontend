"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Monitor,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
} from "lucide-react";
import { ClientEntry, ClientUserEntry, ProfileMap } from "@/lib/types";
import { fetchClientUsers, fetchClientLeaderboard } from "@/lib/client-api";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function displayName(name: string): string {
  if (!name) return "Unknown";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortPubkey(pubkey: string): string {
  return `${pubkey.slice(0, 8)}...${pubkey.slice(-4)}`;
}

function rankBadge(rank: number) {
  if (rank === 1)
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-xs font-bold text-black">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-400 text-xs font-bold text-black">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-black">
        3
      </span>
    );
  return (
    <span className="inline-flex size-7 items-center justify-center rounded-full border border-white/10 text-xs font-medium text-white/40">
      {rank}
    </span>
  );
}

type SortKey = "notes" | "users";

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
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
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

interface ClientRowProps {
  client: ClientEntry;
  rank: number;
  maxNotes: number;
  maxUsers: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function ClientRow({
  client,
  rank,
  maxNotes,
  maxUsers,
  isExpanded,
  onToggle,
}: ClientRowProps) {
  const [users, setUsers] = useState<ClientUserEntry[]>([]);
  const [profiles, setProfiles] = useState<ProfileMap>({});
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleToggle = async () => {
    onToggle();
    if (!loaded && !isExpanded) {
      setLoading(true);
      try {
        const data = await fetchClientUsers(client.client_name, 50);
        setUsers(data.users);
        setProfiles(data.profiles);
        setLoaded(true);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
  };

  const notePct = Math.max(3, (client.note_count / maxNotes) * 100);
  const userPct = Math.max(3, (client.user_count / maxUsers) * 100);

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] transition hover:border-white/10">
      {/* Main row */}
      <button
        onClick={handleToggle}
        className="flex w-full items-center gap-4 px-4 py-3 text-left"
      >
        <div className="shrink-0">{rankBadge(rank)}</div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Monitor className="size-4 text-neon-blue/60" />
            <p className="truncate text-sm font-semibold">
              {displayName(client.client_name)}
            </p>
          </div>
          {/* Double bar */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-12 text-[10px] uppercase tracking-wider text-white/30">
                Notes
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-neon-blue/60 to-neon-blue/20"
                  style={{ width: `${notePct}%` }}
                />
              </div>
              <span className="w-14 text-right text-xs tabular-nums text-white/50">
                {formatNumber(client.note_count)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 text-[10px] uppercase tracking-wider text-white/30">
                Users
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-neon-purple/60 to-neon-purple/20"
                  style={{ width: `${userPct}%` }}
                />
              </div>
              <span className="w-14 text-right text-xs tabular-nums text-white/50">
                {formatNumber(client.user_count)}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 text-white/30">
          {isExpanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </div>
      </button>

      {/* Expanded user list */}
      {isExpanded && (
        <div className="border-t border-white/5 px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="size-5 animate-spin rounded-full border-2 border-white/10 border-t-neon-blue" />
            </div>
          ) : users.length === 0 ? (
            <p className="py-4 text-center text-xs text-white/30">
              No user data available
            </p>
          ) : (
            <>
              {/* Column headers */}
              <div className="mb-2 flex items-center gap-3 text-[10px] uppercase tracking-widest text-white/30">
                <span className="w-8" />
                <span className="flex-1">User</span>
                <span className="w-16 text-right">Notes</span>
                <span className="hidden w-20 text-right sm:block">
                  First seen
                </span>
                <span className="hidden w-20 text-right sm:block">
                  Last seen
                </span>
              </div>

              <div className="space-y-0.5">
                {users.map((user, idx) => {
                  const profile = profiles[user.pubkey];
                  const name =
                    profile?.display_name || profile?.name || null;
                  const picture = profile?.picture;

                  return (
                    <Link
                      key={user.pubkey}
                      href={`/profiles/${user.pubkey}`}
                      className="flex items-center gap-3 rounded-xl px-1 py-1.5 transition hover:bg-white/[0.04]"
                    >
                      <span className="w-8 text-center text-xs tabular-nums text-white/30">
                        {idx + 1}
                      </span>

                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        {picture ? (
                          <img
                            src={picture}
                            alt=""
                            className="size-6 shrink-0 rounded-full bg-white/5 object-cover"
                          />
                        ) : (
                          <div className="size-6 shrink-0 rounded-full bg-gradient-to-br from-neon-pink/20 to-neon-blue/20" />
                        )}
                        <span className="truncate text-sm font-medium">
                          {name || shortPubkey(user.pubkey)}
                        </span>
                      </div>

                      <span className="w-16 text-right text-xs tabular-nums text-white/50">
                        {formatNumber(user.note_count)}
                      </span>
                      <span className="hidden w-20 text-right text-xs text-white/30 sm:block">
                        {formatDate(user.first_seen)}
                      </span>
                      <span className="hidden w-20 text-right text-xs text-white/30 sm:block">
                        {formatDate(user.last_seen)}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {users.length >= 50 && (
                <p className="mt-2 text-center text-xs text-white/20">
                  Showing top 50 users
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  clients: ClientEntry[];
}

export function ClientExplorer({ clients }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("users");
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [range, setRange] = useState("today");
  const [currentClients, setCurrentClients] = useState<ClientEntry[]>(clients);
  const [loading, setLoading] = useState(true);

  // Fetch "today" on mount
  useEffect(() => {
    fetchClientLeaderboard(200, "today")
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
      setExpandedClient(null);
      // Reuse server-provided data for "all" (the default SSR range)
      if (newRange === "all" && clients.length > 0) {
        setCurrentClients(clients);
        return;
      }
      setLoading(true);
      try {
        const res = await fetchClientLeaderboard(200, newRange);
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

  // Sync if server-side data changes (e.g. navigation)
  useEffect(() => {
    if (range === "all") setCurrentClients(clients);
  }, [clients, range]);

  const sorted = [...currentClients].sort((a, b) =>
    sortKey === "notes"
      ? b.note_count - a.note_count
      : b.user_count - a.user_count,
  );

  const maxNotes = sorted[0]?.note_count ?? 1;
  const maxUsers = sorted.reduce((m, c) => Math.max(m, c.user_count), 1);

  const totalNotes = currentClients.reduce((sum, c) => sum + c.note_count, 0);
  const totalUsers = currentClients.reduce((sum, c) => sum + c.user_count, 0);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-wider text-white/30">
            Clients tracked
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {currentClients.length}
          </p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-wider text-white/30">
            Total notes
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {formatNumber(totalNotes)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-wider text-white/30">
            Total users
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {formatNumber(totalUsers)}
          </p>
        </div>
      </div>

      {/* Timeframe + Sort controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TimeframeSwitcher value={range} onChange={handleRangeChange} />
        <div className="flex items-center gap-2">
          <ArrowUpDown className="size-3.5 text-white/30" />
          <span className="text-xs text-white/30">Sort by</span>
          <button
            onClick={() => setSortKey("notes")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              sortKey === "notes"
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            <FileText className="mr-1 inline size-3" />
            Notes
          </button>
          <button
            onClick={() => setSortKey("users")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              sortKey === "users"
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            <Users className="mr-1 inline size-3" />
            Users
          </button>
        </div>
      </div>

      {/* Client list */}
      <div className={`space-y-2 transition-opacity duration-200 ${loading ? "opacity-50" : ""}`}>
        {sorted.map((client, idx) => (
          <ClientRow
            key={client.client_name}
            client={client}
            rank={idx + 1}
            maxNotes={maxNotes}
            maxUsers={maxUsers}
            isExpanded={expandedClient === client.client_name}
            onToggle={() =>
              setExpandedClient(
                expandedClient === client.client_name
                  ? null
                  : client.client_name,
              )
            }
          />
        ))}
      </div>
    </div>
  );
}
