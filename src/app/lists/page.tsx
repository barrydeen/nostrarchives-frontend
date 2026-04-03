"use client";

import { List, LogIn } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function ListsPage() {
  const { pubkey, loading, login } = useAuth();

  if (loading) return null;

  if (!pubkey) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
        <List className="size-12 text-white/20" />
        <h1 className="text-2xl font-bold">Lists</h1>
        <p className="max-w-md text-white/40">
          Login with a Nostr browser extension to manage your lists.
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

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
      <List className="size-12 text-white/20" />
      <h1 className="text-2xl font-bold">Lists</h1>
      <p className="text-white/40">Coming soon.</p>
    </div>
  );
}
