"use client";

import { use } from "react";
import { MessageCircle, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useConversations } from "@/hooks/useConversations";
import { hasNip44Support } from "@/lib/nip17";
import { ConversationDetail } from "@/components/messages/ConversationDetail";

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  const { pubkey, loading: authLoading, login } = useAuth();

  // Initialize the conversations subscription (needed for messages to flow)
  useConversations();

  if (authLoading) return null;

  if (!pubkey) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
        <MessageCircle className="size-12 text-white/20" />
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="max-w-md text-white/40">
          Login with a Nostr browser extension to access your encrypted messages.
        </p>
        <button
          onClick={async () => {
            try { await login(); } catch { /* */ }
          }}
          className="mt-2 flex items-center gap-2 rounded-full bg-neon-pink/10 px-5 py-2.5 text-sm font-medium text-neon-pink transition hover:bg-neon-pink/20"
        >
          <LogIn className="size-4" />
          Login
        </button>
      </div>
    );
  }

  if (!hasNip44Support()) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
        <AlertCircle className="size-12 text-red-400/40" />
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="max-w-md text-red-400/60">
          Your Nostr extension does not support NIP-44 encryption. Please update
          to a compatible extension (Alby, nos2x-fox, etc.).
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto h-[calc(100vh-4rem)] max-w-3xl overflow-hidden">
      <ConversationDetail conversationId={conversationId} />
    </div>
  );
}
