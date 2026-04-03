"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield, Trash2, Plus } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { adminApi, BlockedEntry } from "@/lib/admin-api";
import { createNip98AuthHeader } from "@/lib/nostr-auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.nostrarchives.com";

type Tab = "pubkeys" | "hashtags" | "search_terms";

export default function AdminPage() {
  const { pubkey, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("pubkeys");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!pubkey) return;
    let cancelled = false;
    (async () => {
      try {
        const url = `${API_BASE_URL}/v1/admin/check-auth`;
        const authHeader = await createNip98AuthHeader(url, "GET");
        const res = await fetch(url, {
          headers: { Authorization: authHeader },
        });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.admin === true);
        } else {
          setIsAdmin(false);
        }
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pubkey]);

  if (authLoading || (pubkey && isAdmin === null)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white/40">
        Loading…
      </div>
    );
  }

  if (!pubkey) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-white/50">
        <Shield className="size-10" />
        <p>Login with your Nostr extension to access the admin panel.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-white/50">
        <Shield className="size-10 text-red-400" />
        <p>Access denied. This account is not an admin.</p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "pubkeys", label: "Blocked Pubkeys" },
    { key: "hashtags", label: "Blocked Hashtags" },
    { key: "search_terms", label: "Blocked Search Terms" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="size-6 text-neon-pink" />
        <h1 className="text-2xl font-semibold">Admin Panel</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-white/10 bg-card/60 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pubkeys" && <BlockedPubkeysPanel />}
      {tab === "hashtags" && <BlockedHashtagsPanel />}
      {tab === "search_terms" && <BlockedSearchTermsPanel />}
    </div>
  );
}

function BlockedPubkeysPanel() {
  const [items, setItems] = useState<BlockedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newValue, setNewValue] = useState("");
  const [newReason, setNewReason] = useState("");
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const res = await adminApi.listBlockedPubkeys();
      setItems(res.blocked_pubkeys);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load blocked pubkeys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = async () => {
    const pubkey = newValue.trim().toLowerCase();
    if (pubkey.length !== 64) return alert("Pubkey must be 64-char hex");
    setAdding(true);
    try {
      await adminApi.blockPubkey(pubkey, newReason || undefined);
      setNewValue("");
      setNewReason("");
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setAdding(false);
    }
  };

  const remove = async (pubkey: string) => {
    if (!confirm(`Unblock ${pubkey.slice(0, 16)}…?`)) return;
    try {
      await adminApi.unblockPubkey(pubkey);
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="64-char hex pubkey"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Reason"
          value={newReason}
          onChange={(e) => setNewReason(e.target.value)}
          className="w-40 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
        />
        <button
          onClick={add}
          disabled={adding}
          className="flex items-center gap-1 rounded-lg bg-red-500/80 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
        >
          <Plus className="size-3.5" />
          Block
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-white/40">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-white/40">No blocked pubkeys.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.value}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm text-white/80">
                  {item.value}
                </p>
                {item.reason && (
                  <p className="text-xs text-white/40">{item.reason}</p>
                )}
              </div>
              <button
                onClick={() => remove(item.value)}
                className="shrink-0 rounded-lg p-1.5 text-white/30 transition hover:bg-white/5 hover:text-red-400"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BlockedHashtagsPanel() {
  const [items, setItems] = useState<BlockedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newValue, setNewValue] = useState("");
  const [newReason, setNewReason] = useState("");
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const res = await adminApi.listBlockedHashtags();
      setItems(res.blocked_hashtags);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load blocked hashtags");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = async () => {
    const hashtag = newValue.trim().toLowerCase().replace(/^#/, "");
    if (!hashtag) return;
    setAdding(true);
    try {
      await adminApi.blockHashtag(hashtag, newReason || undefined);
      setNewValue("");
      setNewReason("");
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setAdding(false);
    }
  };

  const remove = async (hashtag: string) => {
    if (!confirm(`Unblock #${hashtag}?`)) return;
    try {
      await adminApi.unblockHashtag(hashtag);
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Hashtag (e.g. bitcoin)"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Reason"
          value={newReason}
          onChange={(e) => setNewReason(e.target.value)}
          className="w-40 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
        />
        <button
          onClick={add}
          disabled={adding}
          className="flex items-center gap-1 rounded-lg bg-red-500/80 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
        >
          <Plus className="size-3.5" />
          Block
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-white/40">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-white/40">No blocked hashtags.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <div
              key={item.value}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-card/60 px-3 py-1.5"
            >
              <span className="text-sm text-white/80">#{item.value}</span>
              <button
                onClick={() => remove(item.value)}
                className="rounded-full p-0.5 text-white/30 transition hover:text-red-400"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BlockedSearchTermsPanel() {
  const [items, setItems] = useState<BlockedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newValue, setNewValue] = useState("");
  const [newReason, setNewReason] = useState("");
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const res = await adminApi.listBlockedSearchTerms();
      setItems(res.blocked_search_terms);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load blocked search terms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = async () => {
    const term = newValue.trim().toLowerCase();
    if (!term) return;
    setAdding(true);
    try {
      await adminApi.blockSearchTerm(term, newReason || undefined);
      setNewValue("");
      setNewReason("");
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setAdding(false);
    }
  };

  const remove = async (term: string) => {
    if (!confirm(`Unblock "${term}"?`)) return;
    try {
      await adminApi.unblockSearchTerm(term);
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search term to block"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Reason"
          value={newReason}
          onChange={(e) => setNewReason(e.target.value)}
          className="w-40 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
        />
        <button
          onClick={add}
          disabled={adding}
          className="flex items-center gap-1 rounded-lg bg-red-500/80 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
        >
          <Plus className="size-3.5" />
          Block
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-white/40">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-white/40">No blocked search terms.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.value}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white/80">&ldquo;{item.value}&rdquo;</p>
                {item.reason && (
                  <p className="text-xs text-white/40">{item.reason}</p>
                )}
              </div>
              <button
                onClick={() => remove(item.value)}
                className="shrink-0 rounded-lg p-1.5 text-white/30 transition hover:bg-white/5 hover:text-red-400"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
