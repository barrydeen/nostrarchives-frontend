import { cache } from "react";
import { StatsResponse, TopNotesResponse, StoredEvent, EventsResponse, SocialResponse, ThreadResponse, InteractionResponse, ProfileMetadataEntry, ProfilesMetadataResponse, TrendingNotesResponse, NewUsersResponse, TrendingUsersResponse, TopZappersResponse, DailyStatsResponse, SearchResponse, SuggestResponse, NoteDetailResponse, TopNotesUnifiedResponse, TrendingMetric, TrendingRange, AdvancedSearchResponse, TrendingHashtagsResponse, HashtagNotesResponse, ClientLeaderboardResponse, RelayLeaderboardResponse, DailyAnalyticsResponse, ProfileNotesResponse, ProfileRepliesResponse, ProfileZapsSentResponse, ProfileZapsReceivedResponse, ProfileZapStatsResponse, TopPostersResponse, MostLikedResponse, MostSharedResponse, ClientUsersResponse } from "./types";

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

async function fetchFromApi<T>(path: string) {
  const url = `${API_BASE_URL}${path}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    return await handleResponse<T>(res);
  } catch (error) {
    console.error(`[nostrarchives] Failed to fetch ${path}`, error);
    return null;
  }
}

export const getGlobalStats = cache(async () => {
  return fetchFromApi<StatsResponse>("/v1/stats");
});

export async function getTopNotes(metric: "likes" | "zaps", range: "all_time" | "today", limit = 6) {
  const path = `/v1/notes/${metric}/top${range === "today" ? "/today" : ""}${buildQuery({ limit })}`;
  return fetchFromApi<TopNotesResponse>(path);
}

/** Unified trending endpoint: metric × range with profiles included. */
export async function getTopNotesUnified(
  metric: TrendingMetric = "reactions",
  range: TrendingRange = "today",
  limit = 20,
  offset = 0,
) {
  return fetchFromApi<TopNotesUnifiedResponse>(
    `/v1/notes/top${buildQuery({ metric, range, limit, offset })}`,
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
  return fetchFromApi<EventsResponse | StoredEvent[]>(`/v1/events${query}`);
}

export async function getEventById(id: string) {
  return fetchFromApi<StoredEvent>(`/v1/events/${id}`);
}

export async function getEventThread(id: string) {
  return fetchFromApi<ThreadResponse>(`/v1/events/${id}/thread`);
}

/** Fetch everything the note detail page needs in a single API call. */
export async function getNoteDetail(id: string) {
  return fetchFromApi<NoteDetailResponse>(`/v1/pages/note/${id}`);
}

export async function getEventInteractions(id: string) {
  return fetchFromApi<InteractionResponse>(`/v1/events/${id}/interactions`);
}

export async function getSocialGraph(pubkey: string) {
  return fetchFromApi<SocialResponse>(`/v1/social/${pubkey}`);
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
      cache: "no-store",
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
  return fetchFromApi<TrendingNotesResponse>(`/v1/notes/trending${buildQuery({ limit })}`);
}

export async function getNewUsers(limit = 20) {
  return fetchFromApi<NewUsersResponse>(`/v1/users/new${buildQuery({ limit })}`);
}

export async function getTopZappers(direction: "sent" | "received" = "received", limit = 20, range = "7d") {
  return fetchFromApi<TopZappersResponse>(
    `/v1/users/zappers${buildQuery({ direction, limit, range })}`,
  );
}

export async function getTrendingUsers(limit = 20) {
  return fetchFromApi<TrendingUsersResponse>(`/v1/users/trending${buildQuery({ limit })}`);
}

export const getDailyStats = cache(async () => {
  return fetchFromApi<DailyStatsResponse>("/v1/stats/daily");
});

// ─── Search ─────────────────────────────────────────────────────────

export async function search(
  q: string,
  type: "all" | "profiles" | "notes" = "all",
  limit = 20,
  offset = 0,
) {
  const query = buildQuery({ q, type, limit, offset });
  return fetchFromApi<SearchResponse>(`/v1/search${query}`);
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
  return fetchFromApi<AdvancedSearchResponse>(`/v1/notes/search${query}`);
}

export async function getProfileMetadata(pubkey: string) {
  const query = buildQuery({ pubkey, kind: 0, limit: 1 });
  const response = await fetchFromApi<EventsResponse | StoredEvent[]>(`/v1/events${query}`);

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

export async function getTrendingHashtags(limit = 20) {
  return fetchFromApi<TrendingHashtagsResponse>(
    `/v1/hashtags/trending${buildQuery({ limit })}`,
  );
}

export async function getHashtagNotes(hashtag: string, limit = 30, offset = 0) {
  const tag = hashtag.trim().replace(/^#/, "");
  if (!tag) return null;
  return fetchFromApi<HashtagNotesResponse>(
    `/v1/hashtags/${encodeURIComponent(tag)}/notes${buildQuery({ limit, offset })}`,
  );
}

// ─── Daily Analytics ────────────────────────────────────────────────

export async function getDailyAnalytics(days = 30) {
  return fetchFromApi<DailyAnalyticsResponse>(
    `/v1/analytics/daily${buildQuery({ days })}`,
  );
}

// ─── Client Leaderboard ─────────────────────────────────────────────

export async function getClientLeaderboard(limit = 50, offset = 0, range?: string) {
  return fetchFromApi<ClientLeaderboardResponse>(
    `/v1/clients/leaderboard${buildQuery({ limit, offset, range })}`,
  );
}

export async function getClientUsers(clientName: string, limit = 50, offset = 0) {
  return fetchFromApi<ClientUsersResponse>(
    `/v1/clients/${encodeURIComponent(clientName)}/users${buildQuery({ limit, offset })}`,
  );
}

// ─── Relay Leaderboard ──────────────────────────────────────────────

export async function getRelayLeaderboard(limit = 50, offset = 0) {
  return fetchFromApi<RelayLeaderboardResponse>(
    `/v1/relays/leaderboard${buildQuery({ limit, offset })}`,
  );
}

// ─── Analytics Leaderboards ─────────────────────────────────────────

export async function getTopPosters(range = "7d", limit = 20) {
  return fetchFromApi<TopPostersResponse>(
    `/v1/analytics/top-posters${buildQuery({ range, limit })}`,
  );
}

export async function getMostLiked(range = "7d", limit = 20) {
  return fetchFromApi<MostLikedResponse>(
    `/v1/analytics/most-liked${buildQuery({ range, limit })}`,
  );
}

export async function getMostShared(range = "7d", limit = 20) {
  return fetchFromApi<MostSharedResponse>(
    `/v1/analytics/most-shared${buildQuery({ range, limit })}`,
  );
}

// ─── Profile Tabs ───────────────────────────────────────────────────

export async function getProfileNotes(pubkey: string, limit = 20, offset = 0, sort = "recent") {
  return fetchFromApi<ProfileNotesResponse>(
    `/v1/profiles/${pubkey}/notes${buildQuery({ limit, offset, sort })}`,
  );
}

export async function getProfileReplies(pubkey: string, limit = 20, offset = 0, sort = "recent") {
  return fetchFromApi<ProfileRepliesResponse>(
    `/v1/profiles/${pubkey}/replies${buildQuery({ limit, offset, sort })}`,
  );
}

export async function getProfileZapsSent(pubkey: string, limit = 20, offset = 0, sort = "recent") {
  return fetchFromApi<ProfileZapsSentResponse>(
    `/v1/profiles/${pubkey}/zaps/sent${buildQuery({ limit, offset, sort })}`,
  );
}

export async function getProfileZapsReceived(pubkey: string, limit = 20, offset = 0, sort = "recent") {
  return fetchFromApi<ProfileZapsReceivedResponse>(
    `/v1/profiles/${pubkey}/zaps/received${buildQuery({ limit, offset, sort })}`,
  );
}

export async function getProfileZapStats(pubkey: string) {
  return fetchFromApi<ProfileZapStatsResponse>(
    `/v1/profiles/${pubkey}/zap-stats`,
  );
}
