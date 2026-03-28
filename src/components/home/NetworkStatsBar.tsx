import Link from "next/link";
import { Users, Zap, FileText, ChevronRight } from "lucide-react";
import { LiveMetrics } from "@/hooks/useLiveMetrics";
import { formatNumber } from "@/lib/utils";

interface NetworkStatsBarProps {
  metrics: LiveMetrics;
  connected: boolean;
}

const items = [
  { key: "online" as const, label: "Online Now", icon: Users, color: "text-neon-green", pulseColor: "bg-green-400", href: "/online" },
  { key: "sats" as const, label: "Live Sats", icon: Zap, color: "text-neon-amber", pulseColor: "bg-amber-400", href: null },
  { key: "notes" as const, label: "Live Notes", icon: FileText, color: "text-neon-blue", pulseColor: "bg-blue-400", href: null },
] as const;

export function NetworkStatsBar({ metrics, connected }: NetworkStatsBarProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {items.map(({ key, label, icon: Icon, color, pulseColor, href }) => {
        const content = (
          <>
            <div className="pointer-events-none absolute -right-4 -top-4 size-24 rounded-full bg-gradient-to-br from-white/[0.03] to-transparent" />
            <div className="flex items-center gap-2 mb-1.5 sm:mb-0">
              <div className={`rounded-lg bg-white/[0.06] p-1.5 sm:p-2.5 ${color} w-fit`}>
                <Icon className="size-3.5 sm:size-4" />
              </div>
              {connected && (
                <span className="relative flex size-2">
                  <span className={`absolute inline-flex size-full animate-ping rounded-full ${pulseColor} opacity-75`} />
                  <span className={`relative inline-flex size-2 rounded-full ${pulseColor}`} />
                </span>
              )}
            </div>
            <span className="block text-[10px] sm:text-xs font-medium uppercase tracking-[0.1em] sm:tracking-[0.15em] text-white/50 mt-1.5">
              {label}
            </span>
            <p className="mt-1 text-lg sm:text-3xl font-bold tracking-tight tabular-nums transition-all duration-500">
              {formatNumber(metrics[key])}
            </p>
            <span className="block text-[9px] sm:text-[10px] text-white/30 mt-0.5">last 10 min</span>
            {href && (
              <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-white/0 transition-all duration-200 group-hover:text-white/40 sm:right-3 sm:size-5" />
            )}
          </>
        );

        const className =
          "group relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/[0.06] bg-surface/80 px-3 py-3 sm:p-5 backdrop-blur-xl transition hover:border-white/15";

        return href ? (
          <Link key={key} href={href} className={className}>
            {content}
          </Link>
        ) : (
          <div key={key} className={className}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
