"use client";

import { useMemo, type ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import { SafeAvatar } from "@/components/search/SafeAvatar";
import { dmStore } from "@/lib/dm-store";
import type { DecryptedDM } from "@/lib/nip17";

interface MessageBubbleProps {
  message: DecryptedDM;
  ourPubkey: string;
  /** Show sender info (for group chats) */
  showSender?: boolean;
}

/**
 * Resolve NIP-30 custom emoji shortcodes in message content.
 * Emoji tags have the format: ["emoji", "shortcode", "https://url/image.png"]
 * Content references them as :shortcode:
 */
function renderContentWithEmoji(
  content: string,
  tags: string[][],
): ReactNode {
  // Build a map of shortcode -> image URL from emoji tags
  const emojiMap = new Map<string, string>();
  for (const tag of tags) {
    if (tag[0] === "emoji" && tag[1] && tag[2]) {
      emojiMap.set(tag[1], tag[2]);
    }
  }

  if (emojiMap.size === 0) return content;

  // Build a regex matching any known :shortcode:
  const escaped = Array.from(emojiMap.keys()).map((k) =>
    k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const pattern = new RegExp(`:(${escaped.join("|")}):`, "g");

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const shortcode = match[1];
    const url = emojiMap.get(shortcode)!;
    parts.push(
      <img
        key={`${shortcode}-${match.index}`}
        src={url}
        alt={`:${shortcode}:`}
        title={`:${shortcode}:`}
        className="inline-block h-5 w-5 align-text-bottom object-contain"
      />,
    );

    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last match
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

export function MessageBubble({
  message,
  ourPubkey,
  showSender,
}: MessageBubbleProps) {
  const isSent = message.sender === ourPubkey;
  const profile = dmStore.getProfile(message.sender);
  const displayName =
    profile?.display_name || profile?.name || message.sender.slice(0, 12) + "...";

  const timeAgo = formatDistanceToNow(message.created_at * 1000, {
    addSuffix: true,
  });

  const renderedContent = useMemo(
    () => renderContentWithEmoji(message.content, message.tags),
    [message.content, message.tags],
  );

  return (
    <div
      className={`flex min-w-0 gap-2 ${isSent ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar for received messages in group chats */}
      {showSender && !isSent && (
        <div className="mt-auto shrink-0">
          <SafeAvatar src={profile?.picture ?? null} size="sm" />
        </div>
      )}

      <div
        className={`min-w-0 max-w-[75%] ${isSent ? "items-end" : "items-start"} flex flex-col gap-0.5`}
      >
        {/* Sender name in group chats */}
        {showSender && !isSent && (
          <span className="ml-1 text-[11px] font-medium text-white/40">
            {displayName}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={`min-w-0 max-w-full overflow-hidden rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
            isSent
              ? "bg-neon-pink/10 text-white"
              : "bg-white/[0.06] text-white/90"
          }`}
          style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
        >
          {renderedContent}
        </div>

        {/* Timestamp */}
        <span
          className={`text-[10px] text-white/25 ${isSent ? "mr-1 text-right" : "ml-1"}`}
        >
          {timeAgo}
        </span>
      </div>
    </div>
  );
}
