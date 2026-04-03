"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { SafeAvatar } from "@/components/search/SafeAvatar";
import { dmStore, type Conversation } from "@/lib/dm-store";

interface ConversationItemProps {
  conversation: Conversation;
  active?: boolean;
}

export function ConversationItem({
  conversation,
  active,
}: ConversationItemProps) {
  const { otherParticipants, lastMessage, unreadCount, id } = conversation;
  const isGroup = otherParticipants.length > 1;

  // Gather profile info for display
  const profiles = otherParticipants.map((pk) => ({
    pubkey: pk,
    profile: dmStore.getProfile(pk),
  }));

  const displayName = isGroup
    ? profiles
        .map(
          (p) =>
            p.profile?.display_name ||
            p.profile?.name ||
            p.pubkey.slice(0, 8) + "...",
        )
        .join(", ")
    : profiles[0]?.profile?.display_name ||
      profiles[0]?.profile?.name ||
      otherParticipants[0]?.slice(0, 12) + "...";

  const preview = lastMessage
    ? lastMessage.content.length > 60
      ? lastMessage.content.slice(0, 60) + "..."
      : lastMessage.content
    : "No messages yet";

  const timeAgo = lastMessage
    ? formatDistanceToNow(lastMessage.created_at * 1000, { addSuffix: true })
    : "";

  return (
    <Link
      href={`/messages/${id}`}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 transition ${
        active
          ? "bg-neon-pink/10 border border-neon-pink/20"
          : "border border-transparent hover:bg-white/[0.04]"
      }`}
    >
      {/* Avatar(s) */}
      <div className="relative shrink-0">
        {isGroup ? (
          <div className="relative size-10">
            {/* Stacked avatars for group */}
            <div className="absolute left-0 top-0 z-10 scale-90">
              <SafeAvatar
                src={profiles[0]?.profile?.picture ?? null}
                size="sm"
              />
            </div>
            <div className="absolute bottom-0 right-0 scale-75">
              <SafeAvatar
                src={profiles[1]?.profile?.picture ?? null}
                size="sm"
              />
            </div>
            {profiles.length > 2 && (
              <div className="absolute -bottom-0.5 -right-0.5 z-20 flex size-4 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-white/60">
                +{profiles.length - 2}
              </div>
            )}
          </div>
        ) : (
          <SafeAvatar
            src={profiles[0]?.profile?.picture ?? null}
            size="sm"
          />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={`truncate text-sm font-medium ${
              unreadCount > 0 ? "text-white" : "text-white/70"
            }`}
          >
            {displayName}
          </p>
          {timeAgo && (
            <span className="shrink-0 text-[11px] text-white/30">{timeAgo}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p
            className={`truncate text-xs ${
              unreadCount > 0 ? "text-white/60" : "text-white/30"
            }`}
          >
            {preview}
          </p>
          {unreadCount > 0 && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-neon-pink text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
