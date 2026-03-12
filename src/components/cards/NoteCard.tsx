import Link from "next/link";
import { Flame, Zap, Heart, Clock } from "lucide-react";
import { StoredEvent, ProfileMetadataEntry } from "@/lib/types";
import { extractHashtags, formatRelative } from "@/lib/utils";
import { ProfileName } from "@/components/ProfileName";

interface NoteCardProps {
  event: StoredEvent;
  profile?: ProfileMetadataEntry | null;
  metricValue?: number;
  metricLabel?: "likes" | "zaps" | "trend";
  highlight?: boolean;
}

const metricIcon = {
  likes: Heart,
  zaps: Zap,
  trend: Flame,
};

export function NoteCard({ event, profile, metricValue, metricLabel = "trend", highlight }: NoteCardProps) {
  const Icon = metricIcon[metricLabel];
  const tags = extractHashtags(event.tags);

  return (
    <div className={`flex h-full flex-col rounded-3xl border border-white/10 ${highlight ? "bg-gradient-to-br from-white/10 via-white/5 to-transparent" : "bg-card/70"} p-5 shadow-2xl backdrop-blur`}> 
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/60">
        <ProfileName pubkey={event.pubkey} profile={profile} className="text-xs" />
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold tracking-wide text-white/70">
          <Icon className="size-3" />
          {metricValue ?? "metric"} {metricLabel}
        </span>
      </div>
      <p className="mt-4 text-base text-white/90 line-clamp-3">{event.content || "—"}</p>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
              #{tag}
            </span>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between pt-6 text-xs text-white/50">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" />
          {formatRelative(event.created_at)}
        </span>
        <div className="flex gap-2 text-[11px]">
          <Link className="underline-offset-2 hover:underline" href={`/notes/${event.id}`}>
            Open note
          </Link>
          <span>•</span>
          <Link className="underline-offset-2 hover:underline" href={`/profiles/${event.pubkey}`}>
            Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
