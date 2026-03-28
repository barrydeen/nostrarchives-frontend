"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

export interface ActiveUser {
  pubkey: string;
  last_active_ms: number;
  activity_kind: number;
}

interface SnapshotMessage {
  type: "snapshot";
  users: ActiveUser[];
}

interface UpdateMessage {
  type: "update";
  users: ActiveUser[];
}

type WsMessage = SnapshotMessage | UpdateMessage;

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/^http/, "ws") ||
  "wss://api.nostrarchives.com";

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const PRUNE_INTERVAL = 30_000; // Prune stale users every 30s
const RENDER_THROTTLE = 1000; // Max 1 state update per second

export function useOnlineUsers() {
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const unmountedRef = useRef(false);

  // Internal map for O(1) updates, flushed to state periodically
  const mapRef = useRef<Map<string, ActiveUser>>(new Map());
  const dirtyRef = useRef(false);
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flush map to sorted array state (throttled)
  const flush = useCallback(() => {
    if (rafRef.current) return; // Already scheduled
    rafRef.current = setTimeout(() => {
      rafRef.current = null;
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      const arr = Array.from(mapRef.current.values());
      arr.sort((a, b) => b.last_active_ms - a.last_active_ms);
      setUsers(arr);
    }, RENDER_THROTTLE);
  }, []);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;

    const ws = new WebSocket(`${WS_BASE_URL}/v1/ws/online-users`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      retriesRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsMessage;

        if (data.type === "snapshot") {
          const map = new Map<string, ActiveUser>();
          for (const u of data.users) {
            map.set(u.pubkey, u);
          }
          mapRef.current = map;
        } else if (data.type === "update") {
          for (const u of data.users) {
            mapRef.current.set(u.pubkey, u);
          }
        }

        dirtyRef.current = true;
        flush();
      } catch {
        // ignore non-JSON (pings etc)
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      if (!unmountedRef.current) {
        const delay =
          RECONNECT_DELAYS[
            Math.min(retriesRef.current, RECONNECT_DELAYS.length - 1)
          ];
        retriesRef.current++;
        setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [flush]);

  // Prune stale users client-side
  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - WINDOW_MS;
      let pruned = false;
      for (const [pk, u] of mapRef.current) {
        if (u.last_active_ms < cutoff) {
          mapRef.current.delete(pk);
          pruned = true;
        }
      }
      if (pruned) {
        dirtyRef.current = true;
        flush();
      }
    }, PRUNE_INTERVAL);

    return () => clearInterval(interval);
  }, [flush]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;
      wsRef.current?.close();
      if (rafRef.current) {
        clearTimeout(rafRef.current);
      }
    };
  }, [connect]);

  // Track which pubkeys were recently updated (for flash animation)
  const recentlyUpdated = useMemo(() => {
    const set = new Set<string>();
    // Users active in the last 3 seconds get the "flash" treatment
    const cutoff = Date.now() - 3000;
    for (const u of users) {
      if (u.last_active_ms > cutoff) {
        set.add(u.pubkey);
      }
    }
    return set;
  }, [users]);

  return { users, connected, recentlyUpdated };
}
