"use client";

import { DailyStatsResponse, TrendingNotesResponse, NewUsersResponse, TrendingUsersResponse, TopZappersResponse, TrendingHashtagsResponse, ClientLeaderboardResponse, RelayLeaderboardResponse, ProfileMetadataEntry, ProfilesMetadataResponse, ClientUsersResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.nostrarchives.com";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchDailyStats() {
  return fetchJson<DailyStatsResponse>(`${API_BASE_URL}/v1/stats/daily`);
}

export async function fetchTrendingNotes(limit = 10) {
  return fetchJson<TrendingNotesResponse>(`${API_BASE_URL}/v1/notes/trending?limit=${limit}`);
}

export async function fetchNewUsers(limit = 12) {
  return fetchJson<NewUsersResponse>(`${API_BASE_URL}/v1/users/new?limit=${limit}`);
}

export async function fetchTrendingUsers(limit = 12) {
  return fetchJson<TrendingUsersResponse>(`${API_BASE_URL}/v1/users/trending?limit=${limit}`);
}

export async function fetchTopZappers(direction: "sent" | "received", limit = 12, range = "today") {
  return fetchJson<TopZappersResponse>(`${API_BASE_URL}/v1/users/zappers?direction=${direction}&limit=${limit}&range=${range}`);
}

export async function fetchTrendingHashtags(limit = 20) {
  return fetchJson<TrendingHashtagsResponse>(`${API_BASE_URL}/v1/hashtags/trending?limit=${limit}`);
}

export async function fetchClientLeaderboard(limit = 10, range?: string) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (range) params.set("range", range);
  return fetchJson<ClientLeaderboardResponse>(`${API_BASE_URL}/v1/clients/leaderboard?${params}`);
}

export async function fetchRelayLeaderboard(limit = 10) {
  return fetchJson<RelayLeaderboardResponse>(`${API_BASE_URL}/v1/relays/leaderboard?limit=${limit}`);
}

export async function fetchClientUsers(clientName: string, limit = 50, offset = 0) {
  return fetchJson<ClientUsersResponse>(
    `${API_BASE_URL}/v1/clients/${encodeURIComponent(clientName)}/users?limit=${limit}&offset=${offset}`,
  );
}

export async function fetchBulkProfileMetadata(pubkeys: string[]): Promise<Map<string, ProfileMetadataEntry>> {
  const map = new Map<string, ProfileMetadataEntry>();
  if (!pubkeys.length) return map;

  const unique = [...new Set(pubkeys)].slice(0, 500);
  const data = await fetchJson<ProfilesMetadataResponse>(`${API_BASE_URL}/v1/profiles/metadata`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pubkeys: unique }),
  });

  for (const profile of data.profiles) {
    map.set(profile.pubkey, profile);
  }
  return map;
}
