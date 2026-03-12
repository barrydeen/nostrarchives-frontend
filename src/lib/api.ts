import { cache } from "react";
import { StatsResponse, TopNotesResponse, StoredEvent, EventsResponse, SocialResponse, ThreadResponse, InteractionResponse, ProfileMetadataEntry, ProfilesMetadataResponse, TrendingNotesResponse, NewUsersResponse, TrendingUsersResponse, TopZappersResponse, DailyStatsResponse, SearchResponse, SuggestResponse, NoteDetailResponse, TopNotesUnifiedResponse, TrendingMetric, TrendingRange, AdvancedSearchResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.nostrarchives.com";

async function handleResponse<T>(res: Response) {
  if (!res.ok) {
    throw new Error(`nostr-api request failed (${res.status})`);
  }

  return (await res.json()) as T;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

async function fetchFromApi<T>(path: string, options?: { revalidate?: number }) {
  const url = `${API_BASE_URL}${path}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: options?.revalidate ?? 30 },
    });
    return await handleResponse<T>(res);
  } catch (error) {
    console.error(`[nostrarchives] Failed to fetch ${path}`, error);
    return null;
  }
}

export const getGlobalStats = cache(async () => {
  return fetchFromApi<StatsResponse>("/v1/stats", { revalidate: 30 });
});

export async function getTopNotes(metric: "likes" | "zaps", range: "all_time" | "today", limit = 6) {
  const path = `/v1/notes/${metric}/top${range === "today" ? "/today" : ""}${buildQuery({ limit })}`;
  return fetchFromApi<TopNotesResponse>(path, { revalidate: range === "today" ? 15 : 120 });
}

/** Unified trending endpoint: metric × range with profiles included. */
export async function getTopNotesUnified(
  metric: TrendingMetric = "reactions",
  range: TrendingRange = "today",
  limit = 20,
  offset = 0,
) {
  const revalidate = range === "today" ? 15 : range === "7d" ? 30 : 120;
  return fetchFromApi<TopNotesUnifiedResponse>(
    `/v1/notes/top${buildQuery({ metric, range, limit, offset })}`,
    { revalidate },
  );
}

export async function getRecentEvents(params?: {
  pubkey?: string;
  kind?: number;
  limit?: number;
  search?: string;
  since?: number;
}) {
  const query = buildQuery({
    pubkey: params?.pubkey,
    kind: params?.kind,
    limit: params?.limit ?? 20,
    search: params?.search,
    since: params?.since,
  });
  return fetchFromApi<EventsResponse | StoredEvent[]>(`/v1/events${query}`, { revalidate: 10 });
}

export async function getEventById(id: string) {
  return fetchFromApi<StoredEvent>(`/v1/events/${id}`, { revalidate: 30 });
}

export async function getEventThread(id: string) {
  return fetchFromApi<ThreadResponse>(`/v1/events/${id}/thread`, { revalidate: 30 });
}

/** Fetch everything the note detail page needs in a single API call. */
export async function getNoteDetail(id: string) {
  return fetchFromApi<NoteDetailResponse>(`/v1/pages/note/${id}`, { revalidate: 30 });
}

export async function getEventInteractions(id: string) {
  return fetchFromApi<InteractionResponse>(`/v1/events/${id}/interactions`, { revalidate: 30 });
}

export async function getSocialGraph(pubkey: string) {
  return fetchFromApi<SocialResponse>(`/v1/social/${pubkey}`, { revalidate: 60 });
}

/** Bulk-fetch profile metadata for up to 500 pubkeys. */
export async function getBulkProfileMetadata(pubkeys: string[]): Promise<Map<string, ProfileMetadataEntry>> {
  const map = new Map<string, ProfileMetadataEntry>();
  if (!pubkeys.length) return map;

  const unique = [...new Set(pubkeys)].slice(0, 500);
  if (!unique.length) return map;
  const url = `${API_BASE_URL}/v1/profiles/metadata`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ pubkeys: unique }),
      next: { revalidate: 300 },
    });
    const data = await handleResponse<ProfilesMetadataResponse>(res);
    for (const profile of data.profiles) {
      map.set(profile.pubkey, profile);
    }
  } catch (error) {
    console.error("[nostrarchives] Failed to fetch bulk profile metadata", error);
  }

  return map;
}

export async function getTrendingNotes(limit = 20) {
  return fetchFromApi<TrendingNotesResponse>(`/v1/notes/trending${buildQuery({ limit })}`, { revalidate: 15 });
}

export async function getNewUsers(limit = 20) {
  return fetchFromApi<NewUsersResponse>(`/v1/users/new${buildQuery({ limit })}`, { revalidate: 30 });
}

export async function getTopZappers(direction: "sent" | "received" = "received", limit = 10) {
  return fetchFromApi<TopZappersResponse>(
    `/v1/users/zappers${buildQuery({ direction, limit })}`,
    { revalidate: 30 },
  );
}

export async function getTrendingUsers(limit = 20) {
  return fetchFromApi<TrendingUsersResponse>(`/v1/users/trending${buildQuery({ limit })}`, { revalidate: 30 });
}

export const getDailyStats = cache(async () => {
  return fetchFromApi<DailyStatsResponse>("/v1/stats/daily", { revalidate: 30 });
});

// ─── Search ─────────────────────────────────────────────────────────

export async function search(
  q: string,
  type: "all" | "profiles" | "notes" = "all",
  limit = 20,
  offset = 0,
) {
  const query = buildQuery({ q, type, limit, offset });
  return fetchFromApi<SearchResponse>(`/v1/search${query}`, { revalidate: 5 });
}

export async function searchSuggest(q: string, limit = 5) {
  const url = `${API_BASE_URL}/v1/search/suggest${buildQuery({ q, limit })}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as SuggestResponse;
}

export async function advancedNoteSearch(params: {
  q?: string;
  exclude?: string;
  author?: string;
  reply_to?: string;
  order?: "newest" | "oldest" | "engagement";
  limit?: number;
  offset?: number;
}) {
  const query = buildQuery(params);
  return fetchFromApi<AdvancedSearchResponse>(`/v1/notes/search${query}`, { revalidate: 10 });
}

export async function getProfileMetadata(pubkey: string) {
  const query = buildQuery({ pubkey, kind: 0, limit: 1 });
  const response = await fetchFromApi<EventsResponse | StoredEvent[]>(`/v1/events${query}`, { revalidate: 300 });

  if (!response) return null;

  const events = Array.isArray(response) ? response : response.events;
  const latest = events?.[0];

  if (!latest) return null;

  try {
    const metadata = typeof latest.content === "string" ? JSON.parse(latest.content) : latest.content;
    return { metadata, event: latest };
  } catch (error) {
    console.warn(`[nostrarchives] Failed to parse profile metadata for ${pubkey}`, error);
    return { metadata: null, event: latest };
  }
}
