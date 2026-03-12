import Link from "next/link";
import { Heart, MessageCircle, Repeat2, Zap, Clock } from "lucide-react";
import { StoredEvent, ProfileMetadataEntry } from "@/lib/types";
import { formatNumber, formatRelative, extractHashtags } from "@/lib/utils";
import { ProfileName } from "@/components/ProfileName";
import { NoteContent } from "@/components/notes/NoteContent";

export interface NoteEngagement {
  reactions?: number;
  replies?: number;
  reposts?: number;
  zap_sats?: number;
}

export interface UnifiedNoteCardProps {
  event: StoredEvent;
  profile?: ProfileMetadataEntry | null;
  /** All profiles map for resolving nostr:npub mentions in content */
  profiles?: Map<string, ProfileMetadataEntry>;
  engagement?: NoteEngagement;
  /** Display variant */
  variant?: "default" | "compact" | "hero";
  /** Rank badge (e.g. #1, #2) */
  rank?: number;
  /** Max content lines before truncation (0 = no limit). Defaults based on variant. */
  maxLines?: number;
  /** Show hashtags */
  showTags?: boolean;
  className?: string;
}

function EngagementBar({ engagement }: { engagement: NoteEngagement }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
      <span className="inline-flex items-center gap-1">
        <Heart className="size-3 text-neon-pink/70" />
        {formatNumber(engagement.reactions ?? 0)}
      </span>
      <span className="inline-flex items-center gap-1">
        <MessageCircle className="size-3 text-neon-blue/70" />
        {formatNumber(engagement.replies ?? 0)}
      </span>
      <span className="inline-flex items-center gap-1">
        <Repeat2 className="size-3 text-white/60" />
        {formatNumber(engagement.reposts ?? 0)}
      </span>
      <span className="inline-flex items-center gap-1 text-neon-amber">
        <Zap className="size-3" />
        {formatNumber(engagement.zap_sats ?? 0)} sats
      </span>
    </div>
  );
}

export function UnifiedNoteCard({
  event,
  profile,
  profiles,
  engagement = {},
  variant = "default",
  rank,
  maxLines,
  showTags = true,
  className = "",
}: UnifiedNoteCardProps) {
  const tags = showTags ? extractHashtags(event.tags) : [];
  const effectiveMaxLines = maxLines ?? (variant === "compact" ? 2 : variant === "hero" ? 6 : 4);

  // Build profiles map — merge single profile into map for mention resolution
  const profilesMap = profiles ?? new Map<string, ProfileMetadataEntry>();
  if (profile && !profilesMap.has(event.pubkey)) {
    profilesMap.set(event.pubkey, profile);
  }

  if (variant === "compact") {
    return (
      <Link
        href={`/notes/${event.id}`}
        className={`group flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-card/60 p-4 backdrop-blur transition hover:border-white/15 hover:bg-card/80 ${className}`}
      >
        {rank != null && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] font-mono text-xs font-bold text-white/40">
            {rank}
          </span>
        )}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <ProfileName pubkey={event.pubkey} profile={profile} className="text-xs text-white/60" showAvatar linked={false} />
            <span className="shrink-0 text-[10px] text-white/30">{formatRelative(event.created_at)}</span>
          </div>
          <div className="mt-1 text-sm">
            <NoteContent content={event.content || "—"} profiles={profilesMap} maxLines={effectiveMaxLines} />
          </div>
          <div className="mt-2">
            <EngagementBar engagement={engagement} />
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "hero") {
    return (
      <div className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-neon-pink/[0.06] via-card/80 to-card/80 p-6 backdrop-blur-xl transition hover:border-white/15 ${className}`}>
        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-neon-pink/[0.04]" />
        <div className="flex items-center justify-between">
          <ProfileName pubkey={event.pubkey} profile={profile} className="text-sm text-white/70" />
          {rank != null && (
            <span className="rounded-full bg-neon-pink/15 px-3 py-1 font-mono text-xs font-semibold text-neon-pink">
              #{rank}
            </span>
          )}
        </div>
        <div className="mt-4 flex-1 text-base leading-relaxed">
          <NoteContent content={event.content || "—"} profiles={profilesMap} maxLines={effectiveMaxLines} />
        </div>
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/[0.08] px-2.5 py-0.5 text-[11px] text-white/50">
                #{tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <EngagementBar engagement={engagement} />
          <div className="flex shrink-0 items-center gap-3 text-xs text-white/40">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {formatRelative(event.created_at)}
            </span>
            <Link href={`/notes/${event.id}`} className="text-white/60 underline-offset-2 hover:text-white hover:underline">
              Open
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex h-full flex-col rounded-2xl border border-white/[0.08] bg-card/70 p-5 backdrop-blur transition hover:border-white/15 ${className}`}>
      <div className="flex items-center justify-between">
        <ProfileName pubkey={event.pubkey} profile={profile} className="text-xs text-white/60" />
        <span className="shrink-0 text-[10px] text-white/30 inline-flex items-center gap-1">
          <Clock className="size-3" />
          {formatRelative(event.created_at)}
        </span>
      </div>
      <div className="mt-3 flex-1 text-sm">
        <NoteContent content={event.content || "—"} profiles={profilesMap} maxLines={effectiveMaxLines} />
      </div>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full border border-white/[0.08] px-2.5 py-0.5 text-[11px] text-white/50">
              #{tag}
            </span>
          ))}
        </div>
      )}
      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
        <EngagementBar engagement={engagement} />
        <Link href={`/notes/${event.id}`} className="shrink-0 text-xs text-white/50 underline-offset-2 hover:text-white hover:underline">
          Open →
        </Link>
      </div>
    </div>
  );
}
