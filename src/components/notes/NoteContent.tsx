"use client";

import { Fragment, useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ProfileMetadataEntry } from "@/lib/types";
import { truncateHex } from "@/lib/utils";
import { nip19 } from "nostr-tools";

interface NoteContentProps {
  content: string;
  profiles?: Map<string, ProfileMetadataEntry>;
  /** Max lines before truncation (0 = no limit) */
  maxLines?: number;
  /** Whether to show expand/collapse controls (default: true when used from profile tabs) */
  expandable?: boolean;
}

// Patterns
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|avif)(\?[^\s]*)?$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m3u8)(\?[^\s]*)?$/i;
// Combined split regex — captures both URLs and nostr mentions as groups
const SPLIT_REGEX = /(https?:\/\/[^\s<>")\]]+|nostr:(?:npub1|nprofile1|note1|nevent1)[a-z0-9]+)/g;

function isImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    // Known image hosts
    if (u.hostname.includes("imgur.com") || u.hostname.includes("nostr.build") || u.hostname.includes("void.cat") || u.hostname.includes("image.nostr.build")) {
      return true;
    }
    return IMAGE_EXT.test(u.pathname);
  } catch {
    return IMAGE_EXT.test(url);
  }
}

function isVideoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return VIDEO_EXT.test(u.pathname);
  } catch {
    return VIDEO_EXT.test(url);
  }
}

interface ParsedSegment {
  type: "text" | "image" | "video" | "link" | "mention-profile" | "mention-event";
  value: string;
  /** Hex pubkey for profile mentions */
  pubkey?: string;
  /** Hex event id for event mentions */
  eventId?: string;
}

function parseContent(content: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  let lastIndex = 0;

  // Reset regex
  SPLIT_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = SPLIT_REGEX.exec(content)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }

    const token = match[0];

    if (token.startsWith("nostr:")) {
      const bech32 = token.slice(6);
      try {
        const decoded = nip19.decode(bech32);
        if (decoded.type === "npub") {
          segments.push({ type: "mention-profile", value: token, pubkey: decoded.data as string });
        } else if (decoded.type === "nprofile") {
          const data = decoded.data as { pubkey: string; relays?: string[] };
          segments.push({ type: "mention-profile", value: token, pubkey: data.pubkey });
        } else if (decoded.type === "note") {
          segments.push({ type: "mention-event", value: token, eventId: decoded.data as string });
        } else if (decoded.type === "nevent") {
          const data = decoded.data as { id: string; relays?: string[]; author?: string; kind?: number };
          segments.push({ type: "mention-event", value: token, eventId: data.id });
        } else {
          segments.push({ type: "text", value: token });
        }
      } catch {
        segments.push({ type: "text", value: token });
      }
    } else if (isImageUrl(token)) {
      segments.push({ type: "image", value: token });
    } else if (isVideoUrl(token)) {
      segments.push({ type: "video", value: token });
    } else {
      segments.push({ type: "link", value: token });
    }

    lastIndex = match.index + token.length;
  }

  // Remaining text
  if (lastIndex < content.length) {
    segments.push({ type: "text", value: content.slice(lastIndex) });
  }

  return segments;
}

function ProfileMention({ pubkey, profiles }: { pubkey: string; profiles?: Map<string, ProfileMetadataEntry> }) {
  const profile = profiles?.get(pubkey);
  const name = profile?.preferred_name || profile?.display_name || profile?.name || truncateHex(pubkey, 8);

  return (
    <Link
      href={`/profiles/${pubkey}`}
      prefetch={false}
      className="inline-flex items-center gap-1 rounded-md bg-neon-blue/10 px-1.5 py-0.5 text-neon-blue transition hover:bg-neon-blue/20"
    >
      @{name}
    </Link>
  );
}

function EventMention({ eventId }: { eventId: string }) {
  return (
    <Link
      href={`/notes/${eventId}`}
      prefetch={false}
      className="inline-flex items-center gap-1 rounded-md bg-neon-pink/10 px-1.5 py-0.5 text-neon-pink transition hover:bg-neon-pink/20"
    >
      📝 {eventId.slice(0, 8)}…
    </Link>
  );
}

