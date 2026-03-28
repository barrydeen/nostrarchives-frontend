"use client";

import { memo, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FileText, Heart, Repeat, Zap } from "lucide-react";
import { ProfileMetadataEntry } from "@/lib/types";
import { truncateHex } from "@/lib/utils";

interface OnlineUserCardProps {
  pubkey: string;
  lastActiveMs: number;
  activityKind: number;
  profile?: ProfileMetadataEntry;
  isRecentlyUpdated: boolean;
  index: number;
}

const ACTIVITY_CONFIG: Record<
  number,
  { icon: typeof FileText; label: string; color: string; ringColor: string; flashColor: string }
> = {
  1: {
    icon: FileText,
    label: "Posted",
    color: "text-neon-blue",
    ringColor: "ring-neon-blue/30",
    flashColor: "rgba(94, 208, 255, 0.5)",
  },
  7: {
    icon: Heart,
    label: "Reacted",
    color: "text-neon-pink",
    ringColor: "ring-neon-pink/30",
    flashColor: "rgba(255, 94, 205, 0.5)",
  },
  6: {
    icon: Repeat,
    label: "Reposted",
    color: "text-neon-purple",
    ringColor: "ring-neon-purple/30",
    flashColor: "rgba(167, 139, 250, 0.5)",
  },
  16: {
    icon: Repeat,
    label: "Reposted",
    color: "text-neon-purple",
    ringColor: "ring-neon-purple/30",
    flashColor: "rgba(167, 139, 250, 0.5)",
  },
  9735: {
    icon: Zap,
    label: "Zapped",
    color: "text-neon-amber",
    ringColor: "ring-neon-amber/30",
    flashColor: "rgba(255, 180, 84, 0.5)",
  },
};

const DEFAULT_ACTIVITY = {
  icon: FileText,
  label: "Active",
  color: "text-neon-green",
  ringColor: "ring-neon-green/30",
  flashColor: "rgba(125, 255, 176, 0.5)",
};

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 10_000) return "just now";
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

function OnlineUserCardInner({
  pubkey,
  lastActiveMs,
  activityKind,
  profile,
  isRecentlyUpdated,
  index,
}: OnlineUserCardProps) {
  const activity = ACTIVITY_CONFIG[activityKind] || DEFAULT_ACTIVITY;
  const ActivityIcon = activity.icon;
  const name = profile?.preferred_name || truncateHex(pubkey);
  const picture = profile?.picture;

  // Flash animation on update
  const [flashing, setFlashing] = useState(false);
  const prevActiveRef = useRef(lastActiveMs);

  useEffect(() => {
    if (lastActiveMs !== prevActiveRef.current) {
      prevActiveRef.current = lastActiveMs;
      setFlashing(true);
      const timer = setTimeout(() => setFlashing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastActiveMs]);

  // Relative time updates
  const [relTime, setRelTime] = useState(() => formatRelativeTime(lastActiveMs));
  useEffect(() => {
    setRelTime(formatRelativeTime(lastActiveMs));
    const interval = setInterval(() => {
      setRelTime(formatRelativeTime(lastActiveMs));
    }, 15_000);
    return () => clearInterval(interval);
  }, [lastActiveMs]);

  const isVeryRecent = Date.now() - lastActiveMs < 30_000;

  return (
    <Link
      href={`/profiles/${pubkey}`}
      prefetch={false}
      className="group relative flex flex-col items-center gap-2.5 overflow-hidden rounded-2xl border border-white/[0.06] bg-card/60 p-4 backdrop-blur transition-all duration-300 hover:border-white/15 hover:bg-card/80"
      style={{
        animationDelay: `${Math.min(index * 30, 1500)}ms`,
        ...(flashing
          ? {
              borderColor: activity.flashColor,
              boxShadow: `0 0 20px ${activity.flashColor}`,
            }
          : {}),
      }}
    >
      {/* Avatar */}
      <div className="relative">
        {picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={picture}
            alt=""
            className={`size-14 shrink-0 rounded-full object-cover ring-2 ${activity.ringColor} transition-all duration-300 ${isVeryRecent ? "animate-pulse" : ""}`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span
            className={`flex size-14 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-lg font-bold text-white/60 ring-2 ${activity.ringColor} transition-all duration-300`}
          >
            {name.charAt(0).toUpperCase()}
          </span>
        )}

        {/* Activity indicator dot */}
        {isVeryRecent && (
          <span className="absolute -bottom-0.5 -right-0.5 flex size-3.5">
            <span
              className={`absolute inline-flex size-full animate-ping rounded-full opacity-75 ${
                activityKind === 9735
                  ? "bg-amber-400"
                  : activityKind === 7
                    ? "bg-pink-400"
                    : activityKind === 6 || activityKind === 16
                      ? "bg-purple-400"
                      : "bg-blue-400"
              }`}
            />
            <span
              className={`relative inline-flex size-3.5 rounded-full ${
                activityKind === 9735
                  ? "bg-amber-400"
                  : activityKind === 7
                    ? "bg-pink-400"
                    : activityKind === 6 || activityKind === 16
                      ? "bg-purple-400"
                      : "bg-blue-400"
              }`}
            />
          </span>
        )}
      </div>

      {/* Name */}
      <p className="max-w-full truncate text-sm font-medium text-white/90 group-hover:text-white text-center">
        {name}
      </p>

      {/* Activity + Time */}
      <div className="flex items-center gap-1.5">
        <ActivityIcon className={`size-3 ${activity.color}`} />
        <span className={`text-[11px] ${activity.color}/70`}>{activity.label}</span>
        <span className="text-[10px] text-white/30">{relTime}</span>
      </div>
    </Link>
  );
}

export const OnlineUserCard = memo(OnlineUserCardInner, (prev, next) => {
  return (
    prev.pubkey === next.pubkey &&
    prev.lastActiveMs === next.lastActiveMs &&
    prev.activityKind === next.activityKind &&
    prev.isRecentlyUpdated === next.isRecentlyUpdated &&
    prev.profile === next.profile
  );
});
