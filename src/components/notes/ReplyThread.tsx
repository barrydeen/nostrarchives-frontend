"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { StoredEvent, ProfileMetadataEntry } from "@/lib/types";
import { UnifiedNoteCard } from "./UnifiedNoteCard";
import { ReplyComposer } from "./ReplyComposer";
import { useAuth } from "@/components/auth/AuthProvider";

export interface ReplyNode {
  event: StoredEvent;
  children: ReplyNode[];
}

/**
 * Parse Nostr `e` tags to find the direct parent event ID for a reply.
 *
 * NIP-10 conventions:
 * - Marked tags: `["e", "<id>", "<relay>", "reply"]` or `["e", "<id>", "<relay>", "root"]`
 * - Positional (no markers): last `e` tag is the reply-to, first is root
 */
function getReplyParentId(event: StoredEvent): string | null {
  const eTags = (event.tags ?? []).filter((t) => t[0] === "e" && t[1]);

  if (eTags.length === 0) return null;

  // Check for NIP-10 marked tags first
  const replyTag = eTags.find((t) => t[3] === "reply");
  if (replyTag) return replyTag[1];

  const rootTag = eTags.find((t) => t[3] === "root");
  // If only a root tag exists (and no reply tag), this is a direct reply to root
  if (rootTag && eTags.length === 1) return rootTag[1];

  // Positional fallback: last e-tag is the parent
  return eTags[eTags.length - 1][1];
}

/**
 * Build a tree of replies from a flat list.
 * `rootEventId` is the ID of the note being viewed — direct replies to it
 * become top-level nodes.
 */
export function buildReplyTree(
  replies: StoredEvent[],
  rootEventId: string
): ReplyNode[] {
  const replyIds = new Set(replies.map((r) => r.id));

  // Initialize nodes
  const nodeMap = new Map<string, ReplyNode>();
  for (const reply of replies) {
    nodeMap.set(reply.id, { event: reply, children: [] });
  }

  const topLevel: ReplyNode[] = [];

  for (const reply of replies) {
    const node = nodeMap.get(reply.id)!;
    const parentId = getReplyParentId(reply);

    // If the parent is the root note, or the parent isn't in our reply set,
    // treat this as a top-level reply
    if (!parentId || parentId === rootEventId || !replyIds.has(parentId)) {
      topLevel.push(node);
    } else {
      const parentNode = nodeMap.get(parentId);
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        topLevel.push(node);
      }
    }
  }

  // Sort each level by created_at ascending
  const sortNodes = (nodes: ReplyNode[]) => {
    nodes.sort((a, b) => a.event.created_at - b.event.created_at);
    for (const node of nodes) {
      sortNodes(node.children);
    }
  };
  sortNodes(topLevel);

  return topLevel;
}

interface ReplyThreadProps {
  nodes: ReplyNode[];
  profiles: Map<string, ProfileMetadataEntry>;
  /** Root event ID of the entire thread (for NIP-10 tagging) */
  rootEventId: string;
  /** Called when a reply is published anywhere in the thread */
  onReplyPublished?: (event: StoredEvent, parentId: string) => void;
  depth?: number;
}

const MAX_DEPTH = 8;

function ReplyNodeItem({
  node,
  profiles,
  rootEventId,
  onReplyPublished,
  depth,
}: {
  node: ReplyNode;
  profiles: Map<string, ProfileMetadataEntry>;
  rootEventId: string;
  onReplyPublished?: (event: StoredEvent, parentId: string) => void;
  depth: number;
}) {
  const { pubkey } = useAuth();
  const [showComposer, setShowComposer] = useState(false);

  return (
    <div className="mt-3 first:mt-0">
      <UnifiedNoteCard
        event={node.event}
        profile={profiles.get(node.event.pubkey)}
        profiles={profiles}
        variant="compact"
        engagement={{
          reactions: node.event.reactions,
          replies: node.event.replies,
          reposts: node.event.reposts,
          zap_sats: node.event.zap_sats,
        }}
      />
      {/* Reply button */}
      {pubkey && (
        <button
          onClick={() => setShowComposer((v) => !v)}
          className="mt-1 flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-xs text-white/30 transition hover:bg-white/5 hover:text-white/50"
        >
          <MessageCircle className="h-3 w-3" />
          Reply
        </button>
      )}
      {/* Inline composer */}
      {showComposer && (
        <ReplyComposer
          eventId={node.event.id}
          eventPubkey={node.event.pubkey}
          rootId={rootEventId}
          inline
          onCancel={() => setShowComposer(false)}
          onPublished={(event) => {
            onReplyPublished?.(event, node.event.id);
            setShowComposer(false);
          }}
        />
      )}
      {/* Children */}
      {node.children.length > 0 && depth < MAX_DEPTH && (
        <ReplyThread
          nodes={node.children}
          profiles={profiles}
          rootEventId={rootEventId}
          onReplyPublished={onReplyPublished}
          depth={depth + 1}
        />
      )}
      {node.children.length > 0 && depth >= MAX_DEPTH && (
        <div className="mt-3">
          {node.children.map((child) => (
            <ReplyNodeItem
              key={child.event.id}
              node={{ event: child.event, children: [] }}
              profiles={profiles}
              rootEventId={rootEventId}
              onReplyPublished={onReplyPublished}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ReplyThread({
  nodes,
  profiles,
  rootEventId,
  onReplyPublished,
  depth = 0,
}: ReplyThreadProps) {
  if (nodes.length === 0) return null;

  return (
    <div className={depth > 0 ? "ml-6 border-l border-white/[0.08] pl-4" : ""}>
      {nodes.map((node) => (
        <ReplyNodeItem
          key={node.event.id}
          node={node}
          profiles={profiles}
          rootEventId={rootEventId}
          onReplyPublished={onReplyPublished}
          depth={depth}
        />
      ))}
    </div>
  );
}
