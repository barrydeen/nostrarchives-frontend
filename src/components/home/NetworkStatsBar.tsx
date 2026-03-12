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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map(({ key, label, icon: Icon, color }) => (
        <div
          key={key}
          className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-surface/80 p-5 backdrop-blur-xl transition hover:border-white/15"
        >
          <div className="pointer-events-none absolute -right-4 -top-4 size-24 rounded-full bg-gradient-to-br from-white/[0.03] to-transparent" />
          <div className="flex items-center gap-3">
            <div className={`rounded-xl bg-white/[0.06] p-2.5 ${color}`}>
              <Icon className="size-4" />
            </div>
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-white/50">{label}</span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            {stats ? formatNumber(stats[key]) : "—"}
          </p>
        </div>
      ))}
    </div>
  );
}
