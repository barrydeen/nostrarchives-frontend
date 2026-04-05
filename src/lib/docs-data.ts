// ---------------------------------------------------------------------------
// API Documentation Data
// Source of truth: nostrarchives-api/src/api/handlers.rs, ws/mod.rs,
//                  scheduler/mod.rs, indexer/mod.rs
// ---------------------------------------------------------------------------

export interface Param {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
  values?: string[];
}

export interface RestEndpoint {
  id: string;
  method: "GET" | "POST" | "DELETE";
  path: string;
  description: string;
  params?: Param[];
  requestBody?: { description: string; example: string };
  responseExample: string;
  notes?: string[];
}

export interface WsMessage {
  direction: "send" | "receive";
  label: string;
  format: string;
  description: string;
}

export interface WsEndpoint {
  id: string;
  url: string;
  path?: string;
  description: string;
  protocol: string;
  authRequired: boolean;
  messages: WsMessage[];
  constraints?: string[];
  notes?: string[];
}

export interface DocCategory {
  id: string;
  title: string;
  description?: string;
  endpoints: RestEndpoint[];
}

export interface DocService {
  id: string;
  title: string;
  baseUrl: string;
  description: string;
  rateLimit?: string;
  categories?: DocCategory[];
  wsEndpoints?: WsEndpoint[];
}

// ---------------------------------------------------------------------------
// REST API — https://api.nostrarchives.com
// ---------------------------------------------------------------------------

