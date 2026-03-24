"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface LiveMetrics {
  online: number;
  sats: number;
  notes: number;
}

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/^http/, "ws") ||
  "wss://api.nostrarchives.com";

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];

export function useLiveMetrics() {
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const unmountedRef = useRef(false);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;

    const ws = new WebSocket(`${WS_BASE_URL}/v1/ws/live-metrics`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      retriesRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as LiveMetrics;
        setMetrics(data);
      } catch {
        // ignore non-JSON messages (pings etc)
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
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;
      wsRef.current?.close();
    };
  }, [connect]);

  return { metrics, connected };
}
