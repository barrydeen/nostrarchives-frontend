import { redirect } from "next/navigation";
import Link from "next/link";
import { Search, User2, MessageSquare } from "lucide-react";
import { search, getBulkProfileMetadata, getHashtagNotes } from "@/lib/api";
import { extractMentionPubkeysFromEvents } from "@/lib/mentions";
import { truncateHex, formatNumber } from "@/lib/utils";
import { SearchBar } from "@/components/search/SearchBar";
import { SafeAvatar } from "@/components/search/SafeAvatar";
import { UnifiedNoteCard } from "@/components/notes/UnifiedNoteCard";
import type { ProfileSearchResult, ProfileMetadataEntry, StoredEvent } from "@/lib/types";

/** Unified shape for rendering note cards from either search or hashtag results. */
interface RenderNote {
  event: StoredEvent;
  reactions: number;
  replies: number;
  reposts: number;
  zap_sats: number;
}

interface Props {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const isHashtag = query.startsWith("#");
  const searchType = (params.type as "all" | "profiles" | "notes") || (isHashtag ? "notes" : "all");

  if (!query) {
    redirect("/");
  }

  const results = isHashtag ? null : await search(query, searchType, 30);
  const profiles = results?.profiles ?? [];

  // Hashtag search: use tag-based endpoint; regular search: use FTS
  let notesToRender: RenderNote[] = [];
  let noteProfiles = new Map<string, ProfileMetadataEntry>();

  if (isHashtag) {
    const hashtagResponse = await getHashtagNotes(query, 30, 0);
    const hashtagNotes = hashtagResponse?.notes ?? [];

    notesToRender = hashtagNotes.map((n) => ({
      event: n.event,
      reactions: n.reactions,
      replies: n.replies,
      reposts: n.reposts,
      zap_sats: n.zap_sats,
    }));

    // Build profile map from API response
    if (hashtagResponse?.profiles) {
      Object.entries(hashtagResponse.profiles).forEach(([pubkey, profile]) => {
        noteProfiles.set(pubkey, {
          pubkey,
          preferred_name: null,
          name: profile.name ?? null,
          display_name: profile.display_name ?? null,
          picture: profile.picture ?? null,
        });
      });
    }

    // Also resolve mentioned pubkeys for @DisplayName rendering
    const pubkeys = new Set<string>();
    hashtagNotes.forEach((n) => pubkeys.add(n.event.pubkey));
    extractMentionPubkeysFromEvents(hashtagNotes.map((n) => n.event)).forEach((pk) => pubkeys.add(pk));
    const mentionProfiles = await getBulkProfileMetadata([...pubkeys]);
    mentionProfiles.forEach((val, key) => noteProfiles.set(key, val));
  } else {
    const notes = results?.notes ?? [];

    notesToRender = notes.map((n) => ({
      event: n.event,
      reactions: n.reactions,
      replies: n.replies,
      reposts: n.reposts,
      zap_sats: n.zaps,
    }));

    // Resolve note authors + mentioned pubkeys
    const pubkeys = new Set<string>();
    notes.forEach((n) => pubkeys.add(n.event.pubkey));
    extractMentionPubkeysFromEvents(notes.map((n) => n.event)).forEach((pk) => pubkeys.add(pk));
    noteProfiles = await getBulkProfileMetadata([...pubkeys]);

    // If entity was resolved, redirect directly
    if (results?.resolved) {
      const r = results.resolved;
      if (r.type === "profile" && r.pubkey) {
        redirect(`/profiles/${r.pubkey}`);
      }
      if (r.type === "event" && r.id) {
        redirect(`/notes/${r.id}`);
      }
    }
  }

  const resultCount = isHashtag ? notesToRender.length : profiles.length + notesToRender.length;
  const emptyState = isHashtag ? notesToRender.length === 0 : profiles.length === 0 && notesToRender.length === 0;

  return (
    <div>
      <div className="mb-8 max-w-2xl">
        <SearchBar />
      </div>

      <h2 className="mb-6 text-lg font-semibold text-white/90">
        Results for &ldquo;{query}&rdquo;
        <span className="ml-2 text-sm font-normal text-white/50">
          {resultCount} found
        </span>
      </h2>

      {/* Type filter tabs */}
      <div className="mb-6 flex gap-2">
        {(["all", "profiles", "notes"] as const).map((t) => (
          <Link
            key={t}
            href={`/search?q=${encodeURIComponent(query)}&type=${t}`}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              searchType === t
                ? "border-white/30 bg-white/10 text-white"
                : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
            }`}
          >
            {t === "all" ? "All" : t === "profiles" ? "Profiles" : "Notes"}
          </Link>
        ))}
      </div>

      <div className="space-y-8">
        {/* Profiles section */}
        {profiles.length > 0 && (
          <section>
            {searchType === "all" && (
              <h3 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/50">
                <User2 className="size-4" /> Profiles
              </h3>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile) => (
                <ProfileCard key={profile.pubkey} profile={profile} />
              ))}
            </div>
          </section>
        )}

        {/* Notes section */}
        {notesToRender.length > 0 && (
          <section>
            {searchType === "all" && (
              <h3 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/50">
                <MessageSquare className="size-4" /> Notes
              </h3>
            )}
            <div className="space-y-3">
              {notesToRender.map((note) => (
                <UnifiedNoteCard
                  key={note.event.id}
                  event={note.event}
                  profile={noteProfiles.get(note.event.pubkey)}
                  profiles={noteProfiles}
                  engagement={{
                    reactions: note.reactions,
                    replies: note.replies,
                    reposts: note.reposts,
                    zap_sats: note.zap_sats,
                  }}
                  variant="compact"
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {emptyState && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="mb-4 size-10 text-white/20" />
            <p className="text-lg font-medium text-white/60">No results found</p>
            <p className="mt-1 text-sm text-white/40">
              Try a different query, or paste an npub / nevent / note1 for direct lookup.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileCard({ profile }: { profile: ProfileSearchResult }) {
  const name = profile.display_name || profile.name || truncateHex(profile.pubkey);

  return (
    <Link
      href={`/profiles/${profile.pubkey}`}
      className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-white/15 hover:bg-white/[0.04]"
    >
      <SafeAvatar src={profile.picture} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white group-hover:text-white/90">
          {name}
        </p>
        {profile.nip05 && (
          <p className="truncate text-xs text-neon-green/70">{profile.nip05}</p>
        )}
        <div className="mt-1 flex items-center gap-3 text-xs text-white/40">
          <span>{formatNumber(profile.follower_count)} followers</span>
          {profile.engagement_score > 0 && (
            <span>{formatNumber(profile.engagement_score)} eng</span>
          )}
        </div>
        {profile.about && (
          <p className="mt-1 line-clamp-1 text-xs text-white/30">{profile.about}</p>
        )}
      </div>
    </Link>
  );
}


