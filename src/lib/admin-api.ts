"use client";

import { createNip98AuthHeader } from "./nostr-auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.nostrarchives.com";

async function adminFetch<T = unknown>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const authHeader = await createNip98AuthHeader(url, method);

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Admin API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export interface BlockedEntry {
  value: string;
  reason: string | null;
  blocked_at: string;
  blocked_by: string;
}

export const adminApi = {
  checkAuth: () => adminFetch<{ admin: boolean }>("/v1/admin/check-auth", "GET"),

  // Pubkeys
  blockPubkey: (pubkey: string, reason?: string) =>
    adminFetch<{ blocked: boolean; pubkey: string; events_deleted: number }>(
      "/v1/admin/block-pubkey",
      "POST",
      { pubkey, reason },
    ),
  unblockPubkey: (pubkey: string) =>
    adminFetch<{ unblocked: boolean }>("/v1/admin/block-pubkey", "DELETE", {
      pubkey,
    }),
  listBlockedPubkeys: () =>
    adminFetch<{ blocked_pubkeys: BlockedEntry[] }>(
      "/v1/admin/blocked-pubkeys",
      "GET",
    ),

  // Hashtags
  blockHashtag: (hashtag: string, reason?: string) =>
    adminFetch<{ blocked: boolean; hashtag: string }>(
      "/v1/admin/block-hashtag",
      "POST",
      { hashtag, reason },
    ),
  unblockHashtag: (hashtag: string) =>
    adminFetch<{ unblocked: boolean }>("/v1/admin/block-hashtag", "DELETE", {
      hashtag,
    }),
  listBlockedHashtags: () =>
    adminFetch<{ blocked_hashtags: BlockedEntry[] }>(
      "/v1/admin/blocked-hashtags",
      "GET",
    ),

  // Search terms
  blockSearchTerm: (term: string, reason?: string) =>
    adminFetch<{ blocked: boolean; term: string }>(
      "/v1/admin/block-search-term",
      "POST",
      { term, reason },
    ),
  unblockSearchTerm: (term: string) =>
    adminFetch<{ unblocked: boolean }>(
      "/v1/admin/block-search-term",
      "DELETE",
      { term },
    ),
  listBlockedSearchTerms: () =>
    adminFetch<{ blocked_search_terms: BlockedEntry[] }>(
      "/v1/admin/blocked-search-terms",
      "GET",
    ),
};
