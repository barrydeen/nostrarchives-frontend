"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, UserPlus, ArrowRight, AlertCircle } from "lucide-react";
import { nip19 } from "nostr-tools";
import { useAuth } from "@/components/auth/AuthProvider";
import { shortConversationId } from "@/lib/nip17";
import { dmStore } from "@/lib/dm-store";
import { SafeAvatar } from "@/components/search/SafeAvatar";
import { fetchProfileMetadata } from "@/lib/nostr-relay";

interface NewConversationDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewConversationDialog({
  open,
  onClose,
}: NewConversationDialogProps) {
  const { pubkey } = useAuth();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<
    { pubkey: string; name: string; picture: string | null }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const resolvePubkey = useCallback(
    (value: string): string | null => {
      const trimmed = value.trim();
      if (!trimmed) return null;

      // Raw hex pubkey
      if (/^[0-9a-f]{64}$/i.test(trimmed)) return trimmed;

      // npub
      try {
        const decoded = nip19.decode(trimmed);
        if (decoded.type === "npub") return decoded.data;
        if (decoded.type === "nprofile") return decoded.data.pubkey;
      } catch {
        // Not a valid nip19 entity
      }

      return null;
    },
    [],
  );

  const addRecipient = useCallback(async () => {
    const pk = resolvePubkey(input);
    if (!pk) {
      setError("Invalid npub, nprofile, or hex pubkey");
      return;
    }

    if (pk === pubkey) {
      setError("You cannot message yourself");
      return;
    }

    if (recipients.some((r) => r.pubkey === pk)) {
      setError("This person is already added");
      return;
    }

    setError(null);
    setLoading(true);

    const profile = await fetchProfileMetadata(pk);
    if (profile) {
      dmStore.setProfile(pk, profile);
    }

    setRecipients((prev) => [
      ...prev,
      {
        pubkey: pk,
        name: profile?.display_name || profile?.name || pk.slice(0, 12) + "...",
        picture: profile?.picture ?? null,
      },
    ]);
    setInput("");
    setLoading(false);
  }, [input, pubkey, recipients, resolvePubkey]);

  const removeRecipient = useCallback((pk: string) => {
    setRecipients((prev) => prev.filter((r) => r.pubkey !== pk));
  }, []);

  const startConversation = useCallback(async () => {
    if (!pubkey || recipients.length === 0) return;

    const allParticipants = [pubkey, ...recipients.map((r) => r.pubkey)];
    const convId = await shortConversationId(allParticipants);

    // Ensure conversation exists in the store
    dmStore.ensureConversation(convId, allParticipants);

    onClose();
    router.push(`/messages/${convId}`);
  }, [pubkey, recipients, onClose, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">New Message</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Recipient input */}
        <div className="mb-3">
          <label className="mb-1.5 block text-xs font-medium text-white/40">
            Recipient (npub, nprofile, or hex pubkey)
          </label>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRecipient();
                }
              }}
              placeholder="npub1..."
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-white/20"
            />
            <button
              onClick={addRecipient}
              disabled={!input.trim() || loading}
              className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-40"
            >
              <Plus className="size-4" />
              Add
            </button>
          </div>
          {error && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400/80">
              <AlertCircle className="size-3" />
              {error}
            </p>
          )}
        </div>

        {/* Added recipients */}
        {recipients.length > 0 && (
          <div className="mb-4 space-y-2">
            <label className="text-xs font-medium text-white/40">
              Recipients ({recipients.length})
            </label>
            <div className="space-y-1.5">
              {recipients.map((r) => (
                <div
                  key={r.pubkey}
                  className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2"
                >
                  <SafeAvatar src={r.picture} size="sm" />
                  <span className="flex-1 truncate text-sm text-white/70">
                    {r.name}
                  </span>
                  <button
                    onClick={() => removeRecipient(r.pubkey)}
                    className="text-white/30 transition hover:text-white/60"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start conversation button */}
        <button
          onClick={startConversation}
          disabled={recipients.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-neon-pink/10 px-4 py-2.5 text-sm font-medium text-neon-pink transition hover:bg-neon-pink/20 disabled:opacity-40"
        >
          <UserPlus className="size-4" />
          {recipients.length > 1 ? "Start Group Chat" : "Start Conversation"}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
