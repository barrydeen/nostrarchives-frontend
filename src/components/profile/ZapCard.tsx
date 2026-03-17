import Link from "next/link";
import { Zap } from "lucide-react";
import { ProfileZapEntry, ProfileMetadataEntry } from "@/lib/types";
import { formatNumber, formatRelative, truncateHex } from "@/lib/utils";

interface ZapCardProps {
  zap: ProfileZapEntry;
  profiles: Map<string, ProfileMetadataEntry>;
  direction: "sent" | "received";
}

export function ZapCard({ zap, profiles, direction }: ZapCardProps) {
  const counterpartyPk = direction === "sent" ? zap.recipient : zap.sender;
  const counterpartyProfile = counterpartyPk ? profiles.get(counterpartyPk) : null;
  const counterpartyName = counterpartyProfile?.preferred_name
    || counterpartyProfile?.display_name
    || counterpartyProfile?.name
    || (counterpartyPk ? truncateHex(counterpartyPk) : "Unknown");
  const counterpartyPicture = counterpartyProfile?.picture;

  return (
    <div className="rounded-xl border border-white/10 bg-card/70 p-4 shadow-md hover:border-white/20 transition-colors">
      {/* Top row: amount + counterparty */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Counterparty avatar */}
          {counterpartyPk && (
            <Link href={`/profiles/${counterpartyPk}`} prefetch={false} className="shrink-0">
              {counterpartyPicture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={counterpartyPicture}
                  alt=""
                  className="size-8 rounded-full object-cover border border-white/10"
                  loading="lazy"
                />
              ) : (
                <span className="flex size-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/60">
                  {counterpartyName.charAt(0).toUpperCase()}
                </span>
              )}
            </Link>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/50">
                {direction === "sent" ? "to" : "from"}
              </span>
              {counterpartyPk ? (
                <Link
                  href={`/profiles/${counterpartyPk}`}
                  prefetch={false}
                  className="text-sm font-medium text-white/80 hover:text-white truncate transition-colors"
                >
                  {counterpartyName}
                </Link>
              ) : (
                <span className="text-sm text-white/50">Unknown</span>
              )}
            </div>
            <span className="text-[11px] text-white/30">
              {formatRelative(zap.event.created_at)}
            </span>
          </div>
        </div>

        {/* Amount badge */}
        <div className="flex items-center gap-1 shrink-0 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1">
          <Zap className="size-3.5 text-amber-400" />
          <span className="text-sm font-semibold text-amber-300">
            {formatNumber(zap.amount_sats)}
          </span>
          <span className="text-[10px] text-amber-400/60">sats</span>
        </div>
      </div>

      {/* Zapped event link */}
      {zap.zapped_event_id && (
        <Link
          href={`/notes/${zap.zapped_event_id}`}
          prefetch={false}
          className="mt-2 block text-xs text-white/30 hover:text-white/50 truncate transition-colors"
        >
          ↳ View zapped note
        </Link>
      )}
    </div>
  );
}
