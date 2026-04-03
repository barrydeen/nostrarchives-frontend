"use client";

import { useState } from "react";
import { MessageCircle, PenSquare, Loader2 } from "lucide-react";
import type { Conversation } from "@/lib/dm-store";
import { ConversationItem } from "./ConversationItem";
import { NewConversationDialog } from "./NewConversationDialog";

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  activeConversationId?: string;
}

export function ConversationList({
  conversations,
  loading,
  loadingMore,
  onLoadMore,
  activeConversationId,
}: ConversationListProps) {
  const [showNewDialog, setShowNewDialog] = useState(false);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <h2 className="text-lg font-semibold text-white">Messages</h2>
        <button
          onClick={() => setShowNewDialog(true)}
          className="flex items-center gap-1.5 rounded-lg bg-neon-pink/10 px-3 py-1.5 text-xs font-medium text-neon-pink transition hover:bg-neon-pink/20"
        >
          <PenSquare className="size-3.5" />
          New
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {loading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Loader2 className="size-6 animate-spin text-white/20" />
            <p className="text-sm text-white/40">Loading messages...</p>
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <MessageCircle className="size-10 text-white/10" />
            <p className="text-sm text-white/40">No conversations yet</p>
            <button
              onClick={() => setShowNewDialog(true)}
              className="mt-1 text-xs font-medium text-neon-pink/60 transition hover:text-neon-pink"
            >
              Start a new conversation
            </button>
          </div>
        )}

        <div className="space-y-0.5">
          {conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              active={conv.id === activeConversationId}
            />
          ))}
        </div>

        {/* Load older conversations */}
        {onLoadMore && conversations.length > 0 && (
          <div className="py-4 text-center">
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium text-white/40 transition hover:bg-white/5 hover:text-white/60 disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Loading older messages...
                </>
              ) : (
                "Load older messages"
              )}
            </button>
          </div>
        )}
      </div>

      <NewConversationDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
      />
    </>
  );
}
