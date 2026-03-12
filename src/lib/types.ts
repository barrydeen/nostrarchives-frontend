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
