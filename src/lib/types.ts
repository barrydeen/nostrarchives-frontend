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
  about?: string | null;
  nip05?: string | null;
  lud16?: string | null;
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

export interface HashtagNotesResponse {
  hashtag: string;
  notes: TrendingNote[];
  profiles: Record<string, {
    name: string | null;
    display_name: string | null;
    picture: string | null;
    nip05: string | null;
  }>;
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

export interface TopZapper {
  pubkey: string;
  total_sats: number;
  zap_count: number;
}

export interface TopZappersResponse {
  direction: string;
  range?: string;
  zappers: TopZapper[];
}

export interface DailyStatsResponse {
  daily_active_users: number;
  total_sats_sent: number;
  daily_posts: number;
}

// ─── Unified Trending ───────────────────────────────────────────────

export type TrendingMetric = "reactions" | "replies" | "reposts" | "zaps";
export type TrendingRange = "today" | "7d" | "30d" | "1y" | "all";

export interface TopNotesUnifiedResponse {
  metric: string;
  range: string;
  notes: Array<{
    count: number;
    total_sats?: number;
    reactions: number;
    replies: number;
    reposts: number;
    zap_sats: number;
    event: StoredEvent;
  }>;
  profiles: Record<string, {
    name: string | null;
    display_name: string | null;
    picture: string | null;
    nip05: string | null;
  }>;
}

// ─── Advanced Note Search ───────────────────────────────────────────

export interface AdvancedSearchNote {
  event: StoredEvent;
  reactions: number;
  replies: number;
  reposts: number;
  zap_sats: number;
}

export interface AdvancedSearchResponse {
  notes: AdvancedSearchNote[];
  total: number;
  profiles: Record<string, {
    name: string | null;
    display_name: string | null;
    picture: string | null;
    nip05: string | null;
  }>;
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

// ─── Trending Hashtags ──────────────────────────────────────────────

export interface TrendingHashtag {
  hashtag: string;
  count: number;
}

export interface TrendingHashtagsResponse {
  hashtags: TrendingHashtag[];
}

// ─── Daily Analytics ────────────────────────────────────────────────

export interface DailyAnalyticsEntry {
  date: string; // YYYY-MM-DD
  active_users: number;
  zaps_sent: number;
  notes_posted: number;
}

export interface DailyAnalyticsResponse {
  data: DailyAnalyticsEntry[];
  range: { from: string; to: string };
}

// ─── Client Leaderboard ─────────────────────────────────────────────

export interface ClientEntry {
  client_name: string;
  note_count: number;
  user_count: number;
}

export interface ClientLeaderboardResponse {
  clients: ClientEntry[];
}

// ─── Relay Leaderboard ──────────────────────────────────────────────

export interface RelayLeaderboardEntry {
  relay_url: string;
  user_count: number;
}

export interface RelayLeaderboardResponse {
  relays: RelayLeaderboardEntry[];
}

// ─── Profile Tabs ───────────────────────────────────────────────────

export type ProfileMap = Record<string, {
  name: string | null;
  display_name: string | null;
  picture: string | null;
  nip05: string | null;
}>;

export interface ProfileNotesResponse {
  events: StoredEvent[];
  total: number;
  profiles: ProfileMap;
}

export interface ProfileRepliesResponse {
  events: StoredEvent[];
  total: number;
  profiles: ProfileMap;
}

export interface ProfileZapEntry {
  event: StoredEvent;
  amount_sats: number;
  recipient?: string | null;
  sender?: string | null;
  zapped_event_id?: string | null;
}

export interface ProfileZapsSentResponse {
  zaps: ProfileZapEntry[];
  total: number;
  profiles: ProfileMap;
}

export interface ProfileZapsReceivedResponse {
  zaps: ProfileZapEntry[];
  total: number;
  profiles: ProfileMap;
}

export interface ZapAggregate {
  total_sats: number;
  zap_count: number;
}

export interface ProfileZapStatsResponse {
  pubkey: string;
  sent: ZapAggregate;
  received: ZapAggregate;
}

// ─── Analytics Leaderboards ─────────────────────────────────────────

export interface TopPoster {
  pubkey: string;
  note_count: number;
}

export interface TopPostersResponse {
  range: string;
  authors: TopPoster[];
}

export interface MostLikedAuthor {
  pubkey: string;
  like_count: number;
}

export interface MostLikedResponse {
  range: string;
  authors: MostLikedAuthor[];
}

export interface MostSharedAuthor {
  pubkey: string;
  repost_count: number;
}

export interface MostSharedResponse {
  range: string;
  authors: MostSharedAuthor[];
}
