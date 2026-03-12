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
  root?: StoredEvent;
  ancestors?: StoredEvent[];
  replies?: StoredEvent[];
}

export interface InteractionResponse {
  reactions?: number;
  replies?: number;
  reposts?: number;
  zaps?: number;
}
