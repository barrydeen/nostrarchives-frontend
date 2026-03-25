"use client";

import { useState, useCallback } from "react";
import { Send, Loader2, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getOutboxRelays,
  publishEvent,
  signEvent,
} from "@/lib/nostr-relay";

interface ReplyComposerProps {
  /** The event being replied to */
  eventId: string;
  /** Pubkey of the event author (target for inbox relays) */
  eventPubkey: string;
  /** Root event ID of the thread (null if this event IS the root) */
  rootId: string | null;
}

type PublishState =
  | { status: "idle" }
  | { status: "signing" }
  | { status: "publishing"; relayCount: number }
  | { status: "success"; successes: number; failures: number; relays: string[] }
  | { status: "error"; message: string };

export function ReplyComposer({
  eventId,
  eventPubkey,
  rootId,
}: ReplyComposerProps) {
  const { pubkey } = useAuth();
  const [content, setContent] = useState("");
  const [state, setState] = useState<PublishState>({ status: "idle" });

  const handleSubmit = useCallback(async () => {
    if (!pubkey || !content.trim()) return;

    try {
      // Step 1: Compute outbox model relays
      setState({ status: "signing" });

      const relays = await getOutboxRelays(pubkey, eventPubkey);

      // Step 2: Build the reply event (NIP-10 tagged)
      const tags: string[][] = [];

      // Root tag: if replying to a reply, use the thread root; otherwise this event is root
      const actualRootId = rootId || eventId;
      tags.push(["e", actualRootId, "", "root"]);

      // Reply tag: always points to the event we're replying to
      if (eventId !== actualRootId) {
        tags.push(["e", eventId, "", "reply"]);
      }

      // Tag the author of the note we're replying to
      tags.push(["p", eventPubkey]);

      const template = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content: content.trim(),
      };

      // Step 3: Sign via NIP-07 extension
      const signed = await signEvent(template);

      // Step 4: Publish to outbox model relays
      setState({ status: "publishing", relayCount: relays.length });
      const result = await publishEvent(relays, signed);

      if (result.successes.length > 0) {
        setState({
          status: "success",
          successes: result.successes.length,
          failures: result.failures.length,
          relays: result.successes,
        });
        setContent("");
        // Reset to idle after a few seconds
        setTimeout(() => setState({ status: "idle" }), 5000);
      } else {
        const errorMsg = result.failures
          .map((f) => `${f.relay}: ${f.error}`)
          .join("; ");
        setState({
          status: "error",
          message: `All relays rejected: ${errorMsg}`,
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to publish reply";
      setState({ status: "error", message });
    }
  }, [pubkey, content, eventId, eventPubkey, rootId]);

  // Don't render if not logged in
  if (!pubkey) {
    return null;
  }

  const isSubmitting = state.status === "signing" || state.status === "publishing";

  return (
    <div className="rounded-[32px] border border-white/10 bg-card/70 p-6 shadow-2xl">
      <h3 className="mb-4 text-sm font-semibold text-white/60">Reply</h3>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your reply..."
        disabled={isSubmitting}
        rows={3}
        className="w-full resize-y rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-white/20 focus:bg-white/[0.07] disabled:opacity-50"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        {/* Status messages */}
        <div className="min-w-0 flex-1 text-sm">
          {state.status === "signing" && (
            <span className="flex items-center gap-2 text-white/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching relays & signing...
            </span>
          )}
          {state.status === "publishing" && (
            <span className="flex items-center gap-2 text-white/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              Publishing to {state.relayCount} relays...
            </span>
          )}
          {state.status === "success" && (
            <span className="flex items-center gap-2 text-green-400/80">
              <CheckCircle className="h-4 w-4" />
              Published to {state.successes} relay{state.successes !== 1 ? "s" : ""}
              {state.failures > 0 && (
                <span className="text-white/40">
                  ({state.failures} failed)
                </span>
              )}
            </span>
          )}
          {state.status === "error" && (
            <span className="flex items-center gap-2 text-red-400/80">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="truncate">{state.message}</span>
            </span>
          )}
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !content.trim()}
          className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send Reply
        </button>
      </div>

      {/* Info about outbox model */}
      {state.status === "idle" && (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-white/30">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          Your reply will be signed with your browser extension and published to your outbox relays and the author&apos;s inbox relays.
        </p>
      )}
    </div>
  );
}
