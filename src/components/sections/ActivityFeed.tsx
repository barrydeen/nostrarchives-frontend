import Link from "next/link";
import { StoredEvent } from "@/lib/types";
import { formatRelative, truncateHex } from "@/lib/utils";
import { Hash, ArrowRight } from "lucide-react";

interface ActivityFeedProps {
  events?: StoredEvent[];
  title?: string;
}

export function ActivityFeed({ events, title = "Latest firehose" }: ActivityFeedProps) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-card/70 p-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">Live stream</p>
          <h2 className="text-2xl font-semibold">{title}</h2>
        </div>
        <Link href="/explore" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
          Expand explorer
          <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="mt-6 space-y-4">
        {events?.slice(0, 8).map((event) => (
          <article key={event.id} className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-surface/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs text-white/50">{truncateHex(event.pubkey)}</div>
              <p className="text-sm text-white/80 line-clamp-2">{event.content || "(binary event)"}</p>
              {event.tags?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {event.tags.slice(0, 3).map((tag, idx) => (
                    <span key={`${event.id}-${idx}`} className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/60">
                      <Hash className="size-3" />
                      {tag[1] ?? tag[0]}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex flex-col items-start gap-2 text-xs text-white/50 sm:items-end">
              <span>{formatRelative(event.created_at)}</span>
              <div className="flex gap-2 text-[11px]">
                <Link href={`/notes/${event.id}`} className="underline-offset-2 hover:underline">
                  Inspect note
                </Link>
                <span>•</span>
                <Link href={`/profiles/${event.pubkey}`} className="underline-offset-2 hover:underline">
                  Author
                </Link>
              </div>
            </div>
          </article>
        )) || <p className="text-white/50">Waiting for events…</p>}
      </div>
    </section>
  );
}
