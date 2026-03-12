export type EventTag = [string, ...string[]];

export interface StoredEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  content: string;
  sig?: string;
  tags: EventTag[];
  relay_url?: string;
  received_at?: string;
  raw?: Record<string, unknown>;
  /** Engagement stats — present when returned by enriched endpoints */
  reactions?: number;
  replies?: number;
  reposts?: number;
  zap_sats?: number;
}

export interface StatsResponse {
  total_events: number;
  unique_pubkeys: number;
  ingestion_rate_per_min: number;
  events_by_kind: Array<{
    kind: number;
    count: number;
  }>;
}

export interface EventsResponse {
  events: StoredEvent[];
  total?: number;
  next_offset?: number;
}

export interface TopNotesResponse {
  metric: "likes" | "zaps";
  range: "all_time" | "today";
  notes: Array<{
    count: number;
    total_sats?: number;
    reactions: number;
    replies: number;
    reposts: number;
    zap_sats: number;
    event: StoredEvent;
  }>;
}

export interface SocialResponse {
  pubkey: string;
  follows: {
    count: number;
    pubkeys: string[];
  };
  followers: {
    count: number;
    pubkeys: string[];
  };
}

export interface ThreadResponse {
  event: StoredEvent;
  interactions: InteractionResponse;
  root_id: string | null;
  parent_id: string | null;
  replies: StoredEvent[];
  reactions: StoredEvent[];
  reposts: StoredEvent[];
  zaps: StoredEvent[];
}

export interface InteractionResponse {
  reactions?: number;
  replies?: number;
  reposts?: number;
  zaps?: number;
}

/** Response from GET /v1/pages/note/{id} — single-query note detail. */
export interface NoteDetailResponse {
  event: StoredEvent;
  root_id: string | null;
  parent_id: string | null;
  stats: {
    replies: number;
    reactions: number;
    reposts: number;
    zaps: number;
  };
  replies: StoredEvent[];
  /** Map of pubkey → profile metadata for all involved pubkeys. */
  profiles: Record<string, {
    name: string | null;
    display_name: string | null;
    picture: string | null;
    nip05: string | null;
  }>;
}

export interface ProfileMetadataEntry {
  pubkey: string;
  display_name: string | null;
  name: string | null;
  preferred_name: string | null;
  picture: string | null;
}

export interface ProfilesMetadataResponse {
  profiles: ProfileMetadataEntry[];
}

export interface TrendingNote {
  event: StoredEvent;
  score: number;
  zap_sats: number;
  reposts: number;
  replies: number;
  reactions: number;
}

export interface TrendingNotesResponse {
  notes: TrendingNote[];
}

export interface NewUser {
  pubkey: string;
  first_seen: number;
  event_count: number;
}

export interface NewUsersResponse {
  users: NewUser[];
}

export interface TrendingUser {
  pubkey: string;
  new_followers: number;
}

export interface TrendingUsersResponse {
  users: TrendingUser[];
}

export interface DailyStatsResponse {
  daily_active_users: number;
  total_sats_sent: number;
  daily_posts: number;
}

// ─── Search ─────────────────────────────────────────────────────────

export interface ProfileSearchResult {
  pubkey: string;
  name: string | null;
  display_name: string | null;
  nip05: string | null;
  about: string | null;
  picture: string | null;
  follower_count: number;
  engagement_score: number;
  last_active_at: number;
  rank_score: number;
}

export interface NoteSearchResult {
  event: StoredEvent;
  rank_score: number;
  reactions: number;
  replies: number;
  reposts: number;
  zaps: number;
}

export interface ResolvedEntity {
  type: "profile" | "event";
  pubkey?: string;
  id?: string;
  relays?: string[];
  author?: string;
  kind?: number;
}

export interface SearchResponse {
  query: string;
  resolved?: ResolvedEntity;
  profiles?: ProfileSearchResult[];
  notes?: NoteSearchResult[];
}

export interface SuggestResponse {
  query: string;
  resolved?: ResolvedEntity;
  suggestions: ProfileSearchResult[];
}
