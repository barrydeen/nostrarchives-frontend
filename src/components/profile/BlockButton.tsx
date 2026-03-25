"use client";

import { useState } from "react";
import { Ban, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { adminApi } from "@/lib/admin-api";

interface BlockButtonProps {
  pubkey: string;
}

export function BlockButton({ pubkey }: BlockButtonProps) {
  const { isAdmin } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (!isAdmin) return null;

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
      >
        <Ban className="size-3.5" />
        Block User
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-background p-6 shadow-2xl">
            <button
              onClick={() => {
                setShowConfirm(false);
                setResult(null);
              }}
              className="absolute right-3 top-3 rounded-lg p-1 text-white/40 hover:text-white"
            >
              <X className="size-5" />
            </button>

            <h3 className="text-lg font-semibold text-red-400">Block User</h3>
            <p className="mt-2 text-sm text-white/60">
              This will permanently delete all events from this pubkey and block
              future ingestion.
            </p>
            <p className="mt-1 font-mono text-xs text-white/40">
              {pubkey.slice(0, 16)}…{pubkey.slice(-8)}
            </p>

            {result ? (
              <p className="mt-4 rounded-lg bg-white/5 p-3 text-sm text-white/80">
                {result}
              </p>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Reason (optional)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="rounded-lg px-4 py-2 text-sm text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const res = await adminApi.blockPubkey(
                          pubkey,
                          reason || undefined,
                        );
                        setResult(
                          `Blocked. ${res.events_deleted} events deleted.`,
                        );
                      } catch (e) {
                        setResult(
                          `Error: ${e instanceof Error ? e.message : "unknown"}`,
                        );
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="rounded-lg bg-red-500/80 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
                  >
                    {loading ? "Blocking…" : "Confirm Block"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
