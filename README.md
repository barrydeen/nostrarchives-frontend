# Nostr Archives Frontend

Cinematic explorer for the `nostr-api` backend. Surfaces live network stats, trending notes, and profile analytics from `https://api.nostrarchives.com`.

## Stack

- **Next.js 16 / App Router**
- **Tailwind CSS 4** with custom neon palette
- **Server components** that fetch directly from nostr-api
- **Lucide icons** + custom UI primitives

## Features

- Hero overview with ingestion telemetry + quick search
- Trending leaderboards (likes + zaps, today & all-time)
- Profile pages with metadata, social graph, and recent notes
- Note detail with thread + interaction counts
- Explore workspace for advanced filtering by pubkey, kind, or full-text search

## Getting started

```bash
npm install
npm run dev -- --port 3006
```

Then open <http://192.168.2.177:3006>. (Bind address is already `0.0.0.0`.)

### Environment

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.nostrarchives.com` | Override when pointing at a different nostr-api instance |

## Project scripts

```bash
npm run dev     # local dev server
npm run build   # production build
npm run start   # start built app
npm run lint    # eslint (next/core-web-vitals)
```

## Deployment

This app targets the existing Hetzner frontend server (see `TOOLS.md`). Build with `npm run build`, then run `npm run start` (or wrap with PM2). Ensure `NODE_ENV=production` and `NEXT_PUBLIC_API_BASE_URL=https://api.nostrarchives.com` in the systemd/PM2 env.
