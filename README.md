# Nostr Archives Frontend

Web frontend for [nostrarchives.com](https://nostrarchives.com). Displays network analytics, trending content, profiles, and real-time metrics from the [nostrarchives-api](https://github.com/barrydeen/nostrarchives-api) backend.

## Prerequisites

- **Node.js** 18.17+
- **npm**

## Installation

```bash
git clone https://github.com/barrydeen/nostrarchives-frontend.git
cd nostrarchives-frontend

npm install
npm run dev -- --port 3006
```

Open `http://localhost:3006`.

### Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.nostrarchives.com` | Backend API URL |
| `NEXT_PUBLIC_WS_BASE_URL` | derived from API URL | WebSocket URL (auto-converts `http` → `ws`) |

## Deployment

Runs on a Hetzner frontend server via PM2 with standalone Next.js output.

```bash
cd /opt/apps/nostrarchives-frontend
git pull origin main
npm run build
cp -r .next/static .next/standalone/.next/static
pm2 restart nostrarchives-frontend
```

Served at `https://nostrarchives.com` via nginx.

## Stack

- **Next.js 16** with App Router and standalone output
- **React 19** with server and client components
- **Tailwind CSS 4** with custom neon dark theme
- **Recharts** for analytics charts
- **Lucide React** for icons
- **nostr-tools** for protocol utilities

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — live network stats (via WebSocket), trending notes, top zappers, new users, trending hashtags |
| `/trending` | Trending notes filtered by metric (reactions/replies/reposts/zaps) and range (today/7d/30d/1y/all) |
| `/profiles/[pubkey]` | Profile page — metadata, social graph, notes, replies, zap stats |
| `/notes/[id]` | Note detail — thread view, interaction tabs (reactions/replies/reposts/zaps) |
| `/search` | Full-text search across profiles and notes, hashtag filtering |
| `/explore` | Advanced search with author, reply_to, and sort filters |
| `/analytics` | Network analytics — daily charts, client/relay leaderboards, top posters |

## API Integration

All data comes from the [nostrarchives-api](https://github.com/barrydeen/nostrarchives-api) backend. The frontend makes no direct database queries.

**REST endpoints** — fetched via server components (initial load) and client-side hooks (interactive updates). See the [backend README](https://github.com/barrydeen/nostrarchives-api#rest-api-endpoints) for the full endpoint list.

**WebSocket** — the home page connects to `wss://api.nostrarchives.com/v1/ws/live-metrics` for real-time network stats (online users, zap sats, notes posted — 10-minute sliding window). Auto-reconnects with exponential backoff.

## Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm run start   # start production server
npm run lint    # eslint
```

## License

MIT