export function NoteContent({ content, profiles, maxLines = 0, expandable = true }: NoteContentProps) {
  const segments = useMemo(() => parseContent(content), [content]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  // Separate media (images/videos) from inline content
  const inlineSegments = segments.filter((s) => s.type !== "image" && s.type !== "video");
  const mediaSegments = segments.filter((s) => s.type === "image" || s.type === "video");

  // Static lookup — dynamic `line-clamp-${n}` breaks Tailwind purge
  const lineClampMap: Record<number, string> = {
    1: "line-clamp-1",
    2: "line-clamp-2",
    3: "line-clamp-3",
    4: "line-clamp-4",
    5: "line-clamp-5",
    6: "line-clamp-6",
  };
  const lineClamp = maxLines > 0 && !isExpanded ? (lineClampMap[maxLines] ?? "line-clamp-4") : "";

  // Check if text content is actually overflowing
  useEffect(() => {
    if (!expandable || maxLines <= 0 || !textRef.current) {
      setShowExpandButton(false);
      return;
    }

    const element = textRef.current;
    const isOverflowing = element.scrollHeight > element.clientHeight;
    setShowExpandButton(isOverflowing);
  }, [expandable, maxLines, inlineSegments]);

  // Media display logic
  const visibleMedia = expandable && !isExpanded && mediaSegments.length > 2 
    ? mediaSegments.slice(0, 2) 
    : mediaSegments;
  const hiddenMediaCount = mediaSegments.length - visibleMedia.length;

  return (
    <div className="min-w-0 overflow-hidden">
      {/* Text content with inline mentions and links */}
      <div 
        ref={textRef}
        className={`whitespace-pre-wrap break-words text-white/90 ${lineClamp}`}
      >
        {inlineSegments.map((segment, i) => {
          switch (segment.type) {
            case "text":
              return <Fragment key={i}>{segment.value}</Fragment>;
            case "link":
              return (
                <a
                  key={i}
                  href={segment.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-neon-blue underline-offset-2 hover:underline"
                >
                  {segment.value.length > 60 ? segment.value.slice(0, 57) + "…" : segment.value}
                </a>
              );
            case "mention-profile":
              return <ProfileMention key={i} pubkey={segment.pubkey!} profiles={profiles} />;
            case "mention-event":
              return <EventMention key={i} eventId={segment.eventId!} />;
            default:
              return null;
          }
        })}
      </div>

      {/* Show more/less button for text */}
      {expandable && showExpandButton && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="mt-1 text-xs text-neon-blue hover:text-neon-blue/80 transition-colors"
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}

      {/* Media grid */}
      {visibleMedia.length > 0 && (
        <div className={`mt-3 grid gap-2 ${visibleMedia.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {visibleMedia.map((segment, i) => {
            const isLastVisible = i === visibleMedia.length - 1;
            const showOverlay = hiddenMediaCount > 0 && isLastVisible;

            if (segment.type === "image") {
              return (
                <div key={i} className="relative overflow-hidden rounded-xl">
                  <a href={segment.value} target="_blank" rel="noopener noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={segment.value}
                      alt=""
                      loading="lazy"
                      className="h-auto max-h-80 w-full rounded-xl border border-white/[0.06] object-cover"
                    />
                  </a>
                  {showOverlay && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-medium hover:bg-black/60 transition-colors"
                    >
                      +{hiddenMediaCount} more
                    </button>
                  )}
                </div>
              );
            }
            if (segment.type === "video") {
              return (
                <div key={i} className="relative overflow-hidden rounded-xl">
                  <video
                    src={segment.value}
                    controls
                    preload="metadata"
                    className="h-auto max-h-80 w-full rounded-xl border border-white/[0.06]"
                  />
                  {showOverlay && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                      }}
                      className="absolute top-2 right-2 bg-black/50 text-white text-sm px-2 py-1 rounded hover:bg-black/60 transition-colors"
                    >
                      +{hiddenMediaCount} more
                    </button>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}
