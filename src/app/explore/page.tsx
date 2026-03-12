import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { advancedNoteSearch } from "@/lib/api";
import { ProfileMetadataEntry } from "@/lib/types";
import { UnifiedNoteCard } from "@/components/notes/UnifiedNoteCard";

interface ExplorePageProps {
  searchParams: Promise<{
    q?: string;
    exclude?: string;
    author?: string;
    reply_to?: string;
    order?: string;
    page?: string;
  }>;
}

const LIMIT = 20;

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * LIMIT;

  const order = (params.order as "newest" | "oldest" | "engagement") || "newest";

  const hasFilters = !!(params.q || params.exclude || params.author || params.reply_to);

  const data = hasFilters
    ? await advancedNoteSearch({
        q: params.q,
        exclude: params.exclude,
        author: params.author,
        reply_to: params.reply_to,
        order,
        limit: LIMIT,
        offset,
      })
    : null;

  // Convert API profiles Record to Map<string, ProfileMetadataEntry>
  const profiles = new Map<string, ProfileMetadataEntry>();
  if (data?.profiles) {
    for (const [pubkey, p] of Object.entries(data.profiles)) {
      profiles.set(pubkey, {
        pubkey,
        display_name: p.display_name,
        name: p.name,
        preferred_name: p.display_name || p.name,
        picture: p.picture,
      });
    }
  }

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;

  // Build pagination href preserving current search params
  function pageHref(p: number) {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.exclude) sp.set("exclude", params.exclude);
    if (params.author) sp.set("author", params.author);
    if (params.reply_to) sp.set("reply_to", params.reply_to);
    if (params.order) sp.set("order", params.order);
    sp.set("page", String(p));
    return `/explore?${sp.toString()}`;
  }

  return (
    <div className="space-y-10">
      {/* Search form */}
      <section className="rounded-[32px] border border-white/10 bg-card/70 p-6 shadow-2xl">
        <div className="flex flex-col gap-3 border-b border-white/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Advanced search</p>
            <h1 className="text-3xl font-semibold">Find notes across the archive</h1>
          </div>
          <Search className="size-5 text-white/50" />
        </div>

        <form className="mt-6 grid gap-4 md:grid-cols-2" method="get" action="/explore">
          <div className="space-y-1.5">
            <label htmlFor="q" className="text-xs font-medium text-white/50">Includes words</label>
            <input
              id="q"
              name="q"
              placeholder="bitcoin nostr protocol"
              defaultValue={params.q}
              className="w-full rounded-2xl border border-white/10 bg-surface/80 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="exclude" className="text-xs font-medium text-white/50">Excludes words</label>
            <input
              id="exclude"
              name="exclude"
              placeholder="spam scam"
              defaultValue={params.exclude}
              className="w-full rounded-2xl border border-white/10 bg-surface/80 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="author" className="text-xs font-medium text-white/50">Posted by</label>
            <input
              id="author"
              name="author"
              placeholder="npub or hex pubkey"
              defaultValue={params.author}
              className="w-full rounded-2xl border border-white/10 bg-surface/80 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reply_to" className="text-xs font-medium text-white/50">Replying to</label>
            <input
              id="reply_to"
              name="reply_to"
              placeholder="npub or hex pubkey"
              defaultValue={params.reply_to}
              className="w-full rounded-2xl border border-white/10 bg-surface/80 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="order" className="text-xs font-medium text-white/50">Order by</label>
            <select
              id="order"
              name="order"
              defaultValue={order}
              className="w-full rounded-2xl border border-white/10 bg-surface/80 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="engagement">Most Engagement</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-neon-pink/80 to-neon-blue/80 px-6 py-3 text-sm font-semibold shadow-glow transition-opacity hover:opacity-90"
            >
              Search
            </button>
          </div>
        </form>
      </section>

      {/* Results */}
      {hasFilters && (
        <section className="rounded-[32px] border border-white/10 bg-surface/70 p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-2xl font-semibold">Results</h2>
            <span className="text-sm text-white/50">
              {data ? `${data.total.toLocaleString()} note${data.total !== 1 ? "s" : ""}` : "0 notes"}
            </span>
          </div>

          {data && data.notes.length > 0 ? (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {data.notes.map((note) => (
                  <UnifiedNoteCard
                    key={note.event.id}
                    event={note.event}
                    profile={profiles.get(note.event.pubkey)}
                    profiles={profiles}
                    engagement={{
                      reactions: note.reactions,
                      replies: note.replies,
                      reposts: note.reposts,
                      zap_sats: note.zap_sats,
                    }}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-4">
                  {page > 1 ? (
                    <a
                      href={pageHref(page - 1)}
                      className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-surface/80 px-4 py-2 text-sm text-white/70 transition-colors hover:border-white/30 hover:text-white"
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-2xl border border-white/5 px-4 py-2 text-sm text-white/20">
                      <ChevronLeft className="size-4" />
                      Previous
                    </span>
                  )}

                  <span className="text-sm text-white/50">
                    Page {page} of {totalPages.toLocaleString()}
                  </span>

                  {page < totalPages ? (
                    <a
                      href={pageHref(page + 1)}
                      className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-surface/80 px-4 py-2 text-sm text-white/70 transition-colors hover:border-white/30 hover:text-white"
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-2xl border border-white/5 px-4 py-2 text-sm text-white/20">
                      Next
                      <ChevronRight className="size-4" />
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="mt-6 text-center text-sm text-white/40">
              {data ? "No notes found matching your search." : "Search failed. Try again."}
            </div>
          )}
        </section>
      )}

      {/* Empty state when no filters applied */}
      {!hasFilters && (
        <section className="rounded-[32px] border border-white/10 bg-surface/70 p-6 shadow-2xl">
          <div className="py-12 text-center text-sm text-white/40">
            Enter search criteria above to find notes.
          </div>
        </section>
      )}
    </div>
  );
}
