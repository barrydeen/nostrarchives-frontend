import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Zap,
  AtSign,
} from "lucide-react";
import type { ParsedNotification } from "@/hooks/useNotifications";
import type { ProfileMetadataEntry } from "@/lib/types";
import { ProfileName } from "@/components/ProfileName";
import { NoteContent } from "@/components/notes/NoteContent";
import { formatRelative, formatNumber } from "@/lib/utils";

const TYPE_CONFIG = {
  reply: {
    icon: MessageCircle,
    color: "text-neon-blue",
    bg: "bg-neon-blue/10",
    label: "replied to your note",
  },
  mention: {
    icon: AtSign,
    color: "text-neon-purple",
    bg: "bg-neon-purple/10",
    label: "mentioned you",
  },
  reaction: {
    icon: Heart,
    color: "text-neon-pink",
    bg: "bg-neon-pink/10",
    label: "reacted to your note",
  },
  repost: {
    icon: Repeat2,
    color: "text-neon-green",
    bg: "bg-neon-green/10",
    label: "reposted your note",
  },
  zap: {
    icon: Zap,
    color: "text-neon-amber",
    bg: "bg-neon-amber/10",
    label: "zapped your note",
  },
} as const;

interface NotificationRowProps {
  notification: ParsedNotification;
  senderProfile: ProfileMetadataEntry | null;
  refNoteProfile: ProfileMetadataEntry | null;
}

export function NotificationRow({
  notification,
  senderProfile,
  refNoteProfile,
}: NotificationRowProps) {
  const config = TYPE_CONFIG[notification.type];
  const Icon = config.icon;
  const linkTarget = notification.referencedEventId
    ? `/notes/${notification.referencedEventId}`
    : `/notes/${notification.id}`;

  // Determine if this is a custom emoji reaction (not "+" and not a NIP-30 shortcode with image)
  const isCustomEmoji =
    notification.type === "reaction" &&
    notification.reactionContent &&
    notification.reactionContent !== "+";
  const hasEmojiImage = notification.reactionEmojiUrl != null;

  // Build action text
  let actionText: string = config.label;
  if (notification.type === "zap" && notification.zapAmountSats) {
    actionText = `zapped your note ${formatNumber(notification.zapAmountSats)} sats`;
  }
  if (isCustomEmoji) {
    actionText = "reacted to your note";
  }

  return (
    <Link
      href={linkTarget}
      prefetch={false}
      className="group flex gap-3 rounded-2xl border border-white/[0.06] bg-card/60 p-4 backdrop-blur transition hover:border-white/15 hover:bg-card/80"
    >
      {/* Type icon — use custom emoji for reactions when available */}
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${config.bg}`}
      >
        {isCustomEmoji && hasEmojiImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={notification.reactionEmojiUrl!}
            alt={notification.reactionContent ?? ""}
            className="size-5 object-contain"
            loading="lazy"
          />
        ) : isCustomEmoji ? (
          <span className="text-base leading-none">
            {notification.reactionContent}
          </span>
        ) : (
          <Icon className={`size-4 ${config.color}`} />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Sender + action + timestamp */}
        <div className="flex items-baseline gap-2">
          <span className="relative z-10 shrink-0">
            <ProfileName
              pubkey={notification.senderPubkey}
              profile={senderProfile}
              className="text-sm text-white/70"
              showAvatar
            />
          </span>
          <span className="truncate text-sm text-white/40">{actionText}</span>
          <span className="ml-auto shrink-0 text-xs text-white/25">
            {formatRelative(notification.createdAt)}
          </span>
        </div>

        {/* Reply/mention content preview */}
        {(notification.type === "reply" || notification.type === "mention") &&
          notification.event.content && (
            <div className="mt-1.5 text-sm text-white/60">
              <NoteContent
                content={notification.event.content}
                maxLines={2}
              />
            </div>
          )}

        {/* Referenced note (the user's note that was interacted with) */}
        {notification.referencedEvent && (
          <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            {refNoteProfile && (
              <span className="mb-1 inline-block">
                <ProfileName
                  pubkey={notification.referencedEvent.pubkey}
                  profile={refNoteProfile}
                  className="text-xs text-white/40"
                  showAvatar
                  linked={false}
                />
              </span>
            )}
            <div className="text-xs text-white/40">
              <NoteContent
                content={notification.referencedEvent.content || ""}
                maxLines={2}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
