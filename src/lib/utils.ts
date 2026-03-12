export function formatNumber(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}b`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toString();
}

export function truncateHex(hex: string, size = 6) {
  if (!hex) return "unknown";
  if (hex.length <= size * 2) return hex;
  return `${hex.slice(0, size)}…${hex.slice(-size)}`;
}

export function formatTimestamp(ts?: number) {
  if (!ts) return "—";
  try {
    const formatter = new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    });
    return formatter.format(new Date(ts * 1000));
  } catch (error) {
    console.warn("Failed to format timestamp", error);
    return "—";
  }
}

export function formatRelative(ts?: number) {
  if (!ts) return "just now";
  const now = Date.now();
  const diffSeconds = Math.max(0, Math.round(now / 1000 - ts));

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
}

export function extractHashtags(tags: string[][] = []) {
  return tags.filter(([identifier]) => identifier === "t").map(([, value]) => value).slice(0, 3);
}
