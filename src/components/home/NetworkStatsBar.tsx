import { Users, Zap, FileText, Activity } from "lucide-react";
import { DailyStatsResponse } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface NetworkStatsBarProps {
  stats: DailyStatsResponse | null;
}

const items = [
  { key: "daily_active_users" as const, label: "Active Users (24h)", icon: Users, color: "text-neon-green" },
  { key: "total_sats_sent" as const, label: "Sats Sent (24h)", icon: Zap, color: "text-neon-amber" },
  { key: "daily_posts" as const, label: "Posts (24h)", icon: FileText, color: "text-neon-blue" },
] as const;

export function NetworkStatsBar({ stats }: NetworkStatsBarProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {items.map(({ key, label, icon: Icon, color }) => (
        <div
          key={key}
          className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/[0.06] bg-surface/80 px-3 py-3 sm:p-5 backdrop-blur-xl transition hover:border-white/15"
        >
          <div className="pointer-events-none absolute -right-4 -top-4 size-24 rounded-full bg-gradient-to-br from-white/[0.03] to-transparent" />
          <div className={`rounded-lg bg-white/[0.06] p-1.5 sm:p-2.5 ${color} mb-1.5 sm:mb-0 w-fit`}>
            <Icon className="size-3.5 sm:size-4" />
          </div>
          <span className="block text-[10px] sm:text-xs font-medium uppercase tracking-[0.1em] sm:tracking-[0.15em] text-white/50 mt-1.5">{label}</span>
          <p className="mt-1 text-lg sm:text-3xl font-bold tracking-tight">
            {stats ? formatNumber(stats[key]) : "—"}
          </p>
        </div>
      ))}
    </div>
  );
}