const restApi: DocService = {
  id: "rest-api",
  title: "REST API",
  baseUrl: "https://api.nostrarchives.com",
  description:
    "HTTP JSON API for querying events, profiles, search, trending content, analytics, and admin operations.",
  rateLimit: "120 requests/min per IP",
  categories: [
    // ── Health & Stats ──────────────────────────────────────────
    {
      id: "health-stats",
      title: "Health & Stats",
      endpoints: [
        {
          id: "health",
          method: "GET",
          path: "/health",
          description: "Health check. Returns 200 OK when the service is running.",
          responseExample: `{ "status": "ok" }`,
        },
        {
          id: "stats",
          method: "GET",
          path: "/v1/stats",
          description:
            "Global statistics: total events, unique pubkeys, event kind counts.",
          responseExample: `{
  "total_events": 12345678,
  "total_pubkeys": 234567,
  "kinds": { "0": 150000, "1": 8000000, ... }
}`,
        },
        {
          id: "stats-daily",
          method: "GET",
          path: "/v1/stats/daily",
          description:
            "Daily network stats: daily active users, total sats sent, daily posts. Served from Redis HyperLogLog counters for O(1) lookups.",
          responseExample: `{
  "daily_active_users": 8234,
  "total_sats_sent": 1456789,
  "daily_posts": 45678
}`,
        },
        {
          id: "stats-follower-cache",
          method: "GET",
          path: "/v1/stats/follower-cache",
          description:
            "Cache monitoring: Web of Trust, follower cache, and profile search cache statistics.",
          responseExample: `{
  "wot": {
    "passing_count": 45000,
    "threshold": 21,
    "last_refresh_ago_secs": 120,
    "refresh_interval_secs": 900
  },
  "follower_cache": { ... },
  "profile_search": { ... }
}`,
        },
        {
          id: "crawler-stats",
          method: "GET",
          path: "/v1/crawler/stats",
          description: "Crawler queue progress and statistics. Returns `{ \"enabled\": false }` if the crawler is disabled.",
          responseExample: `{
  "enabled": true,
  "queue_size": 1234,
  "processed": 56789,
  "errors": 12
}`,
        },
      ],
    },

    // ── Events ──────────────────────────────────────────────────
    {
      id: "events",
      title: "Events",
      endpoints: [
        {
          id: "get-events",
          method: "GET",
          path: "/v1/events",
          description:
            "Query events with filters. Returns events enriched with engagement stats (reactions, replies, reposts, zap_sats).",
          params: [
            { name: "pubkey", type: "string", required: false, description: "Filter by author pubkey (hex or npub)" },
            { name: "kind", type: "integer", required: false, description: "Filter by event kind" },
            { name: "since", type: "integer", required: false, description: "Unix timestamp — events after this time" },
            { name: "until", type: "integer", required: false, description: "Unix timestamp — events before this time" },
            { name: "search", type: "string", required: false, description: "Full-text search query" },
            { name: "limit", type: "integer", required: false, default: "100", description: "Max results (1–100)" },
            { name: "offset", type: "integer", required: false, default: "0", description: "Pagination offset" },
          ],
          responseExample: `{
  "events": [
    {
      "id": "abc123...",
      "pubkey": "def456...",
      "kind": 1,
      "content": "Hello Nostr!",
      "created_at": 1700000000,
      "reactions": 42,
      "replies": 5,
      "reposts": 3,
      "zap_sats": 21000
    }
  ],
  "count": 1
}`,
        },
        {
          id: "get-event-by-id",
          method: "GET",
          path: "/v1/events/{id}",
          description: "Get a single event by its ID (hex).",
          params: [
            { name: "id", type: "string", required: true, description: "Event ID (64-char hex)" },
          ],
          responseExample: `{
  "id": "abc123...",
  "pubkey": "def456...",
  "kind": 1,
  "content": "Hello Nostr!",
  "created_at": 1700000000,
  "tags": [["e", "..."], ["p", "..."]]
}`,
        },
        {
          id: "get-event-thread",
          method: "GET",
          path: "/v1/events/{id}/thread",
          description:
            "Get full thread context: parent/root references, replies, reactions, reposts, and zaps.",
          params: [
            { name: "id", type: "string", required: true, description: "Event ID (64-char hex)" },
            { name: "limit", type: "integer", required: false, default: "50", description: "Max replies (1–500)" },
          ],
          responseExample: `{
  "event": { ... },
  "ancestors": [ ... ],
  "replies": [ ... ],
  "reactions": 42,
  "reposts": 3,
  "zap_sats": 21000
}`,
        },
        {
          id: "get-note-detail",
          method: "GET",
          path: "/v1/pages/note/{id}",
          description:
            "Frontend-optimized note detail. Single SQL round-trip returns the event, thread refs, interaction stats, replies, and profile metadata for all involved pubkeys.",
          params: [
            { name: "id", type: "string", required: true, description: "Event ID (64-char hex)" },
            { name: "limit", type: "integer", required: false, default: "50", description: "Max replies (1–200)" },
          ],
          responseExample: `{
  "event": { ... },
  "replies": [ ... ],
  "profiles": { "<pubkey>": { "name": "...", "picture": "..." } },
  "interactions": { "reactions": 42, "replies": 5, ... }
}`,
        },
        {
          id: "get-event-interactions",
          method: "GET",
          path: "/v1/events/{id}/interactions",
          description:
            "Lightweight interaction counts for an event. No full events returned.",
          params: [
            { name: "id", type: "string", required: true, description: "Event ID (64-char hex)" },
          ],
          responseExample: `{
  "reactions": 42,
  "replies": 5,
  "reposts": 3,
  "zap_sats": 21000
}`,
        },
        {
          id: "get-event-refs",
          method: "GET",
          path: "/v1/events/{id}/refs/{ref_type}",
          description: "Get events that reference a target event, filtered by reference type.",
          params: [
            { name: "id", type: "string", required: true, description: "Target event ID (64-char hex)" },
            { name: "ref_type", type: "string", required: true, description: "Reference type", values: ["reply", "reaction", "repost", "zap", "mention", "root"] },
            { name: "limit", type: "integer", required: false, default: "50", description: "Max results (1–500)" },
          ],
          responseExample: `{
  "events": [ ... ],
  "count": 5,
  "ref_type": "reply"
}`,
        },
      ],
    },

    // ── Profiles & Social ───────────────────────────────────────
    {
      id: "profiles",
      title: "Profiles & Social",
      endpoints: [
        {
          id: "get-social-graph",
          method: "GET",
          path: "/v1/social/{pubkey}",
          description: "Follow/follower counts and paginated lists for a pubkey.",
          params: [
            { name: "pubkey", type: "string", required: true, description: "Pubkey (hex or npub)" },
            { name: "follows_limit", type: "integer", required: false, default: "100", description: "Max follows to return (1–500)" },
            { name: "followers_limit", type: "integer", required: false, default: "100", description: "Max followers to return (1–500)" },
            { name: "follows_offset", type: "integer", required: false, default: "0", description: "Follows pagination offset" },
            { name: "followers_offset", type: "integer", required: false, default: "0", description: "Followers pagination offset" },
          ],
          responseExample: `{
  "pubkey": "abc123...",
  "follows": { "count": 350, "pubkeys": ["..."] },
  "followers": { "count": 12000, "pubkeys": ["..."] }
}`,
        },
        {
          id: "get-profiles-metadata",
          method: "POST",
          path: "/v1/profiles/metadata",
          description: "Batch fetch profile metadata for multiple pubkeys. Accepts hex pubkeys or npubs. Cached for 5 minutes.",
          params: [],
          requestBody: {
            description: "JSON body with array of pubkeys (max 500).",
            example: `{ "pubkeys": ["abc123...", "npub1..."] }`,
          },
          responseExample: `{
  "profiles": [
    {
      "pubkey": "abc123...",
      "display_name": "Alice",
      "name": "alice",
      "preferred_name": "Alice",
      "picture": "https://...",
      "about": "Nostr enthusiast",
      "nip05": "alice@example.com",
      "lud16": "alice@walletofsatoshi.com"
    }
  ]
}`,
        },
        {
          id: "get-profile-notes",
          method: "GET",
          path: "/v1/profiles/{pubkey}/notes",
          description: "Root notes (non-replies) by a specific author, with engagement stats and profile metadata.",
          params: [
            { name: "pubkey", type: "string", required: true, description: "Author pubkey (hex or npub)" },
            { name: "limit", type: "integer", required: false, default: "20", description: "Max results (1–100)" },
            { name: "offset", type: "integer", required: false, default: "0", description: "Pagination offset" },
            { name: "sort", type: "string", required: false, default: "recent", description: "Sort order", values: ["recent", "engagement"] },
          ],
          responseExample: `{
  "events": [
    { "id": "...", "content": "...", "reactions": 10, "replies": 2, ... }
  ],
  "profiles": { "<pubkey>": { "name": "...", ... } }
}`,
        },
        {
          id: "get-profile-replies",
          method: "GET",
          path: "/v1/profiles/{pubkey}/replies",
          description: "Replies by a specific author, with engagement stats and profile metadata.",
          params: [
            { name: "pubkey", type: "string", required: true, description: "Author pubkey (hex or npub)" },
            { name: "limit", type: "integer", required: false, default: "20", description: "Max results (1–100)" },
            { name: "offset", type: "integer", required: false, default: "0", description: "Pagination offset" },
            { name: "sort", type: "string", required: false, default: "recent", description: "Sort order", values: ["recent", "engagement"] },
          ],
          responseExample: `{
  "events": [ ... ],
  "profiles": { "<pubkey>": { "name": "...", ... } }
}`,
        },
        {
          id: "get-profile-zaps-sent",
          method: "GET",
          path: "/v1/profiles/{pubkey}/zaps/sent",
          description: "Zaps sent by a specific pubkey, with recipient metadata.",
          params: [
            { name: "pubkey", type: "string", required: true, description: "Sender pubkey (hex or npub)" },
            { name: "limit", type: "integer", required: false, default: "20", description: "Max results (1–100)" },
            { name: "offset", type: "integer", required: false, default: "0", description: "Pagination offset" },
            { name: "sort", type: "string", required: false, default: "recent", description: "Sort order", values: ["recent", "engagement"] },
          ],
          responseExample: `{
  "zaps": [
    { "event": { ... }, "amount_sats": 1000, "recipient": "...", "zapped_event_id": "..." }
  ],
  "total": 42,
  "profiles": { ... }
}`,
        },
        {
          id: "get-profile-zaps-received",
          method: "GET",
          path: "/v1/profiles/{pubkey}/zaps/received",
          description: "Zaps received by a specific pubkey, with sender metadata.",
          params: [
            { name: "pubkey", type: "string", required: true, description: "Recipient pubkey (hex or npub)" },
            { name: "limit", type: "integer", required: false, default: "20", description: "Max results (1–100)" },
            { name: "offset", type: "integer", required: false, default: "0", description: "Pagination offset" },
            { name: "sort", type: "string", required: false, default: "recent", description: "Sort order", values: ["recent", "engagement"] },
          ],
          responseExample: `{
  "zaps": [
    { "event": { ... }, "amount_sats": 5000, "sender": "...", "zapped_event_id": "..." }
  ],
  "total": 128,
  "profiles": { ... }
}`,
        },
        {
          id: "get-profile-zap-stats",
          method: "GET",
          path: "/v1/profiles/{pubkey}/zap-stats",
          description: "Zap statistics for a pubkey: total sats sent/received and zap counts.",
          params: [
            { name: "pubkey", type: "string", required: true, description: "Pubkey (hex or npub)" },
          ],
          responseExample: `{
  "sent": { "total_sats": 150000, "count": 42 },
  "received": { "total_sats": 500000, "count": 128 }
}`,
        },
      ],
    },

    // ── Search ──────────────────────────────────────────────────
    {
      id: "search",
      title: "Search",
      endpoints: [
        {
          id: "search-full",
          method: "GET",
          path: "/v1/search",
          description:
            "Full-text search across profiles and notes. Automatically detects and resolves Nostr entities (npub, nprofile, nevent, note1, 64-char hex).",
          params: [
            { name: "q", type: "string", required: true, description: "Search query" },
            { name: "type", type: "string", required: false, default: "all", description: "Result type filter", values: ["all", "profiles", "notes"] },
            { name: "limit", type: "integer", required: false, default: "20", description: "Max results (1–100)" },
            { name: "offset", type: "integer", required: false, default: "0", description: "Pagination offset" },
          ],
          responseExample: `{
  "query": "bitcoin",
  "profiles": [
    { "pubkey": "...", "name": "...", "display_name": "...", "picture": "...", "nip05": "...", "follower_count": 1234 }
  ],
  "notes": [
    { "id": "...", "pubkey": "...", "content": "...", "created_at": 1700000000, "reactions": 10 }
  ]
}`,
          notes: ["If the query resolves to a Nostr entity, a `resolved` object is returned instead of search results."],
        },
        {
          id: "search-suggest",
          method: "GET",
          path: "/v1/search/suggest",
          description:
            "Autocomplete suggestions for search-as-you-type. Returns profile suggestions ranked by prefix match quality and follower count. Also resolves Nostr entities.",
          params: [
            { name: "q", type: "string", required: true, description: "Search query (min 2 characters)" },
            { name: "limit", type: "integer", required: false, default: "5", description: "Max suggestions (1–10)" },
          ],
          responseExample: `{
  "query": "al",
  "suggestions": [
    { "pubkey": "...", "name": "alice", "display_name": "Alice", "picture": "...", "follower_count": 5000 }
  ]
}`,
        },
        {
          id: "advanced-note-search",
          method: "GET",
          path: "/v1/notes/search",
          description:
            "Advanced note search with filters for author, reply context, and sort order.",
          params: [
            { name: "q", type: "string", required: false, description: "Full-text search query" },
            { name: "exclude", type: "string", required: false, description: "Exclude notes containing this term" },
            { name: "author", type: "string", required: false, description: "Filter by author pubkey (hex or npub)" },
            { name: "reply_to", type: "string", required: false, description: "Filter to replies to this pubkey (hex or npub)" },
            { name: "order", type: "string", required: false, default: "newest", description: "Sort order", values: ["newest", "oldest", "engagement"] },
            { name: "limit", type: "integer", required: false, default: "20", description: "Max results (1–100)" },
            { name: "offset", type: "integer", required: false, default: "0", description: "Pagination offset" },
          ],
          responseExample: `{
  "notes": [
    { "event": { ... }, "reactions": 10, "replies": 2, "reposts": 1, "zap_sats": 5000 }
  ],
  "total": 142,
  "profiles": { "<pubkey>": { "name": "...", ... } }
}`,
        },
      ],
    },

    // ── Trending & Leaderboards ─────────────────────────────────
    {
      id: "trending",
      title: "Trending & Leaderboards",
      endpoints: [
        {
          id: "notes-top",
          method: "GET",
          path: "/v1/notes/top",
          description:
            "Top notes ranked by a specific engagement metric within a time range. Aggressively cached in Redis (90s for today, up to 1h for all-time).",
          params: [
            { name: "metric", type: "string", required: false, default: "reactions", description: "Engagement metric", values: ["reactions", "replies", "reposts", "zaps"] },
            { name: "range", type: "string", required: false, default: "today", description: "Time range", values: ["today", "7d", "30d", "1y", "all"] },
            { name: "limit", type: "integer", required: false, default: "100", description: "Max results (1–100)" },
            { name: "offset", type: "integer", required: false, default: "0", description: "Pagination offset" },
          ],
          responseExample: `{
  "metric": "reactions",
  "range": "today",
  "notes": [
    {
      "count": 150,
      "total_sats": 50000,
      "reactions": 150,
      "replies": 20,
      "reposts": 10,
      "zap_sats": 50000,
      "event": { "id": "...", "content": "...", ... }
    }
  ],
  "profiles": { "<pubkey>": { "name": "...", "picture": "..." } }
}`,
        },
        {
          id: "notes-trending",
          method: "GET",
          path: "/v1/notes/trending",
          description: "Trending notes ranked by a composite engagement score (reactions + replies + reposts + zap sats). Cached 5 minutes.",
          params: [
            { name: "limit", type: "integer", required: false, default: "100", description: "Max results (1–100)" },
            { name: "offset", type: "integer", required: false, default: "0", description: "Pagination offset" },
          ],
          responseExample: `{ "notes": [ ... ] }`,
        },
        {
          id: "users-new",
          method: "GET",
          path: "/v1/users/new",
          description: "Recently joined users (first seen in the last 24 hours). Cached 5 minutes.",
          params: [
            { name: "limit", type: "integer", required: false, default: "100", description: "Max results (1–100)" },
            { name: "offset", type: "integer", required: false, default: "0", description: "Pagination offset" },
          ],
          responseExample: `{ "users": [ { "pubkey": "...", "name": "...", "created_at": 1700000000 } ] }`,
        },
        {
          id: "users-trending",
          method: "GET",
          path: "/v1/users/trending",
          description: "Trending users ranked by new follower count in the last 24 hours. Cached 24 hours.",
          params: [
            { name: "limit", type: "integer", required: false, default: "100", description: "Max results (1–100)" },
            { name: "offset", type: "integer", required: false, default: "0", description: "Pagination offset" },
          ],
          responseExample: `{ "users": [ ... ] }`,
        },
        {
          id: "users-zappers",
          method: "GET",
          path: "/v1/users/zappers",
          description: "Top zappers by sats sent or received in a time range.",
          params: [
            { name: "direction", type: "string", required: false, default: "received", description: "Zap direction", values: ["sent", "received"] },
            { name: "range", type: "string", required: false, default: "7d", description: "Time range", values: ["today", "7d", "30d", "all"] },
            { name: "limit", type: "integer", required: false, default: "100", description: "Max results (1–100)" },
            { name: "offset", type: "integer", required: false, default: "0", description: "Pagination offset" },
          ],
          responseExample: `{
  "direction": "received",
  "range": "7d",
  "zappers": [ { "pubkey": "...", "total_sats": 500000, "zap_count": 42 } ]
}`,
        },
        {
          id: "hashtags-trending",
          method: "GET",
          path: "/v1/hashtags/trending",
          description: "Trending hashtags from the last 24 hours. Cached 10 minutes.",
          params: [
            { name: "limit", type: "integer", required: false, default: "50", description: "Max results (1–50)" },
            { name: "offset", type: "integer", required: false, default: "0", description: "Pagination offset" },
          ],
          responseExample: `{ "hashtags": [ { "tag": "bitcoin", "count": 456 } ] }`,
        },
        {
          id: "hashtag-notes",
          method: "GET",
          path: "/v1/hashtags/{tag}/notes",
          description: "Notes tagged with a specific hashtag, with profile metadata. Cached 5 minutes.",
          params: [
            { name: "tag", type: "string", required: true, description: "Hashtag (without #)" },
            { name: "limit", type: "integer", required: false, default: "100", description: "Max results (1–100)" },
            { name: "offset", type: "integer", required: false, default: "0", description: "Pagination offset" },
          ],
          responseExample: `{
  "hashtag": "bitcoin",
  "notes": [ ... ],
  "profiles": { "<pubkey>": { "name": "...", ... } }
}`,
        },
      ],
    },

    // ── Analytics ────────────────────────────────────────────────
    {
      id: "analytics",
      title: "Analytics",
      endpoints: [
        {
          id: "analytics-daily",
          method: "GET",
          path: "/v1/analytics/daily",
          description: "Daily analytics for the last N days. Cached 24 hours (immutable once computed).",
          params: [
            { name: "days", type: "integer", required: false, default: "30", description: "Number of days (1–365)" },
          ],
          responseExample: `{
  "data": [
    { "date": "2025-01-15", "dau": 8234, "posts": 45678, "zap_sats": 1456789 }
  ],
  "range": { "from": "2024-12-16", "to": "2025-01-15" }
}`,
        },
        {
          id: "analytics-top-posters",
          method: "GET",
          path: "/v1/analytics/top-posters",
          description: "Authors ranked by number of kind-1 notes published in the time range.",
          params: [
            { name: "range", type: "string", required: false, default: "7d", description: "Time range", values: ["today", "7d", "30d", "1y", "all"] },
            { name: "limit", type: "integer", required: false, default: "100", description: "Max results (1–100)" },
            { name: "offset", type: "integer", required: false, default: "0", description: "Pagination offset" },
          ],
          responseExample: `{ "range": "7d", "authors": [ { "pubkey": "...", "count": 234 } ] }`,
        },
        {
          id: "analytics-most-liked",
          method: "GET",
          path: "/v1/analytics/most-liked",
          description: "Authors whose notes received the most reactions (kind-7) in the time range.",
          params: [
            { name: "range", type: "string", required: false, default: "7d", description: "Time range", values: ["today", "7d", "30d", "1y", "all"] },
            { name: "limit", type: "integer", required: false, default: "100", description: "Max results (1–100)" },
            { name: "offset", type: "integer", required: false, default: "0", description: "Pagination offset" },
          ],
          responseExample: `{ "range": "7d", "authors": [ { "pubkey": "...", "count": 567 } ] }`,
        },
        {
          id: "analytics-most-shared",
          method: "GET",
          path: "/v1/analytics/most-shared",
          description: "Authors whose notes received the most reposts (kind-6) in the time range.",
          params: [
            { name: "range", type: "string", required: false, default: "7d", description: "Time range", values: ["today", "7d", "30d", "1y", "all"] },
            { name: "limit", type: "integer", required: false, default: "100", description: "Max results (1–100)" },
            { name: "offset", type: "integer", required: false, default: "0", description: "Pagination offset" },
          ],
          responseExample: `{ "range": "7d", "authors": [ { "pubkey": "...", "count": 89 } ] }`,
        },
        {
          id: "clients-leaderboard",
          method: "GET",
          path: "/v1/clients/leaderboard",
          description: "Nostr clients ranked by note count and distinct user count. Cached 10 minutes.",
          params: [
            { name: "limit", type: "integer", required: false, default: "100", description: "Max results (1–100)" },
            { name: "offset", type: "integer", required: false, default: "0", description: "Pagination offset" },
          ],
          responseExample: `{ "clients": [ { "client_name": "Damus", "note_count": 500000, "user_count": 12000 } ] }`,
        },
        {
          id: "client-users",
          method: "GET",
          path: "/v1/clients/{client_name}/users",
          description: "Top users of a specific Nostr client, ranked by note count. Cached 10 minutes.",
          params: [
            { name: "client_name", type: "string", required: true, description: "Client name (case-insensitive)" },
            { name: "limit", type: "integer", required: false, default: "100", description: "Max results (1–100)" },
            { name: "offset", type: "integer", required: false, default: "0", description: "Pagination offset" },
          ],
          responseExample: `{
  "client_name": "damus",
  "users": [ { "pubkey": "...", "note_count": 1234 } ],
  "profiles": { ... }
}`,
        },
        {
          id: "relays-leaderboard",
          method: "GET",
          path: "/v1/relays/leaderboard",
          description: "Top relays ranked by event count. Cached 30 minutes.",
          params: [
            { name: "limit", type: "integer", required: false, default: "100", description: "Max results (1–100)" },
            { name: "offset", type: "integer", required: false, default: "0", description: "Pagination offset" },
          ],
          responseExample: `{ "relays": [ { "url": "wss://relay.damus.io", "event_count": 5000000 } ] }`,
        },
      ],
    },

    // ── Admin ────────────────────────────────────────────────────
    {
      id: "admin",
      title: "Admin",
      description: "All admin endpoints require NIP-98 HTTP Auth (signed kind-27235 event). Rate limited to 10 req/min per IP.",
      endpoints: [
        {
          id: "admin-check-auth",
          method: "GET",
          path: "/v1/admin/check-auth",
          description: "Verify admin authentication status.",
          responseExample: `{ "authenticated": true, "pubkey": "abc123..." }`,
        },
        {
          id: "admin-block-pubkey",
          method: "POST",
          path: "/v1/admin/block-pubkey",
          description: "Block a pubkey. Queues data for deletion.",
          requestBody: {
            description: "Pubkey to block with reason.",
            example: `{ "pubkey": "abc123...", "reason": "spam" }`,
          },
          responseExample: `{ "blocked": true, "pubkey": "abc123..." }`,
        },
        {
          id: "admin-unblock-pubkey",
          method: "DELETE",
          path: "/v1/admin/block-pubkey",
          description: "Unblock a previously blocked pubkey.",
          requestBody: {
            description: "Pubkey to unblock.",
            example: `{ "pubkey": "abc123..." }`,
          },
          responseExample: `{ "unblocked": true }`,
        },
        {
          id: "admin-blocked-pubkeys",
          method: "GET",
          path: "/v1/admin/blocked-pubkeys",
          description: "List all blocked pubkeys.",
          responseExample: `[ { "pubkey": "abc123...", "reason": "spam", "blocked_at": "2025-01-01T00:00:00Z" } ]`,
        },
        {
          id: "admin-purge-status",
          method: "GET",
          path: "/v1/admin/purge-status/{pubkey}",
          description: "Check data deletion progress for a blocked pubkey.",
          params: [
            { name: "pubkey", type: "string", required: true, description: "Pubkey (64-char hex)" },
          ],
          responseExample: `{ "pubkey": "abc123...", "status": "completed", "events_deleted": 1234 }`,
        },
        {
          id: "admin-block-hashtag",
          method: "POST",
          path: "/v1/admin/block-hashtag",
          description: "Block a hashtag from trending and search results.",
          requestBody: {
            description: "Hashtag to block with reason.",
            example: `{ "hashtag": "spam", "reason": "abuse" }`,
          },
          responseExample: `{ "blocked": true }`,
        },
        {
          id: "admin-unblock-hashtag",
          method: "DELETE",
          path: "/v1/admin/block-hashtag",
          description: "Unblock a hashtag.",
          requestBody: {
            description: "Hashtag to unblock.",
            example: `{ "hashtag": "spam" }`,
          },
          responseExample: `{ "unblocked": true }`,
        },
        {
          id: "admin-blocked-hashtags",
          method: "GET",
          path: "/v1/admin/blocked-hashtags",
          description: "List all blocked hashtags.",
          responseExample: `[ { "hashtag": "spam", "reason": "abuse" } ]`,
        },
        {
          id: "admin-block-search-term",
          method: "POST",
          path: "/v1/admin/block-search-term",
          description: "Block a search term from returning results.",
          requestBody: {
            description: "Term to block with reason.",
            example: `{ "term": "badterm", "reason": "abuse" }`,
          },
          responseExample: `{ "blocked": true }`,
        },
        {
          id: "admin-unblock-search-term",
          method: "DELETE",
          path: "/v1/admin/block-search-term",
          description: "Unblock a search term.",
          requestBody: {
            description: "Term to unblock.",
            example: `{ "term": "badterm" }`,
          },
          responseExample: `{ "unblocked": true }`,
        },
        {
          id: "admin-blocked-search-terms",
          method: "GET",
          path: "/v1/admin/blocked-search-terms",
          description: "List all blocked search terms.",
          responseExample: `[ { "term": "badterm", "reason": "abuse" } ]`,
        },
      ],
    },
  ],

  // ── Live WebSockets (Port 8000) ─────────────────────────────
  wsEndpoints: [
    {
      id: "ws-live-metrics",
      url: "wss://api.nostrarchives.com/v1/ws/live-metrics",
      description:
        "Real-time network metrics stream. Sends an initial snapshot then streams updates every 2–5 seconds. Keepalive ping every 30 seconds.",
      protocol: "Custom JSON WebSocket",
      authRequired: false,
      messages: [
        {
          direction: "receive",
          label: "Metrics update",
          format: `{ "online": 1234, "sats": 56789, "notes": 4567 }`,
          description: "Current online user count, sats zapped, and notes posted (10-minute sliding window).",
        },
      ],
    },
    {
      id: "ws-online-users",
      url: "wss://api.nostrarchives.com/v1/ws/online-users",
      description:
        "Live online users stream. Sends an initial snapshot of all active users, then batched updates (max 2/sec).",
      protocol: "Custom JSON WebSocket",
      authRequired: false,
      messages: [
        {
          direction: "receive",
          label: "Initial snapshot",
          format: `{ "type": "snapshot", "users": [{ "pubkey": "...", "last_active_ms": 1700000000000, "activity_kind": 1 }] }`,
          description: "Full list of currently active users.",
        },
        {
          direction: "receive",
          label: "Batched update",
          format: `{ "type": "update", "users": [{ "pubkey": "...", "last_active_ms": 1700000000000, "activity_kind": 1 }] }`,
          description: "Incremental updates as users become active.",
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Search Relay — wss://search.nostrarchives.com
// ---------------------------------------------------------------------------

const searchRelay: DocService = {
  id: "search-relay",
  title: "Search Relay",
  baseUrl: "wss://search.nostrarchives.com",
  description:
    "NIP-50 full-text search relay. Connects at the root path and uses standard Nostr NIP-01 protocol with NIP-50 search extension.",
  wsEndpoints: [
    {
      id: "search-relay-root",
      url: "wss://search.nostrarchives.com",
      description:
        "Full-text search across profiles (kind 0) and notes (kind 1). Supports hashtag filtering via `#t` tags, NIP-19 entity resolution (npub, nprofile, nevent, note1), and 64-char hex lookups.",
      protocol: "NIP-01 / NIP-50",
      authRequired: false,
      messages: [
        {
          direction: "send",
          label: "Search request",
          format: `["REQ", "sub1", { "search": "bitcoin", "kinds": [0, 1], "limit": 20 }]`,
          description: "Subscribe with a NIP-50 search filter. Omit `kinds` to search both profiles and notes.",
        },
        {
          direction: "send",
          label: "Hashtag search",
          format: `["REQ", "sub1", { "search": "#bitcoin", "kinds": [1], "#t": ["bitcoin"], "limit": 20 }]`,
          description: "Search notes by hashtag using the `#t` tag filter.",
        },
        {
          direction: "receive",
          label: "Event result",
          format: `["EVENT", "sub1", { "id": "...", "pubkey": "...", "kind": 1, "content": "...", "created_at": 1700000000, "tags": [...], "sig": "..." }]`,
          description: "Each matching event is sent as a raw Nostr event.",
        },
        {
          direction: "receive",
          label: "End of results",
          format: `["EOSE", "sub1"]`,
          description: "Signals all matching events have been sent for this subscription.",
        },
        {
          direction: "send",
          label: "Close subscription",
          format: `["CLOSE", "sub1"]`,
          description: "Close an active subscription.",
        },
      ],
      constraints: [
        "Max limit: 200 results per subscription",
        "Supported kinds: 0 (profiles), 1 (notes)",
        "NIP-19 entities are auto-resolved (npub, nprofile, nevent, note1)",
        "64-char hex lookups are resolved from the database (no relay fetch)",
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Feed Relay ��� wss://feeds.nostrarchives.com
// ---------------------------------------------------------------------------

const feedRelay: DocService = {
  id: "feed-relay",
  title: "Feed Relay",
  baseUrl: "wss://feeds.nostrarchives.com",
  description:
    "Pre-computed Nostr feeds served via NIP-01 protocol. Connect to specific path-based endpoints for trending notes, user feeds, profile rankings, and hashtags.",
  wsEndpoints: [
    {
      id: "feed-trending-notes",
      url: "wss://feeds.nostrarchives.com",
      path: "/notes/trending/{metric}/{range}",
      description:
        "Trending notes ranked by engagement metric within a time range. Notes are pre-ranked — events arrive in ranked order.",
      protocol: "NIP-01",
      authRequired: false,
      messages: [
        {
          direction: "send",
          label: "Subscribe",
          format: `["REQ", "sub1", { "limit": 20 }]`,
          description: "Request trending notes. Limit is clamped to 1–200.",
        },
        {
          direction: "receive",
          label: "Ranked event",
          format: `["EVENT", "sub1", { "id": "...", "kind": 1, "content": "...", ... }]`,
          description: "Events arrive in ranked order (highest engagement first).",
        },
        {
          direction: "receive",
          label: "End of results",
          format: `["EOSE", "sub1"]`,
          description: "All ranked events have been sent.",
        },
      ],
      constraints: [
        "metric: reactions, replies, reposts, zaps",
        "range: today, 7d, 30d, 1y, all",
        "Max limit: 200",
      ],
      notes: [
        "Example: wss://feeds.nostrarchives.com/notes/trending/reactions/today",
        "Example: wss://feeds.nostrarchives.com/notes/trending/zaps/7d",
      ],
    },
    {
      id: "feed-upandcoming",
      url: "wss://feeds.nostrarchives.com",
      path: "/users/upandcoming",
      description: "Emerging users — returns kind-0 profile events for trending new users. Cached 24 hours.",
      protocol: "NIP-01",
      authRequired: false,
      messages: [
        {
          direction: "send",
          label: "Subscribe",
          format: `["REQ", "sub1", { "limit": 20 }]`,
          description: "Request emerging user profiles.",
        },
        {
          direction: "receive",
          label: "Profile event",
          format: `["EVENT", "sub1", { "id": "...", "kind": 0, "content": "{...}", ... }]`,
          description: "Kind-0 metadata events for emerging users.",
        },
      ],
    },
    {
      id: "feed-followers",
      url: "wss://feeds.nostrarchives.com",
      path: "/profiles/followers",
      description: "Follower profiles for a pubkey. Returns kind-0 profile events. Cached 10 minutes.",
      protocol: "NIP-01",
      authRequired: false,
      messages: [
        {
          direction: "send",
          label: "Subscribe",
          format: `["REQ", "sub1", { "authors": ["<target_pubkey>"] }]`,
          description: "Pass the target pubkey in the `authors` filter to get their followers' profiles.",
        },
        {
          direction: "receive",
          label: "Follower profile",
          format: `["EVENT", "sub1", { "kind": 0, "content": "{...}", ... }]`,
          description: "Kind-0 metadata events for each follower.",
        },
      ],
    },
    {
      id: "feed-ranked-notes",
      url: "wss://feeds.nostrarchives.com",
      path: "/profiles/{note_type}/{metric}",
      description:
        "Ranked notes for a specific profile. Returns the author's top-performing notes sorted by the chosen metric. Cached 5 minutes.",
      protocol: "NIP-01",
      authRequired: false,
      messages: [
        {
          direction: "send",
          label: "Subscribe",
          format: `["REQ", "sub1", { "authors": ["<pubkey>"] }]`,
          description: "Pass the author's pubkey in the `authors` filter.",
        },
        {
          direction: "receive",
          label: "Ranked note",
          format: `["EVENT", "sub1", { "kind": 1, "content": "...", ... }]`,
          description: "Notes arrive ranked by the selected metric.",
        },
      ],
      constraints: [
        "note_type: root, replies",
        "metric: likes, reposts, zaps, replies",
      ],
      notes: [
        "Example: wss://feeds.nostrarchives.com/profiles/root/likes",
        "Example: wss://feeds.nostrarchives.com/profiles/replies/zaps",
      ],
    },
    {
      id: "feed-hashtags",
      url: "wss://feeds.nostrarchives.com",
      path: "/hashtags/{variant}",
      description:
        "Hashtag feeds. Returns kind-30015 interest set events containing hashtag lists. Cached 2 hours.",
      protocol: "NIP-01",
      authRequired: false,
      messages: [
        {
          direction: "send",
          label: "Subscribe",
          format: `["REQ", "sub1", {}]`,
          description: "Empty filter — the variant is determined by the URL path.",
        },
        {
          direction: "receive",
          label: "Hashtag set",
          format: `["EVENT", "sub1", { "kind": 30015, "content": "", "tags": [["t", "bitcoin"], ["t", "nostr"], ...] }]`,
          description: "A kind-30015 event with hashtags as `t` tags.",
        },
      ],
      constraints: [
        "variant: trending (top 100 by 24h count) or all (count > 5)",
      ],
      notes: [
        "Example: wss://feeds.nostrarchives.com/hashtags/trending",
        "Example: wss://feeds.nostrarchives.com/hashtags/all",
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Scheduler Relay — wss://scheduler.nostrarchives.com
// ---------------------------------------------------------------------------

const schedulerRelay: DocService = {
  id: "scheduler-relay",
  title: "Scheduler Relay",
  baseUrl: "wss://scheduler.nostrarchives.com",
  description:
    "Authenticated relay for scheduling future-dated Nostr events. Events are held and published at their `created_at` timestamp to the author's NIP-65 write relays.",
  wsEndpoints: [
    {
      id: "scheduler-main",
      url: "wss://scheduler.nostrarchives.com",
      description:
        "Connect and authenticate via NIP-42, then submit future-dated events, query your pending events, or cancel them via NIP-09 deletion.",
      protocol: "NIP-01 / NIP-42 / NIP-09",
      authRequired: true,
      messages: [
        {
          direction: "receive",
          label: "Auth challenge",
          format: `["AUTH", "<challenge_string>"]`,
          description: "Sent immediately on connection. You must respond with a signed auth event before sending other messages.",
        },
        {
          direction: "send",
          label: "Auth response",
          format: `["AUTH", { "kind": 22242, "content": "", "tags": [["relay", "wss://scheduler.nostrarchives.com"], ["challenge", "<challenge_string>"]], "created_at": 1700000000, "pubkey": "...", "id": "...", "sig": "..." }]`,
          description: "Sign a kind-22242 event with the challenge tag to authenticate.",
        },
        {
          direction: "send",
          label: "Submit scheduled event",
          format: `["EVENT", { "kind": 1, "content": "Scheduled post!", "created_at": 1700100000, "pubkey": "...", "id": "...", "sig": "...", "tags": [] }]`,
          description: "Submit a future-dated event. The `created_at` must be 60 seconds to 90 days in the future. Pubkey must match authenticated user.",
        },
        {
          direction: "receive",
          label: "Event accepted",
          format: `["OK", "<event_id>", true, ""]`,
          description: "Confirmation that the event was accepted for scheduling.",
        },
        {
          direction: "send",
          label: "Cancel scheduled event (NIP-09)",
          format: `["EVENT", { "kind": 5, "content": "", "tags": [["e", "<event_id_to_cancel>"]], "pubkey": "...", "id": "...", "sig": "..." }]`,
          description: "Submit a kind-5 deletion event referencing the scheduled event(s) to cancel.",
        },
        {
          direction: "send",
          label: "Query pending events",
          format: `["REQ", "sub1", { "kinds": [1] }]`,
          description: "Query your own scheduled events. The `authors` filter is ignored — only your own events are returned.",
        },
        {
          direction: "send",
          label: "Close subscription",
          format: `["CLOSE", "sub1"]`,
          description: "Close an active subscription.",
        },
      ],
      constraints: [
        "Authentication required (NIP-42) before any operations",
        "created_at must be 60 seconds to 90 days in the future",
        "Maximum 100 pending events per pubkey",
        "Only the event owner can cancel their scheduled events",
        "Events are published to the author's NIP-65 write relays (falls back to top 20 relays)",
        "Publishing task checks every 60 seconds for due events",
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Indexer Relay — wss://indexer.nostrarchives.com
// ---------------------------------------------------------------------------

const indexerRelay: DocService = {
  id: "indexer-relay",
  title: "Indexer Relay",
  baseUrl: "wss://indexer.nostrarchives.com",
  description:
    "Read-only metadata relay for efficient bulk profile discovery. Only serves kinds 0 (metadata), 3 (contact lists), and 10002 (relay lists).",
  rateLimit: "30 requests/min per IP",
  wsEndpoints: [
    {
      id: "indexer-main",
      url: "wss://indexer.nostrarchives.com",
      description:
        "Query metadata, contact lists, and relay lists for batches of pubkeys. No event publishing allowed.",
      protocol: "NIP-01",
      authRequired: false,
      messages: [
        {
          direction: "send",
          label: "Request metadata",
          format: `["REQ", "sub1", { "authors": ["<pubkey1>", "<pubkey2>", "..."], "kinds": [0, 3, 10002] }]`,
          description: "Request metadata for a batch of pubkeys. The `authors` filter is required (1–500 hex pubkeys).",
        },
        {
          direction: "receive",
          label: "Metadata event",
          format: `["EVENT", "sub1", { "kind": 0, "pubkey": "...", "content": "{\"name\":\"Alice\",...}", ... }]`,
          description: "Raw Nostr events for the requested kinds.",
        },
        {
          direction: "receive",
          label: "End of stored events",
          format: `["EOSE", "sub1"]`,
          description: "All matching events have been sent.",
        },
        {
          direction: "send",
          label: "Close subscription",
          format: `["CLOSE", "sub1"]`,
          description: "Close an active subscription.",
        },
      ],
      constraints: [
        "Read-only: EVENT publishing is not allowed",
        "Only kinds 0, 3, 10002 are served",
        "The `authors` filter is required (1–500 hex pubkeys)",
        "Maximum 500 results per REQ",
        "Rate limited: 30 requests/min per IP",
        "Keepalive ping every 30 seconds",
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Export all services
// ---------------------------------------------------------------------------

export const services: DocService[] = [
  restApi,
  searchRelay,
  feedRelay,
  schedulerRelay,
  indexerRelay,
];

// Derive sidebar TOC from services
export interface TocEntry {
  id: string;
  title: string;
  children?: { id: string; title: string }[];
}

export function buildToc(): TocEntry[] {
  return services.map((s) => ({
    id: s.id,
    title: s.title,
    children: [
      ...(s.categories?.map((c) => ({ id: c.id, title: c.title })) ?? []),
      ...(s.wsEndpoints?.length
        ? s.id === "rest-api"
          ? [{ id: "rest-websockets", title: "Live WebSockets" }]
          : []
        : []),
    ],
  }));
}
