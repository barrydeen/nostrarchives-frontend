import { StoredEvent } from "@/lib/types";

export function normalizeEvents(payload: StoredEvent[] | { events?: StoredEvent[] } | null | undefined) {
  if (!payload) return [] as StoredEvent[];
  if (Array.isArray(payload)) return payload;
  return payload.events ?? [];
}
